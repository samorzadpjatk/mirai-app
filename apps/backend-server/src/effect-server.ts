/**
 * Effect Server Integration
 *
 * Provides Effect-based service tags and layers for the HTTP server.
 * Integrates the Hono/Bun server lifecycle with Effect's dependency injection.
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Effect Server Layer                      │
 * │                                                              │
 * │  ┌──────────────────┐          ┌──────────────────────┐    │
 * │  │ HttpServerTag    │─────────>│ Server Lifecycle     │    │
 * │  │   - start()      │          │   - startEffect      │    │
 * │  │   - stop()       │          │   - stopEffect       │    │
 * │  │   - isRunning()  │          │   - graceful shutdown│    │
 * │  └──────────────────┘          └──────────────────────┘    │
 * │                                                              │
 * │  ┌──────────────────┐          ┌──────────────────────┐    │
 * │  │ HttpServerConfig │─────────>│ Server Configuration │    │
 * │  │   - port         │          │   - host, port       │    │
 * │  │   - host         │          │   - timeouts         │    │
 * │  │   - timeouts     │          │   - CORS settings    │    │
 * │  └──────────────────┘          └──────────────────────┘    │
 * │                                                              │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Usage
 *
 * ### Creating Server with Effect
 *
 * ```typescript
 * import { Effect } from "effect";
 * import { HttpServerTag, createServerLayer } from "./effect-server";
 *
 * const program = Effect.gen(function* () {
 *   const server = yield* HttpServerTag;
 *   yield* server.start();
 * });
 *
 * // Run with Layer
 * const result = await Effect.runPromise(
 *   program.pipe(Effect.provide(createServerLayer(config)))
 * );
 * ```
 *
 * @module effect-server
 */

import { Context, Effect, Layer } from "effect";
import { EffectLogger } from "@mirai-app/shared";
import type { BunServer } from "./bun-server";
import type { HonoConfig } from "./config/hono-config";

// =============================================================================
// Server Types
// =============================================================================

/**
 * HTTP server type (Bun server implementation)
 */
export type HttpServer = BunServer;

// =============================================================================
// Service Tags
// =============================================================================

/**
 * Context Tag for the HTTP Server service
 *
 * Provides access to server lifecycle methods within Effects.
 */
export class HttpServerTag extends Context.Tag("HttpServer")<
  HttpServerTag,
  {
    /** Start the server */
    readonly start: () => Effect.Effect<void, ServerStartError, never>;
    /** Stop the server gracefully */
    readonly stop: () => Effect.Effect<void, ServerStopError, never>;
    /** Check if server is running */
    readonly isRunning: () => boolean;
    /** Get the underlying server instance */
    readonly getInstance: () => HttpServer;
  }
>() {}

/**
 * Context Tag for Server Configuration
 */
export class HttpServerConfigTag extends Context.Tag("HttpServerConfig")<
  HttpServerConfigTag,
  HonoConfig
>() {}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Error raised when server fails to start
 */
export class ServerStartError extends Context.Tag("ServerStartError")<
  ServerStartError,
  Error
>() {
  static make(cause: unknown): ServerStartError {
    const error =
      cause instanceof Error
        ? cause
        : new Error(String(cause ?? "Unknown error"));
    return error as unknown as ServerStartError;
  }
}

/**
 * Error raised when server fails to stop
 */
export class ServerStopError extends Context.Tag("ServerStopError")<
  ServerStopError,
  Error
>() {
  static make(cause: unknown): ServerStopError {
    const error =
      cause instanceof Error
        ? cause
        : new Error(String(cause ?? "Unknown error"));
    return error as unknown as ServerStopError;
  }
}

// =============================================================================
// Effect Wrappers for Server Lifecycle
// =============================================================================

/**
 * Create an Effect that starts the server
 *
 * Wraps the async server.start() in an Effect for composability.
 *
 * @param server - The server instance to start
 * @returns Effect that completes when server starts
 */
export function startServerEffect(
  server: HttpServer,
): Effect.Effect<void, ServerStartError, never> {
  return Effect.tryPromise({
    try: () => server.start(),
    catch: (error) => ServerStartError.make(error),
  });
}

/**
 * Create an Effect that stops the server
 *
 * Wraps the async server.stop() in an Effect for composability.
 *
 * @param server - The server instance to stop
 * @returns Effect that completes when server stops
 */
