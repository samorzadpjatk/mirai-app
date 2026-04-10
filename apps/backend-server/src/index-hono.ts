/**
 * Hono Server Entry Point
 *
 * Entry point for starting the Hono GraphQL server.
 * Handles server startup, shutdown, and error handling.
 *
 * ## Usage
 *
 * ### Development (with hot reload):
 * ```bash
 * bun run dev:hono
 * ```
 *
 * ### Production:
 * ```bash
 * bun run start:hono
 * ```
 *
 * ## Environment Variables
 *
 * See `config/hono-config.ts` for all available environment variables.
 *
 * Key variables:
 * - `HONO_SERVER_PORT` - Server port (default: 4000)
 * - `HONO_SERVER_HOST` - Server host (default: 127.0.0.1)
 * - `HONO_ENABLE_GRAPHIQL` - Enable GraphiQL playground
 * - `NODE_ENV` - Environment mode
 *
 * @module index-hono
 */

import { createHonoServer, type HonoServer } from "./hono-server";
import {
  honoConfig,
  validateHonoConfig,
  printHonoConfig,
} from "./config/hono-config";

// =============================================================================
// Startup
// =============================================================================

/**
 * Start the Hono server
 */
async function startServer(): Promise<HonoServer> {
  try {
    // Validate configuration before starting
    validateHonoConfig();

    // Print configuration summary
    printHonoConfig();

    // Create server
    const server = createHonoServer(honoConfig);

    // Start server
    await server.start();

    return server;
  } catch (error) {
    console.error("[Hono] Failed to start server:", error);
    process.exit(1);
  }
}

// =============================================================================
// Shutdown
// =============================================================================

/**
 * Handle graceful shutdown
 */
function handleShutdown(server: HonoServer): void {
  // Handle graceful shutdown signals
  const shutdown = async (signal: string) => {
    console.log(`\n[Hono] Received ${signal}, initiating graceful shutdown...`);

    try {
      await server.stop();
      console.log("[Hono] Shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("[Hono] Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    console.error("[Hono] Uncaught exception:", error);
    void shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[Hono] Unhandled rejection:", reason);
    void shutdown("unhandledRejection");
  });
}

// =============================================================================
// Main
// =============================================================================

/**
 * Main function - starts server and sets up handlers
 */
async function main(): Promise<HonoServer> {
  // Start server
  const server = await startServer();

  // Setup shutdown handlers (synchronous - registers event listeners)
  handleShutdown(server);

  return server;
}

// =============================================================================
// Export for testing
// =============================================================================

/**
 * Exported server instance (for testing)
 *
 * Can be imported in tests to verify server behavior:
 *
 * ```typescript
 * import { server } from "./index-hono";
 *
 * describe("Server", () => {
 *   it("should be running", () => {
 *     expect(server.isRunning()).toBe(true);
 *   });
 * });
 * ```
 */
export let server: HonoServer | null = null;

/**
 * Start function for programmatic use
 *
 * Can be used in tests or other entry points:
 *
 * ```typescript
 * import { start } from "./index-hono";
 * await start();
 * ```
 */
export async function start(): Promise<HonoServer> {
  server = await main();
  return server;
}

// =============================================================================
// Run if called directly
// =============================================================================

// Check if this file is being run directly (not imported)
if (import.meta.main) {
  void main();
}
