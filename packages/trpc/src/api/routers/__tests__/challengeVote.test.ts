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
    update: mock(() => Promise.resolve({})),
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    count: mock(() => Promise.resolve(0)),
  },
  challengeSubmission: {
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
    update: mock(() => Promise.resolve({})),
    create: mock(() => Promise.resolve({})),
    delete: mock(() => Promise.resolve({})),
    count: mock(() => Promise.resolve(0)),
  },
  challengeVote: {
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({})),
    createMany: mock(() => Promise.resolve({ count: 0 })),
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
    findFirst: mock(() => Promise.resolve(null)),
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
  },
  activityFeed: {
    create: mock(() => Promise.resolve({})),
    findMany: mock(() => Promise.resolve([])),
    findFirst: mock(() => Promise.resolve(null)),
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
          data: { signedUrl: "https://example.com/signed.jpg" },
          error: null,
        }),
      }),
    },
  };
};

describe("challengeVote router", () => {
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

  describe("getMyByChallenge", () => {
    test("returns user's votes for challenge", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        id: "participant-1",
      });
      mockCtx.db.challengeVote.findMany.mockResolvedValueOnce([
        { id: "vote-1", votePosition: 1, votePoints: 10 },
        { id: "vote-2", votePosition: 2, votePoints: 5 },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.challengeVote.getMyByChallenge({
        challengeId: "challenge-1",
        tripId: "trip-1",
      });
      expect(result).toHaveLength(2);
    });
  });

  describe("getByChallenge", () => {
    test("returns all votes for challenge (moderator)", async () => {
      setupUserMocks("mod-1", "MODERATOR");
      mockCtx.db.challengeVote.findMany.mockResolvedValueOnce([
        { id: "vote-1", votePosition: 1 },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.challengeVote.getByChallenge({
        challengeId: "challenge-1",
      });
      expect(result).toHaveLength(1);
    });
  });

  describe("submitVotes", () => {
    test("throws CONFLICT when votes already submitted", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        id: "participant-1",
        groupId: "group-1",
      });
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        status: "VOTING_PHASE",
        scoringCategory: "PEER_VOTING",
      });
      mockCtx.db.challengeSubmission.findMany.mockResolvedValueOnce([
        { id: "sub-1", groupId: "group-2" },
      ]);
      mockCtx.db.challengeVote.findMany.mockResolvedValueOnce([
        { votePosition: 1 },
      ]);
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeVote.submitVotes({
          tripId: "trip-1",
          challengeId: "challenge-1",
          votes: [{ submissionId: "sub-1", votePosition: 1, votePoints: 10 }],
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws FORBIDDEN when voting for own group", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        id: "participant-1",
        groupId: "group-1",
      });
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        status: "VOTING_PHASE",
        scoringCategory: "PEER_VOTING",
      });
      mockCtx.db.challengeSubmission.findMany.mockResolvedValueOnce([
        { id: "sub-1", groupId: "group-1" },
      ]);
      mockCtx.db.challengeVote.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeVote.submitVotes({
          tripId: "trip-1",
          challengeId: "challenge-1",
          votes: [{ submissionId: "sub-1", votePosition: 1, votePoints: 10 }],
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws BAD_REQUEST for duplicate submission votes", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        id: "participant-1",
        groupId: "group-1",
      });
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        status: "VOTING_PHASE",
        scoringCategory: "PEER_VOTING",
      });
      mockCtx.db.challengeSubmission.findMany.mockResolvedValueOnce([
        { id: "sub-1", groupId: "group-2" },
        { id: "sub-2", groupId: "group-3" },
      ]);
      mockCtx.db.challengeVote.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeVote.submitVotes({
          tripId: "trip-1",
          challengeId: "challenge-1",
          votes: [
            { submissionId: "sub-1", votePosition: 1, votePoints: 10 },
            { submissionId: "sub-1", votePosition: 2, votePoints: 5 },
          ],
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("submitVote", () => {
    test("throws BAD_REQUEST when voting phase not active", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        id: "participant-1",
        groupId: "group-1",
      });
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        status: "ACTIVE",
        scoringCategory: "PEER_VOTING",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeVote.submitVote({
          tripId: "trip-1",
          challengeId: "challenge-1",
          submissionId: "sub-1",
          votePosition: 1,
          votePoints: 10,
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws BAD_REQUEST for invalid submission", async () => {
      setupUserMocks();
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        id: "participant-1",
        groupId: "group-1",
      });
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        status: "VOTING_PHASE",
        scoringCategory: "PEER_VOTING",
      });
      mockCtx.db.challengeSubmission.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeVote.submitVote({
          tripId: "trip-1",
          challengeId: "challenge-1",
          submissionId: "invalid-sub",
          votePosition: 1,
          votePoints: 10,
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getJudgedStaffProgress", () => {
    test("returns voting progress for judged staff challenge", async () => {
      setupAdminMocks();
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        tripId: "trip-1",
        status: "ACTIVE",
        scoringCategory: "JUDGED_STAFF",
      });
      mockCtx.db.challengeSubmission.count.mockResolvedValueOnce(3);
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        { id: "admin-1" },
        { id: "admin-2" },
      ]);
      mockCtx.db.challengeVote.findMany.mockResolvedValueOnce([
        { voterId: "admin-1", votePosition: 1 },
        { voterId: "admin-1", votePosition: 2 },
        { voterId: "admin-1", votePosition: 3 },
        { voterId: "admin-2", votePosition: 1 },
        { voterId: "admin-2", votePosition: 2 },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.challengeVote.getJudgedStaffProgress({
        challengeId: "challenge-1",
        tripId: "trip-1",
      });
      expect(result.requiredPositions).toBe(3);
      expect(result.votedAdmins).toBe(1);
      expect(result.pendingAdmins).toBe(1);
    });

    test("throws BAD_REQUEST for non-judged staff challenge", async () => {
      setupAdminMocks();
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        status: "ACTIVE",
        scoringCategory: "SPEED",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.challengeVote.getJudgedStaffProgress({
          challengeId: "challenge-1",
          tripId: "trip-1",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });
});
