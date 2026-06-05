import { appRouter, enableUserAgentTelemetry, logger, serviceRouter } from "@mirai-app/orpc";
import { ORPCError, onError } from "@orpc/server";
import { RPCHandler as BunWsRPCHandler } from "@orpc/server/bun-ws";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunServer } from "./bun-server";
import {
  TEN_MB,
  buildSecurityHeaders,
  createCorsOrigin,
  createRateLimiter,
  getAllowedOrigins,
  getClientIp,
} from "./utils";

export interface ServerOptions {
  dev?: boolean;
  port?: number;
  prefix?: string;
  host?: string;
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
    const headers: Record<string, string | undefined> = {
      "x-forwarded-for": c.req.header("x-forwarded-for"),
      "x-real-ip": c.req.header("x-real-ip"),
    };
    const ip = getClientIp(headers);
    const path = new URL(c.req.url).pathname;
    const { allowed, retryAfter } = checkRateLimit(ip, path.startsWith(prefix));

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

  app.get("/health", (c) => c.text("OK"));

  const servicePrefix = "/internal/trpc";

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
