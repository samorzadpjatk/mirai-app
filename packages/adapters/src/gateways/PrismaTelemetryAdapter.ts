/**
 * PrismaTelemetryAdapter - TelemetryPort implementation using Prisma ORM
 *
 * This adapter implements the TelemetryPort interface to persist telemetry
 * events to the database using Prisma. It stores telemetry data in the
 * UserAgent table for mobile app tracking and supports various event types.
 *
 * Key Design Decisions:
 * - Uses Result type for explicit error handling (no exceptions for expected errors)
 * - Maps Prisma errors to domain TelemetryError
 * - Thin wrapper with no business logic (just persistence)
 * - Compatible with awilix-modular dependency injection
 *
 * @module gateways
 */

import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import { ok, err, type Result } from "@mirai-app/domain";
import {
  type TelemetryPort,
  type TelemetryEvent,
  TelemetryError,
} from "@mirai-app/use-cases/ports/TelemetryPort";

/**
 * Prisma error codes that we handle explicitly
 */
const PRISMA_ERROR_CODES = {
  P2002: "Unique constraint violation",
  P2003: "Foreign key constraint failed",
  P2024: "Timed out fetching connection from pool",
  P2025: "Record not found",
  P2034: "Transaction conflict",
} as const;

/**
 * Maps Prisma errors to domain TelemetryError
 *
 * @param error - The error thrown by Prisma
 * @param operation - The operation being performed
 * @returns TelemetryError with appropriate context
 */
function mapPrismaErrorToTelemetryError(
  error: unknown,
  operation: string,
): TelemetryError {
  if (error instanceof Error) {
    // Check for Prisma-specific error codes
    const errorCode = (error as { code?: string }).code;

    if (errorCode && errorCode in PRISMA_ERROR_CODES) {
      return new TelemetryError({
        operation,
        message: `Database error: ${PRISMA_ERROR_CODES[errorCode as keyof typeof PRISMA_ERROR_CODES]}`,
        cause: error,
      });
    }

    // Generic error with message
    return new TelemetryError({
      operation,
      message: error.message,
      cause: error,
    });
  }

  // Unknown error type
  return new TelemetryError({
    operation,
    message: "Unknown error occurred during telemetry operation",
    cause: error,
  });
}

/**
 * Extract platform from user agent string or event context
 *
 * @param event - The telemetry event
 * @returns Platform string (ios, android, web, or unknown)
 */
function extractPlatform(event: TelemetryEvent): string {
  // For log events, try to extract from context
  if (event.type === "log" && event.context?.userAgent) {
    const ua = String(event.context.userAgent).toLowerCase();
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) {
      return "ios";
    }
    if (ua.includes("android")) {
      return "android";
    }
    if (ua.includes("web") || ua.includes("chrome") || ua.includes("safari")) {
      return "web";
    }
  }

  // Default to unknown
  return "unknown";
}

/**
 * Build user agent string from event context
 *
 * @param event - The telemetry event
 * @returns User agent string for storage
 */
function buildUserAgentString(event: TelemetryEvent): string {
  const parts: string[] = [];

  if (event.type === "log") {
    // Add severity
    parts.push(`[${event.severity.toUpperCase()}]`);

    // Add message
    parts.push(event.message);

    // Add context details
    if (event.context) {
      const contextStr = Object.entries(event.context)
        .filter(([key]) => key !== "userAgent") // Exclude raw user agent, stored separately
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(", ");
      if (contextStr) {
        parts.push(`context={${contextStr}}`);
      }
    }
  } else if (event.type === "metric") {
    parts.push(`[METRIC] ${event.name}=${event.value}`);
    if (event.unit) {
      parts.push(event.unit);
    }
    if (event.tags) {
      const tagsStr = Object.entries(event.tags)
        .map(([key, value]) => `${key}=${value}`)
        .join(", ");
      parts.push(`tags={${tagsStr}}`);
    }
  } else if (event.type === "trace") {
    parts.push(
      `[TRACE] ${event.name} duration=${event.durationMs}ms status=${event.status}`,
    );
    if (event.metadata) {
      const metaStr = Object.entries(event.metadata)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(", ");
      parts.push(`metadata={${metaStr}}`);
    }
  } else if (event.type === "error") {
    parts.push(`[ERROR] ${event.error.message}`);
    if (event.error.stack) {
      parts.push(`stack=${event.error.stack}`);
    }
    if (event.context) {
      const contextStr = Object.entries(event.context)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(", ");
      parts.push(`context={${contextStr}}`);
    }
  }

  return parts.join(" ");
}

/**
 * Extract user ID from event context if available
 *
 * @param event - The telemetry event
 * @returns User ID or undefined
 */
