/**
 * Effect Logger Layer Configuration
 *
 * Provides a Layer for configuring Effect's built-in logger.
 * This replaces the need for a custom logger implementation.
 *
 * @module logger-layer
 *
 * @example
 * ```typescript
 * import { LoggerLayer } from "@mirai-app/frameworks/effect";
 * import { Layer } from "effect";
 *
 * // Use default console logger
 * const program = myEffect.pipe(
 *   Effect.provide(LoggerLayer.default)
 * );
 *
 * // Use with minimum log level
 * const program = myEffect.pipe(
 *   Effect.provide(LoggerLayer.withMinLogLevel("warn"))
 * );
 * ```
 */

import { Layer, Logger, LogLevel } from "effect";

/**
 * Default logger layer - console output with Effect's default formatting
 */
export const LoggerLayer = {
  /**
   * Default console logger
   */
  default: Layer.succeed(Logger.defaultLogger),

  /**
   * Create a layer with minimum log level filter
   */
  withMinLogLevel: (level: LogLevel.LogLevel) =>
    Layer.succeed(Logger.minimumLogLevel(level)),

  /**
   * Logger that discards all logs (useful for tests)
   */
  silent: Layer.succeed(Logger.remove(Logger.defaultLogger)),

  /**
   * Pretty-printing logger for development
   */
  pretty: Layer.succeed(
    Logger.replace(
      Logger.defaultLogger,
      Logger.make(({ date, logLevel, message }) => {
        const timestamp = date.toISOString();
        const level = logLevel.label.toUpperCase().padStart(5);
        console.log(`[${timestamp}] [${level}] ${message}`);
      }),
    ),
  ),
} as const;
