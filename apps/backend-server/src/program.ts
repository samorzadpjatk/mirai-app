import { Effect } from "effect";
import { makeAppLayer } from "@mirai-app/frameworks/di";
import { ServerStartupError } from "./errors";
import { getServerConfig } from "./config";
import { createDatabaseClient, createSupabaseServiceClient } from "./infrastructure";
import { initializeHandlers, registerShutdownHandlers } from "./lifecycle";
import { startServer } from "./server";

/**
 * Main Server Program Effect
 * Orchestrates the entire server startup sequence
 */
export const ServerProgram = Effect.gen(function* () {
  yield* Effect.log("Starting Mirai App Backend Server...");

  // Get configuration
  const config = yield* getServerConfig;

  // Validate configuration
  if (!config.databaseUrl) {
    return yield* Effect.fail(new ServerStartupError({
      cause: new Error("DATABASE_URL not set"),
      phase: "database",
    }));
  }

  // Initialize infrastructure
  const db = yield* createDatabaseClient(config.databaseUrl);
  const supabase = yield* createSupabaseServiceClient(config.supabaseUrl, config.supabaseAnonKey);

  // Create the complete application layer
  const appLayer = makeAppLayer({ db, supabase });
  yield* Effect.log("Application layer created");

  // Initialize notification handlers
  yield* initializeHandlers(appLayer);

  // Register shutdown handlers before starting server
  yield* registerShutdownHandlers();

    // Start the server with the app layer, db, and supabase
    yield* startServer({ port: config.port, appLayer, db, supabase });

  // Keep the program running
  yield* Effect.never;
});
