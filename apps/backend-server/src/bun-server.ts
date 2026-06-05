import { createORPCContext, logger } from "@mirai-app/orpc";
import { getWsEnvConfig, parseWsAuthMessage } from "./utils";

export interface BunServerOptions {
  port: number;
  hostname: string;
  prefix: string;
  servicePrefix: string;
  app: any;
  wsRpcHandler: any;
  serviceWsRpcHandler: any;
}

export function createBunServer(opts: BunServerOptions) {
  let bunServer: ReturnType<typeof Bun.serve> | null = null;

  const start = () => {
    try {
      bunServer = Bun.serve({
        port: opts.port,
        hostname: opts.hostname,
        fetch(req, server) {
          const url = new URL(req.url, "http://localhost");

          if (
            url.pathname.startsWith(opts.servicePrefix) &&
            server.upgrade(req, { data: { url: req.url } })
          ) {
            return;
          }

          if (
            url.pathname.startsWith(opts.prefix) &&
            server.upgrade(req, { data: { url: req.url } })
          ) {
            return;
          }

          return opts.app.fetch(req);
        },
        websocket: {
          async message(ws, message) {
            const data = ws.data as {
              connectionParams?: Record<string, string>;
              url?: string;
              authProcessed?: boolean;
            };

            const authResult = parseWsAuthMessage(message, data);
            if (authResult.ackSent) {
              ws.send(JSON.stringify({ type: "connection_ack" }));
              data.connectionParams = authResult.connectionParams;
              data.authProcessed = true;
              return;
            }
            if (authResult.authProcessed && !data.authProcessed) {
              data.authProcessed = true;
              if (authResult.connectionParams) {
                data.connectionParams = authResult.connectionParams;
              }
            }

            const headers = new Headers();
            if (data.connectionParams) {
              for (const [key, value] of Object.entries(data.connectionParams)) {
                headers.set(key, value);
              }
            }
            if (data.url) {
              headers.set("x-original-url", data.url);
            }

            const env = getWsEnvConfig();
            const context = createORPCContext({
              headers,
              databaseUrl: env.databaseUrl,
              supabaseUrl: env.supabaseUrl,
              supabaseKey: env.supabaseKey,
              connectionParams: data.connectionParams,
            });

            const wsUrl = data.url ? new URL(data.url, "http://localhost") : null;
            const isServiceEndpoint = wsUrl?.pathname.startsWith(opts.servicePrefix) ?? false;

            if (isServiceEndpoint) {
              await opts.serviceWsRpcHandler.message(ws, message, { context });
            } else {
              await opts.wsRpcHandler.message(ws, message, { context });
            }
          },
          close(ws) {
            const wsUrl = (ws.data as { url?: string }).url;
            const isServiceEndpoint = wsUrl
              ? new URL(wsUrl, "http://localhost").pathname.startsWith(opts.servicePrefix)
              : false;

            if (isServiceEndpoint) {
              opts.serviceWsRpcHandler.close(ws);
            } else {
              opts.wsRpcHandler.close(ws);
            }
          },
        },
      });

      logger.info({ port: opts.port }, "Server listening");
      logger.info(
        { host: opts.hostname, port: opts.port, prefix: opts.prefix },
        "oRPC endpoint ready",
      );
    } catch (err) {
      logger.error(err, "Server startup failed");
      process.exit(1);
    }
  };

  const stop = async () => {
    if (bunServer) {
      await bunServer.stop(true);
      bunServer = null;
    }
  };

  return { start, stop };
}
