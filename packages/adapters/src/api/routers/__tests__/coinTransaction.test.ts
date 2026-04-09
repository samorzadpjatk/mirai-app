import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
    findUnique: mock(() => Promise.resolve(null)),
  },
  coinTransaction: {
    findMany: mock(() => Promise.resolve([])),
    count: mock(() => Promise.resolve(0)),
    aggregate: mock(() => Promise.resolve({})),
    groupBy: mock(() => Promise.resolve([])),
  },
  group: {
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
  },
  tripParticipant: {
    findUnique: mock(() => Promise.resolve(null)),
  },
});

const createMockSupabase = () => {
  const getUserMock = mock(() =>
    Promise.resolve({ data: { user: null }, error: null }),
  );
  const adminGetUserByIdMock = mock(() =>
    Promise.resolve({
      data: { user: { id: "auth-mod-1", banned_until: null } },
      error: null,
    }),
  );
  return {
    auth: {
      getUser: getUserMock,
      admin: {
        getUserById: adminGetUserByIdMock,
      },
    },
    storage: {
      from: () => ({
        createSignedUrl: mock().mockResolvedValue({
          data: { signedUrl: "https://example.com/signed" },
        }),
      }),
    },
  };
};

describe("[INTEGRATION] coinTransaction router", () => {
  let mockCtx: any;

  const setupModeratorMocks = () => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1" } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1" } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: "auth-mod-1", banned_until: null } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "mod-1",
      authUserId: "auth-mod-1",
      firstName: "Moderator",
      lastName: "User",
      role: "MODERATOR",
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "mod-1",
      authUserId: "auth-mod-1",
      firstName: "Moderator",
      lastName: "User",
      role: "MODERATOR",
    });
  };

  beforeEach(() => {
    mockCtx = {
      db: createMockDb(),
      supabase: createMockSupabase(),
      headers: new Headers(),
      accessToken: "test-token",
      dbUser: {
        id: "mod-1",
        authUserId: "auth-mod-1",
        firstName: "Moderator",
        lastName: "User",
        role: "MODERATOR" as const,
      },
    };
  });

  describe("getStatistics", () => {
    test("returns transaction statistics", async () => {
      setupModeratorMocks();
      mockCtx.db.coinTransaction.count.mockResolvedValueOnce(50);
      mockCtx.db.coinTransaction.aggregate.mockResolvedValueOnce({
        _sum: { amount: 5000 },
      });
      mockCtx.db.coinTransaction.aggregate.mockResolvedValueOnce({
        _sum: { amount: -500 },
      });
      const caller = createCaller(mockCtx);
      const result = await caller.coinTransaction.getStatistics({
        tripId: "trip-1",
      });
      expect(result.transactionCount).toBe(50);
      expect(result.addedCoins).toBe(5000);
      expect(result.removedCoins).toBe(-500);
      expect(result.netBalance).toBe(4500);
    });
  });

  describe("getMostActiveAdminStats", () => {
    test("returns most active admin", async () => {
      setupModeratorMocks();
      mockCtx.db.coinTransaction.groupBy.mockResolvedValueOnce([
        { adminId: "admin-1", _sum: { amount: 1000 }, _count: { id: 20 } },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.coinTransaction.getMostActiveAdminStats({
        tripId: "trip-1",
      });
      expect(result[0].adminId).toBe("admin-1");
    });
  });

  describe("getAll", () => {
    test("returns paginated transactions", async () => {
      setupModeratorMocks();
      mockCtx.db.coinTransaction.findMany.mockResolvedValueOnce([
        {
          id: "tx-1",
          amount: 100,
          group: { id: "group-1", name: "Team Alpha" },
          admin: { id: "mod-1", firstName: "Moderator", lastName: "User" },
        },
      ]);
      mockCtx.db.coinTransaction.count.mockResolvedValueOnce(1);
      const caller = createCaller(mockCtx);
      const result = await caller.coinTransaction.getAll({ tripId: "trip-1" });
      expect(result.transactions).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("getQuickStats", () => {
    test("returns quick stats", async () => {
      setupModeratorMocks();
      mockCtx.db.coinTransaction.aggregate.mockResolvedValueOnce({
        _sum: { amount: 10000 },
        _count: { id: 20 },
      });
      mockCtx.db.coinTransaction.groupBy.mockResolvedValueOnce([
        { groupId: "group-1", _sum: { amount: 5000 } },
      ]);
      mockCtx.db.group.findUnique.mockResolvedValueOnce({ name: "Rich Team" });
      const caller = createCaller(mockCtx);
      const result = await caller.coinTransaction.getQuickStats({
        tripId: "trip-1",
      });
      expect(result?.totalCoins).toBe(10000);
      expect(result?.richestGroupName).toBe("Rich Team");
    });

    test("returns null when no transactions", async () => {
      setupModeratorMocks();
      mockCtx.db.coinTransaction.aggregate.mockResolvedValueOnce({
        _sum: { amount: null },
        _count: { id: 0 },
      });
      const caller = createCaller(mockCtx);
      const result = await caller.coinTransaction.getQuickStats({
        tripId: "trip-1",
      });
      expect(result).toBeNull();
    });
  });

  describe("getAdditionalInsights", () => {
    test("returns insights", async () => {
      setupModeratorMocks();
      mockCtx.db.coinTransaction.findMany.mockResolvedValueOnce([
        { id: "tx-1", amount: 100, group: { name: "Team Alpha" } },
      ]);
      mockCtx.db.coinTransaction.groupBy.mockResolvedValueOnce([
        { adminId: "admin-1", _count: { id: 10 } },
      ]);
      mockCtx.db.user.findUnique.mockResolvedValueOnce({
        firstName: "Admin",
        lastName: "User",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.coinTransaction.getAdditionalInsights({
        tripId: "trip-1",
      });
      expect(result?.mostActiveAdmin.name).toBe("Admin User");
    });

    test("returns null when no transactions", async () => {
      setupModeratorMocks();
      mockCtx.db.coinTransaction.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.coinTransaction.getAdditionalInsights({
        tripId: "trip-1",
      });
      expect(result).toBeNull();
    });
  });

  describe("getCoinTransactions", () => {
    test("returns transactions for participant", async () => {
      setupModeratorMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        userId: "user-1",
      });
      mockCtx.db.coinTransaction.findMany.mockResolvedValueOnce([
        {
          id: "tx-1",
          amount: 100,
          group: { id: "group-1", name: "Team Alpha", coins: 100 },
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.coinTransaction.getCoinTransactions({
        tripId: "trip-1",
        limit: 50,
      });
      expect(result).toHaveLength(1);
    });

    test("throws FORBIDDEN when not a participant", async () => {
      setupModeratorMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.coinTransaction.getCoinTransactions({
          tripId: "trip-1",
          limit: 50,
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("returns transactions for specific group", async () => {
      setupModeratorMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        userId: "user-1",
      });
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
      });
      mockCtx.db.coinTransaction.findMany.mockResolvedValueOnce([
        {
          id: "tx-1",
          amount: 100,
          group: { id: "group-1", name: "Team Alpha", coins: 100 },
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.coinTransaction.getCoinTransactions({
        tripId: "trip-1",
        groupId: "group-1",
        limit: 50,
      });
      expect(result).toHaveLength(1);
    });

    test("throws NOT_FOUND when group not found", async () => {
      setupModeratorMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        userId: "user-1",
      });
      mockCtx.db.group.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.coinTransaction.getCoinTransactions({
          tripId: "trip-1",
          groupId: "nonexistent",
          limit: 50,
        }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
