/**
 * LogTelemetry Use Case
 *
 * Orchestrates telemetry logging for mobile app requests.
 * Extracts mobileAppMiddleware logging logic into a framework-agnostic use case.
 *
 * This use case:
 * - Creates structured telemetry events from mobile app metadata
 * - Delegates persistence to TelemetryPort (no direct DB access)
 * - Returns Effect for explicit error handling
 *
 * @module interactors
 */

import { Effect, Data } from "effect";
import { TelemetryPortTag, TelemetryError } from "../ports/TelemetryPort";
import type { TelemetryEvent } from "../ports/TelemetryPort";

// =============================================================================
// DTO Types
// =============================================================================

/**
 * Input DTO for LogTelemetry use case
 *
 * Contains mobile app metadata extracted from request headers.
 */
export interface LogTelemetryInput {
  /** User agent string from request */
  readonly userAgent: string;
  /** App version (e.g., "1.2.3") */
  readonly appVersion: string;
  /** Platform identifier (ios, android, web) */
  readonly platform: string;
  /** When the telemetry was recorded */
  readonly timestamp: Date;
  /** ID of the authenticated user (optional for anonymous requests) */
  readonly userId?: string;
  /** Additional context for the telemetry event */
  readonly context?: Record<string, unknown>;
}

/**
 * Output DTO for LogTelemetry use case
 *
 * Currently void - telemetry is fire-and-forget.
 * Future: Could return event ID for tracking.
 */
export interface LogTelemetryOutput {
  /** Unique identifier for the logged event */
  readonly eventId: string;
  /** Timestamp when the event was persisted */
  readonly loggedAt: Date;
}

/**
 * Error when telemetry logging fails
 */
export class LogTelemetryError extends Data.TaggedError("LogTelemetryError")<{
  readonly cause: unknown;
}> {}

// =============================================================================
// Use Case
// =============================================================================

/**
 * LogTelemetry Use Case (Effect-based)
 *
 * Logs telemetry events for mobile app requests.
 * Extracts logging logic from mobileAppMiddleware into a testable use case.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = logTelemetryUseCase(input).pipe(
 *   Effect.provideService(TelemetryPortTag, telemetryPort)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 *
 * ## Error Handling
 *
 * Returns Effect<void, TelemetryError> for explicit error handling.
 * Callers should handle failures gracefully - telemetry failures are typically
 * non-critical and should not block the main request flow.
 */
export function logTelemetryUseCase(
  input: LogTelemetryInput,
): Effect.Effect<void, TelemetryError, TelemetryPortTag> {
  return Effect.gen(function* () {
    const telemetryPort = yield* TelemetryPortTag;

    // Build telemetry event from input
    const event = buildTelemetryEvent(input);

    // Delegate to port for persistence
    // Use case has no knowledge of HOW telemetry is stored
    yield* telemetryPort.log(event);
  });
}

/**
 * Build a structured telemetry event from input DTO
 *
 * @param input - Raw telemetry input
 * @returns TelemetryEvent formatted for the port
 */
function buildTelemetryEvent(input: LogTelemetryInput): TelemetryEvent {
  // Determine severity based on platform/errors
  const severity = determineSeverity(input);

  // Build context with all metadata
  const context: Record<string, unknown> = {
    appVersion: input.appVersion,
    platform: input.platform,
    ...input.context,
  };

  // Add userId to context if present
  if (input.userId) {
    context.userId = input.userId;
  }

  return {
    type: "log",
    severity,
    message: `Mobile app request from ${input.platform} v${input.appVersion}`,
    context,
    timestamp: input.timestamp,
  };
}

/**
 * Determine severity level based on input metadata
 *
 * @param _input - Telemetry input
 * @returns Severity level for the event
 */
function determineSeverity(
  _input: LogTelemetryInput,
): "debug" | "info" | "warn" | "error" | "fatal" {
  // Default to info for normal mobile app telemetry
  // Could be extended to detect errors from context
  return "info";
}
