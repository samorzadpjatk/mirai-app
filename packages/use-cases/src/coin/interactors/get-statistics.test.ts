import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getCoinStatisticsUseCase,
  type GetCoinStatisticsInput,
  GetStatisticsError,
} from "./get-statistics";
import {
  CoinTransactionGatewayTag,
  type CoinTransactionGateway,
} from "../ports/gateway";
import type { CoinTransactionDTO } from "@mirai-app/domain";

/**
 * Mock CoinTransactionGateway for testing
 */
function createMockCoinGateway(
  options: {
    count?: number;
    addedCoins?: number | null;
    removedCoins?: number | null;
    shouldFailCount?: boolean;
    shouldFailAdded?: boolean;
    shouldFailRemoved?: boolean;
  } = {},
): CoinTransactionGateway {
  return {
    count: () => {
      if (options.shouldFailCount) {
        return Effect.fail(new Error("Count failed"));
      }
      return Effect.succeed(options.count ?? 0);
    },

    sumAmount: () => Effect.succeed(null),

    sumAddedCoins: () => {
      if (options.shouldFailAdded) {
        return Effect.fail(new Error("Sum added failed"));
      }
      return Effect.succeed(options.addedCoins ?? 0);
    },

    sumRemovedCoins: () => {
      if (options.shouldFailRemoved) {
        return Effect.fail(new Error("Sum removed failed"));
      }
      return Effect.succeed(options.removedCoins ?? 0);
    },

    getMostActiveAdmin: () => Effect.succeed([]),

    findManyConnection: () =>
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

    findRecent: () => Effect.succeed([]),

    getTotalCoinsByGroup: () => Effect.succeed([]),

    groupByAdmin: () => Effect.succeed([]),

    create: () =>
      Effect.succeed({
        id: "tx-123",
        groupId: "group-123",
        tripId: "trip-123",
        amount: 100,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
      } as CoinTransactionDTO),

    incrementGroupCoins: () => Effect.succeed(void 0),

    decrementGroupCoins: () =>
      Effect.succeed({ success: true, currentBalance: 900 }),

    getGroupCoins: () => Effect.succeed(1000),

    verifyGroupInTrip: () =>
      Effect.succeed({
        exists: true,
        tripId: "trip-123",
        isDeleted: false,
        coins: 1000,
      }),
  };
}

describe("[UNIT] getCoinStatisticsUseCase", () => {
  it("should return coin statistics successfully", async () => {
    const mockGateway = createMockCoinGateway({
      count: 150,
      addedCoins: 5000,
      removedCoins: -2000,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinStatisticsInput = { tripId: "trip-123" };
    const program = getCoinStatisticsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.transactionCount).toBe(150);
    expect(result.addedCoins).toBe(5000);
    expect(result.removedCoins).toBe(-2000);
    expect(result.netBalance).toBe(3000);
    expect(result.time).toBeInstanceOf(Date);
  });

  it("should handle null values for added and removed coins", async () => {
    const mockGateway = createMockCoinGateway({
      count: 50,
      addedCoins: null,
      removedCoins: null,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinStatisticsInput = { tripId: "trip-123" };
    const program = getCoinStatisticsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.transactionCount).toBe(50);
    expect(result.addedCoins).toBe(0);
    expect(result.removedCoins).toBe(0);
    expect(result.netBalance).toBe(0);
  });

  it("should fail with GetStatisticsError when count fails", async () => {
    const mockGateway = createMockCoinGateway({ shouldFailCount: true });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinStatisticsInput = { tripId: "trip-123" };
    const program = getCoinStatisticsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetStatisticsError);
      expect(either.left.message).toBe("Failed to get coin statistics");
    }
  });

  it("should fail with GetStatisticsError when added coins query fails", async () => {
    const mockGateway = createMockCoinGateway({
      count: 100,
      shouldFailAdded: true,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinStatisticsInput = { tripId: "trip-123" };
    const program = getCoinStatisticsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetStatisticsError);
    }
  });

  it("should fail with GetStatisticsError when removed coins query fails", async () => {
    const mockGateway = createMockCoinGateway({
      count: 100,
      addedCoins: 1000,
      shouldFailRemoved: true,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinStatisticsInput = { tripId: "trip-123" };
    const program = getCoinStatisticsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetStatisticsError);
    }
  });

  it("should calculate correct net balance with positive removed coins", async () => {
    const mockGateway = createMockCoinGateway({
      count: 20,
      addedCoins: 3000,
      removedCoins: 1000, // This means -1000 was removed (user error in mock)
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinStatisticsInput = { tripId: "trip-123" };
    const program = getCoinStatisticsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.addedCoins).toBe(3000);
    expect(result.netBalance).toBe(4000); // 3000 + 1000
  });

  it("should return statistics with correct types", async () => {
    const mockGateway = createMockCoinGateway({
      count: 75,
      addedCoins: 2500,
      removedCoins: -800,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinStatisticsInput = { tripId: "trip-123" };
    const program = getCoinStatisticsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(typeof result.transactionCount).toBe("number");
    expect(typeof result.addedCoins).toBe("number");
    expect(typeof result.removedCoins).toBe("number");
    expect(typeof result.netBalance).toBe("number");
    expect(result.time).toBeInstanceOf(Date);
  });

  it("should handle zero transactions", async () => {
    const mockGateway = createMockCoinGateway({
      count: 0,
      addedCoins: null,
      removedCoins: null,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinStatisticsInput = { tripId: "trip-empty" };
    const program = getCoinStatisticsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.transactionCount).toBe(0);
    expect(result.netBalance).toBe(0);
  });
});
