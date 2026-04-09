/**
 * LogTelemetry Use Case
 *
 * Orchestrates telemetry logging for mobile app requests.
 * Extracts mobileAppMiddleware logging logic into a framework-agnostic use case.
 *
 * This use case:
 * - Creates structured telemetry events from mobile app metadata
 * - Delegates persistence to TelemetryPort (no direct DB access)
 * - Returns Result type for explicit error handling
 *
 * @module interactors
 */

import type { Result } from "@mirai-app/domain";
import type { TelemetryPort, TelemetryEvent } from "../ports/TelemetryPort";
import { TelemetryError } from "../ports/TelemetryPort";

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

// =============================================================================
// Use Case
// =============================================================================

/**
 * LogTelemetry Use Case
 *
 * Logs telemetry events for mobile app requests.
 * Extracts logging logic from mobileAppMiddleware into a testable use case.
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new LogTelemetryUseCase(telemetryPort);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("logTelemetryUseCase");
 * ```
 *
 * ## Error Handling
 *
 * Returns Result<void, TelemetryError> for explicit error handling.
 * Callers should handle failures gracefully - telemetry failures are typically
 * non-critical and should not block the main request flow.
 *
 * ```typescript
 * const result = await useCase.execute(input);
 * if (isErr(result)) {
 *   // Log locally, but don't fail the request
 *   console.warn("Telemetry logging failed:", result.error);
 * }
 * ```
 */
export class LogTelemetryUseCase {
  constructor(private readonly telemetryPort: TelemetryPort) {}

  /**
   * Execute telemetry logging
   *
   * @param input - Mobile app telemetry data
   * @returns Result<void, TelemetryError> - success or telemetry error
   *
   * @example
   * ```typescript
   * const input: LogTelemetryInput = {
   *   userAgent: "MiraiApp/1.2.3 (iOS 16.0; iPhone14,2)",
   *   appVersion: "1.2.3",
   *   platform: "ios",
   *   timestamp: new Date(),
   *   userId: "user-123",
   *   context: { route: "/api/challenges" }
   * };
   *
   * const result = await useCase.execute(input);
   * if (isOk(result)) {
   *   console.log("Telemetry logged successfully");
   * }
   * ```
   */
  async execute(
    input: LogTelemetryInput,
  ): Promise<Result<void, TelemetryError>> {
    // Build telemetry event from input
    const event = this.buildTelemetryEvent(input);

    // Delegate to port for persistence
    // Use case has no knowledge of HOW telemetry is stored
    return this.telemetryPort.log(event);
  }

  /**
   * Build a structured telemetry event from input DTO
   *
   * @private
   * @param input - Raw telemetry input
   * @returns TelemetryEvent formatted for the port
   */
  private buildTelemetryEvent(input: LogTelemetryInput): TelemetryEvent {
    // Determine severity based on platform/errors
    const severity = this.determineSeverity(input);

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
   * @private
   * @param input - Telemetry input
   * @returns Severity level for the event
   */
  private determineSeverity(
    _input: LogTelemetryInput,
  ): "debug" | "info" | "warn" | "error" | "fatal" {
    // Default to info for normal mobile app telemetry
    // Could be extended to detect errors from context
    return "info";
  }
}
