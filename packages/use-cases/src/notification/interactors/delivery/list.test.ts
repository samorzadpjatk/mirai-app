import { describe, it, expect } from "bun:test";
import { Effect, Layer, Data } from "effect";
import {
  getDeliveriesUseCase,
  type GetDeliveriesInput,
  GetDeliveriesError,
} from "./list";
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
    shouldFailFindMany?: boolean;
    shouldFailCount?: boolean;
  } = {},
): NotificationDeliveryGateway {
  return {
    count: () => {
      if (options.shouldFailCount) {
        return Effect.fail(
          new DatabaseErrorMock({
            operation: "count",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(deliveries.length);
    },

    getStats: () =>
      Effect.succeed({
        totalDeliveries: deliveries.length,
        totalRecipients: deliveries.length,
        totalSuccess: deliveries.filter((d) => d.status === "success").length,
        totalFailures: deliveries.filter(
          (d) => d.status === "failure" || d.status === "partial_failure",
        ).length,
        avgSuccessPerDelivery: 0,
        avgFailuresPerDelivery: 0,
        successRate: 0,
        statusBreakdown: {},
      }),

    countFailed: () =>
      Effect.succeed(
        deliveries.filter(
          (d) => d.status === "failure" || d.status === "partial_failure",
        ).length,
      ),

    findMany: () => {
      if (options.shouldFailFindMany) {
        return Effect.fail(
          new DatabaseErrorMock({
            operation: "findMany",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(deliveries);
    },

    findFailed: () =>
      Effect.succeed(
        deliveries.filter(
          (d) => d.status === "failure" || d.status === "partial_failure",
        ),
      ),

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
    status: overrides.status ?? "success",
    totalRecipients: overrides.totalRecipients ?? 10,
    successCount: overrides.successCount ?? 8,
    failureCount: overrides.failureCount ?? 2,
    deliveryStartedAt: overrides.deliveryStartedAt ?? now,
    deliveryCompletedAt: overrides.deliveryCompletedAt ?? now,
    errorLog: overrides.errorLog ?? null,
    scheduleId: overrides.scheduleId ?? null,
    notification: overrides.notification ?? null,
  };
}

describe("[UNIT] getDeliveriesUseCase", () => {
  it("should return all deliveries with pagination", async () => {
    const mockDeliveries: NotificationDelivery[] = [
      createMockNotificationDelivery({
        id: "delivery-1",
        notificationId: "notification-1",
        tripId: "trip-123",
        status: "success" as DeliveryStatus,
      }),
      createMockNotificationDelivery({
        id: "delivery-2",
        notificationId: "notification-2",
        tripId: "trip-123",
        status: "failure" as DeliveryStatus,
      }),
      createMockNotificationDelivery({
        id: "delivery-3",
        notificationId: "notification-3",
        tripId: "trip-456",
        status: "pending" as DeliveryStatus,
      }),
    ];

    const mockGateway = createMockDeliveryGateway(mockDeliveries);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveriesInput = {
      pagination: { limit: 10, offset: 0 },
    };

    const program = getDeliveriesUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.deliveries).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
  });

  it("should use default pagination when not specified", async () => {
    const mockDeliveries: NotificationDelivery[] = Array.from(
      { length: 60 },
      (_, i) =>
        createMockNotificationDelivery({
          id: `delivery-${i}`,
          notificationId: `notification-${i}`,
          tripId: "trip-123",
          status: "success" as DeliveryStatus,
        }),
    );

    const mockGateway = createMockDeliveryGateway(mockDeliveries);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveriesInput = {};

    const program = getDeliveriesUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.deliveries).toHaveLength(60);
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  it("should filter by tripId when provided", async () => {
    const mockDeliveries: NotificationDelivery[] = [
      createMockNotificationDelivery({
        id: "delivery-1",
        notificationId: "notification-1",
        tripId: "trip-filtered",
        status: "success" as DeliveryStatus,
      }),
      createMockNotificationDelivery({
        id: "delivery-2",
        notificationId: "notification-2",
        tripId: "trip-filtered",
        status: "failure" as DeliveryStatus,
      }),
      createMockNotificationDelivery({
        id: "delivery-3",
        notificationId: "notification-3",
        tripId: "trip-other",
        status: "success" as DeliveryStatus,
      }),
    ];

    const mockGateway = createMockDeliveryGateway(mockDeliveries);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveriesInput = {
      filters: { tripId: "trip-filtered" },
      pagination: { limit: 10, offset: 0 },
    };

    const program = getDeliveriesUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.deliveries).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it("should filter by status when provided", async () => {
    const mockDeliveries: NotificationDelivery[] = [
      createMockNotificationDelivery({
        id: "delivery-1",
        status: "success" as DeliveryStatus,
      }),
      createMockNotificationDelivery({
        id: "delivery-2",
        status: "failure" as DeliveryStatus,
      }),
      createMockNotificationDelivery({
        id: "delivery-3",
        status: "success" as DeliveryStatus,
      }),
    ];

    const mockGateway = createMockDeliveryGateway(mockDeliveries);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveriesInput = {
      filters: { status: "success" as DeliveryStatus },
      pagination: { limit: 10, offset: 0 },
    };

    const program = getDeliveriesUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.deliveries).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it("should handle database errors during findMany", async () => {
    const mockGateway = createMockDeliveryGateway([], {
      shouldFailFindMany: true,
    });
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveriesInput = {
      pagination: { limit: 10, offset: 0 },
    };

    const program = getDeliveriesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetDeliveriesError);
    }
  });

  it("should handle database errors during count", async () => {
    const mockGateway = createMockDeliveryGateway([], {
      shouldFailCount: true,
    });
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveriesInput = {
      pagination: { limit: 10, offset: 0 },
    };

    const program = getDeliveriesUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetDeliveriesError);
    }
  });

  it("should return empty array when no deliveries match filters", async () => {
    const mockGateway = createMockDeliveryGateway([]);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveriesInput = {
      filters: { tripId: "non-existent" },
      pagination: { limit: 10, offset: 0 },
    };

    const program = getDeliveriesUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.deliveries).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("should apply custom pagination values", async () => {
    const mockDeliveries: NotificationDelivery[] = Array.from(
      { length: 100 },
      (_, i) =>
        createMockNotificationDelivery({
          id: `delivery-${i}`,
          notificationId: `notification-${i}`,
          tripId: "trip-123",
          status: "success" as DeliveryStatus,
        }),
    );

    const mockGateway = createMockDeliveryGateway(mockDeliveries);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveriesInput = {
      pagination: { limit: 25, offset: 50 },
    };

    const program = getDeliveriesUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.deliveries).toHaveLength(100);
    expect(result.total).toBe(100);
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(50);
  });

  it("should include delivery details in results", async () => {
    const mockDeliveries: NotificationDelivery[] = [
      createMockNotificationDelivery({
        id: "delivery-detail",
        notificationId: "notification-detail",
        tripId: "trip-123",
        status: "success" as DeliveryStatus,
        totalRecipients: 200,
        successCount: 200,
        failureCount: 0,
        notification: {
          id: "notification-detail",
          title: "Detailed Delivery",
          body: "Complete delivery data",
          createdAt: new Date(),
          createdBy: {
            id: "user-123",
            firstName: "John",
            lastName: "Doe",
            authUserId: "auth-123",
          },
        },
      }),
    ];

    const mockGateway = createMockDeliveryGateway(mockDeliveries);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveriesInput = {};

    const program = getDeliveriesUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.deliveries[0].id).toBe("delivery-detail");
    expect(result.deliveries[0].totalRecipients).toBe(200);
    expect(result.deliveries[0].successCount).toBe(200);
    expect(result.deliveries[0].notification?.title).toBe("Detailed Delivery");
  });
});
