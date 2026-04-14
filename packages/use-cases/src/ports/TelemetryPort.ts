/**
 * TelemetryPort - Telemetry Logging Port Interface (Effect-based)
 *
 * This interface defines telemetry/observability operations needed by the use cases layer.
 * It abstracts the telemetry mechanism, allowing different implementations
 * (console logging, external services like Datadog, etc.) in the adapters layer.
 *
 * Key Design Decisions:
 * - Uses Effect.Effect for composable error handling (no exceptions for expected errors)
 * - Returns void on success (fire-and-forget semantics)
 * - No framework dependencies (pure TypeScript interface with Effect)
 * - Async operations wrapped in Effect
 *
 * Implementations:
 * - DrizzleTelemetryAdapter: Logs to database via Drizzle ORM
 * - ConsoleTelemetryAdapter: Logs to console
 * - NoOpTelemetryAdapter: For testing (does nothing)
 *
 * @module ports
 */

import { Context, Effect, Data } from "effect";

// =============================================================================
// Domain Errors
// =============================================================================

/**
 * Error thrown when telemetry logging fails
 */
export class TelemetryError extends Data.TaggedError("TelemetryError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

// =============================================================================
// DTO Types
// =============================================================================

/**
 * Severity level for telemetry events
 */
export type TelemetrySeverity = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * TelemetryEvent represents a structured log/event for telemetry
 *
 * This DTO is used to pass telemetry data through the port without
 * depending on specific logging framework types.
 */
export type TelemetryEvent =
  | {
      readonly type: "log";
      readonly severity: TelemetrySeverity;
      readonly message: string;
      readonly context?: Record<string, unknown>;
      readonly timestamp: Date;
    }
  | {
      readonly type: "metric";
      readonly name: string;
      readonly value: number;
      readonly unit?: string;
      readonly tags?: Record<string, string>;
      readonly timestamp: Date;
    }
  | {
      readonly type: "trace";
      readonly name: string;
      readonly durationMs: number;
      readonly status: "success" | "error";
      readonly metadata?: Record<string, unknown>;
      readonly timestamp: Date;
    }
  | {
      readonly type: "error";
      readonly error: Error;
      readonly context?: Record<string, unknown>;
      readonly timestamp: Date;
    };

// =============================================================================
// Port Interface
// =============================================================================

/**
 * TelemetryPort defines the contract for telemetry operations
 *
 * This port abstracts the telemetry mechanism from the use cases,
 * enabling different implementations without changing business logic.
 *
 * All methods return Effect.Effect for composable error handling.
 */
export interface TelemetryPort {
  /**
   * Log a telemetry event
   *
   * @param event - The telemetry event to log
   * @returns Effect.Effect<void, TelemetryError, never>
   *
   * @example
   * ```typescript
   * const event: TelemetryEvent = {
   *   type: "log",
   *   severity: "info",
   *   message: "User created successfully",
   *   context: { userId: "123" },
   *   timestamp: new Date()
   * };
   *
   * const effect = telemetryPort.log(event);
   * const result = await Effect.runPromise(Effect.either(effect));
   * if (Either.isLeft(result)) {
   *   // Handle logging failure (rare, usually non-critical)
   * }
   * ```
   */
  readonly log: (
    event: TelemetryEvent,
  ) => Effect.Effect<void, TelemetryError, never>;

  /**
   * Log multiple telemetry events in batch
   *
   * @param events - Array of telemetry events to log
   * @returns Effect.Effect<void, TelemetryError, never>
   *
   * @example
   * ```typescript
   * const events: TelemetryEvent[] = [
   *   { type: "metric", name: "requests", value: 1, timestamp: new Date() },
   *   { type: "metric", name: "latency", value: 150, unit: "ms", timestamp: new Date() }
   * ];
   *
   * const effect = telemetryPort.logBatch(events);
   * await Effect.runPromise(effect);
   * ```
   */
  readonly logBatch?: (
    events: TelemetryEvent[],
  ) => Effect.Effect<void, TelemetryError, never>;

  /**
   * Flush any buffered telemetry data
   *
   * @returns Effect.Effect<void, TelemetryError, never>
   *
   * @example
   * ```typescript
   * // Ensure all telemetry is sent before shutting down
   * const effect = telemetryPort.flush();
   * await Effect.runPromise(effect);
   * ```
   */
  readonly flush?: () => Effect.Effect<void, TelemetryError, never>;
}

/**
 * TelemetryPort Context.Tag for Effect dependency injection
 *
 * This is the canonical Effect-based interface for telemetry operations.
 * Use this Tag with Effect.gen and yield* for dependency resolution.
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const telemetry = yield* TelemetryPortTag;
 *   yield* telemetry.log(event);
 * });
 * ```
 */
export class TelemetryPortTag extends Context.Tag("TelemetryPort")<
  TelemetryPortTag,
  TelemetryPort
>() {}
