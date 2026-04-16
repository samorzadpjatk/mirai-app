import { describe, it, expect } from "bun:test";
import { Effect, Layer, Data } from "effect";
import {
  getDeliveryStatsUseCase,
  type GetDeliveryStatsInput,
  GetDeliveryStatsError,
} from "./get-stats";
import {
  NotificationDeliveryGatewayTag,
  type NotificationDeliveryGateway,
  type DeliveryStats,
} from "../../ports/delivery/gateway";

/**
 * Mock NotificationDeliveryGateway for testing
 */
function createMockDeliveryGateway(
  stats: DeliveryStats,
  options: {
    shouldFailGetStats?: boolean;
  } = {},
): NotificationDeliveryGateway {
  return {
    count: () => Effect.succeed(stats.totalDeliveries),

    getStats: () => {
      if (options.shouldFailGetStats) {
        return Effect.fail(
          new DatabaseErrorMock({
            operation: "getStats",
            message: "Database error",
          }),
        );
      }
      return Effect.succeed(stats);
    },

    countFailed: () => Effect.succeed(stats.totalFailures),

    findFailed: () => Effect.succeed([]),

    findMany: () => Effect.succeed([]),

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

function createMockDeliveryStats(
  overrides: Partial<DeliveryStats> = {},
): DeliveryStats {
  return {
    totalDeliveries: overrides.totalDeliveries ?? 100,
    totalRecipients: overrides.totalRecipients ?? 100,
    totalSuccess: overrides.totalSuccess ?? 80,
    totalFailures: overrides.totalFailures ?? 20,
    avgSuccessPerDelivery: overrides.avgSuccessPerDelivery ?? 0.8,
    avgFailuresPerDelivery: overrides.avgFailuresPerDelivery ?? 0.2,
    successRate: overrides.successRate ?? 80,
    statusBreakdown: overrides.statusBreakdown ?? {
      pending: 10,
      success: 80,
      partial_failure: 5,
      failure: 5,
    },
  };
}

describe("[UNIT] getDeliveryStatsUseCase", () => {
  it("should return delivery statistics successfully", async () => {
    const mockStats = createMockDeliveryStats({
      totalDeliveries: 150,
      totalRecipients: 150,
      totalSuccess: 120,
      totalFailures: 30,
      successRate: 80,
    });

    const mockGateway = createMockDeliveryGateway(mockStats);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryStatsInput = {};

    const program = getDeliveryStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.totalDeliveries).toBe(150);
    expect(result.totalRecipients).toBe(150);
    expect(result.totalSuccess).toBe(120);
    expect(result.totalFailures).toBe(30);
    expect(result.successRate).toBe(80);
  });

  it("should return statistics with status breakdown", async () => {
    const mockStats = createMockDeliveryStats({
      statusBreakdown: {
        pending: 25,
        success: 150,
        partial_failure: 15,
        failure: 10,
      },
    });

    const mockGateway = createMockDeliveryGateway(mockStats);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryStatsInput = {};

    const program = getDeliveryStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.statusBreakdown.pending).toBe(25);
    expect(result.statusBreakdown.success).toBe(150);
    expect(result.statusBreakdown.partial_failure).toBe(15);
    expect(result.statusBreakdown.failure).toBe(10);
  });

  it("should handle database errors", async () => {
    const mockStats = createMockDeliveryStats();

    const mockGateway = createMockDeliveryGateway(mockStats, {
      shouldFailGetStats: true,
    });
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryStatsInput = {};

    const program = getDeliveryStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetDeliveryStatsError);
    }
  });

  it("should apply filters when provided", async () => {
    const mockStats = createMockDeliveryStats({
      totalDeliveries: 50,
      totalSuccess: 40,
      totalFailures: 10,
    });

    const mockGateway = createMockDeliveryGateway(mockStats);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryStatsInput = {
      filters: {
        tripId: "trip-123",
        status: "success",
      },
    };

    const program = getDeliveryStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.totalDeliveries).toBe(50);
    expect(result.totalSuccess).toBe(40);
  });

  it("should return averages correctly", async () => {
    const mockStats = createMockDeliveryStats({
      totalDeliveries: 100,
      totalRecipients: 1000,
      totalSuccess: 800,
      totalFailures: 200,
      avgSuccessPerDelivery: 8.0,
      avgFailuresPerDelivery: 2.0,
    });

    const mockGateway = createMockDeliveryGateway(mockStats);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryStatsInput = {};

    const program = getDeliveryStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.avgSuccessPerDelivery).toBe(8.0);
    expect(result.avgFailuresPerDelivery).toBe(2.0);
  });

  it("should handle zero deliveries scenario", async () => {
    const mockStats = createMockDeliveryStats({
      totalDeliveries: 0,
      totalRecipients: 0,
      totalSuccess: 0,
      totalFailures: 0,
      successRate: 0,
      avgSuccessPerDelivery: 0,
      avgFailuresPerDelivery: 0,
      statusBreakdown: {
        pending: 0,
        success: 0,
        partial_failure: 0,
        failure: 0,
      },
    });

    const mockGateway = createMockDeliveryGateway(mockStats);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryStatsInput = {};

    const program = getDeliveryStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.totalDeliveries).toBe(0);
    expect(result.successRate).toBe(0);
    expect(result.statusBreakdown.success).toBe(0);
  });

  it("should include all expected statistics properties", async () => {
    const mockStats = createMockDeliveryStats();

    const mockGateway = createMockDeliveryGateway(mockStats);
    const mockLayer = Layer.succeed(
      NotificationDeliveryGatewayTag,
      mockGateway,
    );

    const input: GetDeliveryStatsInput = {};

    const program = getDeliveryStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toHaveProperty("totalDeliveries");
    expect(result).toHaveProperty("totalRecipients");
    expect(result).toHaveProperty("totalSuccess");
    expect(result).toHaveProperty("totalFailures");
    expect(result).toHaveProperty("avgSuccessPerDelivery");
    expect(result).toHaveProperty("avgFailuresPerDelivery");
    expect(result).toHaveProperty("successRate");
    expect(result).toHaveProperty("statusBreakdown");
  });
});
