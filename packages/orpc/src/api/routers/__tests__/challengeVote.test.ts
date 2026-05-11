/* eslint-disable @typescript-eslint/no-unsafe-call */
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ORPCError } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import { challengeVoteRouter } from "../../routers/challengeVote";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { PrismaClient, User, Challenge, ChallengeSubmission, ChallengeVote, TripParticipant } from "@mirai-app/db";

// Mock the utility modules
vi.mock("../../../utils/activityFeed", () => ({
  createChallengeCompletionWithWinnersById: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../utils/tripGuards", () => ({
  ensureTripNotEnded: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@mirai-app/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: "user-123", email: "test@example.com" },
    dbUser: {
      id: "user-123",
      authUserId: "auth-123",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      hasAvatar: false,
        lastSeenOn: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    requireModerator: vi.fn().mockResolvedValue({
      user: { id: "moderator-123", email: "moderator@example.com" },
      dbUser: {
        id: "moderator-123",
        authUserId: "moderator-123",
        firstName: "Test",
        lastName: "Moderator",
        role: "MODERATOR",
        hasAvatar: false,
        lastSeenOn: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
    requireAdmin: vi.fn().mockResolvedValue({
      user: { id: "admin-123", email: "admin@example.com" },
      dbUser: {
        id: "admin-123",
        authUserId: "admin-123",
        firstName: "Test",
        lastName: "Admin",
        role: "ADMIN",
        hasAvatar: false,
        lastSeenOn: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  })
);

const createCaller = (ctx: TRPCContext) => createRouterClient(challengeVoteRouter, { context: ctx });

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

// Helper to create mock challenge
const createMockChallenge = (overrides: Partial<Challenge> = {}): Challenge => ({
  id: "challenge-123",
  tripId: "trip-123",
  title: "Test Challenge",
  description: "A test challenge",
  image: null,
  points: 100,
  maxSubmissions: 1,
  scoringCategory: "PEER_VOTING",
  status: "VOTING_PHASE",
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  createdById: "admin-123",
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock submission
const createMockSubmission = (overrides: Partial<ChallengeSubmission> = {}): ChallengeSubmission => ({
  id: "submission-123",
  challengeId: "challenge-123",
  groupId: "group-123",
  status: "PENDING",
  content: "Test submission",
  submittedById: "user-123",
  voteCount: 0,
  voteScore: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create mock vote
const createMockVote = (overrides: Partial<ChallengeVote> = {}): ChallengeVote => ({
  id: "vote-123",
  challengeId: "challenge-123",
  submissionId: "submission-123",
  voterId: "participant-123",
  votePosition: 1,
  votePoints: 3,
  normalizedWeight: 1.0,
  votedAt: new Date(),
  ...overrides,
});

// Helper to create mock trip participant
const createMockParticipant = (overrides: Partial<TripParticipant> = {}): TripParticipant => ({
  id: "participant-123",
  userId: "user-123",
  tripId: "trip-123",
  groupId: "group-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("challengeVoteRouter", () => {
  let mockDb: PrismaClient;
  let mockSupabase: SupabaseClient;
  let mockUser: User;
  let mockModeratorUser: User;
  let mockAdminUser: User;
  let mockChallenge: Challenge;
  let mockSubmission: ChallengeSubmission;
  let mockVote: ChallengeVote;
  let mockParticipant: TripParticipant;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUser = createMockUser({ id: "user-123", role: "USER" });
    mockModeratorUser = createMockUser({ id: "moderator-123", role: "MODERATOR" });
    mockAdminUser = createMockUser({ id: "admin-123", role: "ADMIN" });
    mockChallenge = createMockChallenge({ id: "challenge-123", tripId: "trip-123" });
    mockSubmission = createMockSubmission({ id: "submission-123", challengeId: "challenge-123" });
    mockVote = createMockVote({ id: "vote-123", challengeId: "challenge-123" });
    mockParticipant = createMockParticipant({ id: "participant-123", userId: "user-123", tripId: "trip-123" });

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
      challenge: {
        findFirst: vi.fn().mockResolvedValue(mockChallenge),
        findUnique: vi.fn().mockResolvedValue(mockChallenge),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      challengeSubmission: {
        findMany: vi.fn().mockResolvedValue([mockSubmission]),
        findFirst: vi.fn().mockResolvedValue(mockSubmission),
        findUnique: vi.fn().mockResolvedValue(mockSubmission),
        count: vi.fn().mockResolvedValue(3),
        update: vi.fn().mockResolvedValue(mockSubmission),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      challengeVote: {
        findMany: vi.fn().mockResolvedValue([mockVote]),
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(mockVote),
        create: vi.fn().mockResolvedValue(mockVote),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        count: vi.fn().mockResolvedValue(5),
      },
      tripParticipant: {
        findUnique: vi.fn().mockResolvedValue(mockParticipant),
        findFirst: vi.fn().mockResolvedValue(mockParticipant),
        findMany: vi.fn().mockResolvedValue([mockParticipant]),
        count: vi.fn().mockResolvedValue(1),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(mockUser),
        findFirst: vi.fn().mockResolvedValue(mockUser),
        findMany: vi.fn().mockResolvedValue([mockUser]),
      },
      trip: {
        findUnique: vi.fn().mockResolvedValue({
          id: "trip-123",
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }),
      },
      $transaction: vi.fn(async (callback: unknown) => {
        if (typeof callback === "function") {
          return await (callback as (db: PrismaClient) => Promise<unknown>)(mockDb);
        }
        return Promise.all(callback as unknown[]);
      }),
    } as unknown as PrismaClient;
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

  describe("getMyByChallenge", () => {
    it("should return user's votes for a challenge", async () => {
      const mockVotes = [
        createMockVote({ id: "vote-1", votePosition: 1, votePoints: 3 }),
        createMockVote({ id: "vote-2", votePosition: 2, votePoints: 2 }),
      ];
      mockDb.challengeVote.findMany.mockResolvedValue(mockVotes);
      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMyByChallenge({
        challengeId: "challenge-123",
        tripId: "trip-123",
      });

      expect(result).toHaveLength(2);
      expect(result[0].votePosition).toBe(1);
      expect(result[1].votePosition).toBe(2);
    });

    it("should throw FORBIDDEN when user is not a trip participant", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getMyByChallenge({
          challengeId: "challenge-123",
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should return empty array when user has no votes", async () => {
      mockDb.challengeVote.findMany.mockResolvedValue([]);
      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.getMyByChallenge({
        challengeId: "challenge-123",
        tripId: "trip-123",
      });

      expect(result).toEqual([]);
    });
  });

  describe("getByChallenge", () => {
    it("should return all votes for a challenge as moderator", async () => {
      const mockVotes = [
        createMockVote({ id: "vote-1", voterId: "participant-1" }),
        createMockVote({ id: "vote-2", voterId: "participant-2" }),
      ];
      mockDb.challengeVote.findMany.mockResolvedValue(mockVotes);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getByChallenge({
        challengeId: "challenge-123",
      });

      expect(result).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.challengeVote.findMany).toHaveBeenCalledWith({
        where: { challengeId: "challenge-123" },
        select: expect.any(Object),
        orderBy: [{ voterId: "asc" }, { votePosition: "asc" }],
      });
    });

    it("should return votes ordered by voter and position", async () => {
      const mockVotes = [
        createMockVote({ id: "vote-1", voterId: "participant-1", votePosition: 1 }),
        createMockVote({ id: "vote-2", voterId: "participant-1", votePosition: 2 }),
        createMockVote({ id: "vote-3", voterId: "participant-2", votePosition: 1 }),
      ];
      mockDb.challengeVote.findMany.mockResolvedValue(mockVotes);

      const ctx = createAuthContext(mockModeratorUser);
      const caller = createCaller(ctx);

      const result = await caller.getByChallenge({
        challengeId: "challenge-123",
      });

      expect(result).toHaveLength(3);
      expect(result[0].voterId).toBe("participant-1");
      expect(result[0].votePosition).toBe(1);
    });
  });

  describe("getJudgedStaffProgress", () => {
    it("should return voting progress for judged staff challenge", async () => {
      const judgedChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "JUDGED_STAFF",
        status: "ACTIVE",
        endTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      });
      mockDb.challenge.findFirst.mockResolvedValue(judgedChallenge);
      mockDb.challengeSubmission.count.mockResolvedValue(5);
      mockDb.tripParticipant.findMany.mockResolvedValue([
        createMockParticipant({ id: "admin-participant-1", userId: "admin-1" }),
        createMockParticipant({ id: "admin-participant-2", userId: "admin-2" }),
      ]);
      mockDb.challengeVote.findMany.mockResolvedValue([
        createMockVote({ voterId: "admin-participant-1", votePosition: 1 }),
        createMockVote({ voterId: "admin-participant-1", votePosition: 2 }),
        createMockVote({ voterId: "admin-participant-1", votePosition: 3 }),
      ]);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.getJudgedStaffProgress({
        challengeId: "challenge-123",
        tripId: "trip-123",
      });

      expect(result.challengeStatus).toBe("ACTIVE");
      expect(result.requiredPositions).toBe(3);
      expect(result.totalAdmins).toBe(2);
      expect(result.votedAdmins).toBe(1);
    });

    it("should throw BAD_REQUEST for non-judged staff challenges", async () => {
      const peerVotingChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "PEER_VOTING",
      });
      mockDb.challenge.findFirst.mockResolvedValue(peerVotingChallenge);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.getJudgedStaffProgress({
          challengeId: "challenge-123",
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("forceEndJudgedStaffVoting", () => {
    it("should force end voting for judged staff challenge", async () => {
      const judgedChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "JUDGED_STAFF",
        status: "ACTIVE",
        endTime: new Date(Date.now() - 60 * 60 * 1000),
      });
      mockDb.challenge.findFirst.mockResolvedValue(judgedChallenge);
      mockDb.$transaction.mockImplementation(async (fn: unknown) => {
        if (typeof fn === "function") {
          return await (fn as (db: PrismaClient) => Promise<unknown>)(mockDb);
        }
        return Promise.all(fn as unknown[]);
      });
      mockDb.challenge.updateMany.mockResolvedValue({ count: 1 });

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.forceEndJudgedStaffVoting({
        challengeId: "challenge-123",
        tripId: "trip-123",
      });

      expect(result.success).toBe(true);
      expect(result.finalized).toBe(true);
      expect(result.challengeStatus).toBe("COMPLETED");
    });

    it("should throw BAD_REQUEST for cancelled challenges", async () => {
      const cancelledChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "JUDGED_STAFF",
        status: "CANCELLED",
        endTime: new Date(Date.now() - 60 * 60 * 1000),
      });
      mockDb.challenge.findFirst.mockResolvedValue(cancelledChallenge);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.forceEndJudgedStaffVoting({
          challengeId: "challenge-123",
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when submission phase hasn't ended", async () => {
      const futureChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "JUDGED_STAFF",
        status: "ACTIVE",
        endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour in future
      });
      mockDb.challenge.findFirst.mockResolvedValue(futureChallenge);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.forceEndJudgedStaffVoting({
          challengeId: "challenge-123",
          tripId: "trip-123",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("submitVotes", () => {
    it("should submit multiple votes successfully", async () => {
      const peerVotingChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "PEER_VOTING",
        status: "VOTING_PHASE",
      });
      const createdVotes = [
        createMockVote({ id: "vote-1", submissionId: "submission-1", votePosition: 1, votePoints: 3 }),
        createMockVote({ id: "vote-2", submissionId: "submission-2", votePosition: 2, votePoints: 2 }),
        createMockVote({ id: "vote-3", submissionId: "submission-3", votePosition: 3, votePoints: 1 }),
      ];
      mockDb.challenge.findFirst.mockResolvedValue(peerVotingChallenge);
      mockDb.tripParticipant.findUnique.mockResolvedValue({
        ...mockParticipant,
        groupId: "different-group-123",
      });
      mockDb.challengeSubmission.findMany.mockResolvedValue([
        createMockSubmission({ id: "submission-1", groupId: "group-1" }),
        createMockSubmission({ id: "submission-2", groupId: "group-2" }),
        createMockSubmission({ id: "submission-3", groupId: "group-3" }),
      ]);
      mockDb.challengeVote.findMany.mockResolvedValue([]);
      mockDb.$transaction.mockImplementation(async (fn: unknown) => {
        if (typeof fn === "function") {
          await (fn as (db: PrismaClient) => Promise<unknown>)(mockDb);
          return createdVotes;
        }
        return Promise.all(fn as unknown[]);
      });

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.submitVotes({
        tripId: "trip-123",
        challengeId: "challenge-123",
        votes: [
          { submissionId: "submission-1", votePosition: 1, votePoints: 3 },
          { submissionId: "submission-2", votePosition: 2, votePoints: 2 },
          { submissionId: "submission-3", votePosition: 3, votePoints: 1 },
        ],
      });

      expect(result).toHaveLength(3);
    });

    it("should throw BAD_REQUEST for duplicate submission votes", async () => {
      const peerVotingChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "PEER_VOTING",
        status: "VOTING_PHASE",
      });
      mockDb.challenge.findFirst.mockResolvedValue(peerVotingChallenge);
      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.submitVotes({
          tripId: "trip-123",
          challengeId: "challenge-123",
          votes: [
            { submissionId: "submission-1", votePosition: 1, votePoints: 3 },
            { submissionId: "submission-1", votePosition: 2, votePoints: 2 }, // Duplicate submission
          ],
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST for duplicate vote positions", async () => {
      const peerVotingChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "PEER_VOTING",
        status: "VOTING_PHASE",
      });
      mockDb.challenge.findFirst.mockResolvedValue(peerVotingChallenge);
      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.submitVotes({
          tripId: "trip-123",
          challengeId: "challenge-123",
          votes: [
            { submissionId: "submission-1", votePosition: 1, votePoints: 3 },
            { submissionId: "submission-2", votePosition: 1, votePoints: 2 }, // Duplicate position
          ],
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when voting on own group submission", async () => {
      const peerVotingChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "PEER_VOTING",
        status: "VOTING_PHASE",
      });
      mockDb.challenge.findFirst.mockResolvedValue(peerVotingChallenge);
      mockDb.tripParticipant.findUnique.mockResolvedValue({
        ...mockParticipant,
        groupId: "group-123",
      });
      mockDb.challengeSubmission.findMany.mockResolvedValue([
        createMockSubmission({ id: "submission-1", groupId: "group-123" }), // Same as participant's group
      ]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.submitVotes({
          tripId: "trip-123",
          challengeId: "challenge-123",
          votes: [{ submissionId: "submission-1", votePosition: 1, votePoints: 3 }],
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw CONFLICT when user already voted", async () => {
      const peerVotingChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "PEER_VOTING",
        status: "VOTING_PHASE",
      });
      mockDb.challenge.findFirst.mockResolvedValue(peerVotingChallenge);
      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.challengeSubmission.findMany.mockResolvedValue([
        createMockSubmission({ id: "submission-1", groupId: "group-1" }),
      ]);
      mockDb.challengeVote.findMany.mockResolvedValue([
        createMockVote({ voterId: "participant-123" }),
      ]);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.submitVotes({
          tripId: "trip-123",
          challengeId: "challenge-123",
          votes: [{ submissionId: "submission-1", votePosition: 1, votePoints: 3 }],
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("submitVote", () => {
    it("should submit a single vote successfully", async () => {
      const peerVotingChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "PEER_VOTING",
        status: "VOTING_PHASE",
      });
      mockDb.challenge.findFirst.mockResolvedValue(peerVotingChallenge);
      mockDb.tripParticipant.findUnique.mockResolvedValue({
        ...mockParticipant,
        groupId: "different-group-123",
      });
      mockDb.challengeSubmission.findFirst.mockResolvedValue(
        createMockSubmission({ id: "submission-123", groupId: "group-1" })
      );
      mockDb.challengeVote.findMany.mockResolvedValue([]);
      mockDb.$transaction.mockImplementation(async (fn: unknown) => {
        if (typeof fn === "function") {
          return await (fn as (db: PrismaClient) => Promise<unknown>)(mockDb);
        }
        return Promise.all(fn as unknown[]);
      });
      mockDb.challengeVote.create.mockResolvedValue(mockVote);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      const result = await caller.submitVote({
        tripId: "trip-123",
        challengeId: "challenge-123",
        submissionId: "submission-123",
        votePosition: 1,
        votePoints: 3,
      });

      expect(result.votePosition).toBe(1);
      expect(result.votePoints).toBe(3);
    });

    it("should allow admin to vote in judged staff challenge", async () => {
      const judgedChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "JUDGED_STAFF",
        status: "ACTIVE",
        endTime: new Date(Date.now() - 60 * 60 * 1000),
      });
      mockDb.challenge.findFirst.mockResolvedValue(judgedChallenge);
      mockDb.tripParticipant.findUnique.mockResolvedValue({
        ...mockParticipant,
        groupId: "admin-group-123",
      });
      mockDb.challengeSubmission.findFirst.mockResolvedValue(
        createMockSubmission({ id: "submission-123", groupId: "different-group-456" })
      );
      mockDb.challengeVote.findMany.mockResolvedValue([]);
      mockDb.challengeSubmission.count.mockResolvedValue(5);
      mockDb.$transaction.mockImplementation(async (fn: unknown) => {
        if (typeof fn === "function") {
          return await (fn as (db: PrismaClient) => Promise<unknown>)(mockDb);
        }
        return Promise.all(fn as unknown[]);
      });
      mockDb.challengeVote.create.mockResolvedValue(mockVote);

      const { requireAuth } = await import("@mirai-app/auth");
      requireAuth.mockResolvedValue({
        user: { id: "auth-admin-123", email: "admin@example.com" },
        dbUser: mockAdminUser,
      });

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      const result = await caller.submitVote({
        tripId: "trip-123",
        challengeId: "challenge-123",
        submissionId: "submission-123",
        votePosition: 1,
        votePoints: 5,
      });

      expect(result).toBeDefined();
    });

    it("should throw FORBIDDEN when non-admin votes in judged staff challenge", async () => {
      const judgedChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "JUDGED_STAFF",
        status: "ACTIVE",
        endTime: new Date(Date.now() - 60 * 60 * 1000),
      });
      mockDb.challenge.findFirst.mockResolvedValue(judgedChallenge);
      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);

      const ctx = createAuthContext(mockUser);
      const caller = createCaller(ctx);

      await expect(
        caller.submitVote({
          tripId: "trip-123",
          challengeId: "challenge-123",
          submissionId: "submission-123",
          votePosition: 1,
          votePoints: 3,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when voting outside allowed positions", async () => {
      const judgedChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "JUDGED_STAFF",
        status: "ACTIVE",
        endTime: new Date(Date.now() - 60 * 60 * 1000),
      });
      mockDb.challenge.findFirst.mockResolvedValue(judgedChallenge);
      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.challengeSubmission.findFirst.mockResolvedValue(
        createMockSubmission({ id: "submission-123" })
      );
      mockDb.challengeVote.findMany.mockResolvedValue([]);
      mockDb.challengeSubmission.count.mockResolvedValue(2); // Only 2 submissions, so positions 1-2 allowed

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.submitVote({
          tripId: "trip-123",
          challengeId: "challenge-123",
          submissionId: "submission-123",
          votePosition: 3, // Position 3 not allowed with only 2 submissions
          votePoints: 3,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw CONFLICT when vote already exists for position", async () => {
      const judgedChallenge = createMockChallenge({
        id: "challenge-123",
        scoringCategory: "JUDGED_STAFF",
        status: "ACTIVE",
        endTime: new Date(Date.now() - 60 * 60 * 1000),
      });
      mockDb.challenge.findFirst.mockResolvedValue(judgedChallenge);
      mockDb.tripParticipant.findUnique.mockResolvedValue(mockParticipant);
      mockDb.challengeSubmission.findFirst.mockResolvedValue(
        createMockSubmission({ id: "submission-123" })
      );
      mockDb.challengeVote.findMany.mockResolvedValue([
        createMockVote({ voterId: "participant-123", votePosition: 1, submissionId: "submission-other" }),
      ]);
      mockDb.challengeSubmission.count.mockResolvedValue(5);

      const ctx = createAuthContext(mockAdminUser);
      const caller = createCaller(ctx);

      await expect(
        caller.submitVote({
          tripId: "trip-123",
          challengeId: "challenge-123",
          submissionId: "submission-123",
          votePosition: 1, // Position already voted
          votePoints: 3,
        })
      ).rejects.toThrow(ORPCError);
    });
  });
});
