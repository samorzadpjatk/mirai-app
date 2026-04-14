/**
 * Effect Logger Integration
 *
 * This module provides Effect-native logging that replaces the custom logger.
 * It re-exports Effect's built-in logging capabilities with a familiar interface.
 *
 * Benefits over custom logger:
 * - Native Effect integration (composable, testable)
 * - Automatic span and context propagation
 * - No manual console.* calls (true functional style)
 * - Compatible with Effect's logging middleware
 *
 * @module effect-logger
 *
 * @example
 * ```typescript
 * import { EffectLogger } from "@mirai-app/shared";
 *
 * // In Effect code:
 * const program = Effect.gen(function* () {
 *   yield* EffectLogger.info("Processing started", { userId: "123" });
 *   // ... logic
 *   yield* EffectLogger.error("Something failed", error, { context: "here" });
 * });
 * ```
 */

import { Effect, Logger } from "effect";

// ============================================================================
// Import LogContext type from legacy logger (shared interface)
// ============================================================================

import type { LogContext } from "./logger";
export type { LogContext, LogLevel } from "./logger";

// ============================================================================
// Effect Logger API
// ============================================================================

/**
 * Log a debug message with optional context
 */
export function debug(
  message: string,
  context?: LogContext,
): Effect.Effect<void, never, never> {
  return Effect.logDebug(message).pipe(
    context ? Effect.annotateLogs(context) : (x) => x,
  );
}

/**
 * Log an info message with optional context
 */
export function info(
  message: string,
  context?: LogContext,
): Effect.Effect<void, never, never> {
  return Effect.log(message).pipe(
    context ? Effect.annotateLogs(context) : (x) => x,
  );
}

/**
 * Log a warning message with optional context and error
 */
export function warn(
  message: string,
  context?: LogContext,
): Effect.Effect<void, never, never> {
  return Effect.logWarning(message).pipe(
    context ? Effect.annotateLogs(context) : (x) => x,
  );
}

/**
 * Log an error message with optional error and context
 */
export function error(
  message: string,
  error?: Error,
  context?: LogContext,
): Effect.Effect<void, never, never> {
  const baseEffect = Effect.logError(message);
  const withError = error
    ? baseEffect.pipe(
        Effect.annotateLogs({
          errorMessage: error.message,
          errorStack: error.stack,
        }),
      )
    : baseEffect;
  return context ? withError.pipe(Effect.annotateLogs(context)) : withError;
}

/**
 * Create a child logger with additional context (span in Effect terms)
 */
export function withContext(
  context: LogContext,
): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R> {
  return (effect) => effect.pipe(Effect.annotateLogs(context));
}

// ============================================================================
// Re-exports from Effect Logger
// ============================================================================

export { Logger } from "effect";

// ============================================================================
// Convenience namespace for imports
// Example: import { EffectLogger } from "@mirai-app/shared";
//          yield* EffectLogger.info("message");
// ============================================================================

/**
 * Convenience namespace for grouped imports.
 * Use: `import { EffectLogger } from "@mirai-app/shared";` then `yield* EffectLogger.info("message")`
 */
export const EffectLogger = {
  debug,
  info,
  warn,
  error,
  withContext,
} as const;
