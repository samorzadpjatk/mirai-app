import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getCoinTransactionsConnectionUseCase,
  type GetCoinTransactionsConnectionInput,
  GetTransactionsConnectionError,
} from "./get-transactions-connection";
import {
  CoinTransactionGatewayTag,
  type CoinTransactionGateway,
} from "../ports/gateway";
import type { CoinTransactionDTO, Connection } from "@mirai-app/domain";

function createMockCoinGateway(
  options: {
    connection?: Connection<CoinTransactionDTO>;
    shouldFail?: boolean;
  } = {},
): CoinTransactionGateway {
  return {
    count: () => Effect.succeed(0),

    sumAmount: () => Effect.succeed(null),

    sumAddedCoins: () => Effect.succeed(0),

    sumRemovedCoins: () => Effect.succeed(0),

    getMostActiveAdmin: () => Effect.succeed([]),

    findManyConnection: () => {
      if (options.shouldFail) {
        return Effect.fail(new Error("Database error"));
      }
      return Effect.succeed(
        options.connection ?? {
          edges: [],
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalCount: 0,
        },
      );
    },

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

describe("[UNIT] getCoinTransactionsConnectionUseCase", () => {
  it("should return paginated transactions successfully", async () => {
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

    const connection: Connection<CoinTransactionDTO> = {
      edges: transactions.map((tx) => ({
        node: tx,
        cursor: `cursor-${tx.id}`,
      })),
      nodes: transactions,
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: "cursor-tx-1",
        endCursor: "cursor-tx-2",
      },
      totalCount: 10,
    };

    const mockGateway = createMockCoinGateway({ connection });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsConnectionInput = {
      tripId: "trip-123",
      first: 10,
    };

    const program = getCoinTransactionsConnectionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("tx-1");
    expect(result.items[1].id).toBe("tx-2");
    expect(result.hasMore).toBe(true);
  });

  it("should use default pagination when not specified", async () => {
    const transactions: CoinTransactionDTO[] = Array.from(
      { length: 20 },
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

    const connection: Connection<CoinTransactionDTO> = {
      edges: transactions.map((tx) => ({
        node: tx,
        cursor: `cursor-${tx.id}`,
      })),
      nodes: transactions,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: "cursor-tx-0",
        endCursor: "cursor-tx-19",
      },
      totalCount: 20,
    };

    const mockGateway = createMockCoinGateway({ connection });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsConnectionInput = {
      tripId: "trip-123",
    };

    const program = getCoinTransactionsConnectionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items).toHaveLength(20);
    expect(result.hasMore).toBe(false);
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

    const connection: Connection<CoinTransactionDTO> = {
      edges: transactions.map((tx) => ({
        node: tx,
        cursor: `cursor-${tx.id}`,
      })),
      nodes: transactions,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: "cursor-tx-1",
        endCursor: "cursor-tx-1",
      },
      totalCount: 1,
    };

    const mockGateway = createMockCoinGateway({ connection });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsConnectionInput = {
      tripId: "trip-123",
      groupId: "group-123",
      first: 10,
    };

    const program = getCoinTransactionsConnectionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].groupId).toBe("group-123");
  });

  it("should handle cursor-based pagination with after parameter", async () => {
    const transactions: CoinTransactionDTO[] = [
      {
        id: "tx-3",
        groupId: "group-123",
        amount: 100,
        reason: "Test",
        adminId: "admin-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const connection: Connection<CoinTransactionDTO> = {
      edges: transactions.map((tx) => ({
        node: tx,
        cursor: `cursor-${tx.id}`,
      })),
      nodes: transactions,
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: true,
        startCursor: "cursor-tx-3",
        endCursor: "cursor-tx-3",
      },
      totalCount: 5,
    };

    const mockGateway = createMockCoinGateway({ connection });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsConnectionInput = {
      tripId: "trip-123",
      first: 5,
      after: { id: "tx-2", createdAt: new Date() },
    };

    const program = getCoinTransactionsConnectionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("tx-3");
    expect(result.hasMore).toBe(true);
  });

  it("should fail with GetTransactionsConnectionError when database fails", async () => {
    const mockGateway = createMockCoinGateway({ shouldFail: true });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsConnectionInput = {
      tripId: "trip-123",
      first: 10,
    };

    const program = getCoinTransactionsConnectionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetTransactionsConnectionError);
      expect(either.left.message).toBe("Failed to get coin transactions");
    }
  });

  it("should return empty result when no transactions exist", async () => {
    const connection: Connection<CoinTransactionDTO> = {
      edges: [],
      nodes: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      totalCount: 0,
    };

    const mockGateway = createMockCoinGateway({ connection });
    const mockLayer = Layer.succeed(CoinTransactionGatewayTag, mockGateway);

    const input: GetCoinTransactionsConnectionInput = {
      tripId: "trip-empty",
      first: 10,
    };

    const program = getCoinTransactionsConnectionUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.items).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });
});
