import { describe, it, expect, mock } from "bun:test";
import {
  getCoinTransactionsUseCase,
  type GetCoinTransactionsInput,
} from "./GetCoinTransactions";
import { Effect, Either } from "effect";
import {
  CoinTransactionRepositoryTag,
  type CoinTransaction,
  type PaginationOptions,
} from "../ports/CoinTransactionRepository";

describe("[UNIT] getCoinTransactionsUseCase (Effect)", () => {
  const createMockTransaction = (
    overrides?: Partial<CoinTransaction>,
  ): CoinTransaction => ({
    id: overrides?.id ?? "transaction-123",
    tripId: overrides?.tripId ?? "trip-123",
    groupId: overrides?.groupId ?? "group-123",
    amount: overrides?.amount ?? 100,
    reason: overrides?.reason ?? "Test transaction",
    adminId: overrides?.adminId ?? "user-123",
    createdAt: overrides?.createdAt ?? new Date("2026-01-01"),
  });

  const createMockRepo = (overrides?: any) => ({
    count: mock(() => Effect.succeed(0)),
    sumAmount: mock(() => Effect.succeed(null)),
    sumAddedCoins: mock(() => Effect.succeed(null)),
    sumRemovedCoins: mock(() => Effect.succeed(null)),
    getMostActiveAdmin: mock(() => Effect.succeed([])),
    findMany: mock(() => Effect.succeed([])),
    findRecent: mock(() => Effect.succeed([])),
    getTotalCoinsByGroup: mock(() => Effect.succeed([])),
    groupByAdmin: mock(() => Effect.succeed([])),
    create: mock(() => Effect.succeed(createMockTransaction())),
    incrementGroupCoins: mock(() => Effect.succeed(undefined)),
    decrementGroupCoins: mock(() => Effect.succeed({ success: true })),
    getGroupCoins: mock(() => Effect.succeed(0)),
    verifyGroupInTrip: mock(() => Effect.succeed({ exists: true })),
    ...overrides,
  });

  describe("[UNIT] execute", () => {
    it("should return transactions for trip", async () => {
      const mockTransactions = [
        createMockTransaction({ id: "tx-1", amount: 100 }),
        createMockTransaction({ id: "tx-2", amount: -50 }),
        createMockTransaction({ id: "tx-3", amount: 200 }),
      ];
      const mockRepo = createMockRepo({
        findMany: mock(() => Effect.succeed(mockTransactions)),
        count: mock(() => Effect.succeed(3)),
      });

      const input: GetCoinTransactionsInput = {
        tripId: "trip-123",
      };

      const program = getCoinTransactionsUseCase(input).pipe(
        Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      expect(result.transactions).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.limit).toBe(50);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should filter by group when groupId provided", async () => {
      const mockTransactions = [
        createMockTransaction({ id: "tx-1", groupId: "group-456" }),
      ];
      const findManyMock = mock((filters: any) => {
        expect(filters.groupId).toBe("group-456");
        return Effect.succeed(mockTransactions);
      });
      const mockRepo = createMockRepo({
        findMany: findManyMock,
        count: mock(() => Effect.succeed(1)),
      });

      const input: GetCoinTransactionsInput = {
        tripId: "trip-123",
        groupId: "group-456",
      };

      const program = getCoinTransactionsUseCase(input).pipe(
        Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      expect(result.transactions).toHaveLength(1);
    });

    it("should apply pagination options", async () => {
      const findManyMock = mock(
        (filters: any, pagination: PaginationOptions) => {
          expect(pagination.limit).toBe(10);
          expect(pagination.offset).toBe(20);
          return Effect.succeed([]);
        },
      );
      const mockRepo = createMockRepo({
        findMany: findManyMock,
        count: mock(() => Effect.succeed(100)),
      });

      const input: GetCoinTransactionsInput = {
        tripId: "trip-123",
        pagination: { limit: 10, offset: 20 },
      };

      const program = getCoinTransactionsUseCase(input).pipe(
        Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(20);
      expect(result.pagination.hasMore).toBe(true);
    });

    it("should return empty list when no transactions", async () => {
      const mockRepo = createMockRepo({
        findMany: mock(() => Effect.succeed([])),
        count: mock(() => Effect.succeed(0)),
      });

      const input: GetCoinTransactionsInput = {
        tripId: "trip-empty",
      };

      const program = getCoinTransactionsUseCase(input).pipe(
        Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
      );

      const result = await Effect.runPromise(program);

      expect(result.transactions).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findMany: mock(() => Effect.fail(new Error("DB error"))),
      });

      const input: GetCoinTransactionsInput = {
        tripId: "trip-123",
      };

      const program = getCoinTransactionsUseCase(input).pipe(
        Effect.provideService(CoinTransactionRepositoryTag, mockRepo),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left.message).toContain(
          "Failed to get coin transactions",
        );
      }
    });
  });
});
