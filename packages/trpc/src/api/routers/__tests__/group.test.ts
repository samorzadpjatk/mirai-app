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
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    count: mock(() => Promise.resolve({ count: 0 })),
  },
  tripParticipant: {
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    upsert: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    updateMany: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
  },
  groupJoinRequest: {
    findUnique: mock(() => Promise.resolve(null)),
    findFirst: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    deleteMany: mock(() => Promise.resolve({})),
  },
  coinTransaction: {
    create: mock(() => Promise.resolve({})),
    findMany: mock(() => Promise.resolve([])),
  },
  trip: {
    findUnique: mock(() => Promise.resolve(null)),
  },
  challengeSubmission: {
    findMany: mock(() => Promise.resolve([])),
  },
  activityFeed: {
    findMany: mock(() => Promise.resolve([])),
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
      data: { user: { id: "auth-admin-1", banned_until: null } },
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
          data: { signedUrl: "https://signed.url" },
          error: null,
        }),
      }),
    },
  };
};

describe("group router", () => {
  let mockCtx: any;

  const setupUserMocks = (userId = "user-1", role = "USER") => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}` } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: userId,
      authUserId: `auth-${userId}`,
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
  };

  const setupAdminMocks = () => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1" } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1" } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: "auth-admin-1", banned_until: null } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "admin-1",
      authUserId: "auth-admin-1",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    });
  };

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
      firstName: "Mod",
      lastName: "User",
      role: "MODERATOR",
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "mod-1",
      authUserId: "auth-mod-1",
      firstName: "Mod",
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
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER" as const,
      },
    };
  });

  describe("getAllNames", () => {
    test("returns all group names for trip", async () => {
      setupModeratorMocks();
      mockCtx.db.group.findMany.mockResolvedValueOnce([
        { id: "group-1", name: "Team Alpha" },
        { id: "group-2", name: "Team Beta" },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.group.getAllNames({ tripId: "trip-1" });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Team Alpha");
    });
  });

  describe("getMy", () => {
    test("returns null when user has no group", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: null,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.group.getMy({ tripId: "trip-1" });
      expect(result).toBeNull();
    });

    test("returns group with participants when user has group", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: "group-1",
      });
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        name: "Team Alpha",
        isDeleted: false,
        organizer: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
          authUserId: "auth-1",
        },
        participants: [
          {
            user: {
              id: "user-1",
              firstName: "John",
              lastName: "Doe",
              authUserId: "auth-1",
            },
          },
        ],
        coinTransactions: [],
      });
      const caller = createCaller(mockCtx);
      const result = await caller.group.getMy({ tripId: "trip-1" });
      expect(result?.name).toBe("Team Alpha");
    });

    test("returns null when group is deleted", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: "group-1",
      });
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        name: "Deleted Team",
        isDeleted: true,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.group.getMy({ tripId: "trip-1" });
      expect(result).toBeNull();
    });
  });

  describe("getAll", () => {
    test("returns paginated groups", async () => {
      setupUserMocks();
      mockCtx.db.group.findMany.mockResolvedValueOnce([
        {
          id: "group-1",
          name: "Team Alpha",
          isDeleted: false,
          organizer: {
            id: "user-1",
            firstName: "John",
            lastName: "Doe",
            authUserId: "auth-1",
          },
          participants: [],
          coinTransactions: [],
        },
      ]);
      mockCtx.db.group.count.mockResolvedValueOnce(1);
      const caller = createCaller(mockCtx);
      const result = await caller.group.getAll({ tripId: "trip-1" });
      expect(result.groups).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("getById", () => {
    test("throws NOT_FOUND when group not found", async () => {
      setupUserMocks();
      mockCtx.db.group.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(caller.group.getById({ id: "nonexistent" })).rejects.toThrow(
        TRPCError,
      );
    });

    test("returns group with details when found", async () => {
      setupUserMocks();
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        name: "Team Alpha",
        isDeleted: false,
        organizer: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
          authUserId: "auth-1",
        },
        participants: [],
        trip: { id: "trip-1", name: "Summer Trip" },
        challengeSubmissions: [],
        _count: { participants: 0 },
      });
      const caller = createCaller(mockCtx);
      const result = await caller.group.getById({ id: "group-1" });
      expect(result.name).toBe("Team Alpha");
    });
  });

  describe("create", () => {
    test("creates group successfully", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique = mock().mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.group.create.mockResolvedValueOnce({
        id: "group-new",
        name: "New Team",
        organizer: {
          id: "user-1",
          firstName: "John",
          lastName: "Doe",
          authUserId: "auth-1",
        },
      });
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            tripParticipant: { upsert: mock(), deleteMany: mock() },
            groupJoinRequest: { deleteMany: mock() },
          });
        },
      );
      const caller = createCaller(mockCtx);
      const result = await caller.group.create({
        tripId: "trip-1",
        name: "New Team",
      });
      expect(result.name).toBe("New Team");
    });
  });

  describe("delete", () => {
    test("admin can delete group", async () => {
      setupAdminMocks();
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        isDeleted: false,
      });
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            tripParticipant: { updateMany: mock() },
            groupJoinRequest: { deleteMany: mock() },
            group: { update: mock() },
          });
        },
      );
      const caller = createCaller(mockCtx);
      const result = await caller.group.delete({ id: "group-1" });
      expect(result.success).toBe(true);
    });

    test("throws NOT_FOUND when group already deleted", async () => {
      setupAdminMocks();
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        isDeleted: true,
      });
      const caller = createCaller(mockCtx);
      await expect(caller.group.delete({ id: "group-1" })).rejects.toThrow(
        TRPCError,
      );
    });
  });

  describe("join", () => {
    test("admin can join group", async () => {
      setupAdminMocks();
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
        participants: [],
      });
      mockCtx.db.$transaction = mock().mockResolvedValueOnce([
        {
          userId: "admin-1",
          groupId: "group-1",
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.group.join({
        id: "group-1",
        tripId: "trip-1",
      });
      expect(result.userId).toBe("admin-1");
    });

    test("throws CONFLICT when already a member", async () => {
      setupAdminMocks();
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
        participants: [{ userId: "admin-1" }],
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.group.join({ id: "group-1", tripId: "trip-1" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("requestToJoin", () => {
    test("creates join request when user has no group", async () => {
      setupUserMocks();
      // First call for ensureTripNotEndedByGroupId, second for procedure
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
        organizerId: "other-user",
      });
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
        organizerId: "other-user",
      });
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: null,
      });
      mockCtx.db.groupJoinRequest.findUnique.mockResolvedValueOnce(null);
      mockCtx.db.groupJoinRequest.create.mockResolvedValueOnce({
        groupId: "group-1",
        tripId: "trip-1",
        userId: "user-1",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.group.requestToJoin({ groupId: "group-1" });
      expect(result.groupId).toBe("group-1");
    });

    test("throws BAD_REQUEST when already in a group", async () => {
      setupUserMocks();
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
        organizerId: "other-user",
      });
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
        organizerId: "other-user",
      });
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: "other-group",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.group.requestToJoin({ groupId: "group-1" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("leaveMyGroup", () => {
    test("organizer cannot leave without reassigning", async () => {
      setupUserMocks();
      // First call for ensureTripNotEndedByGroupId, second for procedure
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
        organizerId: "user-1",
      });
      mockCtx.db.group.findUnique.mockResolvedValueOnce({
        id: "group-1",
        tripId: "trip-1",
        isDeleted: false,
        organizerId: "user-1",
      });
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: "group-1",
      });
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            tripParticipant: {
              update: mock(),
              findMany: mock().mockResolvedValueOnce([]),
            },
            groupJoinRequest: { deleteMany: mock() },
            group: { update: mock() },
            groupRankingSnapshot: { findMany: mock().mockResolvedValue([]) },
          });
        },
      );
      const caller = createCaller(mockCtx);
      const result = await caller.group.leaveMyGroup({ groupId: "group-1" });
      expect(result.left).toBe(true);
      expect(result.groupDeleted).toBe(true);
    });
  });

  describe("addCoins", () => {
    test("moderator can add coins to group", async () => {
      setupModeratorMocks();
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            challengeSubmission: { findMany: mock().mockResolvedValue([]) },
            group: {
              findUnique: mock().mockResolvedValueOnce({
                id: "group-1",
                tripId: "trip-1",
                isDeleted: false,
              }),
              update: mock(),
              findMany: mock().mockResolvedValue([]),
            },
            coinTransaction: {
              create: mock().mockResolvedValueOnce({ id: "tx-1", amount: 100 }),
            },
            activityFeed: { findMany: mock().mockResolvedValue([]) },
            groupRankingSnapshot: { findMany: mock().mockResolvedValue([]) },
          });
        },
      );
      const caller = createCaller(mockCtx);
      const result = await caller.group.addCoins({
        groupId: "group-1",
        amount: 100,
        tripId: "trip-1",
      });
      expect(result.amount).toBe(100);
    });
  });

  describe("ranking", () => {
    test("returns groups ordered by coins", async () => {
      setupUserMocks();
      mockCtx.db.group.findMany.mockResolvedValueOnce([
        {
          id: "group-1",
          name: "Team Alpha",
          coins: 500,
          organizer: {
            id: "user-1",
            firstName: "John",
            lastName: "Doe",
            authUserId: "auth-1",
          },
          participants: [],
          coinTransactions: [],
        },
        {
          id: "group-2",
          name: "Team Beta",
          coins: 300,
          organizer: {
            id: "user-2",
            firstName: "Jane",
            lastName: "Doe",
            authUserId: "auth-2",
          },
          participants: [],
          coinTransactions: [],
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.group.ranking({ tripId: "trip-1" });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].coins).toBe(500);
    });
  });
});
