import { describe, it, expect } from "bun:test";
import { Effect, Layer, Data } from "effect";
import {
  getDeliveryByNotificationIdUseCase,
  type GetDeliveryByNotificationIdInput,
  DeliveryNotFoundError,
} from "./get-by-notification-id";
import {
  NotificationDeliveryGatewayTag,
  type NotificationDeliveryGateway,
  type NotificationDelivery,
  type DeliveryStatus,
} from "../../ports/delivery/gateway";

/**
 * Mock NotificationDeliveryGateway for testing
 */
function createMockDeliveryGateway(
  deliveries: NotificationDelivery[] = [],
  options: {
    shouldFailFindByNotificationId?: boolean;
  } = {},
): NotificationDeliveryGateway {
  const deliveryMap = new Map(deliveries.map((d) => [d.notificationId, d]));

  return {
    count: () => Effect.succeed(deliveryMap.size),

    getStats: () =>
      Effect.succeed({
        totalDeliveries: deliveryMap.size,
        totalRecipients: deliveryMap.size,
        totalSuccess: Array.from(deliveryMap.values()).filter(
          (d) => d.status === "success",
        ).length,
        totalFailures: Array.from(deliveryMap.values()).filter(
          (d) => d.status === "failure" || d.status === "partial_failure",
        ).length,
        avgSuccessPerDelivery: 0,
        avgFailuresPerDelivery: 0,
        successRate: 0,
        statusBreakdown: {},
      }),

    countFailed: () =>
      Effect.succeed(
        Array.from(deliveryMap.values()).filter(
          (d) => d.status === "failure" || d.status === "partial_failure",
        ).length,
      ),

    findByNotificationId: (notificationId: string) => {
      if (options.shouldFailFindByNotificationId) {
        return Effect.fail(
          new DatabaseErrorMock({
            operation: "findByNotificationId",
            message: "Database error",
          }),
        );
      }
      const delivery = deliveryMap.get(notificationId);
      return Effect.succeed(delivery ?? null);
    },

    findMany: () => Effect.succeed(Array.from(deliveryMap.values())),

    findFailed: () => Effect.succeed([]),
  };
}

class DatabaseErrorMock extends Data.TaggedError("DatabaseError")<{
  operation: string;
  message: string;
}> {}

function createMockNotificationDelivery(
  overrides: Partial<NotificationDelivery> = {},
): NotificationDelivery {
  const now = new Date();
  return {
    id: overrides.id ?? "delivery-123",
    notificationId: overrides.notificationId ?? "notification-123",
    tripId: overrides.tripId ?? "trip-123",
    status: overrides.status ?? "success",
    totalRecipients: overrides.totalRecipients ?? 10,
    successCount: overrides.successCount ?? 8,
    failureCount: overrides.failureCount ?? 2,
    deliveryStartedAt: overrides.deliveryStartedAt ?? now,
    deliveryCompletedAt: overrides.deliveryCompletedAt ?? now,
    errorLog: overrides.errorLog ?? null,
    scheduleId: overrides.scheduleId ?? null,
    notification: overrides.notification ?? {
      id: overrides.notificationId ?? "notification-123",
      title: "Test Notification",
      body: "This is a test notification",
      createdAt: now,
    },
  };
}

