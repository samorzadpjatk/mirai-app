import { appRouter, createORPCContext, logger, serviceRouter } from "@mirai-app/orpc";
import { ORPCError, onError } from "@orpc/server";
import { RPCHandler as BunWsRPCHandler } from "@orpc/server/bun-ws";
import { RPCHandler } from "@orpc/server/fetch";
import { BatchHandlerPlugin } from "@orpc/server/plugins";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunServer } from "./bun-server";
import {
  buildSecurityHeaders,
  createCorsOrigin,
  createRateLimiter,
  getAllowedOrigins,
  getClientIp,
  getWsEnvConfig,
  hashAccessToken,
  TEN_MB,
} from "./utils";

export interface ServerOptions {
  dev?: boolean;
  port?: number;
  prefix?: string;
  host?: string;
}

function createOnErrorCallback(dev: boolean, source: string) {
  return (error: unknown): void => {
    logger.error(error, `${source} error`);
    if (!dev && !(error instanceof ORPCError)) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Internal server error" });
    }
  };
}

export function createServer(opts: ServerOptions) {
  const dev = opts.dev ?? true;
  const port = opts.port ?? 3000;
  const prefix = opts.prefix ?? "/api/orpc";
  const host = opts.host ?? "127.0.0.1";

  const limiter = createRateLimiter();
  const app = new Hono();

  app.use("*", async (c, next) => {
    const contentLength = c.req.header("content-length");
    if (contentLength && Number.parseInt(contentLength, 10) > TEN_MB) {
      return c.text("Payload Too Large", 413);
    }
    await next();
  });

  app.use("*", async (c, next) => {
    const headers: Record<string, string | undefined> = {
      "x-forwarded-for": c.req.header("x-forwarded-for"),
      "x-real-ip": c.req.header("x-real-ip"),
    };
    const ip = getClientIp(headers);
    const { allowed, retryAfter } = limiter.check("ip", ip);

    if (!allowed) {
      c.header("Retry-After", String(retryAfter));
      return c.text("Too Many Requests", 429);
    }

    await next();
  });

  app.use("*", async (c, next) => {
    await next();
    for (const [name, value] of Object.entries(buildSecurityHeaders())) {
      c.header(name, value);
    }
  });

  if (dev) {
    const allowedOrigins = getAllowedOrigins();
    app.use(
      "*",
      cors({
        origin: (origin) => {
          const result = createCorsOrigin(allowedOrigins, origin);
          return result.origin;
        },
        credentials: true,
      }),
    );
  }

  // HTTP oRPC handler. Non-streaming procedures from the client travel over
  // plain HTTP (the WebSocket link is only used for streaming procedures), so
  // this mount is required for normal queries/mutations. Without it every
  // request falls through to Hono's default 404 ("Not Found").
  const checkUserRateLimit = async (accessToken: string | null): Promise<void> => {
    const tokenKey = await hashAccessToken(accessToken);

    if (!tokenKey) {
      return;
    }

    const { allowed, retryAfter } = limiter.check("user", tokenKey);

    if (!allowed) {
      throw new ORPCError("TOO_MANY_REQUESTS", {
        status: 429,
        data: { retryAfter },
        message: "Too Many Requests",
      });
    }
  };

  const rpcHandler = new RPCHandler(appRouter, {
    plugins: [new BatchHandlerPlugin()],
    interceptors: [
      async ({ context, next }) => {
        await checkUserRateLimit(context.accessToken);
        return next();
      },
      onError(createOnErrorCallback(dev, "RPC HTTP handler")),
    ],
  });

  app.use(`${prefix}/*`, async (c, next) => {
    const request =
      c.req.method === "GET" || c.req.method === "HEAD"
        ? c.req.raw
        : new Proxy(c.req.raw, {
            get(target, prop) {
              switch (prop) {
                case "json":
                  return () => c.req.json();
                case "text":
                  return () => c.req.text();
                default:
                  return Reflect.get(target, prop, target) as unknown;
              }
            },
          });

    const { supabaseUrl, supabaseKey, databaseUrl } = getWsEnvConfig();

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

  const servicePrefix = "/internal/orpc";

  const wsRpcHandler = new BunWsRPCHandler(appRouter, {
    plugins: [new BatchHandlerPlugin()],
    interceptors: [
      async ({ context, next }) => {
        await checkUserRateLimit(context.accessToken);
        return next();
      },
      onError(createOnErrorCallback(dev, "RPC WebSocket handler")),
    ],
  });

  const serviceWsRpcHandler = new BunWsRPCHandler(serviceRouter, {
    plugins: [new BatchHandlerPlugin()],
    interceptors: [
      async ({ context, next }) => {
        await checkUserRateLimit(context.accessToken);
        return next();
      },
      onError(createOnErrorCallback(dev, "Service RPC WebSocket handler")),
    ],
  });

  const { start, stop } = createBunServer({
    port,
    hostname: host,
    prefix,
    servicePrefix,
    app,
    wsRpcHandler,
    serviceWsRpcHandler,
  });

  return { app, start, stop };
}
