import { describe, it, expect, beforeEach } from "bun:test";
import { logTelemetryUseCase, type LogTelemetryInput } from "./LogTelemetry";
import { Effect, Either } from "effect";
import type { TelemetryPort, TelemetryEvent } from "../ports/TelemetryPort";
import { TelemetryError } from "../ports/TelemetryPort";

// =============================================================================
// Type Guard Helpers
// =============================================================================

/**
 * Type guard to narrow TelemetryEvent to log event type
 */
function isLogEvent(
  event: TelemetryEvent,
): event is TelemetryEvent & { type: "log" } {
  return event.type === "log";
}

/**
 * Helper to get typed access to log event properties
 * Throws if event is not a log type
 */
function getLogEvent(
  event: TelemetryEvent | undefined,
): TelemetryEvent & { type: "log" } {
  if (!event) {
    throw new Error("Expected event to be defined");
  }
  if (!isLogEvent(event)) {
    throw new Error(`Expected log event but got ${event.type}`);
  }
  return event;
}

// =============================================================================
// Mock TelemetryPort Implementation
// =============================================================================

/**
 * Mock TelemetryPort for unit testing
 *
 * Records all logged events for verification.
 * Simulates both success and failure scenarios.
 */
class MockTelemetryPort implements TelemetryPort {
  private loggedEvents: TelemetryEvent[] = [];
  private shouldFail: boolean = false;
  private failWithError?: TelemetryError;

  /**
   * Configure mock to fail on next call
   */
  setFailure(error?: TelemetryError): void {
    this.shouldFail = true;
    this.failWithError =
      error ??
      new TelemetryError({
        operation: "MockTelemetryPort.log",
        message: "Simulated telemetry failure",
      });
  }

  /**
   * Reset mock state
   */
  reset(): void {
    this.loggedEvents = [];
    this.shouldFail = false;
    this.failWithError = undefined;
  }

  /**
   * Get all logged events for verification
   */
  getLoggedEvents(): TelemetryEvent[] {
    return [...this.loggedEvents];
  }

  /**
   * Check if any events were logged
   */
  hasEvents(): boolean {
    return this.loggedEvents.length > 0;
  }

  /**
   * Get the last logged event
   */
  getLastEvent(): TelemetryEvent | undefined {
    return this.loggedEvents[this.loggedEvents.length - 1];
  }

  /**
   * Mock implementation of TelemetryPort.log
   */
  async log(
    event: TelemetryEvent,
  ): Promise<import("@mirai-app/domain").Result<void, TelemetryError>> {
    if (this.shouldFail) {
      return { kind: "err", error: this.failWithError! };
    }

    this.loggedEvents.push(event);
    return { kind: "ok", value: undefined };
  }
}

// =============================================================================
// Effect-based Mock Service
// =============================================================================

import { TelemetryPortTag } from "../ports/TelemetryPort";

const createMockTelemetryPortService = (mockPort: MockTelemetryPort) => ({
  log: (event: TelemetryEvent) =>
    Effect.promise(() => mockPort.log(event)).pipe(
      Effect.flatMap((result) =>
        result.kind === "ok"
          ? Effect.succeed(result.value)
          : Effect.fail(result.error),
      ),
    ),
});

// =============================================================================
// Test Suite
// =============================================================================

describe("[UNIT] logTelemetryUseCase (Effect)", () => {
  let mockPort: MockTelemetryPort;

  beforeEach(() => {
    mockPort = new MockTelemetryPort();
  });

  // Helper to create valid input
  const createValidInput = (
    overrides?: Partial<LogTelemetryInput>,
  ): LogTelemetryInput => ({
    userAgent: "MiraiApp/1.2.3 (iOS 16.0; iPhone14,2)",
    appVersion: "1.2.3",
    platform: "ios",
    timestamp: new Date("2026-04-09T10:00:00Z"),
    userId: "user-123",
    context: { route: "/api/challenges" },
    ...overrides,
  });

  describe("[UNIT] execute", () => {
    it("should log telemetry with all required fields", async () => {
      const input = createValidInput();

      const program = logTelemetryUseCase(input).pipe(
        Effect.provideService(
          TelemetryPortTag,
          createMockTelemetryPortService(mockPort),
        ),
      );

      await Effect.runPromise(program);

      expect(mockPort.hasEvents()).toBe(true);
      expect(mockPort.getLoggedEvents()).toHaveLength(1);

      const logEvent = getLogEvent(mockPort.getLastEvent());
      expect(logEvent.type).toBe("log");
      expect(logEvent.severity).toBe("info");
      expect(logEvent.timestamp).toEqual(input.timestamp);
    });

    it("should include mobile app metadata in context", async () => {
      const input = createValidInput({
        appVersion: "2.0.0",
        platform: "android",
      });

      const program = logTelemetryUseCase(input).pipe(
        Effect.provideService(
          TelemetryPortTag,
          createMockTelemetryPortService(mockPort),
        ),
      );

      await Effect.runPromise(program);

      const logEvent = getLogEvent(mockPort.getLastEvent());
      expect(logEvent.context).toMatchObject({
        appVersion: "2.0.0",
        platform: "android",
        userId: "user-123",
        route: "/api/challenges",
      });
    });

    it("should propagate telemetry port errors", async () => {
      const dbError = new TelemetryError({
        operation: "DrizzleTelemetryAdapter.log",
        message: "Database connection failed",
        cause: new Error("Connection refused"),
      });
      mockPort.setFailure(dbError);

      const input = createValidInput();

      const program = logTelemetryUseCase(input).pipe(
        Effect.provideService(
          TelemetryPortTag,
          createMockTelemetryPortService(mockPort),
        ),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
    });
  });
});
