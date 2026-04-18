import { Effect } from "effect";
import { Hono } from "hono";
import type { BetterAuthInstance } from "@mirai-app/frameworks/better-auth";
import { serverState } from "../state";

/**
 * Hono app configuration options
 */
export interface HonoAppConfig {
  /** Better Auth instance for handling auth routes */
  betterAuth?: BetterAuthInstance;
}

/**
 * Create Hono HTTP app with health, readiness, and auth endpoints
 */
export const createHonoApp = (config?: HonoAppConfig) =>
  Effect.sync((): Hono => {
    const app = new Hono();

    // Health check endpoint
    app.get("/health", (c) => {
      const overallStatus = serverState.handlerStatus.notification === "initialized" ? "ok" : "degraded";

      return c.json({
        status: overallStatus,
        handlers: serverState.handlerStatus,
        timestamp: new Date().toISOString(),
      });
    });

    // Readiness check
    app.get("/ready", (c) => {
      if (serverState.handlerStatus.notification !== "initialized") {
        return c.json({
          ready: false,
          reason: `Notification handlers status: ${serverState.handlerStatus.notification}`,
        }, 503);
      }

      return c.json({ ready: true });
    });

    // GraphQL redirect for backward compatibility
    // Redirects deprecated /graphql path to new /api/graphql location
    app.all("/graphql", (c) => {
      Effect.runFork(Effect.logWarning("Deprecated GraphQL path used, redirecting to /api/graphql", {
        originalPath: c.req.path,
        userAgent: c.req.header("user-agent") ?? "unknown",
      }));
      return c.redirect("/api/graphql", 301);
    });

    // Better Auth routes - mount at /api/auth/*
    // Includes error handling with logging for production debugging
    const auth = config?.betterAuth;
    if (auth) {
      app.all("/api/auth/*", async (c) => {
        try {
          return await auth.handler(c.req.raw);
        } catch (error) {
          const errorDetails = error instanceof Error ? error.message : String(error);
          const stack = error instanceof Error ? error.stack : undefined;

          Effect.runFork(Effect.logError("Better Auth handler error", {
            error: errorDetails,
            stack,
            path: c.req.path,
            method: c.req.method,
            userAgent: c.req.header("user-agent") ?? "unknown",
            timestamp: new Date().toISOString(),
          }));

          return c.json({ error: "Authentication error" }, 500);
        }
      });
    }

    return app;
  });