describe("[UNIT] getDeliveryByNotificationIdUseCase", () => {
  it("should return delivery when found by notification ID", async () => {
    const mockDelivery = createMockNotificationDelivery({
      id: "delivery-456",
      notificationId: "notification-456",
      tripId: "trip-123",
      status: "success" as DeliveryStatus,
      totalRecipients: 100,
      successCount: 95,
      failureCount: 5,
      notification: {
        id: "notification-456",
        title: "Welcome Message",
        body: "Welcome to the trip!",
        createdAt: new Date(),
        createdBy: {
          id: "user-123",
          firstName: "John",
          lastName: "Doe",
          authUserId: "auth-123",
        },
      },
    });
    const mockGateway = createMockDeliveryGateway([mockDelivery]);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryByNotificationIdInput = {
      notificationId: "notification-456",
      tripId: "trip-123",
    };
    const program = getDeliveryByNotificationIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.delivery.id).toBe("delivery-456");
    expect(result.delivery.notificationId).toBe("notification-456");
    expect(result.delivery.tripId).toBe("trip-123");
    expect(result.delivery.status).toBe("success");
    expect(result.delivery.totalRecipients).toBe(100);
    expect(result.delivery.successCount).toBe(95);
    expect(result.delivery.failureCount).toBe(5);
    expect(result.delivery.notification?.title).toBe("Welcome Message");
    expect(result.delivery.notification?.body).toBe("Welcome to the trip!");
  });

  it("should fail with DeliveryNotFoundError when delivery not found", async () => {
    const mockGateway = createMockDeliveryGateway([]);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryByNotificationIdInput = {
      notificationId: "non-existent",
      tripId: "trip-123",
    };
    const program = getDeliveryByNotificationIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeliveryNotFoundError);
      if (either.left instanceof DeliveryNotFoundError) {
        expect(either.left.notificationId).toBe("non-existent");
      }
    }
  });

  it("should fail with DeliveryNotFoundError when delivery belongs to different trip", async () => {
    const mockDelivery = createMockNotificationDelivery({
      notificationId: "notification-789",
      tripId: "trip-different",
    });
    const mockGateway = createMockDeliveryGateway([mockDelivery]);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryByNotificationIdInput = {
      notificationId: "notification-789",
      tripId: "trip-123",
    };
    const program = getDeliveryByNotificationIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeliveryNotFoundError);
      if (either.left instanceof DeliveryNotFoundError) {
        expect(either.left.notificationId).toBe("notification-789");
      }
    }
  });

  it("should handle database errors", async () => {
    const mockGateway = createMockDeliveryGateway([], {
      shouldFailFindByNotificationId: true,
    });
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryByNotificationIdInput = {
      notificationId: "notification-123",
      tripId: "trip-123",
    };
    const program = getDeliveryByNotificationIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseErrorMock);
    }
  });

  it("should return delivery with partial failure status", async () => {
    const mockDelivery = createMockNotificationDelivery({
      notificationId: "notification-partial",
      tripId: "trip-123",
      status: "partial_failure" as DeliveryStatus,
      totalRecipients: 50,
      successCount: 30,
      failureCount: 20,
    });
    const mockGateway = createMockDeliveryGateway([mockDelivery]);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryByNotificationIdInput = {
      notificationId: "notification-partial",
      tripId: "trip-123",
    };
    const program = getDeliveryByNotificationIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.delivery.status).toBe("partial_failure");
    expect(result.delivery.successCount).toBe(30);
    expect(result.delivery.failureCount).toBe(20);
  });

  it("should return delivery with error log when available", async () => {
    const mockDelivery = createMockNotificationDelivery({
      notificationId: "notification-error",
      tripId: "trip-123",
      status: "failure" as DeliveryStatus,
      errorLog: "Connection timeout",
    });
    const mockGateway = createMockDeliveryGateway([mockDelivery]);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryByNotificationIdInput = {
      notificationId: "notification-error",
      tripId: "trip-123",
    };
    const program = getDeliveryByNotificationIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.delivery.errorLog).toBe("Connection timeout");
    expect(result.delivery.status).toBe("failure");
  });

  it("should return delivery with all properties", async () => {
    const completedAt = new Date();
    const mockDelivery = createMockNotificationDelivery({
      notificationId: "notification-full",
      tripId: "trip-123",
      status: "success" as DeliveryStatus,
      totalRecipients: 100,
      successCount: 100,
      failureCount: 0,
      deliveryCompletedAt: completedAt,
      notification: {
        id: "notification-full",
        title: "Full Test",
        body: "Complete delivery data",
        createdAt: new Date(),
        createdBy: {
          id: "user-456",
          firstName: "Jane",
          lastName: "Smith",
          authUserId: "auth-456",
        },
      },
    });
    const mockGateway = createMockDeliveryGateway([mockDelivery]);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryByNotificationIdInput = {
      notificationId: "notification-full",
      tripId: "trip-123",
    };
    const program = getDeliveryByNotificationIdUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.delivery).toHaveProperty("id");
    expect(result.delivery).toHaveProperty("notificationId");
    expect(result.delivery).toHaveProperty("tripId");
    expect(result.delivery).toHaveProperty("status");
    expect(result.delivery).toHaveProperty("totalRecipients");
    expect(result.delivery).toHaveProperty("successCount");
    expect(result.delivery).toHaveProperty("failureCount");
    expect(result.delivery).toHaveProperty("deliveryStartedAt");
    expect(result.delivery).toHaveProperty("deliveryCompletedAt");
    expect(result.delivery).toHaveProperty("errorLog");
    expect(result.delivery).toHaveProperty("notification");
    expect(result.delivery.notification?.createdBy).toHaveProperty("firstName");
    expect(result.delivery.notification?.createdBy).toHaveProperty("lastName");
  });
});
