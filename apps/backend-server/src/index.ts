import { Effect } from "effect";
import { ServerProgram } from "./program";

/**
 * Backend Server Entry Point
 *
 * This module initializes the GraphQL server with Effect-based patterns:
 * - Bun's native HTTP and WebSocket servers
 * - Notification handlers initialized as Effect operations
 * - Graceful shutdown with Effect-based cleanup
 * - Health check endpoint with handler status
 * - Full DI integration via Effect Layers
 */

// Run the server program
Effect.runPromise(ServerProgram).then(
  () => {
    // Should not reach here due to Effect.never, but handle anyway
    Effect.runSync(Effect.log("Server program completed unexpectedly"));
    process.exit(0);
  },
  (error) => {
    Effect.runSync(Effect.logError("Fatal error starting server").pipe(
      Effect.annotateLogs({ error })
    ));
    process.exit(1);
  }
);