export function stopServerEffect(
  server: HttpServer,
): Effect.Effect<void, ServerStopError, never> {
  return Effect.tryPromise({
    try: () => server.stop(),
    catch: (error) => ServerStopError.make(error),
  });
}

// =============================================================================
// Layer Builders
// =============================================================================

/**
 * Create a Layer that provides the HttpServer service from a BunServer
 *
 * @param server - The BunServer instance to wrap
 * @returns Layer providing HttpServerTag
 */
export function createBunServerLayer(
  server: BunServer,
): Layer.Layer<HttpServerTag, never, never> {
  const service = {
    start: () => startServerEffect(server),
    stop: () => stopServerEffect(server),
    isRunning: () => server.isRunning(),
    getInstance: () => server,
  };

  return Layer.succeed(HttpServerTag, service);
}

/**
 * Create a Layer that provides Server Configuration
 *
 * @param config - The HonoConfig to provide
 * @returns Layer providing HttpServerConfigTag
 */
export function createServerConfigLayer(
  config: HonoConfig,
): Layer.Layer<HttpServerConfigTag, never, never> {
  return Layer.succeed(HttpServerConfigTag, config);
}

// =============================================================================
// Complete Server Layer
// =============================================================================

/**
 * Options for creating the complete server layer
 */
export interface CreateServerLayerOptions {
  /** Server configuration */
  config: HonoConfig;
  /** Bun server instance */
  bunServer: BunServer;
}

/**
 * Create a complete server Layer from configuration
 *
 * Creates both the config and server service layers.
 *
 * @param options - Server creation options
 * @returns Layer providing both HttpServerTag and HttpServerConfigTag
 */
export function createServerLayer(
  options: CreateServerLayerOptions,
): Layer.Layer<HttpServerTag | HttpServerConfigTag, never, never> {
  const configLayer = createServerConfigLayer(options.config);
  const serverLayer = createBunServerLayer(options.bunServer);

  return Layer.merge(configLayer, serverLayer);
}

// =============================================================================
// Server Programs
// =============================================================================

/**
 * Program that starts the server and logs success
 *
 * @returns Effect that starts the server and logs
 */
export function startServerProgram(): Effect.Effect<
  void,
  ServerStartError,
  HttpServerTag
> {
  return Effect.gen(function* () {
    const server = yield* HttpServerTag;
    yield* server.start();
    yield* EffectLogger.info("[Effect] Server started successfully");
  });
}

/**
 * Program that stops the server and logs success
 *
 * @returns Effect that stops the server and logs
 */
export function stopServerProgram(): Effect.Effect<
  void,
  ServerStopError,
  HttpServerTag
> {
  return Effect.gen(function* () {
    const server = yield* HttpServerTag;
    yield* server.stop();
    yield* EffectLogger.info("[Effect] Server stopped successfully");
  });
}

/**
 * Program that handles graceful shutdown
 *
 * Waits for shutdown signal, then stops the server.
 *
 * @param signal - The shutdown signal received
 * @returns Effect that handles shutdown
 */
export function gracefulShutdownProgram(
  signal: string,
): Effect.Effect<void, ServerStopError, HttpServerTag> {
  return Effect.gen(function* () {
    yield* EffectLogger.info(
      `[Effect] Received ${signal}, initiating graceful shutdown...`,
    );
    yield* stopServerProgram();
    yield* EffectLogger.info("[Effect] Graceful shutdown complete");
  });
}

// =============================================================================
// Signal Handling
// =============================================================================

/**
 * Setup signal handlers for graceful shutdown
 *
 * Registers SIGTERM and SIGINT handlers that run the shutdown program.
 *
 * @param runEffect - Function to run the shutdown Effect
 */
export function setupSignalHandlers(
  runEffect: <A>(
    effect: Effect.Effect<A, unknown, HttpServerTag>,
  ) => Promise<A>,
): void {
  const shutdownHandler = (signal: string) => {
    void runEffect(gracefulShutdownProgram(signal)).then(
      () => process.exit(0),
      (error) => {
        // eslint-disable-next-line no-console
        console.error("[Effect] Shutdown failed:", error);
        process.exit(1);
      },
    );
  };

  process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
  process.on("SIGINT", () => shutdownHandler("SIGINT"));
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { createBunServer, type BunServer } from "./bun-server";
export { honoConfig, type HonoConfig } from "./config/hono-config";
