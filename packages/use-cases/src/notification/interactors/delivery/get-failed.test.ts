import { describe, it, expect } from "bun:test";
import { Effect, Layer, Data } from "effect";
import {
  getFailedDeliveriesUseCase,
  type GetFailedDeliveriesInput,
  GetFailedDeliveriesError,
} from "./get-failed";
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
    shouldFailFindFailed?: boolean;
    shouldFailCountFailed?: boolean;
  } = {},
): NotificationDeliveryGateway {
  const failedDeliveries = deliveries.filter(
    (d) => d.status === "failure" || d.status === "partial_failure",
  );

  return {
    count: () => Effect.succeed(deliveries.length),

    getStats: () =>
      Effect.succeed({
        totalDeliveries: deliveries.length,
        totalRecipients: deliveries.length,
        totalSuccess: deliveries.filter((d) => d.status === "success").length,
        totalFailures: failedDeliveries.length,
        avgSuccessPerDelivery: 0,
        avgFailuresPerDelivery: 0,
        successRate: 0,
        statusBreakdown: {},
      }),

    countFailed: () => {
      if (options.shouldFailCountFailed) {
        return Effect.fail(
          new DatabaseErrorMock({
            operation: "countFailed",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(failedDeliveries.length);
    },

    findFailed: () => {
      if (options.shouldFailFindFailed) {
        return Effect.fail(
          new DatabaseErrorMock({
            operation: "findFailed",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(failedDeliveries);
    },

    findMany: () => Effect.succeed(deliveries),

    findByNotificationId: () => Effect.succeed(null),

    findFailedConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByNotificationIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByUserIdConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),
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
    status: overrides.status ?? "failure",
    totalRecipients: overrides.totalRecipients ?? 10,
    successCount: overrides.successCount ?? 0,
    failureCount: overrides.failureCount ?? 10,
    deliveryStartedAt: overrides.deliveryStartedAt ?? now,
    deliveryCompletedAt: overrides.deliveryCompletedAt ?? now,
    errorLog: overrides.errorLog ?? null,
    scheduleId: overrides.scheduleId ?? null,
    notification: overrides.notification ?? null,
  };
}

describe("[UNIT] getFailedDeliveriesUseCase", () => {
  it("should return failed deliveries for a trip", async () => {
    const mockDeliveries: NotificationDelivery[] = [
      createMockNotificationDelivery({
        id: "delivery-1",
        notificationId: "notification-1",
        tripId: "trip-123",
        status: "failure" as DeliveryStatus,
        totalRecipients: 50,
        successCount: 0,
        failureCount: 50,
        errorLog: "Connection timeout",
      }),
      createMockNotificationDelivery({
        id: "delivery-2",
        notificationId: "notification-2",
        tripId: "trip-123",
        status: "partial_failure" as DeliveryStatus,
        totalRecipients: 100,
        successCount: 60,
        failureCount: 40,
        errorLog: "Some recipients unreachable",
      }),
      createMockNotificationDelivery({
        id: "delivery-3",
        notificationId: "notification-3",
        tripId: "trip-123",
        status: "success" as DeliveryStatus,
        totalRecipients: 30,
        successCount: 30,
        failureCount: 0,
      }),
    ];

    const mockGateway = createMockDeliveryGateway(mockDeliveries);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetFailedDeliveriesInput = {
      tripId: "trip-123",
      pagination: { limit: 10, offset: 0 },
    };

    const program = getFailedDeliveriesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.deliveries).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
    expect(result.deliveries[0].status).toBe("failure");
    expect(result.deliveries[1].status).toBe("partial_failure");
  });

  it("should use default pagination when not specified", async () => {
    const mockDeliveries: NotificationDelivery[] = Array.from(
      { length: 25 },
      (_, i) =>
        createMockNotificationDelivery({
          id: `delivery-${i}`,
          notificationId: `notification-${i}`,
          tripId: "trip-123",
          status: i % 2 === 0 ? "failure" : "partial_failure",
        }),
    );

    const mockGateway = createMockDeliveryGateway(mockDeliveries);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetFailedDeliveriesInput = {
      tripId: "trip-123",
    };

    const program = getFailedDeliveriesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.deliveries).toHaveLength(25);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
  });

  it("should return empty array when no failed deliveries exist", async () => {
    const mockDeliveries: NotificationDelivery[] = [
      createMockNotificationDelivery({
        id: "delivery-1",
        notificationId: "notification-1",
        tripId: "trip-123",
        status: "success" as DeliveryStatus,
      }),
    ];

    const mockGateway = createMockDeliveryGateway(mockDeliveries);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetFailedDeliveriesInput = {
      tripId: "trip-123",
      pagination: { limit: 10, offset: 0 },
    };

    const program = getFailedDeliveriesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.deliveries).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("should handle database errors during findFailed", async () => {
    const mockGateway = createMockDeliveryGateway([], {
      shouldFailFindFailed: true,
    });
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetFailedDeliveriesInput = {
      tripId: "trip-123",
      pagination: { limit: 10, offset: 0 },
    };

    const program = getFailedDeliveriesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetFailedDeliveriesError);
    }
  });

  it("should handle database errors during countFailed", async () => {
    const mockGateway = createMockDeliveryGateway([], {
      shouldFailCountFailed: true,
    });
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetFailedDeliveriesInput = {
      tripId: "trip-123",
      pagination: { limit: 10, offset: 0 },
    };

    const program = getFailedDeliveriesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetFailedDeliveriesError);
    }
  });

  it("should apply pagination correctly", async () => {
    const mockDeliveries: NotificationDelivery[] = Array.from(
      { length: 50 },
      (_, i) =>
        createMockNotificationDelivery({
          id: `delivery-${i}`,
          notificationId: `notification-${i}`,
          tripId: "trip-123",
          status: "failure" as DeliveryStatus,
        }),
    );

    const mockGateway = createMockDeliveryGateway(mockDeliveries);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetFailedDeliveriesInput = {
      tripId: "trip-123",
      pagination: { limit: 5, offset: 10 },
    };

    const program = getFailedDeliveriesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.deliveries).toHaveLength(50);
    expect(result.total).toBe(50);
    expect(result.limit).toBe(5);
    expect(result.offset).toBe(10);
  });

  it("should include delivery details in results", async () => {
    const mockDeliveries: NotificationDelivery[] = [
      createMockNotificationDelivery({
        id: "delivery-detail",
        notificationId: "notification-detail",
        tripId: "trip-123",
        status: "failure" as DeliveryStatus,
        totalRecipients: 100,
        successCount: 0,
        failureCount: 100,
        errorLog: "Detailed error log",
        notification: {
          id: "notification-detail",
          title: "Failed Notification",
          body: "This notification failed to deliver",
          createdAt: new Date(),
        },
      }),
    ];

    const mockGateway = createMockDeliveryGateway(mockDeliveries);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetFailedDeliveriesInput = {
      tripId: "trip-123",
    };

    const program = getFailedDeliveriesUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.deliveries[0].id).toBe("delivery-detail");
    expect(result.deliveries[0].errorLog).toBe("Detailed error log");
    expect(result.deliveries[0].totalRecipients).toBe(100);
    expect(result.deliveries[0].failureCount).toBe(100);
  });
});
