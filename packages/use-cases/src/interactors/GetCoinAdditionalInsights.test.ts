import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  getCoinAdditionalInsightsUseCase,
  type GetCoinAdditionalInsightsInput,
} from "./GetCoinAdditionalInsights";
import { CoinTransactionRepositoryTag } from "../ports/CoinTransactionRepository";
import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";

describe("[UNIT] getCoinAdditionalInsightsUseCase (Effect)", () => {
  let mockRepo: CoinTransactionRepository;

  // Mock CoinTransaction
  const createMockTransaction = (
    overrides?: Partial<CoinTransaction>,
  ): CoinTransaction =>
    ({
      id: "tx-123",
      groupId: "group-123",
      amount: 100,
      reason: "Test transaction",
      adminId: "admin-123",
      createdAt: new Date("2024-01-01"),
      ...overrides,
    }) as CoinTransaction;

  beforeEach(() => {
    mockRepo = {
      findRecent: async () => [
        createMockTransaction({ id: "tx-1" }),
        createMockTransaction({ id: "tx-2" }),
      ],
      groupByAdmin: async () => [
        { adminId: "admin-1", _count: { id: 15 } },
        { adminId: "admin-2", _count: { id: 8 } },
      ],
    } as unknown as CoinTransactionRepository;
  });

  // Helper to run use case with repository
  const runUseCase = async (input: GetCoinAdditionalInsightsInput) => {
    const program = getCoinAdditionalInsightsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, {
        findRecent: (filters: { tripId: string }, limit: number) =>
          Effect.promise(() => mockRepo.findRecent(filters, limit)),
        groupByAdmin: (tripId: string, limit: number) =>
          Effect.promise(() => mockRepo.groupByAdmin(tripId, limit)),
        sumAmount: (filters?: { tripId?: string }) =>
          Effect.promise(() => mockRepo.sumAmount(filters)),
        count: (filters?: { tripId?: string }) =>
          Effect.promise(() => mockRepo.count(filters)),
        getTotalCoinsByGroup: (tripId: string) =>
          Effect.promise(() => mockRepo.getTotalCoinsByGroup(tripId)),
        findMany: (filters: any, pagination: any) =>
          Effect.promise(() => mockRepo.findMany(filters, pagination)),
        sumAddedCoins: (tripId: string) =>
          Effect.promise(() => mockRepo.sumAddedCoins(tripId)),
        sumRemovedCoins: (tripId: string) =>
          Effect.promise(() => mockRepo.sumRemovedCoins(tripId)),
        getMostActiveAdmin: (tripId: string) =>
          Effect.promise(() => mockRepo.getMostActiveAdmin(tripId)),
        create: (data: any) => Effect.promise(() => mockRepo.create(data)),
        incrementGroupCoins: (groupId: string, amount: number) =>
          Effect.promise(() => mockRepo.incrementGroupCoins(groupId, amount)),
        decrementGroupCoins: (groupId: string, amount: number) =>
          Effect.promise(() => mockRepo.decrementGroupCoins(groupId, amount)),
        getGroupCoins: (groupId: string) =>
          Effect.promise(() => mockRepo.getGroupCoins(groupId)),
        verifyGroupInTrip: (groupId: string, tripId: string) =>
          Effect.promise(() => mockRepo.verifyGroupInTrip(groupId, tripId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return insights with recent transactions and most active admin", async () => {
      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };

      const result = await runUseCase(input);

      expect(result).not.toBeNull();
      expect(result?.mostActiveAdmin).not.toBeNull();
      expect(result?.mostActiveAdmin?.name).toBe("admin-1");
      expect(result?.mostActiveAdmin?.transactionCount).toBe(15);
      expect(result?.recentTransactions).toHaveLength(2);
    });

    it("should use default recentLimit of 5", async () => {
      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };

      let capturedLimit: number | undefined;
      mockRepo.findRecent = async (_filters: any, limit: number) => {
        capturedLimit = limit;
        return [];
      };

      await runUseCase(input);

      expect(capturedLimit).toBe(5);
    });

    it("should use custom recentLimit when provided", async () => {
      const input: GetCoinAdditionalInsightsInput = {
        tripId: "trip-123",
        recentLimit: 10,
      };

      let capturedLimit: number | undefined;
      mockRepo.findRecent = async (_filters: any, limit: number) => {
        capturedLimit = limit;
        return [];
      };

      await runUseCase(input);

      expect(capturedLimit).toBe(10);
    });

    it("should return null when no data exists", async () => {
      mockRepo.findRecent = async () => [];
      mockRepo.groupByAdmin = async () => [];

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result).toBeNull();
    });

    it("should handle no recent transactions but have admin stats", async () => {
      mockRepo.findRecent = async () => [];

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result).not.toBeNull();
      expect(result?.recentTransactions).toEqual([]);
      expect(result?.mostActiveAdmin?.name).toBe("admin-1");
    });

    it("should handle recent transactions but no admin stats", async () => {
      mockRepo.groupByAdmin = async () => [];

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.mostActiveAdmin).toBeNull();
      expect(result?.recentTransactions).toHaveLength(2);
    });

    it("should map transactions correctly", async () => {
      mockRepo.findRecent = async () => [
        createMockTransaction({ id: "tx-1", amount: 50 }),
        createMockTransaction({ id: "tx-2", amount: 100 }),
      ];

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.recentTransactions[0].id).toBe("tx-1");
      expect(result?.recentTransactions[0].amount).toBe(50);
      expect(result?.recentTransactions[1].id).toBe("tx-2");
    });

    it("should return first admin as most active", async () => {
      mockRepo.groupByAdmin = async () => [
        { adminId: "admin-most", _count: { id: 25 } },
        { adminId: "admin-less", _count: { id: 5 } },
      ];

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.mostActiveAdmin?.name).toBe("admin-most");
      expect(result?.mostActiveAdmin?.transactionCount).toBe(25);
    });
  });
});
