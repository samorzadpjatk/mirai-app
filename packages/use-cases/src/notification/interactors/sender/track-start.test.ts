import { describe, it, expect } from "bun:test";
import { Effect, Layer, Data } from "effect";
import {
  trackDeliveryStartUseCase,
  type TrackDeliveryStartInput,
  TrackDeliveryStartError,
} from "./track-start";
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
    shouldFailTrackDeliveryStart?: boolean;
    deliveryId?: string;
  } = {},
): NotificationSenderGateway {
  return {
    trackDeliveryStart: () => {
      if (options.shouldFailTrackDeliveryStart) {
        return Effect.fail(
          new DatabaseError({
            operation: "trackDeliveryStart",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed({
        success: true as const,
        deliveryId: options.deliveryId ?? "delivery-123",
      });
    },

    trackDeliveryComplete: () => Effect.succeed({ success: true as const }),

    trackDeliveryFailure: () => Effect.succeed({ success: true as const }),
  };
}

describe("[UNIT] trackDeliveryStartUseCase", () => {
  it("should track delivery start successfully", async () => {
    const mockGateway = createMockNotificationSenderGateway();
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryStartInput = {
      notificationId: "notif-123",
    };

    const program = trackDeliveryStartUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deliveryId).toBe("delivery-123");
  });

  it("should return custom delivery ID from gateway", async () => {
    const mockGateway = createMockNotificationSenderGateway({
      deliveryId: "custom-delivery-456",
    });
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryStartInput = {
      notificationId: "notif-456",
    };

    const program = trackDeliveryStartUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deliveryId).toBe("custom-delivery-456");
  });

  it("should track delivery start for different notification IDs", async () => {
    const mockGateway = createMockNotificationSenderGateway();
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const testCases = [
      "notif-abc",
      "notif-def",
      "notif-ghi",
      "broadcast-123",
      "scheduled-456",
    ];

    for (const notificationId of testCases) {
      const input: TrackDeliveryStartInput = {
        notificationId,
      };

      const program = trackDeliveryStartUseCase(input).pipe(
        Effect.provide(mockLayer),
      );
      const result = await Effect.runPromise(program);

      expect(result.success).toBe(true);
      expect(typeof result.deliveryId).toBe("string");
    }
  });

  it("should fail with TrackDeliveryStartError when database error occurs", async () => {
    const mockGateway = createMockNotificationSenderGateway({
      shouldFailTrackDeliveryStart: true,
    });
    const mockLayer = Layer.succeed(NotificationSenderGatewayTag, mockGateway);

    const input: TrackDeliveryStartInput = {
      notificationId: "notif-err",
    };

    const program = trackDeliveryStartUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(TrackDeliveryStartError);
    }
  });
});
