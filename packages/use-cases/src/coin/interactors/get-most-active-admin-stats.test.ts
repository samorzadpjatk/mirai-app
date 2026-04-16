import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getMostActiveAdminStatsUseCase,
  type GetMostActiveAdminStatsInput,
  CoinTransactionRepositoryError,
} from "./get-most-active-admin-stats";
import {
  CoinTransactionGatewayTag,
  type CoinTransactionGateway,
} from "../ports/gateway";
import type { CoinTransactionDTO } from "@mirai-app/domain";

function createMockCoinGateway(
  options: {
    mostActiveAdminStats?: Array<{
      adminId: string;
      _sum: { amount: number | null };
      _count: { id: number };
    }>;
    shouldFail?: boolean;
  } = {},
): CoinTransactionGateway {
  return {
    count: () => Effect.succeed(0),

    sumAmount: () => Effect.succeed(null),

    sumAddedCoins: () => Effect.succeed(0),

    sumRemovedCoins: () => Effect.succeed(0),

    getMostActiveAdmin: () => {
      if (options.shouldFail) {
        return Effect.fail(new Error("Database error"));
      }
      return Effect.succeed(options.mostActiveAdminStats ?? []);
    },

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
        amount: 100,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
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

describe("[UNIT] getMostActiveAdminStatsUseCase", () => {
  it("should return most active admin stats successfully", async () => {
    const mostActiveAdminStats = [
      {
        adminId: "admin-123",
        _sum: { amount: 5000 },
        _count: { id: 25 },
      },
    ];

    const mockGateway = createMockCoinGateway({ mostActiveAdminStats });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };
    const program = getMostActiveAdminStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.adminId).toBe("admin-123");
    expect(result?.totalAmount).toBe(5000);
    expect(result?.transactionCount).toBe(25);
  });

  it("should return null when no admin stats exist", async () => {
    const mockGateway = createMockCoinGateway({ mostActiveAdminStats: [] });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetMostActiveAdminStatsInput = { tripId: "trip-empty" };
    const program = getMostActiveAdminStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).toBeNull();
  });

  it("should handle null sum amount by defaulting to 0", async () => {
    const mostActiveAdminStats = [
      {
        adminId: "admin-123",
        _sum: { amount: null },
        _count: { id: 10 },
      },
    ];

    const mockGateway = createMockCoinGateway({ mostActiveAdminStats });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };
    const program = getMostActiveAdminStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.adminId).toBe("admin-123");
    expect(result?.totalAmount).toBe(0);
    expect(result?.transactionCount).toBe(10);
  });

  it("should fail with CoinTransactionRepositoryError when database fails", async () => {
    const mockGateway = createMockCoinGateway({ shouldFail: true });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };
    const program = getMostActiveAdminStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(CoinTransactionRepositoryError);
      expect(either.left.message).toContain(
        "Failed to get most active admin stats",
      );
    }
  });

  it("should handle multiple admin stats and return top admin", async () => {
    const mostActiveAdminStats = [
      {
        adminId: "admin-456",
        _sum: { amount: 10000 },
        _count: { id: 50 },
      },
      {
        adminId: "admin-123",
        _sum: { amount: 5000 },
        _count: { id: 25 },
      },
    ];

    const mockGateway = createMockCoinGateway({ mostActiveAdminStats });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetMostActiveAdminStatsInput = { tripId: "trip-123" };
    const program = getMostActiveAdminStatsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result).not.toBeNull();
    expect(result?.adminId).toBe("admin-456");
    expect(result?.totalAmount).toBe(10000);
    expect(result?.transactionCount).toBe(50);
  });
});
