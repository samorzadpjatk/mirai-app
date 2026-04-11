/**
 * TelemetryPort - Telemetry Logging Port Interface
 *
 * This interface defines telemetry/observability operations needed by the use cases layer.
 * It abstracts the telemetry mechanism, allowing different implementations
 * (console logging, external services like Datadog, etc.) in the adapters layer.
 *
 * Key Design Decisions:
 * - Uses Result type for explicit error handling
 * - Returns void on success (fire-and-forget semantics)
 * - No framework dependencies (pure TypeScript interface)
 * - Async operations return Promises
 *
 * Implementations:
 * - ConsoleTelemetryAdapter: Logs to console
 * - DatadogTelemetryAdapter: Sends to Datadog
 * - NoOpTelemetryAdapter: For testing (does nothing)
 *
 * @module ports
 */

import type { Result } from "@mirai-app/domain";

// =============================================================================
// Domain Errors
// =============================================================================

/**
 * Error thrown when telemetry logging fails
 */
export class TelemetryError extends Error {
  readonly _tag = "TelemetryError" as const;
  readonly code = "TELEMETRY_ERROR" as const;
  readonly operation: string;
  override readonly cause?: unknown;
  override readonly message: string;

  constructor(props: { operation: string; message: string; cause?: unknown }) {
    super(`Telemetry error in '${props.operation}': ${props.message}`);
    this.operation = props.operation;
    this.message = props.message;
    this.cause = props.cause;
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
 */
export interface TelemetryPort {
  /**
   * Log a telemetry event
   *
   * @param event - The telemetry event to log
   * @returns Result<void, TelemetryError>
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
   * const result = await telemetryPort.log(event);
   * if (isErr(result)) {
   *   // Handle logging failure (rare, usually non-critical)
   * }
   * ```
   */
  log(event: TelemetryEvent): Promise<Result<void, TelemetryError>>;

  /**
   * Log multiple telemetry events in batch
   *
   * @param events - Array of telemetry events to log
   * @returns Result<void, TelemetryError>
   *
   * @example
   * ```typescript
   * const events: TelemetryEvent[] = [
   *   { type: "metric", name: "requests", value: 1, timestamp: new Date() },
   *   { type: "metric", name: "latency", value: 150, unit: "ms", timestamp: new Date() }
   * ];
   *
   * await telemetryPort.logBatch(events);
   * ```
   */
  logBatch?(events: TelemetryEvent[]): Promise<Result<void, TelemetryError>>;

  /**
   * Flush any buffered telemetry data
   *
   * @returns Result<void, TelemetryError>
   *
   * @example
   * ```typescript
   * // Ensure all telemetry is sent before shutting down
   * await telemetryPort.flush();
   * ```
   */
  flush?(): Promise<Result<void, TelemetryError>>;
}
