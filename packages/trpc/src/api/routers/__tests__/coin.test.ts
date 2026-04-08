import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  group: {
    findUnique: mock(() => Promise.resolve(null)),
    update: mock(() => Promise.resolve({})),
    findMany: mock(() => Promise.resolve([])),
  },
  coinTransaction: {
    create: mock(() => Promise.resolve({})),
    findMany: mock(() => Promise.resolve([])),
    aggregate: mock(() => Promise.resolve({})),
    groupBy: mock(() => Promise.resolve([])),
    count: mock(() => Promise.resolve(0)),
  },
  activityFeed: {
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
  },
  groupRankingSnapshot: {
    findMany: mock(() => Promise.resolve([])),
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

describe("coin router", () => {
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

  describe("addCoins", () => {
    test("adds coins to group successfully", async () => {
      setupModeratorMocks();
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            groupRankingSnapshot: { findMany: mock().mockResolvedValue([]) },
            group: {
              findMany: mock().mockResolvedValue([]),
              findUnique: mock().mockResolvedValueOnce({
                id: "group-1",
                tripId: "trip-1",
                isDeleted: false,
              }),
              update: mock().mockResolvedValueOnce({
                id: "group-1",
                coins: 100,
              }),
            },
            coinTransaction: {
              create: mock().mockResolvedValueOnce({
                id: "tx-1",
                amount: 100,
                group: { id: "group-1", name: "Team Alpha", coins: 100 },
                admin: {
                  id: "mod-1",
                  firstName: "Moderator",
                  lastName: "User",
                },
              }),
            },
            activityFeed: { findMany: mock().mockResolvedValue([]) },
          });
        },
      );
      const caller = createCaller(mockCtx);
      const result = await caller.coin.addCoins({
        tripId: "trip-1",
        groupId: "group-1",
        amount: 100,
        reason: "Challenge reward",
      });
      expect(result.amount).toBe(100);
    });

    test("throws NOT_FOUND when group not in trip", async () => {
      setupModeratorMocks();
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            groupRankingSnapshot: { findMany: mock().mockResolvedValue([]) },
            group: {
              findUnique: mock().mockResolvedValueOnce({
                id: "group-1",
                tripId: "other-trip",
                isDeleted: false,
              }),
            },
            activityFeed: { findMany: mock().mockResolvedValue([]) },
          });
        },
      );
      const caller = createCaller(mockCtx);
      await expect(
        caller.coin.addCoins({
          tripId: "trip-1",
          groupId: "group-1",
          amount: 100,
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws NOT_FOUND when group is deleted", async () => {
      setupModeratorMocks();
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            groupRankingSnapshot: { findMany: mock().mockResolvedValue([]) },
            group: {
              findUnique: mock().mockResolvedValueOnce({
                id: "group-1",
                tripId: "trip-1",
                isDeleted: true,
              }),
            },
            activityFeed: { findMany: mock().mockResolvedValue([]) },
          });
        },
      );
      const caller = createCaller(mockCtx);
      await expect(
        caller.coin.addCoins({
          tripId: "trip-1",
          groupId: "group-1",
          amount: 100,
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("removeCoins", () => {
    test("removes coins from group successfully", async () => {
      setupModeratorMocks();
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            groupRankingSnapshot: { findMany: mock().mockResolvedValue([]) },
            group: {
              findMany: mock().mockResolvedValue([]),
              findUnique: mock().mockResolvedValueOnce({
                id: "group-1",
                tripId: "trip-1",
                isDeleted: false,
                coins: 200,
              }),
              update: mock().mockResolvedValueOnce({
                id: "group-1",
                coins: 100,
              }),
            },
            coinTransaction: {
              create: mock().mockResolvedValueOnce({
                id: "tx-2",
                amount: -100,
                group: { id: "group-1", name: "Team Alpha", coins: 100 },
              }),
            },
            activityFeed: { findMany: mock().mockResolvedValue([]) },
          });
        },
      );
      const caller = createCaller(mockCtx);
      const result = await caller.coin.removeCoins({
        tripId: "trip-1",
        groupId: "group-1",
        amount: 100,
        reason: "Penalty",
      });
      expect(result.amount).toBe(-100);
    });

    test("throws BAD_REQUEST when not enough coins", async () => {
      setupModeratorMocks();
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            groupRankingSnapshot: { findMany: mock().mockResolvedValue([]) },
            group: {
              findUnique: mock().mockResolvedValueOnce({
                id: "group-1",
                tripId: "trip-1",
                isDeleted: false,
                coins: 50,
              }),
            },
            activityFeed: { findMany: mock().mockResolvedValue([]) },
          });
        },
      );
      const caller = createCaller(mockCtx);
      await expect(
        caller.coin.removeCoins({
          tripId: "trip-1",
          groupId: "group-1",
          amount: 100,
        }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
