import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  getCoinQuickStatsUseCase,
  type GetCoinQuickStatsInput,
} from "./GetCoinQuickStats";
import { CoinTransactionRepositoryTag } from "../ports/CoinTransactionRepository";
import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";

describe("[UNIT] getCoinQuickStatsUseCase (Effect)", () => {
  let mockRepo: CoinTransactionRepository;

  beforeEach(() => {
    mockRepo = {
      sumAmount: async () => 1000,
      count: async () => 10,
      getTotalCoinsByGroup: async () => [
        { groupId: "group-1", _sum: { amount: 500 } },
        { groupId: "group-2", _sum: { amount: 300 } },
        { groupId: "group-3", _sum: { amount: 200 } },
      ],
    } as unknown as CoinTransactionRepository;
  });

  // Helper to run use case with repository
  const runUseCase = async (input: GetCoinQuickStatsInput) => {
    const program = getCoinQuickStatsUseCase(input).pipe(
      Effect.provideService(CoinTransactionRepositoryTag, {
        sumAmount: (filters?: { tripId?: string }) =>
          Effect.promise(() => mockRepo.sumAmount(filters)),
        count: (filters?: { tripId?: string }) =>
          Effect.promise(() => mockRepo.count(filters)),
        getTotalCoinsByGroup: (tripId: string) =>
          Effect.promise(() => mockRepo.getTotalCoinsByGroup(tripId)),
        findMany: (filters: any, pagination: any) =>
          Effect.promise(() => mockRepo.findMany(filters, pagination)),
        findRecent: (filters: any, limit: number) =>
          Effect.promise(() => mockRepo.findRecent(filters, limit)),
        groupByAdmin: (tripId: string, limit: number) =>
          Effect.promise(() => mockRepo.groupByAdmin(tripId, limit)),
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
    it("should return quick stats for trip", async () => {
      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };

      const result = await runUseCase(input);

      expect(result).not.toBeNull();
      expect(result?.totalCoins).toBe(1000);
      expect(result?.totalGroups).toBe(10);
      expect(result?.averageCoinsPerGroup).toBe(100);
      expect(result?.richestGroupId).toBe("group-1");
      expect(result?.time).toBeInstanceOf(Date);
    });

    it("should return null when no transactions exist", async () => {
      mockRepo.sumAmount = async () => null;

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result).toBeNull();
    });

    it("should calculate average correctly", async () => {
      mockRepo.sumAmount = async () => 500;
      mockRepo.count = async () => 5;

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.averageCoinsPerGroup).toBe(100); // 500/5
    });

    it("should handle zero groups", async () => {
      mockRepo.sumAmount = async () => 0;
      mockRepo.count = async () => 0;

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.averageCoinsPerGroup).toBe(0);
    });

    it("should handle groups without richest info", async () => {
      mockRepo.getTotalCoinsByGroup = async () => [];

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.richestGroupId).toBeUndefined();
      expect(result?.totalCoins).toBe(1000);
    });

    it("should find richest group correctly", async () => {
      mockRepo.getTotalCoinsByGroup = async () => [
        { groupId: "group-a", _sum: { amount: 100 } },
        { groupId: "group-b", _sum: { amount: 800 } },
        { groupId: "group-c", _sum: { amount: 50 } },
      ];

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.richestGroupId).toBe("group-b");
    });

    it("should handle null amounts in group data", async () => {
      mockRepo.getTotalCoinsByGroup = async () => [
        { groupId: "group-1", _sum: { amount: null } },
        { groupId: "group-2", _sum: { amount: 300 } },
      ];

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.richestGroupId).toBe("group-2");
    });
  });
});
