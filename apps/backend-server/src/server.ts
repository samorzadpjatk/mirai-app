import { Hono } from "hono";
import { cors } from "hono/cors";
import { RPCHandler } from "@orpc/server/fetch";
import { RPCHandler as BunWsRPCHandler } from "@orpc/server/bun-ws";
import { ORPCError, onError } from "@orpc/server";
import { appRouter, createORPCContext } from "@mirai-app/orpc";

export interface ServerOptions {
  dev?: boolean;
  port?: number;
  prefix?: string;
  host?: string;
}

const TEN_MB = 10 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const GLOBAL_RATE_LIMIT = 100;
const AUTH_RATE_LIMIT = 10;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return c.req.header("x-real-ip") ?? "unknown";
}

function checkRateLimit(
  ip: string,
  path: string,
  isAuthEndpoint: boolean,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const windowMs = RATE_LIMIT_WINDOW_MS;

  const globalKey = `${ip}:global`;
  const globalEntry = rateLimitStore.get(globalKey);
  let globalAllowed = true;
  let globalRetryAfter = 0;

  if (!globalEntry || now > globalEntry.resetTime) {
    rateLimitStore.set(globalKey, { count: 1, resetTime: now + windowMs });
  } else if (globalEntry.count >= GLOBAL_RATE_LIMIT) {
    globalAllowed = false;
    globalRetryAfter = Math.ceil((globalEntry.resetTime - now) / 1000);
  } else {
    globalEntry.count++;
  }

  if (!globalAllowed) {
    return { allowed: false, retryAfter: globalRetryAfter };
  }

  if (isAuthEndpoint) {
    const authKey = `${ip}:auth`;
    const authEntry = rateLimitStore.get(authKey);

    if (!authEntry || now > authEntry.resetTime) {
      rateLimitStore.set(authKey, { count: 1, resetTime: now + windowMs });
    } else if (authEntry.count >= AUTH_RATE_LIMIT) {
      return { allowed: false, retryAfter: Math.ceil((authEntry.resetTime - now) / 1000) };
    } else {
      authEntry.count++;
    }
  }

  return { allowed: true, retryAfter: 0 };
}

export function createServer(opts: ServerOptions) {
  const dev = opts.dev ?? true;
  const port = opts.port ?? 3000;
  const prefix = opts.prefix ?? "/trpc";
  const host = opts.host ?? "127.0.0.1";

  const app = new Hono();

  app.use("*", async (c, next) => {
    const contentLength = c.req.header("content-length");
    if (contentLength && parseInt(contentLength, 10) > TEN_MB) {
      return c.text("Payload Too Large", 413);
    }
    await next();
  });

  app.use("*", async (c, next) => {
    const ip = getClientIp(c);
    const path = new URL(c.req.url).pathname;
    const isAuthEndpoint = path.startsWith(prefix);
    const { allowed, retryAfter } = checkRateLimit(ip, path, isAuthEndpoint);

    if (!allowed) {
      c.header("Retry-After", String(retryAfter));
      return c.text("Too Many Requests", 429);
    }

    await next();
  });

  app.use("*", async (c, next) => {
    await next();
    c.header("X-Frame-Options", "DENY");
    c.header("X-Content-Type-Options", "nosniff");
    c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    c.header("Content-Security-Policy", "default-src 'self'");
  });

  if (dev) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:8081"];
    app.use(
      "*",
      cors({
        origin: (origin) => {
          if (!origin || allowedOrigins.includes(origin)) {
            return origin;
          }
          return null;
        },
        credentials: true,
      }),
    );
  }

  const rpcHandler = new RPCHandler(appRouter, {
    interceptors: [
      onError((error): void => {
        console.error(error);
        if (!dev && !(error instanceof ORPCError)) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Internal server error" });
        }
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
      onError((error): void => {
        console.error(error);
        if (!dev && !(error instanceof ORPCError)) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Internal server error" });
        }
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

          if (url.pathname.startsWith(prefix) && server.upgrade(req, { data: { url: req.url } })) {
            return;
          }

          return app.fetch(req);
        },
        websocket: {
          async message(ws, message) {
            const data = ws.data as {
              connectionParams?: Record<string, string>;
              url?: string;
              authProcessed?: boolean;
            };

            const msgString =
              typeof message === "string" ? message : new TextDecoder().decode(message);

            if (!data.authProcessed) {
              try {
                const msg = JSON.parse(msgString) as {
                  type?: string;
                  payload?: { authorization?: string };
                };
                if (msg.type === "connection_init" && msg.payload?.authorization) {
                  data.connectionParams = {
                    authorization: msg.payload.authorization,
                  };
                  data.authProcessed = true;
                  ws.send(JSON.stringify({ type: "connection_ack" }));
                  return;
                }
              } catch {
                data.authProcessed = true;
              }
              data.authProcessed = true;
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
