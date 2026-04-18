import { Effect } from "effect";
import { Hono } from "hono";
import { serverState } from "../state";

/**
 * Create Hono HTTP app with health and readiness endpoints
 */
export const createHonoApp = () =>
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

    return app;
  });
