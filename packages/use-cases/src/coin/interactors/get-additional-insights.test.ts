import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  getCoinAdditionalInsightsUseCase,
  type GetCoinAdditionalInsightsInput,
} from "./get-additional-insights";
import { CoinTransactionGatewayTag } from "../ports/gateway";
import { UserGatewayTag } from "../../ports/user/gateway";
import type {
  CoinTransactionGateway,
  CoinTransaction,
} from "../ports/gateway";
import type { UserGateway } from "../../ports/user/gateway";
import type { User } from "@mirai-app/domain";

describe("[UNIT] getCoinAdditionalInsightsUseCase (Effect)", () => {
  let mockRepo: CoinTransactionGateway;
  let mockUserRepo: UserGateway;

  // Helper to create a mock User
  const createMockUser = (
    id: string,
    firstName: string,
    lastName: string,
  ): User =>
    ({
      id,
      firstName,
      lastName,
      getFullName: () =>
        [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown",
      getDisplayName: () =>
        firstName && lastName
          ? `${firstName} ${lastName}`
          : firstName || lastName || "Unknown",
    }) as User;

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
    } as unknown as CoinTransactionGateway;

    mockUserRepo = {
      findById: async (id: string) => {
        // Return mock users
        const users: Record<string, { firstName: string; lastName: string }> = {
          "admin-1": { firstName: "John", lastName: "Doe" },
          "admin-2": { firstName: "Jane", lastName: "Smith" },
          "admin-most": { firstName: "Bob", lastName: "Johnson" },
        };
        const user = users[id];
        if (!user) return null;

        // Return a simple mock User object
        return createMockUser(id, user.firstName, user.lastName);
      },
    } as unknown as UserGateway;
  });

  // Helper to run use case with repositories
  const runUseCase = async (input: GetCoinAdditionalInsightsInput) => {
    const coinTxService = Effect.provideService(CoinTransactionGatewayTag, {
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
    });

    const userService = Effect.provideService(UserGatewayTag, {
      findById: (id: string) => Effect.promise(() => mockUserRepo.findById(id)),
      create: (user: User) => Effect.promise(() => mockUserRepo.create(user)),
      findByAuthUserId: (authUserId: string) =>
        Effect.promise(() => mockUserRepo.findByAuthUserId(authUserId)),
      findByRole: (role: any) =>
        Effect.promise(() => mockUserRepo.findByRole(role)),
      findAll: (options?: any) =>
        Effect.promise(() => mockUserRepo.findAll(options)),
      update: (user: User) => Effect.promise(() => mockUserRepo.update(user)),
      delete: (id: string) => Effect.promise(() => mockUserRepo.delete(id)),
      existsByAuthUserId: (authUserId: string) =>
        Effect.promise(() => mockUserRepo.existsByAuthUserId(authUserId)),
    });

    const program = getCoinAdditionalInsightsUseCase(input).pipe(
      coinTxService,
      userService,
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return insights with recent transactions and most active admin with resolved name", async () => {
      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };

      const result = await runUseCase(input);

      expect(result).not.toBeNull();
      expect(result?.mostActiveAdmin).not.toBeNull();
      expect(result?.mostActiveAdmin?.name).toBe("John Doe");
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

    it("should handle no recent transactions but have admin stats with resolved name", async () => {
      mockRepo.findRecent = async () => [];

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result).not.toBeNull();
      expect(result?.recentTransactions).toEqual([]);
      expect(result?.mostActiveAdmin?.name).toBe("John Doe");
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

    it("should return first admin as most active with resolved name", async () => {
      mockRepo.groupByAdmin = async () => [
        { adminId: "admin-most", _count: { id: 25 } },
        { adminId: "admin-less", _count: { id: 5 } },
      ];

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.mostActiveAdmin?.name).toBe("Bob Johnson");
      expect(result?.mostActiveAdmin?.transactionCount).toBe(25);
    });

    it("should handle user not found and fallback to adminId", async () => {
      mockRepo.groupByAdmin = async () => [
        { adminId: "nonexistent-admin", _count: { id: 10 } },
      ];

      const input: GetCoinAdditionalInsightsInput = { tripId: "trip-123" };
      const result = await runUseCase(input);

      expect(result?.mostActiveAdmin?.name).toBe("nonexistent-admin");
      expect(result?.mostActiveAdmin?.transactionCount).toBe(10);
    });
  });
});
