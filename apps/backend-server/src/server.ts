import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter, createTRPCContext } from "@mirai-app/trpc";
import { createBunHonoWSHandler } from "./ws-adapter";

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

  app.use(
    prefix + "/*",
    trpcServer({
      router: appRouter,
      endpoint: prefix,
      createContext: (_opts, c) => {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const databaseUrl = process.env.DATABASE_URL;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error(
            "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
          );
        }

        if (!databaseUrl) {
          throw new Error(
            "Missing database credentials. Set DATABASE_URL.",
          );
        }

        const headers = new Headers(c.req.raw.headers);
        if (c.req.url) {
          headers.set("x-original-url", c.req.url);
        }

        return createTRPCContext({
          headers,
          databaseUrl,
          supabaseUrl,
          supabaseKey,
        });
      },
      onError({ path, error }) {
        console.error(`Error in tRPC handler on path '${path}':`, error);
      },
    }),
  );

  app.get("/health", (c) => c.text("OK"));

  let bunServer: ReturnType<typeof Bun.serve> | null = null;

  const start = () => {
    try {
      const wsResult = createBunHonoWSHandler({
        router: appRouter,
        createContext: (opts) => {
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          const databaseUrl = process.env.DATABASE_URL;

          if (!supabaseUrl || !supabaseKey) {
            throw new Error(
              "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
            );
          }

          if (!databaseUrl) {
            throw new Error(
              "Missing database credentials. Set DATABASE_URL.",
            );
          }

          const headers = new Headers();
          const url = opts.info.url;
          if (url) {
            headers.set("x-original-url", url.toString());
          }

          const connectionParams = opts.info.connectionParams as
            | Record<string, string>
            | null;

          if (connectionParams) {
            for (const [key, value] of Object.entries(connectionParams)) {
              headers.set(key, value);
            }
          }

          return createTRPCContext({
            headers,
            databaseUrl,
            supabaseUrl,
            supabaseKey,
            connectionParams: connectionParams ?? undefined,
          });
        },
        onError({ path, error }) {
          console.error(`Error in tRPC WS handler on path '${path}':`, error);
        },
      });

      app.route(prefix, wsResult.wsRouter);

      bunServer = Bun.serve({
        port,
        hostname: host,
        fetch: app.fetch,
        websocket: wsResult.websocket,
      });

      console.log("listening on port", port);
      console.log(`tRPC endpoint ready at http://${host}:${port}${prefix}`);
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
