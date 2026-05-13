 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import { coinTransactionRouter } from "../../routers/coinTransaction";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { DB, User, CoinTransaction, Group } from "@mirai-app/db";

const createCaller = (ctx: TRPCContext) => createRouterClient(coinTransactionRouter, { context: ctx });

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  authUserId: "auth-123",
  firstName: "Test",
  lastName: "User",
  role: "USER",
  hasAvatar: false,
  lastSeenOn: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock group
const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
  id: "group-123",
  name: "Test Group",
  description: "A test group",
  image: null,
  code: "1234",
  coins: 100,
  tripId: "trip-123",
  organizerId: "user-123",
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock coin transaction
const createMockCoinTransaction = (overrides: Partial<CoinTransaction> = {}): CoinTransaction => ({
  id: "transaction-123",
  groupId: "group-123",
  amount: 50,
  reason: "Test transaction",
  adminId: "user-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("coinTransactionRouter", () => {
  let mockDb: PrismaClient;
  let mockSupabase: SupabaseClient;
  let mockUser: User;
  let mockModeratorUser: User;
  let mockGroup: Group;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUser = createMockUser({ id: "user-123", role: "USER" });
    mockModeratorUser = createMockUser({ id: "moderator-123", role: "MODERATOR" });
    mockGroup = createMockGroup({ id: "group-123", tripId: "trip-123" });

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123" } }, error: null }),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-123", email: "test@example.com" } },
            error: null,
          }),
        },
      },
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: "https://signed-url.example.com/image.jpg" },
            error: null,
          }),
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } as unknown as SupabaseClient;

    // Setup mock database client
    mockDb = {
      coinTransaction: {
        count: vi.fn().mockResolvedValue(10),
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 500 }, _count: { id: 10 } }),
        groupBy: vi.fn().mockResolvedValue([{ adminId: "user-123", _sum: { amount: 500 }, _count: { id: 5 } }]),
        findMany: vi.fn().mockResolvedValue([createMockCoinTransaction()]),
      },
      group: {
        findUnique: vi.fn().mockResolvedValue(mockGroup),
        findMany: vi.fn().mockResolvedValue([mockGroup]),
      },
      tripParticipant: {
        findUnique: vi.fn().mockResolvedValue({
          id: "participant-123",
          userId: "user-123",
          tripId: "trip-123",
          groupId: "group-123",
        }),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(mockModeratorUser),
        findUnique: vi.fn().mockResolvedValue({ firstName: "Test", lastName: "Admin" }),
      },
    };
  });

  // Helper to create authenticated context
  const createAuthContext = (user: User, token = "test-token"): TRPCContext => ({
    db: mockDb,
    supabase: mockSupabase,
    headers: new Headers({ Authorization: `Bearer ${token}` }),
    accessToken: token,
    user: { id: user.authUserId || "auth-123" },
    dbUser: user,
  });

  describe("getStatistics (moderatorProcedure)", () => {
    it("should return transaction statistics for trip", async () => {
      (mockDb.coinTransaction.count as ReturnType<typeof vi.fn>).mockResolvedValue(10);
      (mockDb.coinTransaction.aggregate as unknown as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ _sum: { amount: 500 } }) // addedCoins
        .mockResolvedValueOnce({ _sum: { amount: -200 } }); // removedCoins

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getStatistics({ tripId: "trip-123" });

      expect(result.transactionCount).toBe(10);
      expect(result.addedCoins).toBe(500);
      expect(result.removedCoins).toBe(-200);
      expect(result.netBalance).toBe(300);
      expect(result.time).toBeInstanceOf(Date);
    });

    it("should handle zero transactions", async () => {
      (mockDb.coinTransaction.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (mockDb.coinTransaction.aggregate as unknown as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getStatistics({ tripId: "trip-123" });

      expect(result.transactionCount).toBe(0);
      expect(result.addedCoins).toBe(0);
      expect(result.removedCoins).toBe(0);
      expect(result.netBalance).toBe(0);
    });

    it("should filter by tripId", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.getStatistics({ tripId: "trip-123" });

       
      expect(mockDb.coinTransaction.count).toHaveBeenCalledWith({
        where: { group: { tripId: "trip-123" } },
      });
    });
  });

  describe("getMostActiveAdminStats (moderatorProcedure)", () => {
    it("should return most active admin stats", async () => {
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { adminId: "admin-1", _sum: { amount: 1000 }, _count: { id: 10 } },
      ]);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getMostActiveAdminStats({ tripId: "trip-123" });

      expect(result).toHaveLength(1);
      expect(result[0].adminId).toBe("admin-1");
      expect(result[0]._sum.amount).toBe(1000);
      expect(result[0]._count.id).toBe(10);
    });

    it("should return empty array when no transactions", async () => {
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getMostActiveAdminStats({ tripId: "trip-123" });

      expect(result).toEqual([]);
    });

    it("should limit to 1 result and order by amount desc", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.getMostActiveAdminStats({ tripId: "trip-123" });

       
      expect(mockDb.coinTransaction.groupBy).toHaveBeenCalledWith({
        by: ["adminId"],
        _sum: { amount: true },
        _count: { id: true },
        where: { group: { tripId: "trip-123" } },
        take: 1,
        orderBy: { _sum: { amount: "desc" } },
      });
    });
  });

  describe("getAll (moderatorProcedure)", () => {
    it("should return paginated transactions", async () => {
      const mockTransactions = [
        createMockCoinTransaction({ id: "tx-1", amount: 50 }),
        createMockCoinTransaction({ id: "tx-2", amount: -30 }),
      ];
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTransactions);
      (mockDb.coinTransaction.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({ tripId: "trip-123" });

      expect(result.transactions).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should respect pagination parameters", async () => {
      const mockTransactions = [createMockCoinTransaction({ id: "tx-1" })];
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockTransactions);
      (mockDb.coinTransaction.count as ReturnType<typeof vi.fn>).mockResolvedValue(5);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAll({
        tripId: "trip-123",
        pagination: { limit: 1, offset: 0 },
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.pagination.hasMore).toBe(true);
       
      expect(mockDb.coinTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
          skip: 0,
        })
      );
    });

    it("should use default pagination when not provided", async () => {
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockDb.coinTransaction.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.getAll({ tripId: "trip-123" });

       
      expect(mockDb.coinTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        })
      );
    });

    it("should order by createdAt desc", async () => {
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockDb.coinTransaction.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.getAll({ tripId: "trip-123" });

       
      expect(mockDb.coinTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });

  describe("getQuickStats (moderatorProcedure)", () => {
    it("should return quick stats for trip", async () => {
      (mockDb.coinTransaction.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _sum: { amount: 1000 },
        _count: { id: 10 },
      });
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { groupId: "group-123", _sum: { amount: 500 } },
      ]);
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ name: "Richest Group" });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getQuickStats({ tripId: "trip-123" });

      expect(result).not.toBeNull();
      expect(result?.totalCoins).toBe(1000);
      expect(result?.totalGroups).toBe(10);
      expect(result?.averageCoinsPerGroup).toBe(100);
      expect(result?.richestGroupName).toBe("Richest Group");
    });

    it("should return null when no transactions", async () => {
      (mockDb.coinTransaction.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _sum: { amount: null },
        _count: { id: 0 },
      });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getQuickStats({ tripId: "trip-123" });

      expect(result).toBeNull();
    });

    it("should return null when no richest group found", async () => {
      (mockDb.coinTransaction.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _sum: { amount: 1000 },
        _count: { id: 10 },
      });
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getQuickStats({ tripId: "trip-123" });

      expect(result).toBeNull();
    });

    it("should calculate average correctly", async () => {
      (mockDb.coinTransaction.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
        _sum: { amount: 500 },
        _count: { id: 4 },
      });
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { groupId: "group-123", _sum: { amount: 500 } },
      ]);
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ name: "Test Group" });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getQuickStats({ tripId: "trip-123" });

      expect(result?.averageCoinsPerGroup).toBe(125); // 500 / 4 = 125
    });
  });

  describe("getAdditionalInsights (moderatorProcedure)", () => {
    it("should return additional insights", async () => {
      const recentTransactions = [
        createMockCoinTransaction({ id: "tx-1", amount: 50 }),
        createMockCoinTransaction({ id: "tx-2", amount: -20 }),
      ];
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(recentTransactions);
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { adminId: "admin-1", _count: { id: 10 } },
      ]);
      (mockDb.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ firstName: "Test", lastName: "Admin" });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAdditionalInsights({ tripId: "trip-123" });

      expect(result).not.toBeNull();
      expect(result?.mostActiveAdmin.name).toBe("Test Admin");
      expect(result?.mostActiveAdmin.transactionCount).toBe(10);
      expect(result?.recentTransactions).toHaveLength(2);
    });

    it("should return null when no recent transactions", async () => {
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAdditionalInsights({ tripId: "trip-123" });

      expect(result).toBeNull();
    });

    it("should return null when no most active admin", async () => {
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([createMockCoinTransaction()]);
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAdditionalInsights({ tripId: "trip-123" });

      expect(result).toBeNull();
    });

    it("should return null when most active admin not found", async () => {
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([createMockCoinTransaction()]);
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { adminId: "admin-1", _count: { id: 10 } },
      ]);
      (mockDb.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAdditionalInsights({ tripId: "trip-123" });

      expect(result).toBeNull();
    });

    it("should limit recent transactions to 5", async () => {
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await caller.getAdditionalInsights({ tripId: "trip-123" });

       
      expect(mockDb.coinTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe("getCoinTransactions (protectedProcedure)", () => {
    it("should return transactions for trip participant", async () => {
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([createMockCoinTransaction()]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getCoinTransactions({ tripId: "trip-123" });

      expect(result).toHaveLength(1);
       
      expect(mockDb.coinTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { group: { tripId: "trip-123" } },
        })
      );
    });

    it("should filter by groupId when provided", async () => {
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockGroup);
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([createMockCoinTransaction()]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await caller.getCoinTransactions({ tripId: "trip-123", groupId: "group-123" });

       
      expect(mockDb.coinTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { groupId: "group-123", group: { tripId: "trip-123" } },
        })
      );
    });

    it("should throw FORBIDDEN when user is not trip participant", async () => {
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getCoinTransactions({ tripId: "trip-123" })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND when group not found", async () => {
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getCoinTransactions({ tripId: "trip-123", groupId: "non-existent" })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND when group belongs to different trip", async () => {
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockGroup({ id: "group-123", tripId: "different-trip" })
      );

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getCoinTransactions({ tripId: "trip-123", groupId: "group-123" })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND when group is deleted", async () => {
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });
      (mockDb.group.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        createMockGroup({ id: "group-123", isDeleted: true })
      );

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getCoinTransactions({ tripId: "trip-123", groupId: "group-123" })
      ).rejects.toThrow(ORPCError);
    });

    it("should use default limit of 50", async () => {
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await caller.getCoinTransactions({ tripId: "trip-123" });

       
      expect(mockDb.coinTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it("should include group and admin in response", async () => {
      const transaction = createMockCoinTransaction({
        group: { id: "group-123", name: "Test Group", coins: 100 },
        admin: { id: "admin-123", firstName: "Test", lastName: "Admin" },
      });
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([transaction]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getCoinTransactions({ tripId: "trip-123" });

      expect(result[0].group).toBeDefined();
      expect(result[0].admin).toBeDefined();
    });
  });

  describe("Input validation", () => {
    it("should validate tripId is required for getStatistics", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.getStatistics({})
      ).rejects.toThrow();
    });

    it("should validate pagination limit range for getAll", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getAll({
          tripId: "trip-123",
          pagination: { limit: 101, offset: 0 },
        })
      ).rejects.toThrow();
    });

    it("should validate pagination offset is non-negative for getAll", async () => {
      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getAll({
          tripId: "trip-123",
          pagination: { limit: 10, offset: -1 },
        })
      ).rejects.toThrow();
    });

    it("should validate limit range for getCoinTransactions", async () => {
      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getCoinTransactions({
          tripId: "trip-123",
          limit: 101,
        })
      ).rejects.toThrow();
    });
  });

  describe("formatUserFullName helper", () => {
    it("should format full name correctly", async () => {
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([createMockCoinTransaction()]);
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { adminId: "admin-1", _count: { id: 5 } },
      ]);
      (mockDb.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        firstName: "John",
        lastName: "Doe",
      });
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAdditionalInsights({ tripId: "trip-123" });

      expect(result?.mostActiveAdmin.name).toBe("John Doe");
    });

    it("should handle only first name", async () => {
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([createMockCoinTransaction()]);
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { adminId: "admin-1", _count: { id: 5 } },
      ]);
      (mockDb.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        firstName: "John",
        lastName: null,
      });
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAdditionalInsights({ tripId: "trip-123" });

      expect(result?.mostActiveAdmin.name).toBe("John");
    });

    it("should handle only last name", async () => {
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([createMockCoinTransaction()]);
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { adminId: "admin-1", _count: { id: 5 } },
      ]);
      (mockDb.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        firstName: null,
        lastName: "Doe",
      });
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAdditionalInsights({ tripId: "trip-123" });

      expect(result?.mostActiveAdmin.name).toBe("Doe");
    });

    it("should return Unknown user when no name", async () => {
      (mockDb.coinTransaction.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([createMockCoinTransaction()]);
      (mockDb.coinTransaction.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
        { adminId: "admin-1", _count: { id: 5 } },
      ]);
      (mockDb.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        firstName: null,
        lastName: null,
      });
      (mockDb.tripParticipant.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "participant-123",
        userId: "user-123",
        tripId: "trip-123",
        groupId: "group-123",
      });

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getAdditionalInsights({ tripId: "trip-123" });

      expect(result?.mostActiveAdmin.name).toBe("Unknown user");
    });
  });
});
