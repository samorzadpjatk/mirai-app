import { Effect } from "effect";
import { serverState } from "../state";

/**
 * Perform graceful shutdown
 */
export const performShutdown = (signal: string) =>
  Effect.gen(function* () {
    yield* Effect.log(`Received ${signal}, starting graceful shutdown...`);

    // Clean up notification handlers
    if (serverState.notificationCleanup) {
      yield* Effect.sync(() => serverState.notificationCleanup!());
      serverState.handlerStatus.notification = "cleaned_up";
      yield* Effect.log("Notification handlers cleaned up");
    }

    // Clean up location handlers
    if (serverState.locationCleanup) {
      yield* Effect.sync(() => serverState.locationCleanup!());
      serverState.handlerStatus.location = "cleaned_up";
      yield* Effect.log("Location handlers cleaned up");
    }

    // Close all WebSocket connections
    yield* Effect.sync(() => {
      for (const ws of serverState.wsConnections) {
        ws.close();
      }
      serverState.wsConnections.clear();
    });
    yield* Effect.log("WebSocket connections closed");

    // Stop the Bun server
    if (serverState.server) {
      yield* Effect.sync(() => serverState.server!.stop());
      yield* Effect.log("HTTP server closed");
    }

    yield* Effect.log("Graceful shutdown complete");

    // Exit cleanly
    yield* Effect.sync(() => process.exit(0));
  }).pipe(
    Effect.timeout("30 seconds"),
    Effect.catchAll(() =>
      Effect.gen(function* () {
        yield* Effect.logError("Forced shutdown after timeout").pipe(
          Effect.annotateLogs({ error: new Error("Timeout") })
        );
        yield* Effect.sync(() => process.exit(1));
      })
    )
  );

/**
 * Register SIGTERM and SIGINT handlers
 */
export const registerShutdownHandlers = () =>
  Effect.sync(() => {
    process.on("SIGTERM", () => {
      Effect.runPromise(performShutdown("SIGTERM")).catch(() => process.exit(1));
    });
    process.on("SIGINT", () => {
      Effect.runPromise(performShutdown("SIGINT")).catch(() => process.exit(1));
    });
  });
