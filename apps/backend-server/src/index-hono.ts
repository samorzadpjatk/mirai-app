/**
 * Hono Server Entry Point with Effect Integration
 *
 * Entry point for starting the Hono GraphQL server with Effect runtime.
 * Handles server startup, shutdown, and error handling using Effect.
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
 * ## Effect Integration
 *
 * The server lifecycle is now managed through Effect:
 * - Server startup is wrapped in an Effect
 * - Graceful shutdown uses Effect for composable error handling
 * - DI container is wired to Effect Layers
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

import { Effect, Layer } from "effect";
import {
  makeAppLayer,
  type AppLayerConfig,
} from "@mirai-app/frameworks/layers";
import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";
import { createSupabaseClient } from "@mirai-app/frameworks/supabase/client";
import { serverLogger } from "@mirai-app/shared";
import { createBunServer } from "./bun-server";
import {
  honoConfig,
  validateHonoConfig,
  printHonoConfig,
} from "./config/hono-config";
import {
  HttpServerTag,
  createBunServerLayer,
  createServerConfigLayer,
  startServerProgram,
  stopServerProgram,
  setupSignalHandlers,
  type BunServer,
} from "./effect-server";

// =============================================================================
// Effect Layer Initialization
// =============================================================================

/** Global AppLayer instance - created once at bootstrap */
let _appLayer: Layer.Layer<unknown> | null = null;

/**
 * Get the global AppLayer instance
 * @returns The AppLayer or null if not initialized
 */
export function getAppLayer(): Layer.Layer<unknown> | null {
  return _appLayer;
}

/**
 * Create the AppLayer with database and Supabase clients
 *
 * This sets up the complete Effect Layer with all repositories and services.
 */
function createAppLayer(): Layer.Layer<unknown> {
  serverLogger.info("[Effect] Creating database and Supabase clients...");

  // Create database client
  const db = createDrizzleClient(process.env.DATABASE_URL);

  // Create Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required",
    );
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

  // Create AppLayer with all repositories and services
  const config: AppLayerConfig = { supabase, db };
  const appLayer = makeAppLayer(config);

  serverLogger.info("[Effect] AppLayer created successfully");
  return appLayer;
}

/**
 * Initialize the Effect runtime with AppLayer
 */
function initializeDependencies(): void {
  serverLogger.info("[Effect] Initializing Effect runtime...");

  // Create AppLayer with all dependencies
  _appLayer = createAppLayer();

  serverLogger.info("[Effect] Dependencies initialized successfully");
}

// =============================================================================
// Server Management
// =============================================================================

/** Server instance reference for external access */
let _server: BunServer | null = null;

/**
 * Get the current server instance
 *
 * @returns The active server instance or null if not running
 */
export function getServer(): BunServer | null {
  return _server;
}

/**
 * Check if server is currently running
 *
 * @returns True if server is running
 */
export function isServerRunning(): boolean {
  return _server?.isRunning() ?? false;
}

// =============================================================================
// Effect Programs
// =============================================================================

/**
 * Server startup program
 *
 * Validates config, creates server, starts it, and logs endpoints.
 */
const startupProgram = Effect.gen(function* () {
  // Validate configuration
  validateHonoConfig();
  printHonoConfig();

  // Get the global AppLayer
  const appLayer = getAppLayer();
  if (!appLayer) {
    throw new Error(
      "AppLayer not initialized. Call initializeDependencies() first.",
    );
  }

  // Create Bun server with WebSocket support and AppLayer
  serverLogger.info("[Effect] Creating Bun server...");
  _server = createBunServer(honoConfig, appLayer);

  // Create server layer with the instance
  const serverLayer = createBunServerLayer(_server);
  const configLayer = createServerConfigLayer(honoConfig);
  const serverAppLayer = Layer.merge(serverLayer, configLayer);

  // Start server within Effect (server layer merged with global AppLayer)
  yield* Effect.provide(startServerProgram(), serverAppLayer);

  // Log startup success
  yield* Effect.sync(() => {
    serverLogger.info("[Effect] Server startup complete");
    serverLogger.info(
      `[Effect] Health check: http://${honoConfig.host}:${honoConfig.port}/health`,
    );
    serverLogger.info(
      `[Effect] GraphQL endpoint: http://${honoConfig.host}:${honoConfig.port}${honoConfig.graphqlPath}`,
    );
    if (honoConfig.enableGraphiQL) {
      serverLogger.info(
        `[Effect] GraphiQL playground: http://${honoConfig.host}:${honoConfig.port}${honoConfig.graphqlPath}/graphiql`,
      );
    }
  });

  return _server;
});

/**
 * Graceful shutdown program
 *
 * Handles SIGTERM/SIGINT signals with proper cleanup.
 */
const shutdownProgram = (signal: string) =>
  Effect.gen(function* () {
    yield* Effect.sync(() => {
      serverLogger.info(`[Effect] Received ${signal}, initiating shutdown...`);
    });

    if (_server && _server.isRunning()) {
      // Create server layer for shutdown
      const serverLayer = createBunServerLayer(_server);
      yield* Effect.provide(stopServerProgram(), serverLayer);
    }

    yield* Effect.sync(() => {
      serverLogger.info("[Effect] Shutdown complete");
    });
  });

// =============================================================================
// Signal Handlers
// =============================================================================

/**
 * Setup process signal handlers for graceful shutdown
 */
function setupShutdownHandlers(): void {
  const handleSignal = (signal: string) => {
    Effect.runPromise(shutdownProgram(signal)).then(
      () => process.exit(0),
      (error) => {
        serverLogger.error("[Effect] Shutdown error:", { error });
        process.exit(1);
      },
    );
  };

  process.on("SIGTERM", () => handleSignal("SIGTERM"));
  process.on("SIGINT", () => handleSignal("SIGINT"));

  // Handle uncaught errors
  process.on("uncaughtException", (error) => {
    serverLogger.error("[Effect] Uncaught exception:", { error });
    handleSignal("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    serverLogger.error("[Effect] Unhandled rejection:", { error: reason });
    handleSignal("unhandledRejection");
  });
}

// =============================================================================
// Main Entry Point
// =============================================================================

/**
 * Start the server with Effect runtime
 *
 * This is the main entry point for server startup. It initializes
 * dependencies and runs the startup program.
 *
 * @returns Promise resolving to the server instance
 */
export async function start(): Promise<BunServer> {
  try {
    // Initialize dependencies
    initializeDependencies();

    // Setup shutdown handlers
    setupShutdownHandlers();

    // Run startup program
    const server = await Effect.runPromise(startupProgram);

    return server;
  } catch (error) {
    serverLogger.error("[Effect] Failed to start server:", { error });
    process.exit(1);
  }
}

/**
 * Stop the server gracefully
 *
 * Can be called programmatically to shut down the server.
 *
 * @returns Promise that resolves when server is stopped
 */
export async function stop(): Promise<void> {
  if (!_server) {
    serverLogger.info("[Effect] Server not running");
    return;
  }

  await Effect.runPromise(shutdownProgram("manual"));
}

// =============================================================================
// Direct Execution
// =============================================================================

// Check if this file is being run directly (not imported)
if (import.meta.main) {
  void start();
}