function extractUserId(event: TelemetryEvent): string | undefined {
  if (event.type === "log" || event.type === "error") {
    const userId = event.context?.userId;
    if (typeof userId === "string") {
      return userId;
    }
  }
  return undefined;
}

/**
 * Extract endpoint from event context if available
 *
 * @param event - The telemetry event
 * @returns Endpoint or undefined
 */
function extractEndpoint(event: TelemetryEvent): string | undefined {
  if (event.type === "log" || event.type === "error") {
    const endpoint = event.context?.endpoint;
    if (typeof endpoint === "string") {
      return endpoint;
    }
  }
  return undefined;
}

/**
 * PrismaTelemetryAdapter
 *
 * Implements TelemetryPort using Prisma ORM to persist telemetry
 * events to the UserAgent table in the database.
 *
 * Compatible with awilix-modular dependency injection.
 * Registered in RepositoryModule with singleton lifetime.
 *
 * @example
 * ```typescript
 * // With DI container (awilix-modular)
 * const telemetry = container.resolve("telemetryPort");
 * const result = await telemetry.log(event);
 *
 * // Manual instantiation (backward-compatible)
 * const telemetry = new PrismaTelemetryAdapter(prisma);
 * const result = await telemetry.log(event);
 *
 * // Check result
 * if (isErr(result)) {
 *   console.error("Failed to log telemetry:", result.error.message);
 * }
 * ```
 */
export class PrismaTelemetryAdapter implements TelemetryPort {
  /**
   * Creates a new PrismaTelemetryAdapter
   *
   * @param prisma - PrismaClient instance (injected by awilix or passed manually)
   */
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Log a telemetry event to the database
   *
   * @param event - The telemetry event to log
   * @returns Result<void, TelemetryError> - ok() on success, err() on failure
   *
   * @example
   * ```typescript
   * const event: TelemetryEvent = {
   *   type: "log",
   *   severity: "info",
   *   message: "User created successfully",
   *   context: { userId: "123", endpoint: "/api/users" },
   *   timestamp: new Date()
   * };
   *
   * const result = await adapter.log(event);
   * if (isErr(result)) {
   *   // Handle error (telemetry is usually non-critical)
   *   console.warn("Telemetry logging failed:", result.error);
   * }
   * ```
   */
  async log(event: TelemetryEvent): Promise<Result<void, TelemetryError>> {
    try {
      // Transform telemetry event to UserAgent record
      const userAgent = buildUserAgentString(event);
      const platform = extractPlatform(event);
      const userId = extractUserId(event);
      const endpoint = extractEndpoint(event);

      // Persist to database
      await this.prisma.userAgent.create({
        data: {
          userAgent,
          platform,
          userId,
          endpoint,
          timestamp: event.timestamp,
        },
      });

      return ok(undefined);
    } catch (error) {
      return err(mapPrismaErrorToTelemetryError(error, "log"));
    }
  }

  /**
   * Log multiple telemetry events in batch
   *
   * This implementation logs events sequentially to ensure each event
   * is properly persisted even if one fails. For higher throughput,
   * consider using Prisma's createMany (if available) or a queue.
   *
   * @param events - Array of telemetry events to log
   * @returns Result<void, TelemetryError> - ok() on success, err() on failure
   *
   * @example
   * ```typescript
   * const events: TelemetryEvent[] = [
   *   { type: "metric", name: "requests", value: 1, timestamp: new Date() },
   *   { type: "metric", name: "latency", value: 150, unit: "ms", timestamp: new Date() }
   * ];
   *
   * const result = await adapter.logBatch(events);
   * if (isErr(result)) {
   *   console.error("Batch telemetry failed:", result.error);
   * }
   * ```
   */
  async logBatch(
    events: TelemetryEvent[],
  ): Promise<Result<void, TelemetryError>> {
    try {
      // Transform all events to UserAgent records
      const records = events.map((event) => ({
        userAgent: buildUserAgentString(event),
        platform: extractPlatform(event),
        userId: extractUserId(event),
        endpoint: extractEndpoint(event),
        timestamp: event.timestamp,
      }));

      // Use createMany for batch insertion (more efficient)
      await this.prisma.userAgent.createMany({
        data: records,
      });

      return ok(undefined);
    } catch (error) {
      return err(mapPrismaErrorToTelemetryError(error, "logBatch"));
    }
  }

  /**
   * Flush any buffered telemetry data
   *
   * This adapter does not buffer events (they are written immediately),
   * so flush is a no-op that always succeeds.
   *
   * @returns Result<void, TelemetryError> - always ok()
   *
   * @example
   * ```typescript
   * // Ensure all telemetry is sent before shutting down
   * await adapter.flush();
   * ```
   */
  async flush(): Promise<Result<void, TelemetryError>> {
    // No buffering in this implementation - events are written immediately
    // This method exists for interface compliance
    return ok(undefined);
  }
}
