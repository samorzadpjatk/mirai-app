import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  challenge: {
    findFirst: mock(() => Promise.resolve(null)),
    updateMany: mock(() => Promise.resolve({ count: 0 })),
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    count: mock(() => Promise.resolve(0)),
  },
  challengeSubmission: {
    findUnique: mock(() => Promise.resolve(null)),
    findFirst: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve({})),
    update: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    count: mock(() => Promise.resolve(0)),
  },
  tripParticipant: {
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
  },
  group: {
    update: mock(() => Promise.resolve({})),
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
  },
  coinTransaction: {
    create: mock(() => Promise.resolve({})),
  },
  activityFeed: {
    findFirst: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    findMany: mock(() => Promise.resolve([])),
  },
  submissionActivity: {
    findFirst: mock(() => Promise.resolve(null)),
  },
  trip: {
    findUnique: mock(() => Promise.resolve(null)),
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
      data: { user: { id: "auth-user-1", banned_until: null } },
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
          data: { signedUrl: "https://signed.url/image.jpg" },
          error: null,
        }),
      }),
    },
  };
};

describe("challengeSubmission router", () => {
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
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: `auth-${userId}`, banned_until: null } },
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
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER" as const,
      },
    };
  });

  describe("getByChallenge", () => {
    test("returns submissions for challenge", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        id: "participant-1",
      });
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        status: "ACTIVE",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
      });
      mockCtx.db.challenge.updateMany = mock().mockResolvedValueOnce({
        count: 0,
      });
      mockCtx.db.challengeSubmission.findMany.mockResolvedValueOnce([
        {
          id: "sub-1",
          status: "APPROVED",
          imageIds: ["img-1"],
          group: { id: "group-1", name: "Team Alpha" },
        },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.challengeSubmission.getByChallenge({
        challengeId: "challenge-1",
        tripId: "trip-1",
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("getMyForChallenge", () => {
    test("returns null when user has no group", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: null,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.challengeSubmission.getMyForChallenge({
        challengeId: "challenge-1",
        tripId: "trip-1",
      });
      expect(result).toBeNull();
    });

    test("returns submission when user has group", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: "group-1",
      });
      mockCtx.db.challengeSubmission.findUnique.mockResolvedValueOnce({
        id: "sub-1",
        status: "APPROVED",
        groupId: "group-1",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.challengeSubmission.getMyForChallenge({
        challengeId: "challenge-1",
        tripId: "trip-1",
      });
      expect(result?.id).toBe("sub-1");
    });
  });

  describe("create", () => {
    test("creates submission successfully", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: "group-1",
      });
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        name: "Test Challenge",
        status: "ACTIVE",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        autoApprove: false,
        isRecurring: false,
      });
      mockCtx.db.challenge.findMany.mockResolvedValueOnce([]);
      mockCtx.db.challenge.findMany.mockResolvedValueOnce([]);
      mockCtx.db.challenge.updateMany.mockResolvedValueOnce({ count: 0 });
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        name: "Test Challenge",
        status: "ACTIVE",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        autoApprove: false,
        startTime: new Date(),
        endTime: new Date(Date.now() + 86400000),
        basePoints: 100,
        firstPlacePoints: 50,
        secondPlacePoints: 30,
        thirdPlacePoints: 20,
      });
      mockCtx.db.challengeSubmission.findUnique.mockResolvedValueOnce(null);
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            challengeSubmission: {
              create: mock().mockResolvedValueOnce({
                id: "new-sub",
                status: "PENDING",
              }),
            },
            group: { update: mock() },
            coinTransaction: { create: mock() },
            activityFeed: { findMany: mock().mockResolvedValue([]) },
            groupRankingSnapshot: { findMany: mock().mockResolvedValue([]) },
          });
        },
      );
      mockCtx.db.challengeSubmission.findUnique.mockResolvedValueOnce({
        id: "new-sub",
        status: "PENDING",
        group: { id: "group-1", name: "Team Alpha" },
      });
      const caller = createCaller(mockCtx);
      const result = await caller.challengeSubmission.create({
        tripId: "trip-1",
        challengeId: "challenge-1",
        imageIds: ["img-1"],
      });
      expect(result.status).toBe("PENDING");
    });

    test("throws FORBIDDEN when user not in group", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique = mock().mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: null,
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeSubmission.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["img-1"],
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws CONFLICT when submission already exists", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique = mock().mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: "group-1",
      });
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        status: "ACTIVE",
        submissionType: "IMAGE",
      });
      mockCtx.db.challenge.updateMany = mock().mockResolvedValue({ count: 0 });
      mockCtx.db.challengeSubmission.findUnique.mockResolvedValueOnce({
        id: "existing-sub",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeSubmission.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["img-1"],
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws FORBIDDEN when challenge not active", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique = mock().mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: "group-1",
      });
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        status: "COMPLETED",
        submissionType: "IMAGE",
      });
      mockCtx.db.challenge.updateMany = mock().mockResolvedValue({ count: 0 });
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeSubmission.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["img-1"],
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("review", () => {
    test("rejects submission without reason", async () => {
      setupModeratorMocks();
      mockCtx.db.challengeSubmission.findUnique.mockResolvedValueOnce({
        id: "sub-1",
        status: "PENDING",
        challenge: {
          id: "challenge-1",
          tripId: "trip-1",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
        },
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeSubmission.review({
          id: "sub-1",
          status: "REJECTED",
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws NOT_FOUND when submission not found", async () => {
      setupModeratorMocks();
      mockCtx.db.challengeSubmission.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeSubmission.review({
          id: "nonexistent",
          status: "APPROVED",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("deleteMine", () => {
    test("deletes own pending submission", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique = mock().mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: "group-1",
      });
      mockCtx.db.challengeSubmission.findFirst.mockResolvedValueOnce({
        id: "sub-1",
        status: "PENDING",
      });
      mockCtx.db.challengeSubmission.delete.mockResolvedValueOnce({
        id: "sub-1",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.challengeSubmission.deleteMine({
        id: "sub-1",
        tripId: "trip-1",
      });
      expect(result.success).toBe(true);
    });

    test("throws FORBIDDEN when submission already approved", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique = mock().mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        groupId: "group-1",
      });
      mockCtx.db.challengeSubmission.findFirst.mockResolvedValueOnce({
        id: "sub-1",
        status: "APPROVED",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeSubmission.deleteMine({
          id: "sub-1",
          tripId: "trip-1",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
