import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getCoinTransactionsUseCase,
  type GetCoinTransactionsInput,
  GetTransactionsError,
} from "./get-transactions";
import {
  CoinTransactionGatewayTag,
  type CoinTransactionGateway,
} from "../ports/gateway";
import type { CoinTransactionDTO } from "@mirai-app/domain";

function createMockCoinGateway(
  options: {
    transactions?: CoinTransactionDTO[];
    count?: number;
    shouldFailFindMany?: boolean;
    shouldFailCount?: boolean;
  } = {},
): CoinTransactionGateway {
  return {
    count: () => {
      if (options.shouldFailCount) {
        return Effect.fail(new Error("Count failed"));
      }
      return Effect.succeed(options.count ?? 0);
    },

    findMany: () => {
      if (options.shouldFailFindMany) {
        return Effect.fail(new Error("FindMany failed"));
      }
      return Effect.succeed(options.transactions ?? []);
    },

    sumAmount: () => Effect.succeed(null),

    sumAddedCoins: () => Effect.succeed(0),

    sumRemovedCoins: () => Effect.succeed(0),

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

describe("[UNIT] getCoinTransactionsUseCase", () => {
  it("should return transactions with pagination", async () => {
    const transactions: CoinTransactionDTO[] = [
      {
        id: "tx-1",
        groupId: "group-123",
        amount: 100,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tx-2",
        groupId: "group-456",
        amount: -50,
        reason: "Deduction",
        adminId: "admin-456",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockGateway = createMockCoinGateway({
      transactions,
      count: 10,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsInput = {
      tripId: "trip-123",
      pagination: { limit: 2, offset: 0 },
    };

    const program = getCoinTransactionsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.transactions).toHaveLength(2);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.limit).toBe(2);
    expect(result.pagination.offset).toBe(0);
    expect(result.pagination.hasMore).toBe(true);
  });

  it("should use default pagination when not specified", async () => {
    const transactions: CoinTransactionDTO[] = Array.from(
      { length: 50 },
      (_, i) => ({
        id: `tx-${i}`,
        groupId: "group-123",
        amount: 100,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const mockGateway = createMockCoinGateway({
      transactions,
      count: 100,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsInput = {
      tripId: "trip-123",
    };

    const program = getCoinTransactionsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.pagination.limit).toBe(50);
    expect(result.pagination.offset).toBe(0);
    expect(result.pagination.hasMore).toBe(true);
  });

  it("should filter by groupId when provided", async () => {
    const transactions: CoinTransactionDTO[] = [
      {
        id: "tx-1",
        groupId: "group-123",
        amount: 100,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockGateway = createMockCoinGateway({
      transactions,
      count: 1,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsInput = {
      tripId: "trip-123",
      groupId: "group-123",
      pagination: { limit: 10, offset: 0 },
    };

    const program = getCoinTransactionsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].groupId).toBe("group-123");
  });

  it("should fail with GetTransactionsError when findMany fails", async () => {
    const mockGateway = createMockCoinGateway({
      shouldFailFindMany: true,
      count: 10,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsInput = {
      tripId: "trip-123",
      pagination: { limit: 10, offset: 0 },
    };

    const program = getCoinTransactionsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetTransactionsError);
      expect(either.left.message).toBe("Failed to get coin transactions");
    }
  });

  it("should fail with GetTransactionsError when count fails", async () => {
    const mockGateway = createMockCoinGateway({
      transactions: [],
      shouldFailCount: true,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsInput = {
      tripId: "trip-123",
      pagination: { limit: 10, offset: 0 },
    };

    const program = getCoinTransactionsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetTransactionsError);
      expect(either.left.message).toBe("Failed to get coin transactions");
    }
  });

  it("should calculate hasMore correctly on last page", async () => {
    const transactions: CoinTransactionDTO[] = [
      {
        id: "tx-9",
        groupId: "group-123",
        amount: 100,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "tx-10",
        groupId: "group-123",
        amount: 100,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockGateway = createMockCoinGateway({
      transactions,
      count: 10,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsInput = {
      tripId: "trip-123",
      pagination: { limit: 10, offset: 8 },
    };

    const program = getCoinTransactionsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.transactions).toHaveLength(2);
    expect(result.pagination.hasMore).toBe(false);
  });

  it("should handle empty result", async () => {
    const mockGateway = createMockCoinGateway({
      transactions: [],
      count: 0,
    });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsInput = {
      tripId: "trip-empty",
      pagination: { limit: 10, offset: 0 },
    };

    const program = getCoinTransactionsUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.transactions).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.hasMore).toBe(false);
  });
});
