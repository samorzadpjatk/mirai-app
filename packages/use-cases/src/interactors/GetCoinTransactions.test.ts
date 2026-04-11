import { describe, it, expect, mock } from "bun:test";
import {
  GetCoinTransactionsUseCase,
  type GetCoinTransactionsInput,
} from "./GetCoinTransactions";
import type {
  CoinTransactionRepository,
  CoinTransaction,
  PaginationOptions,
} from "../ports/CoinTransactionRepository";

describe("[UNIT] GetCoinTransactionsUseCase", () => {
  const createMockTransaction = (
    overrides?: Partial<CoinTransaction>,
  ): CoinTransaction => ({
    id: overrides?.id ?? "transaction-123",
    tripId: overrides?.tripId ?? "trip-123",
    groupId: overrides?.groupId ?? "group-123",
    amount: overrides?.amount ?? 100,
    reason: overrides?.reason ?? "Test transaction",
    createdById: overrides?.createdById ?? "user-123",
    createdAt: overrides?.createdAt ?? new Date("2026-01-01"),
  });

  const createMockRepo = (
    overrides?: Partial<CoinTransactionRepository>,
  ): CoinTransactionRepository => ({
    findMany: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(null)),
    findByGroupId: mock(() => Promise.resolve([])),
    findByTripId: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve(createMockTransaction())),
    count: mock(() => Promise.resolve(0)),
    getBalance: mock(() => Promise.resolve(0)),
    ...overrides,
  });

  describe("execute", () => {
    it("should return transactions for trip", async () => {
      const mockTransactions = [
        createMockTransaction({ id: "tx-1", amount: 100 }),
        createMockTransaction({ id: "tx-2", amount: -50 }),
        createMockTransaction({ id: "tx-3", amount: 200 }),
      ];
      const mockRepo = createMockRepo({
        findMany: mock(() => Promise.resolve(mockTransactions)),
        count: mock(() => Promise.resolve(3)),
      });

      const useCase = new GetCoinTransactionsUseCase(mockRepo);
      const input: GetCoinTransactionsInput = {
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.transactions).toHaveLength(3);
        expect(result.value.pagination.total).toBe(3);
        expect(result.value.pagination.limit).toBe(50);
        expect(result.value.pagination.offset).toBe(0);
        expect(result.value.pagination.hasMore).toBe(false);
      }
    });

    it("should filter by group when groupId provided", async () => {
      const mockTransactions = [
        createMockTransaction({ id: "tx-1", groupId: "group-456" }),
      ];
      const mockRepo = createMockRepo({
        findMany: mock((filters: any) => {
          expect(filters.groupId).toBe("group-456");
          return Promise.resolve(mockTransactions);
        }),
        count: mock(() => Promise.resolve(1)),
      });

      const useCase = new GetCoinTransactionsUseCase(mockRepo);
      const input: GetCoinTransactionsInput = {
        tripId: "trip-123",
        groupId: "group-456",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.transactions).toHaveLength(1);
      }
    });

    it("should apply pagination options", async () => {
      const mockRepo = createMockRepo({
        findMany: mock((filters: any, pagination: PaginationOptions) => {
          expect(pagination.limit).toBe(10);
          expect(pagination.offset).toBe(20);
          return Promise.resolve([]);
        }),
        count: mock(() => Promise.resolve(100)),
      });

      const useCase = new GetCoinTransactionsUseCase(mockRepo);
      const input: GetCoinTransactionsInput = {
        tripId: "trip-123",
        pagination: { limit: 10, offset: 20 },
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.pagination.limit).toBe(10);
        expect(result.value.pagination.offset).toBe(20);
        expect(result.value.pagination.hasMore).toBe(true); // 20 + 10 < 100
      }
    });

    it("should return empty list when no transactions", async () => {
      const mockRepo = createMockRepo({
        findMany: mock(() => Promise.resolve([])),
        count: mock(() => Promise.resolve(0)),
      });

      const useCase = new GetCoinTransactionsUseCase(mockRepo);
      const input: GetCoinTransactionsInput = {
        tripId: "trip-empty",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.transactions).toHaveLength(0);
        expect(result.value.pagination.total).toBe(0);
        expect(result.value.pagination.hasMore).toBe(false);
      }
    });

    it("should handle repository errors", async () => {
      const mockRepo = createMockRepo({
        findMany: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new GetCoinTransactionsUseCase(mockRepo);
      const input: GetCoinTransactionsInput = {
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Failed to get coin transactions");
      }
    });
  });
});
