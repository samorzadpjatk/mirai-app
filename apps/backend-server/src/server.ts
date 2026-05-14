import { Hono } from "hono";
import { cors } from "hono/cors";
import { RPCHandler } from "@orpc/server/fetch";
import { RPCHandler as BunWsRPCHandler } from "@orpc/server/bun-ws";
import { onError } from "@orpc/server";
import { appRouter, createORPCContext } from "@mirai-app/orpc";

export interface ServerOptions {
  dev?: boolean;
  port?: number;
  prefix?: string;
  host?: string;
}

export function createServer(opts: ServerOptions) {
  const dev = opts.dev ?? true;
  const port = opts.port ?? 3000;
  const prefix = opts.prefix ?? "/trpc";
  const host = opts.host ?? "127.0.0.1";

  const app = new Hono();

  if (dev) {
    app.use("*", cors({ origin: (origin) => origin, credentials: true }));
  }

  const rpcHandler = new RPCHandler(appRouter, {
    interceptors: [
      onError((error) => {
        console.error(error);
      }),
    ],
  });

  app.use(prefix + "/*", async (c, next) => {
    const request =
      c.req.method === "GET" || c.req.method === "HEAD"
        ? c.req.raw
        : new Proxy(c.req.raw, {
            get(target, prop) {
              switch (prop) {
                case "arrayBuffer":
                  return () => c.req.arrayBuffer();
                case "blob":
                  return () => c.req.blob();
                case "formData":
                  return () => c.req.formData();
                case "json":
                  return () => c.req.json();
                case "text":
                  return () => c.req.text();
                default:
                  return Reflect.get(target, prop, target) as unknown;
              }
            },
          });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const databaseUrl = process.env.DATABASE_URL;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    if (!databaseUrl) {
      throw new Error("Missing database credentials. Set DATABASE_URL.");
    }

    const headers = new Headers(c.req.raw.headers);
    if (c.req.url) {
      headers.set("x-original-url", c.req.url);
    }

    const context = createORPCContext({
      headers,
      databaseUrl,
      supabaseUrl,
      supabaseKey,
    });

    const { matched, response } = await rpcHandler.handle(request, {
      prefix: prefix as `/${string}`,
      context,
    });

    if (matched) {
      return response;
    }

    await next();
  });

  app.get("/health", (c) => c.text("OK"));

  let bunServer: ReturnType<typeof Bun.serve> | null = null;

  const wsRpcHandler = new BunWsRPCHandler(appRouter, {
    interceptors: [
      onError((error) => {
        console.error(error);
      }),
    ],
  });

  const start = () => {
    try {
      bunServer = Bun.serve({
        port,
        hostname: host,
        fetch(req, server) {
          const url = new URL(req.url, "http://localhost");
          const connectionParams: Record<string, string> = {};
          for (const [key, value] of url.searchParams.entries()) {
            connectionParams[key] = value;
          }

          if (
            url.pathname.startsWith(prefix) &&
            server.upgrade(req, { data: { connectionParams, url: req.url } })
          ) {
            return;
          }

          return app.fetch(req);
        },
        websocket: {
          async message(ws, message) {
            const data = ws.data as {
              connectionParams?: Record<string, string>;
              url?: string;
            };

            const headers = new Headers();
            if (data.url) {
              headers.set("x-original-url", data.url);
            }
            if (data.connectionParams) {
              for (const [key, value] of Object.entries(data.connectionParams)) {
                headers.set(key, value);
              }
            }

            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
            const databaseUrl = process.env.DATABASE_URL;

            if (!supabaseUrl || !supabaseKey) {
              throw new Error(
                "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
              );
            }

            if (!databaseUrl) {
              throw new Error("Missing database credentials. Set DATABASE_URL.");
            }

            const context = createORPCContext({
              headers,
              databaseUrl,
              supabaseUrl,
              supabaseKey,
              connectionParams: data.connectionParams,
            });

            await wsRpcHandler.message(ws, message, { context });
          },
          close(ws) {
            wsRpcHandler.close(ws);
          },
        },
      });

      console.log("listening on port", port);
      console.log(`oRPC endpoint ready at http://${host}:${port}${prefix}`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };

  const stop = async () => {
    if (bunServer) {
      await bunServer.stop(true);
      bunServer = null;
    }
  };

  return { app, start, stop };
}
