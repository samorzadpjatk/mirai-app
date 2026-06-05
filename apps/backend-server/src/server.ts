import {
  appRouter,
  createORPCContext,
  enableUserAgentTelemetry,
  logger,
  serviceRouter,
} from "@mirai-app/orpc";
import { ORPCError, onError } from "@orpc/server";
import { RPCHandler as BunWsRPCHandler } from "@orpc/server/bun-ws";
import { env } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";

export interface ServerOptions {
  dev?: boolean;
  port?: number;
  prefix?: string;
  host?: string;
}

const TEN_MB = 10 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const GLOBAL_RATE_LIMIT = 600;
const AUTH_RATE_LIMIT = 30;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return c.req.header("x-real-ip") ?? "unknown";
}

function createRateLimiter() {
  const store = new Map<string, RateLimitEntry>();

  function checkRateLimit(
    ip: string,
    isAuthEndpoint: boolean,
  ): { allowed: boolean; retryAfter: number } {
    const now = Date.now();
    const windowMs = RATE_LIMIT_WINDOW_MS;

    const globalKey = `${ip}:global`;
    const globalEntry = store.get(globalKey);
    let globalAllowed = true;
    let globalRetryAfter = 0;

    if (!globalEntry || now > globalEntry.resetTime) {
      store.set(globalKey, { count: 1, resetTime: now + windowMs });
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
      const authEntry = store.get(authKey);

      if (!authEntry || now > authEntry.resetTime) {
        store.set(authKey, { count: 1, resetTime: now + windowMs });
      } else if (authEntry.count >= AUTH_RATE_LIMIT) {
        return { allowed: false, retryAfter: Math.ceil((authEntry.resetTime - now) / 1000) };
      } else {
        authEntry.count++;
      }
    }

    return { allowed: true, retryAfter: 0 };
  }

  return { checkRateLimit };
}

export function createServer(opts: ServerOptions) {
  enableUserAgentTelemetry();
  const dev = opts.dev ?? true;
  const port = opts.port ?? 3000;
  const prefix = opts.prefix ?? "/trpc";
  const host = opts.host ?? "127.0.0.1";

  const { checkRateLimit } = createRateLimiter();
  const app = new Hono();

  app.use("*", async (c, next) => {
    const contentLength = c.req.header("content-length");
    if (contentLength && Number.parseInt(contentLength, 10) > TEN_MB) {
      return c.text("Payload Too Large", 413);
    }
    await next();
  });

  app.use("*", async (c, next) => {
    const ip = getClientIp(c);
    const path = new URL(c.req.url).pathname;
    const isAuthEndpoint = path.startsWith(prefix);
    const { allowed, retryAfter } = checkRateLimit(ip, isAuthEndpoint);

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
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:8081"];
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

  app.get("/health", (c) => c.text("OK"));

  let bunServer: ReturnType<typeof Bun.serve> | null = null;

  const wsRpcHandler = new BunWsRPCHandler(appRouter, {
    interceptors: [
      onError((error): void => {
        logger.error(error, "RPC WebSocket handler error");
        if (!dev && !(error instanceof ORPCError)) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Internal server error" });
        }
      }),
    ],
  });

  const servicePrefix = "/internal/trpc";
  const serviceWsRpcHandler = new BunWsRPCHandler(serviceRouter, {
    interceptors: [
      onError((error): void => {
        logger.error(error, "Service RPC WebSocket handler error");
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

          if (
            url.pathname.startsWith(servicePrefix) &&
            server.upgrade(req, { data: { url: req.url } })
          ) {
            return;
          }

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

            const supabaseUrl = env.SUPABASE_URL;
            const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
            const databaseUrl = env.DATABASE_URL;

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

            const wsUrl = data.url ? new URL(data.url, "http://localhost") : null;
            const isServiceEndpoint = wsUrl?.pathname.startsWith(servicePrefix) ?? false;

            if (isServiceEndpoint) {
              await serviceWsRpcHandler.message(ws, message, { context });
            } else {
              await wsRpcHandler.message(ws, message, { context });
            }
          },
          close(ws) {
            const wsUrl = (ws.data as { url?: string }).url;
            const isServiceEndpoint = wsUrl
              ? new URL(wsUrl, "http://localhost").pathname.startsWith(servicePrefix)
              : false;

            if (isServiceEndpoint) {
              serviceWsRpcHandler.close(ws);
            } else {
              wsRpcHandler.close(ws);
            }
          },
        },
      });

      logger.info({ port }, "Server listening");
      logger.info({ host, port, prefix }, "oRPC endpoint ready");
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

  return { app, start, stop };
}
