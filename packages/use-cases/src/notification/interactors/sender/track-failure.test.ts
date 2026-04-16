import { describe, it, expect } from "bun:test";
import { Effect, Layer, Data } from "effect";
import {
  trackDeliveryFailureUseCase,
  type TrackDeliveryFailureInput,
  TrackDeliveryFailureError,
} from "./track-failure";
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
    shouldFailTrackDeliveryFailure?: boolean;
  } = {},
): NotificationSenderGateway {
  return {
    trackDeliveryStart: () =>
      Effect.succeed({ success: true as const, deliveryId: "delivery-123" }),

    trackDeliveryComplete: () => Effect.succeed({ success: true as const }),

    trackDeliveryFailure: () => {
      if (options.shouldFailTrackDeliveryFailure) {
        return Effect.fail(
          new DatabaseError({
            operation: "trackDeliveryFailure",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed({ success: true as const });
    },
  };
}

describe("[UNIT] trackDeliveryFailureUseCase", () => {
  it("should track delivery failure with string error", async () => {
    const mockGateway = createMockNotificationSenderGateway();
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryFailureInput = {
      notificationId: "notif-123",
      error: "FCM service returned 500 error",
    };

    const program = trackDeliveryFailureUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });

  it("should track delivery failure with Error object", async () => {
    const mockGateway = createMockNotificationSenderGateway();
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryFailureInput = {
      notificationId: "notif-456",
      error: new Error("Network timeout"),
    };

    const program = trackDeliveryFailureUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });

  it("should track delivery failure with empty string error", async () => {
    const mockGateway = createMockNotificationSenderGateway();
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryFailureInput = {
      notificationId: "notif-789",
      error: "",
    };

    const program = trackDeliveryFailureUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
  });

  it("should track delivery failure for different notification IDs", async () => {
    const mockGateway = createMockNotificationSenderGateway();
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const testCases = ["notif-abc", "notif-def", "notif-ghi"];

    for (const notificationId of testCases) {
      const input: TrackDeliveryFailureInput = {
        notificationId,
        error: `Delivery failed for ${notificationId}`,
      };

      const program = trackDeliveryFailureUseCase(input).pipe(
        Effect.provide(mockLayer),
      );
      const result = await Effect.runPromise(program);

      expect(result.success).toBe(true);
    }
  });

  it("should fail with TrackDeliveryFailureError when database error occurs", async () => {
    const mockGateway = createMockNotificationSenderGateway({
      shouldFailTrackDeliveryFailure: true,
    });
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryFailureInput = {
      notificationId: "notif-err",
      error: "Some error occurred",
    };

    const program = trackDeliveryFailureUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(TrackDeliveryFailureError);
    }
  });
});
