import { describe, it, expect, beforeEach } from "bun:test";
import { LogTelemetryUseCase } from "./LogTelemetry";
import type { LogTelemetryInput } from "./LogTelemetry";
import type { TelemetryPort, TelemetryEvent } from "../ports/TelemetryPort";
import { TelemetryError } from "../ports/TelemetryPort";
import { ok, err, isOk, isErr } from "@mirai-app/domain";

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
      return err(this.failWithError!);
    }

    this.loggedEvents.push(event);
    return ok(undefined);
  }
}

// =============================================================================
// Test Suite
// =============================================================================

describe("[UNIT] LogTelemetryUseCase", () => {
  let mockPort: MockTelemetryPort;
  let useCase: LogTelemetryUseCase;

  beforeEach(() => {
    mockPort = new MockTelemetryPort();
    useCase = new LogTelemetryUseCase(mockPort);
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

  describe("execute", () => {
    it("should log telemetry with all required fields", async () => {
      // Arrange
      const input = createValidInput();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(isOk(result)).toBe(true);
      expect(mockPort.hasEvents()).toBe(true);
      expect(mockPort.getLoggedEvents()).toHaveLength(1);

      const logEvent = getLogEvent(mockPort.getLastEvent());
      expect(logEvent.type).toBe("log");
      expect(logEvent.severity).toBe("info");
      expect(logEvent.timestamp).toEqual(input.timestamp);
    });

    it("should include mobile app metadata in context", async () => {
      // Arrange
      const input = createValidInput({
        appVersion: "2.0.0",
        platform: "android",
      });

      // Act
      await useCase.execute(input);

      // Assert
      const logEvent = getLogEvent(mockPort.getLastEvent());
      expect(logEvent.context).toMatchObject({
        appVersion: "2.0.0",
        platform: "android",
        userId: "user-123",
        route: "/api/challenges",
      });
    });

    it("should create descriptive message with platform and version", async () => {
      // Arrange
      const input = createValidInput({
        platform: "ios",
        appVersion: "3.1.4",
      });

      // Act
      await useCase.execute(input);

      // Assert
      const logEvent = getLogEvent(mockPort.getLastEvent());
      expect(logEvent.message).toContain("ios");
      expect(logEvent.message).toContain("3.1.4");
      expect(logEvent.message).toBe("Mobile app request from ios v3.1.4");
    });

    it("should handle optional userId (anonymous requests)", async () => {
      // Arrange
      const input = createValidInput({ userId: undefined });

      // Act
      await useCase.execute(input);

      // Assert
      const logEvent = getLogEvent(mockPort.getLastEvent());
      expect(logEvent.context).not.toHaveProperty("userId");
      expect(logEvent.context).toHaveProperty("appVersion");
      expect(logEvent.context).toHaveProperty("platform");
    });

    it("should handle optional context (no additional metadata)", async () => {
      // Arrange
      const input = createValidInput({ context: undefined });

      // Act
      await useCase.execute(input);

      // Assert
      const logEvent = getLogEvent(mockPort.getLastEvent());
      expect(logEvent.context).toEqual({
        appVersion: "1.2.3",
        platform: "ios",
        userId: "user-123",
      });
    });

    it("should support all platform types", async () => {
      const platforms = ["ios", "android", "web"];

      for (const platform of platforms) {
        // Reset mock between iterations
        mockPort.reset();

        // Arrange
        const input = createValidInput({ platform });

        // Act
        await useCase.execute(input);

        // Assert
        const logEvent = getLogEvent(mockPort.getLastEvent());
        expect(logEvent.context).toHaveProperty("platform", platform);
        expect(logEvent.message).toContain(platform);
      }
    });

    it("should propagate telemetry port errors as Result.err", async () => {
      // Arrange
      const dbError = new TelemetryError({
        operation: "PrismaTelemetryAdapter.log",
        message: "Database connection failed",
        cause: new Error("Connection refused"),
      });
      mockPort.setFailure(dbError);

      const input = createValidInput();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe(dbError);
        expect(result.error.operation).toBe("PrismaTelemetryAdapter.log");
        expect(result.error.message).toBe("Database connection failed");
      }
    });

    it("should return ok result when logging succeeds", async () => {
      // Arrange
      const input = createValidInput();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBeUndefined();
      }
    });

    it("should not throw exceptions on telemetry failure", async () => {
      // Arrange
      mockPort.setFailure(
        new TelemetryError({
          operation: "log",
          message: "Storage full",
        }),
      );
      const input = createValidInput();

      // Act & Assert - should not throw
      let result;
      try {
        result = await useCase.execute(input);
      } catch (_e) {
        // Should not reach here
        expect(false).toBe(true);
      }

      // Verify we got an error result, not an exception
      expect(result).toBeDefined();
      expect(isErr(result!)).toBe(true);
    });

    it("should merge custom context with default metadata", async () => {
      // Arrange
      const input = createValidInput({
        context: {
          route: "/api/users",
          method: "POST",
          durationMs: 150,
        },
      });

      // Act
      await useCase.execute(input);

      // Assert
      const logEvent = getLogEvent(mockPort.getLastEvent());
      expect(logEvent.context).toEqual({
        appVersion: "1.2.3",
        platform: "ios",
        userId: "user-123",
        route: "/api/users",
        method: "POST",
        durationMs: 150,
      });
    });

    it("should handle complex user agent strings", async () => {
      // Arrange
      const complexUserAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) " +
        "MiraiApp/1.2.3 Mobile/15E148";
      const input = createValidInput({ userAgent: complexUserAgent });

      // Act
      await useCase.execute(input);

      // Assert - userAgent is not directly stored, but we verify no errors
      const logEvent = getLogEvent(mockPort.getLastEvent());
      expect(logEvent).toBeDefined();
      expect(logEvent.type).toBe("log");
    });

    it("should work with different repository implementations", async () => {
      // This test verifies the use case works with any TelemetryPort
      // by creating a different mock implementation
      const differentMock = new MockTelemetryPort();
      const differentUseCase = new LogTelemetryUseCase(differentMock);

      const input = createValidInput({ userId: "different-user" });

      // Act
      const result = await differentUseCase.execute(input);

      // Assert
      expect(isOk(result)).toBe(true);
      expect(differentMock.hasEvents()).toBe(true);

      const logEvent = getLogEvent(differentMock.getLastEvent());
      expect(logEvent.context).toHaveProperty("userId", "different-user");
    });

    it("should handle very long app versions gracefully", async () => {
      // Arrange
      const longVersion = "1.2.3-beta.4+build.567.sha.abc123def456";
      const input = createValidInput({ appVersion: longVersion });

      // Act
      await useCase.execute(input);

      // Assert
      const logEvent = getLogEvent(mockPort.getLastEvent());
      expect(logEvent.context).toHaveProperty("appVersion", longVersion);
      expect(logEvent.message).toContain(longVersion);
    });

    it("should use correct timestamp from input", async () => {
      // Arrange
      const specificDate = new Date("2026-01-15T14:30:00.000Z");
      const input = createValidInput({ timestamp: specificDate });

      // Act
      await useCase.execute(input);

      // Assert
      const logEvent = getLogEvent(mockPort.getLastEvent());
      expect(logEvent.timestamp).toEqual(specificDate);
    });

    it("should call port.log exactly once per execute", async () => {
      // Arrange
      const input = createValidInput();

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockPort.getLoggedEvents()).toHaveLength(1);
    });
  });

  describe("error handling", () => {
    it("should handle generic telemetry errors gracefully", async () => {
      // Arrange
      const genericError = new TelemetryError({
        operation: "TelemetryPort.log",
        message: "Service unavailable",
      });
      mockPort.setFailure(genericError);

      const input = createValidInput();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error._tag).toBe("TelemetryError");
        expect(result.error.code).toBe("TELEMETRY_ERROR");
      }
    });

    it("should preserve error cause when available", async () => {
      // Arrange
      const originalError = new Error("Network timeout");
      const telemetryError = new TelemetryError({
        operation: "TelemetryPort.log",
        message: "Failed to persist",
        cause: originalError,
      });
      mockPort.setFailure(telemetryError);

      const input = createValidInput();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.cause).toBe(originalError);
      }
    });
  });
});
