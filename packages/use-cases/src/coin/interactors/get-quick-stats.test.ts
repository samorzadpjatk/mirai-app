import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  getCoinQuickStatsUseCase,
  type GetCoinQuickStatsInput,
} from "./get-quick-stats";
import { CoinTransactionGatewayTag } from "../ports/gateway";
import { GroupGatewayTag } from "../../ports/group/gateway";
import type {
  CoinTransactionGateway,
  CoinTransaction,
} from "../ports/gateway";
import type { GroupGateway } from "../../ports/group/gateway";
import type { Group } from "@mirai-app/domain";

describe("[UNIT] getCoinQuickStatsUseCase (Effect)", () => {
  let mockRepo: CoinTransactionGateway;
  let mockGroupRepo: GroupGateway;

  // Helper to create a mock Group
  const createMockGroup = (id: string, name: string): Group =>
    ({
      id,
      name,
    }) as Group;

  beforeEach(() => {
    mockRepo = {
      sumAmount: async () => 1000,
      count: async () => 10,
      getTotalCoinsByGroup: async () => [
        { groupId: "group-1", _sum: { amount: 500 } },
        { groupId: "group-2", _sum: { amount: 300 } },
        { groupId: "group-3", _sum: { amount: 200 } },
      ],
    } as unknown as CoinTransactionGateway;

    mockGroupRepo = {
      findById: async (id: string) => {
        // Return mock groups
        const groups: Record<string, { name: string }> = {
          "group-1": { name: "Team Alpha" },
          "group-2": { name: "Team Beta" },
          "group-b": { name: "Best Group" },
        };
        const group = groups[id];
        if (!group) return null;

        // Return a simple mock Group object with just the needed properties
        return createMockGroup(id, group.name);
      },
    } as unknown as GroupGateway;
  });

  // Helper to run use case with repositories
  const runUseCase = async (input: GetCoinQuickStatsInput) => {
    const coinTxService = Effect.provideService(CoinTransactionGatewayTag, {
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
    });

    const groupService = Effect.provideService(GroupGatewayTag, {
      findById: (id: string) =>
        Effect.promise(() => mockGroupRepo.findById(id)),
      create: (group: Group) =>
        Effect.promise(() => mockGroupRepo.create(group)),
      findByTripId: (tripId: string) =>
        Effect.promise(() => mockGroupRepo.findByTripId(tripId)),
      findByStatus: (status: any) =>
        Effect.promise(() => mockGroupRepo.findByStatus(status)),
      findByTripIdAndStatus: (tripId: string, status: any) =>
        Effect.promise(() =>
          mockGroupRepo.findByTripIdAndStatus(tripId, status),
        ),
      findByOrganizerId: (organizerId: string) =>
        Effect.promise(() => mockGroupRepo.findByOrganizerId(organizerId)),
      findByCode: (code: string) =>
        Effect.promise(() => mockGroupRepo.findByCode(code)),
      findAll: (options?: any) =>
        Effect.promise(() => mockGroupRepo.findAll(options)),
      update: (group: Group) =>
        Effect.promise(() => mockGroupRepo.update(group)),
      delete: (id: string) => Effect.promise(() => mockGroupRepo.delete(id)),
      exists: (id: string) => Effect.promise(() => mockGroupRepo.exists(id)),
      countByTripId: (tripId: string) =>
        Effect.promise(() => mockGroupRepo.countByTripId(tripId)),
      findParticipantByUserIdAndTripId: (userId: string, tripId: string) =>
        Effect.promise(() =>
          mockGroupRepo.findParticipantByUserIdAndTripId(userId, tripId),
        ),
      findParticipantsByGroupId: (groupId: string) =>
        Effect.promise(() => mockGroupRepo.findParticipantsByGroupId(groupId)),
      assignUserToGroup: (userId: string, groupId: string) =>
        Effect.promise(() => mockGroupRepo.assignUserToGroup(userId, groupId)),
      removeUserFromGroup: (userId: string, groupId: string) =>
        Effect.promise(() =>
          mockGroupRepo.removeUserFromGroup(userId, groupId),
        ),
    });

    const program = getCoinQuickStatsUseCase(input).pipe(
      coinTxService,
      groupService,
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
      expect(result?.richestGroupName).toBe("Team Alpha");
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

    it("should find richest group correctly and resolve name", async () => {
      mockRepo.getTotalCoinsByGroup = async () => [
        { groupId: "group-1", _sum: { amount: 100 } },
        { groupId: "group-2", _sum: { amount: 800 } },
        { groupId: "group-3", _sum: { amount: 50 } },
      ];

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.richestGroupId).toBe("group-2");
      expect(result?.richestGroupName).toBe("Team Beta");
    });

    it("should handle group not found when resolving name", async () => {
      mockRepo.getTotalCoinsByGroup = async () => [
        { groupId: "nonexistent-group", _sum: { amount: 500 } },
      ];

      const input: GetCoinQuickStatsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.richestGroupId).toBe("nonexistent-group");
      expect(result?.richestGroupName).toBeUndefined();
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
