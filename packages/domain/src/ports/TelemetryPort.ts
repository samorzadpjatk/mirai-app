import type { Effect } from "effect";

/**
 * TelemetryPort - Telemetry Logging Port Interface (Effect-based)
 *
 * This interface defines telemetry/observability operations needed by the use cases layer.
 * It abstracts the telemetry mechanism, allowing different implementations
 * (console logging, external services like Datadog, etc.) in the adapters layer.
 */

// =============================================================================
// Domain Errors
// =============================================================================

/**
 * Error thrown when telemetry logging fails
 */
export class TelemetryError extends Error {
  readonly _tag = "TelemetryError" as const;
  readonly operation: string;
  declare readonly cause: unknown;

  constructor(props: { operation: string; message: string; cause?: unknown }) {
    super(props.message, { cause: props.cause });
    this.operation = props.operation;
  }
}

// =============================================================================
// DTO Types
// =============================================================================

/**
 * Severity level for telemetry events
 */
export type TelemetrySeverity = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * TelemetryEvent represents a structured log/event for telemetry
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
 */
export interface TelemetryPort {
  /**
   * Log a telemetry event
   */
  log(event: TelemetryEvent): Effect.Effect<void, TelemetryError, never>;

  /**
   * Log a debug message
   */
  debug(
    message: string,
    context?: Record<string, unknown>,
  ): Effect.Effect<void, TelemetryError, never>;

  /**
   * Log an info message
   */
  info(
    message: string,
    context?: Record<string, unknown>,
  ): Effect.Effect<void, TelemetryError, never>;

  /**
   * Log a warning message
   */
  warn(
    message: string,
    context?: Record<string, unknown>,
  ): Effect.Effect<void, TelemetryError, never>;

  /**
   * Log an error message
   */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): Effect.Effect<void, TelemetryError, never>;

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    value: number,
    unit?: string,
    tags?: Record<string, string>,
  ): Effect.Effect<void, TelemetryError, never>;

  /**
   * Record a trace/span
   */
  recordTrace(
    name: string,
    durationMs: number,
    status: "success" | "error",
    metadata?: Record<string, unknown>,
  ): Effect.Effect<void, TelemetryError, never>;
}
