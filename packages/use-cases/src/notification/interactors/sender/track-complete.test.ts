import { describe, it, expect } from "bun:test";
import { Effect, Layer, Data } from "effect";
import {
  trackDeliveryCompleteUseCase,
  type TrackDeliveryCompleteInput,
  TrackDeliveryCompleteError,
} from "./track-complete";
import {
  NotificationSenderGatewayTag,
  type NotificationSenderGateway,
} from "../../ports/sender/gateway";
import { DatabaseError } from "@mirai-app/domain";

/**
 * Mock NotificationSenderGateway for testing
 */
function createMockNotificationSenderGateway(
  options: {
    shouldFailTrackDeliveryComplete?: boolean;
  } = {},
): NotificationSenderGateway {
  return {
    trackDeliveryStart: () =>
      Effect.succeed({ success: true as const, deliveryId: "delivery-123" }),

    trackDeliveryComplete: () => {
      if (options.shouldFailTrackDeliveryComplete) {
        return Effect.fail(
          new DatabaseError({
            operation: "trackDeliveryComplete",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed({ success: true as const });
    },

    trackDeliveryFailure: () => Effect.succeed({ success: true as const }),
  };
}

describe("[UNIT] trackDeliveryCompleteUseCase", () => {
  it("should track delivery completion successfully", async () => {
    const mockGateway = createMockNotificationSenderGateway();
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryCompleteInput = {
      notificationId: "notif-123",
      totalRecipients: 100,
      successCount: 95,
      failureCount: 5,
      errors: null,
    };

    const program = trackDeliveryCompleteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });

  it("should track delivery completion with partial failures", async () => {
    const mockGateway = createMockNotificationSenderGateway();
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryCompleteInput = {
      notificationId: "notif-456",
      totalRecipients: 50,
      successCount: 40,
      failureCount: 10,
      errors: "Some devices were unreachable",
    };

    const program = trackDeliveryCompleteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });

  it("should track delivery completion with all failures", async () => {
    const mockGateway = createMockNotificationSenderGateway();
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryCompleteInput = {
      notificationId: "notif-789",
      totalRecipients: 20,
      successCount: 0,
      failureCount: 20,
      errors: "FCM service unavailable",
    };

    const program = trackDeliveryCompleteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });

  it("should track delivery completion with all successes", async () => {
    const mockGateway = createMockNotificationSenderGateway();
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryCompleteInput = {
      notificationId: "notif-abc",
      totalRecipients: 30,
      successCount: 30,
      failureCount: 0,
      errors: null,
    };

    const program = trackDeliveryCompleteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });

  it("should fail with TrackDeliveryCompleteError when database error occurs", async () => {
    const mockGateway = createMockNotificationSenderGateway({
      shouldFailTrackDeliveryComplete: true,
    });
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryCompleteInput = {
      notificationId: "notif-def",
      totalRecipients: 100,
      successCount: 100,
      failureCount: 0,
      errors: null,
    };

    const program = trackDeliveryCompleteUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(TrackDeliveryCompleteError);
    }
  });
});
