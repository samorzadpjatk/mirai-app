import { Effect, type Layer } from "effect";
import { makeAppLayer } from "@mirai-app/frameworks/di";
import { ServerStartupError } from "./errors";
import { getServerConfig } from "./config";
import { createDatabaseClient, createBetterAuthClient } from "./infrastructure";
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

  // Validate Better Auth configuration (always required)
  if (!config.betterAuthSecret) {
    return yield* Effect.fail(new ServerStartupError({
      cause: new Error("BETTER_AUTH_SECRET not set"),
      phase: "better_auth",
    }));
  }
  if (!config.betterAuthUrl) {
    return yield* Effect.fail(new ServerStartupError({
      cause: new Error("BETTER_AUTH_URL not set"),
      phase: "better_auth",
    }));
  }
  if (config.betterAuthSecret.length < 32) {
    return yield* Effect.fail(new ServerStartupError({
      cause: new Error("BETTER_AUTH_SECRET must be at least 32 characters"),
      phase: "better_auth",
    }));
  }

  // Initialize infrastructure
  const db = yield* createDatabaseClient(config.databaseUrl);

  // Create Better Auth client
  const betterAuth = yield* createBetterAuthClient(db, config.betterAuthSecret, config.betterAuthUrl);
  yield* Effect.log("Better Auth initialized");

  // Create the complete application layer
  const appLayer = makeAppLayer({ db });
  yield* Effect.log("Application layer created");

  // Initialize notification handlers
  yield* initializeHandlers(appLayer);

  // Register shutdown handlers before starting server
  yield* registerShutdownHandlers();

  // Start the server with the app layer, db, and betterAuth
  yield* startServer({ port: config.port, appLayer, db, betterAuth });

  // Keep the program running
  yield* Effect.never;
});
