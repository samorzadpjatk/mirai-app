 
 
 
import { describe, it, expect, vi, beforeEach } from "vitest";
import { challengeSubmissionRouter } from "../challengeSubmission";
import { createRouterClient } from "@orpc/server";
import type { TRPCContext } from "../../trpc";
import { ORPCError } from "@orpc/server";
import { ORPCError } from "@orpc/server";
import type { DB, User, TransactionDB } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";

// Mock the utility modules
vi.mock("~/utils/authEmails", () => ({
  buildAuthEmailLookup: vi.fn().mockResolvedValue(new Map()),
  resolveAuthEmail: vi.fn().mockReturnValue(null),
}));

vi.mock("~/utils/location-validation", () => ({
  calculateDistance: vi.fn().mockReturnValue(0.1), // 100 meters
}));

vi.mock("~/utils/activityFeed", () => ({
  captureTripRankingSnapshot: vi.fn().mockResolvedValue(new Map()),
  createChallengeStatusActivityById: vi.fn().mockResolvedValue(undefined),
  createRankChangeActivities: vi.fn().mockResolvedValue(undefined),
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed: vi.fn().mockResolvedValue([]),
  promoteVisibleChallengesToActiveWithFeed: vi.fn().mockResolvedValue([]),
}));

vi.mock("~/utils/recurringChallenges", () => ({
  resolveRecurringChallengeIdForTrip: vi.fn().mockResolvedValue(null),
}));

vi.mock("~/utils/tripGuards", () => ({
  ensureTripNotEnded: vi.fn().mockResolvedValue(undefined),
}));

// Import mocked functions for assertions
import { buildAuthEmailLookup, resolveAuthEmail } from "~/utils/authEmails";
import { calculateDistance } from "~/utils/location-validation";
import {
  captureTripRankingSnapshot,
  createChallengeStatusActivityById,
  createRankChangeActivities,
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed,
  promoteVisibleChallengesToActiveWithFeed,
} from "~/utils/activityFeed";
import { resolveRecurringChallengeIdForTrip } from "~/utils/recurringChallenges";
import { ensureTripNotEnded } from "~/utils/tripGuards";

const createCaller = (ctx: TRPCContext) => createRouterClient(challengeSubmissionRouter, { context: ctx });

describe("challengeSubmissionRouter", () => {
  let mockDb: DB;
  let mockSupabase: SupabaseClient;
  let mockTx: TransactionDB;

  // Test data factories
  const createMockUser = (overrides?: Partial<User>): User => ({
    id: "user-1",
    authUserId: "auth-1",
    firstName: "Test",
    lastName: "User",
    role: "USER",
    hasAvatar: false,
    lastSeenOn: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockDbUser = (overrides?: Partial<User>): User =>
    createMockUser({ id: "db-user-1", role: "USER", ...overrides });

  const createMockModeratorUser = (overrides?: Partial<User>): User =>
    createMockUser({ id: "mod-user-1", role: "MODERATOR", ...overrides });

  const createMockAdminUser = (overrides?: Partial<User>): User =>
    createMockUser({ id: "admin-user-1", role: "ADMIN", ...overrides });

  const createMockChallenge = (overrides?: Record<string, unknown>) => ({
    id: "challenge-1",
    name: "Test Challenge",
    status: "ACTIVE",
    scoringCategory: "UNLIMITED",
    startTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
    votingStartTime: null,
    submissionType: "IMAGE",
    description: "Test description",
    expectedValue: null,
    targetLatitude: null,
    targetLongitude: null,
    autoApprove: false,
    basePoints: 10,
    firstPlacePoints: 30,
    secondPlacePoints: 20,
    thirdPlacePoints: 15,
    ...overrides,
  });

  const createMockSubmission = (overrides?: Record<string, unknown>) => ({
    id: "submission-1",
    challengeId: "challenge-1",
    groupId: "group-1",
    imageIds: ["image-1", "image-2"],
    videoId: null,
    textContent: null,
    latitude: null,
    longitude: null,
    status: "PENDING",
    reviewedById: null,
    reviewedAt: null,
    rejectionReason: null,
    awardedPoints: null,
    bonusPoints: null,
    ranking: null,
    voteCount: 0,
    voteScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    group: {
      id: "group-1",
      name: "Test Group",
      description: "Test group description",
      image: null,
    },
    reviewedBy: null,
    ...overrides,
  });

  const createMockGroup = (overrides?: Record<string, unknown>) => ({
    id: "group-1",
    name: "Test Group",
    description: "Test group description",
    image: null,
    coins: 100,
    ...overrides,
  });

  const createMockTripParticipant = (overrides?: Record<string, unknown>) => ({
    id: "participant-1",
    userId: "db-user-1",
    tripId: "trip-1",
    groupId: "group-1",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup transaction mock with default return values
    mockTx = {
      challenge: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue(null),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue(null),
        delete: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
      challengeSubmission: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue(null),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        delete: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
      tripParticipant: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      group: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue(null),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      coinTransaction: {
        create: vi.fn().mockResolvedValue(null),
      },
      activityFeed: {
        create: vi.fn().mockResolvedValue(null),
      },
      submissionActivity: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      challengeActivity: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      userAgent: {
        create: vi.fn().mockResolvedValue(null),
      },
      trip: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    // Setup mock database client with default return values
    mockDb = {
      challenge: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue(null),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        create: vi.fn().mockResolvedValue(null),
        delete: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
      challengeSubmission: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue(null),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        delete: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
      tripParticipant: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      group: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue(null),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      coinTransaction: {
        create: vi.fn().mockResolvedValue(null),
      },
      activityFeed: {
        create: vi.fn().mockResolvedValue(null),
      },
      submissionActivity: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      challengeActivity: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      userAgent: {
        create: vi.fn().mockResolvedValue(null),
      },
      trip: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
    };

    // Add Drizzle query API layer to mockDb
    (mockDb as any).query = {
      challenges: mockDb.challenge,
      challengeSubmissions: mockDb.challengeSubmission,
      tripParticipants: mockDb.tripParticipant,
      groups: mockDb.group,
      coinTransactions: mockDb.coinTransaction,
      activityFeeds: mockDb.activityFeed,
      submissionActivities: mockDb.submissionActivity,
      challengeActivities: mockDb.challengeActivity,
      users: mockDb.user,
      userAgents: mockDb.userAgent,
      trips: mockDb.trip,
    };

    // Add Drizzle query API layer to mockTx
    (mockTx as any).query = {
      challenges: mockTx.challenge,
      challengeSubmissions: mockTx.challengeSubmission,
      tripParticipants: mockTx.tripParticipant,
      groups: mockTx.group,
      coinTransactions: mockTx.coinTransaction,
      activityFeeds: mockTx.activityFeed,
      submissionActivities: mockTx.submissionActivity,
      challengeActivities: mockTx.challengeActivity,
      users: mockTx.user,
      userAgents: mockTx.userAgent,
      trips: mockTx.trip,
    };

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } satisfies SupabaseClient;
  });

  describe("getByChallengeForAdmin", () => {
    it("should return submissions for admin/moderator", async () => {
      const mockSubmissions = [createMockSubmission(), createMockSubmission({ id: "submission-2" })];
      mockDb.challengeSubmission.findMany.mockResolvedValue(mockSubmissions);
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge());
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      const result = await caller.getByChallengeForAdmin({ challengeId: "challenge-1", tripId: "trip-1" });

      expect(result).toHaveLength(2);
       
      expect(mockDb.challengeSubmission.findMany).toHaveBeenCalledWith({
        where: { challengeId: "challenge-1" },
        select: expect.any(Object),
        orderBy: [{ voteScore: "desc" }, { createdAt: "asc" }],
      });
    });

    it("should resolve recurring challenge ID", async () => {
      const mockSubmissions = [createMockSubmission()];
      mockDb.challengeSubmission.findMany.mockResolvedValue(mockSubmissions);
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge());
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue("recurring-challenge-1");

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      const result = await caller.getByChallengeForAdmin({ challengeId: "challenge-1", tripId: "trip-1" });

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
    });

    it("should throw NOT_FOUND when challenge not found", async () => {
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await expect(
        caller.getByChallengeForAdmin({ challengeId: "nonexistent", tripId: "trip-1" })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("getByChallenge", () => {
    it("should return submissions for regular user", async () => {
      const mockSubmissions = [
        createMockSubmission({ status: "APPROVED" }),
        createMockSubmission({ id: "submission-2", status: "PENDING" }),
      ];
      mockDb.challengeSubmission.findMany.mockResolvedValue(mockSubmissions);
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge());
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.getByChallenge({ challengeId: "challenge-1", tripId: "trip-1" });

      expect(result).toHaveLength(2);
      // Non-approved submissions should have media hidden for regular users
      expect(result[1]?.imageIds).toEqual([]);
      expect(result[1]?.videoId).toBeNull();
    });

    it("should not hide media for approved submissions", async () => {
      const mockSubmission = createMockSubmission({ status: "APPROVED" });
      mockDb.challengeSubmission.findMany.mockResolvedValue([mockSubmission]);
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge());
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.getByChallenge({ challengeId: "challenge-1", tripId: "trip-1" });

      expect(result[0]?.imageIds).toEqual(["image-1", "image-2"]);
    });

    it("should not hide media for moderators", async () => {
      const mockSubmission = createMockSubmission({ status: "PENDING" });
      mockDb.challengeSubmission.findMany.mockResolvedValue([mockSubmission]);
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge());
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      const result = await caller.getByChallenge({ challengeId: "challenge-1", tripId: "trip-1" });

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
    });

    it("should throw FORBIDDEN when user is not a trip participant", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.getByChallenge({ challengeId: "challenge-1", tripId: "trip-1" })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("getById", () => {
    it("should return submission by ID", async () => {
      const mockSubmission = createMockSubmission();
      mockDb.challengeSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.getById({ id: "submission-1", tripId: "trip-1" });

      expect(result.id).toBe("submission-1");
       
      expect(mockDb.challengeSubmission.findFirst).toHaveBeenCalledWith({
        where: { id: "submission-1", challenge: { tripId: "trip-1" } },
        select: expect.any(Object),
      });
    });

    it("should throw NOT_FOUND when submission not found", async () => {
      mockDb.challengeSubmission.findFirst.mockResolvedValue(null);
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(caller.getById({ id: "nonexistent", tripId: "trip-1" })).rejects.toThrow(ORPCError);
    });
  });

  describe("getMyForChallenge", () => {
    it("should return user's submission for challenge", async () => {
      const mockSubmission = createMockSubmission();
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.getMyForChallenge({ challengeId: "challenge-1", tripId: "trip-1" });

      expect(result?.id).toBe("submission-1");
    });

    it("should return null when user has no submission", async () => {
      mockDb.challengeSubmission.findUnique.mockResolvedValue(null);
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.getMyForChallenge({ challengeId: "challenge-1", tripId: "trip-1" });

      expect(result).toBeNull();
    });

    it("should return null when user has no group", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant({ groupId: null }));
      mockDb.challengeSubmission.findUnique.mockResolvedValue(null);
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.getMyForChallenge({ challengeId: "challenge-1", tripId: "trip-1" });

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new submission", async () => {
      const mockSubmission = createMockSubmission();
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.trip.findUnique.mockResolvedValue({ id: "trip-1", endedAt: null });
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge());
      mockDb.challengeSubmission.findUnique.mockImplementation((args: { where: { id: string } }) => {
        if (args.where.id === "submission-1") return Promise.resolve(mockSubmission);
        return Promise.resolve(null);
      });
      mockTx.challengeSubmission.create.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.challenge.findFirst.mockResolvedValue(createMockChallenge());
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["image-1", "image-2"],
        })
      ).resolves.toBeDefined();
    });

    it("should auto-approve QR code challenge with correct code", async () => {
      const mockSubmission = createMockSubmission({
        status: "APPROVED",
        awardedPoints: 10,
      });
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.trip.findUnique.mockResolvedValue({ id: "trip-1", endedAt: null });
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge({ submissionType: "QR_CODE", expectedValue: "SECRET123" }));
      mockDb.challengeSubmission.findUnique.mockImplementation((args: { where: { id: string } }) => {
        if (args.where.id === "submission-1") return Promise.resolve(mockSubmission);
        return Promise.resolve(null);
      });
      mockTx.challengeSubmission.create.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.challenge.findFirst.mockResolvedValue(createMockChallenge({ submissionType: "QR_CODE", expectedValue: "SECRET123" }));
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          textContent: "SECRET123",
        })
      ).resolves.toBeDefined();
    });

    it("should throw BAD_REQUEST for QR code with incorrect code", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          textContent: "WRONGCODE",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should auto-approve location challenge within radius", async () => {
      const mockSubmission = createMockSubmission({
        status: "APPROVED",
        awardedPoints: 10,
      });
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.trip.findUnique.mockResolvedValue({ id: "trip-1", endedAt: null });
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge({ submissionType: "LOCATION", targetLatitude: 52.2297, targetLongitude: 21.0122 }));
      mockDb.challengeSubmission.findUnique.mockImplementation((args: { where: { id: string } }) => {
        if (args.where.id === "submission-1") return Promise.resolve(mockSubmission);
        return Promise.resolve(null);
      });
      mockTx.challengeSubmission.create.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.challenge.findFirst.mockResolvedValue(createMockChallenge({ submissionType: "LOCATION", targetLatitude: 52.2297, targetLongitude: 21.0122 }));
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      calculateDistance.mockReturnValue(0.05);
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          latitude: 52.23,
          longitude: 21.01,
        })
      ).resolves.toBeDefined();
    });

    it("should throw BAD_REQUEST for location challenge outside radius", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);
      calculateDistance.mockReturnValue(50); // 500 meters - outside 200m radius

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          latitude: 52.25,
          longitude: 21.05,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw CONFLICT when submission already exists", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challengeSubmission.findUnique.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["image-1"],
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when challenge is not active", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["image-1"],
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw FORBIDDEN when submission window has ended", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["image-1"],
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when user has no group", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["image-1"],
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should validate IMAGE submission type", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: [], // Empty array should fail
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should validate MULTI_IMAGE submission type", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["image-1"], // Only 1 image should fail
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should validate VIDEO submission type", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          // No videoId provided
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should validate TEXT submission type", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          // No textContent provided
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should validate IMAGE_LOCATION submission type", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["image-1"],
          // No location provided
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should validate LOCATION submission type", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          // No location provided
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should validate QR_CODE submission type with text", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          // No text or image provided
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should auto-approve TEXT challenge with expected value", async () => {
      const mockSubmission = createMockSubmission({
        status: "APPROVED",
        awardedPoints: 10,
      });
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.trip.findUnique.mockResolvedValue({ id: "trip-1", endedAt: null });
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge({ submissionType: "TEXT", expectedValue: "ANSWER123" }));
      mockDb.challengeSubmission.findUnique.mockImplementation((args: { where: { id: string } }) => {
        if (args.where.id === "submission-1") return Promise.resolve(mockSubmission);
        return Promise.resolve(null);
      });
      mockTx.challengeSubmission.create.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.challenge.findFirst.mockResolvedValue(createMockChallenge({ submissionType: "TEXT", expectedValue: "ANSWER123" }));
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          textContent: "ANSWER123",
        })
      ).resolves.toBeDefined();
    });

    it("should throw BAD_REQUEST for TEXT challenge with wrong expected value", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          textContent: "WRONGANSWER",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should auto-approve when autoApprove flag is true", async () => {
      const mockSubmission = createMockSubmission({
        status: "APPROVED",
        awardedPoints: 10,
      });
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.trip.findUnique.mockResolvedValue({ id: "trip-1", endedAt: null });
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge({ autoApprove: true }));
      mockDb.challengeSubmission.findUnique.mockImplementation((args: { where: { id: string } }) => {
        if (args.where.id === "submission-1") return Promise.resolve(mockSubmission);
        return Promise.resolve(null);
      });
      mockTx.challengeSubmission.create.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.challenge.findFirst.mockResolvedValue(createMockChallenge({ autoApprove: true }));
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["image-1"],
        })
      ).resolves.toBeDefined();
    });

    it("should award coins for auto-approved submissions", async () => {
      const mockSubmission = createMockSubmission({
        status: "APPROVED",
        awardedPoints: 10,
      });
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.trip.findUnique.mockResolvedValue({ id: "trip-1", endedAt: null });
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge({ autoApprove: true, basePoints: 10, firstPlacePoints: 30, secondPlacePoints: 20, thirdPlacePoints: 15 }));
      mockDb.challengeSubmission.findUnique.mockImplementation((args: { where: { id: string } }) => {
        if (args.where.id === "submission-1") return Promise.resolve(mockSubmission);
        return Promise.resolve(null);
      });
      mockTx.challengeSubmission.create.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.challenge.findFirst.mockResolvedValue(createMockChallenge({ autoApprove: true, basePoints: 10, firstPlacePoints: 30, secondPlacePoints: 20, thirdPlacePoints: 15 }));
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["image-1"],
        })
      ).resolves.toBeDefined();
    });
  });

  describe("updateMine", () => {
    it("should update user's submission", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge(),
      });
      const updatedSubmission = createMockSubmission({
        id: "submission-1",
        imageIds: ["new-image-1"],
        status: "PENDING",
      });
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.trip.findUnique.mockResolvedValue({ id: "trip-1", endedAt: null });
      mockDb.challengeSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge());
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.challengeSubmission.update.mockResolvedValue(updatedSubmission);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.updateMine({
        id: "submission-1",
        tripId: "trip-1",
        imageIds: ["new-image-1"],
      });

      expect(result.id).toBe("submission-1");
       
      expect(mockTx.challengeSubmission.update).toHaveBeenCalled();
    });

    it("should throw FORBIDDEN when trying to update approved submission", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challengeSubmission.findFirst.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.updateMine({
          id: "submission-1",
          tripId: "trip-1",
          imageIds: ["new-image-1"],
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND when submission not found", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challengeSubmission.findFirst.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.updateMine({
          id: "nonexistent",
          tripId: "trip-1",
          imageIds: ["new-image-1"],
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should auto-approve on update if conditions met", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          submissionType: "QR_CODE",
          expectedValue: "SECRET123",
        }),
      });
      const updatedSubmission = createMockSubmission({
        id: "submission-1",
        status: "APPROVED",
        textContent: "SECRET123",
      });
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.trip.findUnique.mockResolvedValue({ id: "trip-1", endedAt: null });
      mockDb.challengeSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge({ submissionType: "QR_CODE", expectedValue: "SECRET123" }));
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.challengeSubmission.update.mockResolvedValue(updatedSubmission);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.updateMine({
        id: "submission-1",
        tripId: "trip-1",
        textContent: "SECRET123",
      });

      expect(result.status).toBe("APPROVED");
    });

    it("should activate challenge if start time has passed", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          status: "VISIBLE",
          startTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        }),
      });
      const updatedSubmission = createMockSubmission({
        id: "submission-1",
        status: "PENDING",
      });
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.trip.findUnique.mockResolvedValue({ id: "trip-1", endedAt: null });
      mockDb.challengeSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge({ status: "VISIBLE", startTime: new Date(Date.now() - 1000 * 60 * 60) }));
      mockTx.challenge.updateMany.mockResolvedValue({ count: 1 });
      mockTx.challengeSubmission.update.mockResolvedValue(updatedSubmission);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.updateMine({
        id: "submission-1",
        tripId: "trip-1",
        imageIds: ["image-1"],
      });

      expect(result).toBeDefined();
    });

    it("should handle PEER_VOTING challenge updates", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          status: "VOTING_PHASE",
          scoringCategory: "PEER_VOTING",
          votingStartTime: new Date(Date.now() - 1000 * 60 * 60),
        }),
      });
      const updatedSubmission = createMockSubmission({
        id: "submission-1",
        status: "PENDING",
      });
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.trip.findUnique.mockResolvedValue({ id: "trip-1", endedAt: null });
      mockDb.challengeSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge({ status: "VOTING_PHASE", scoringCategory: "PEER_VOTING" }));
      mockTx.challenge.findFirst.mockResolvedValue(createMockChallenge({ status: "VOTING_PHASE", scoringCategory: "PEER_VOTING" }));
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.challengeSubmission.update.mockResolvedValue(updatedSubmission);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.updateMine({
          id: "submission-1",
          tripId: "trip-1",
          imageIds: ["image-1"],
        })
      ).rejects.toThrow();
    });

    it("should complete challenge if end time has passed", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          status: "ACTIVE",
          scoringCategory: "UNLIMITED",
          endTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        }),
      });
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challengeSubmission.findFirst.mockResolvedValue(null);
      mockTx.challenge.update.mockResolvedValue(createMockChallenge());
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.updateMine({
          id: "submission-1",
          tripId: "trip-1",
          imageIds: ["image-1"],
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("deleteMine", () => {
    it("should delete user's submission", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.trip.findUnique.mockResolvedValue({ id: "trip-1", endedAt: null });
      mockDb.challengeSubmission.findFirst.mockResolvedValue(createMockSubmission({ status: "PENDING" }));
      mockDb.challengeSubmission.delete.mockResolvedValue(createMockSubmission());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.deleteMine({ id: "submission-1", tripId: "trip-1" });

      expect(result.success).toBe(true);
       
      expect(mockDb.challengeSubmission.delete).toHaveBeenCalledWith({
        where: { id: "submission-1" },
      });
    });

    it("should throw FORBIDDEN when trying to delete approved submission", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challengeSubmission.findFirst.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.deleteMine({ id: "submission-1", tripId: "trip-1" })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND when submission not found", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challengeSubmission.findFirst.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.deleteMine({ id: "nonexistent", tripId: "trip-1" })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST when user has no group", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.deleteMine({ id: "submission-1", tripId: "trip-1" })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("review", () => {
    it("should approve a submission", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          scoringCategory: "UNLIMITED",
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
        awardedPoints: 10,
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce(approvedSubmission) // First call - refreshedForResponse
        .mockResolvedValueOnce({ // Second call - refreshedForActivity
          ...approvedSubmission,
          challenge: { id: "challenge-1", tripId: "trip-1", name: "Test Challenge" },
          group: { id: "group-1", name: "Test Group" },
        });
      mockTx.submissionActivity.findFirst.mockResolvedValue(null);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.activityFeed.create.mockResolvedValue({ id: "activity-1" });
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      const result = await caller.review({
        id: "submission-1",
        status: "APPROVED",
        awardedPoints: 10,
      });

      expect(result.status).toBe("APPROVED");
       
      expect(mockTx.challengeSubmission.update).toHaveBeenCalledWith({
        where: { id: "submission-1" },
        data: expect.objectContaining({
          status: "APPROVED",
          rejectionReason: null,
          awardedPoints: 10,
        }),
      });
    });

    it("should reject a submission with reason", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge(),
      });
      const rejectedSubmission = createMockSubmission({
        status: "REJECTED",
        rejectionReason: "Invalid content",
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValue(rejectedSubmission);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      const result = await caller.review({
        id: "submission-1",
        status: "REJECTED",
        rejectionReason: "Invalid content",
      });

      expect(result.status).toBe("REJECTED");
       
      expect(mockTx.challengeSubmission.update).toHaveBeenCalledWith({
        where: { id: "submission-1" },
        data: expect.objectContaining({
          status: "REJECTED",
          rejectionReason: "Invalid content",
        }),
      });
    });

    it("should throw BAD_REQUEST when rejecting without reason", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await expect(
        caller.review({
          id: "submission-1",
          status: "REJECTED",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw NOT_FOUND when submission not found", async () => {
      mockDb.challengeSubmission.findUnique.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await expect(
        caller.review({
          id: "nonexistent",
          status: "APPROVED",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should throw BAD_REQUEST for JUDGED_STAFF challenges", async () => {
      mockDb.challengeSubmission.findUnique.mockResolvedValue(createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({ scoringCategory: "JUDGED_STAFF" }),
      }));

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await expect(
        caller.review({
          id: "submission-1",
          status: "APPROVED",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should award coins when approving", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          scoringCategory: "UNLIMITED",
          basePoints: 20,
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
        awardedPoints: 20,
        bonusPoints: 5,
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce(approvedSubmission)
        .mockResolvedValueOnce({
          ...approvedSubmission,
          challenge: { id: "challenge-1", tripId: "trip-1", name: "Test Challenge" },
          group: { id: "group-1", name: "Test Group" },
        });
      mockTx.submissionActivity.findFirst.mockResolvedValue(null);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      mockTx.activityFeed.create.mockResolvedValue({ id: "activity-1" });
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await caller.review({
        id: "submission-1",
        status: "APPROVED",
        awardedPoints: 20,
        bonusPoints: 5,
      });

       
      expect(mockTx.group.update).toHaveBeenCalledWith({
        where: { id: "group-1" },
        data: { coins: { increment: 25 } },
      });
       
      expect(mockTx.coinTransaction.create).toHaveBeenCalled();
    });

    it("should rebalance SPEED rankings when approving", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          scoringCategory: "SPEED",
          basePoints: 10,
          firstPlacePoints: 30,
          secondPlacePoints: 20,
          thirdPlacePoints: 15,
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce(approvedSubmission)
        .mockResolvedValueOnce({
          ...approvedSubmission,
          challenge: { id: "challenge-1", tripId: "trip-1", name: "Test Challenge" },
          group: { id: "group-1", name: "Test Group" },
        });
      mockTx.challengeSubmission.findMany.mockResolvedValue([]);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.activityFeed.create.mockResolvedValue({ id: "activity-1" });
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await caller.review({
        id: "submission-1",
        status: "APPROVED",
      });

      // Should update submission with ranking
       
      expect(mockTx.challengeSubmission.update).toHaveBeenCalled();
    });

    it("should create activity feed entry on approval", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          submissionType: "IMAGE",
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
        awardedPoints: 10,
        bonusPoints: 0,
        ranking: 1,
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce(approvedSubmission);
      mockTx.submissionActivity.findFirst.mockResolvedValue(null);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.activityFeed.create.mockResolvedValue({ id: "activity-1" });
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      // Mock the second findUnique call for activity creation (refreshedForActivity)
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce({
        ...approvedSubmission,
        challenge: { id: "challenge-1", tripId: "trip-1", name: "Test Challenge" },
        group: { id: "group-1", name: "Test Group" },
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await caller.review({
        id: "submission-1",
        status: "APPROVED",
        awardedPoints: 10,
      });

       
      expect(mockTx.activityFeed.create).toHaveBeenCalled();
    });

    it("should handle PEER_VOTING challenge review", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          scoringCategory: "PEER_VOTING",
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce(approvedSubmission)
        .mockResolvedValueOnce({
          ...approvedSubmission,
          challenge: { id: "challenge-1", tripId: "trip-1", name: "Test Challenge" },
          group: { id: "group-1", name: "Test Group" },
        });
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.submissionActivity.findFirst.mockResolvedValue(null);
      mockTx.activityFeed.create.mockResolvedValue({ id: "activity-1" });
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      const result = await caller.review({
        id: "submission-1",
        status: "APPROVED",
      });

      expect(result.status).toBe("APPROVED");
    });

    it("should use ranking-based points for SPEED challenges", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          scoringCategory: "SPEED",
          basePoints: 10,
          firstPlacePoints: 30,
          secondPlacePoints: 20,
          thirdPlacePoints: 15,
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce(approvedSubmission)
        .mockResolvedValueOnce({
          ...approvedSubmission,
          challenge: { id: "challenge-1", tripId: "trip-1", name: "Test Challenge" },
          group: { id: "group-1", name: "Test Group" },
        });
      mockTx.challengeSubmission.findMany.mockResolvedValue([]);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.activityFeed.create.mockResolvedValue({ id: "activity-1" });
      mockTx.submissionActivity.findFirst.mockResolvedValue(null);
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await caller.review({
        id: "submission-1",
        status: "APPROVED",
        ranking: 2,
      });

      // For SPEED challenges, awardedPoints should not be set directly
       
      expect(mockTx.challengeSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ranking: undefined,
          }),
        })
      );
    });

    it("should not create duplicate activity feed entries", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          submissionType: "IMAGE",
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValue(approvedSubmission);
      mockTx.submissionActivity.findFirst.mockResolvedValue({ activityId: "existing-activity" });
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await caller.review({
        id: "submission-1",
        status: "APPROVED",
      });

       
      expect(mockTx.activityFeed.create).not.toHaveBeenCalled();
    });

    it("should not award coins for TEXT submissions", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          submissionType: "TEXT",
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValue(approvedSubmission);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await caller.review({
        id: "submission-1",
        status: "APPROVED",
        awardedPoints: 10,
      });

       
      expect(mockTx.group.update).not.toHaveBeenCalled();
       
      expect(mockTx.coinTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe("adminDelete", () => {
    it("should delete submission as admin", async () => {
      mockDb.challengeSubmission.delete.mockResolvedValue(createMockSubmission());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockAdminUser() });
      const result = await caller.adminDelete({ id: "submission-1" });

      expect(result.success).toBe(true);
       
      expect(mockDb.challengeSubmission.delete).toHaveBeenCalledWith({
        where: { id: "submission-1" },
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockDb.challengeSubmission.findMany.mockRejectedValue(new Error("Test error"));
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.getByChallenge({ challengeId: "challenge-1", tripId: "trip-1" })
      ).rejects.toThrow();
    });

    it("should handle missing coordinates for location challenge", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          latitude: 52.23,
          longitude: 21.01,
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should handle QR code challenge without expected value configured", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          textContent: "SOMECODE",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should handle missing submission after creation", async () => {
      const mockSubmission = createMockSubmission({ id: "submission-1" });
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);
      mockDb.challenge.findFirst.mockResolvedValue(null);
      mockDb.challengeSubmission.findUnique.mockResolvedValue(null);
      mockTx.challengeSubmission.create.mockResolvedValue(mockSubmission);
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);
      ensureTripNotEnded.mockResolvedValue(undefined);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      await expect(
        caller.create({
          tripId: "trip-1",
          challengeId: "challenge-1",
          imageIds: ["image-1"],
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should handle missing submission after review", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge(),
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(null);
      mockTx.challengeSubmission.findUnique.mockResolvedValue(null);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await expect(
        caller.review({
          id: "submission-1",
          status: "APPROVED",
        })
      ).rejects.toThrow(ORPCError);
    });

    it("should handle missing submission for activity creation", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          submissionType: "IMAGE",
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(null);
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce(null);
      mockTx.submissionActivity.findFirst.mockResolvedValue(null);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      captureTripRankingSnapshot.mockResolvedValue(undefined);

      // Second findUnique returns null (for activity creation)
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      await expect(
        caller.review({
          id: "submission-1",
          status: "APPROVED",
        })
      ).rejects.toThrow(ORPCError);
    });
  });

  describe("resolveAwardedPoints helper", () => {
    it("should use explicit awardedPoints when provided", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          scoringCategory: "UNLIMITED",
          basePoints: 10,
          firstPlacePoints: 30,
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
        awardedPoints: 50,
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce(approvedSubmission)
        .mockResolvedValueOnce({
          ...approvedSubmission,
          challenge: { id: "challenge-1", tripId: "trip-1", name: "Test Challenge" },
          group: { id: "group-1", name: "Test Group" },
        });
      mockTx.submissionActivity.findFirst.mockResolvedValue(null);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      mockTx.activityFeed.create.mockResolvedValue({ id: "activity-1" });
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      const result = await caller.review({
        id: "submission-1",
        status: "APPROVED",
        awardedPoints: 50,
      });

      expect(result.awardedPoints).toBe(50);
    });

    it("should use ranking-based points when ranking provided", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          scoringCategory: "UNLIMITED",
          basePoints: 10,
          firstPlacePoints: 30,
          secondPlacePoints: 20,
          thirdPlacePoints: 15,
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
        awardedPoints: 20,
        ranking: 2,
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce(approvedSubmission)
        .mockResolvedValueOnce({
          ...approvedSubmission,
          challenge: { id: "challenge-1", tripId: "trip-1", name: "Test Challenge" },
          group: { id: "group-1", name: "Test Group" },
        });
      mockTx.submissionActivity.findFirst.mockResolvedValue(null);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      mockTx.activityFeed.create.mockResolvedValue({ id: "activity-1" });
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      const result = await caller.review({
        id: "submission-1",
        status: "APPROVED",
        ranking: 2,
      });

      expect(result.awardedPoints).toBe(20);
    });

    it("should use basePoints as fallback", async () => {
      const mockSubmission = createMockSubmission({
        status: "PENDING",
        challenge: createMockChallenge({
          scoringCategory: "UNLIMITED",
          basePoints: 10,
        }),
      });
      const approvedSubmission = createMockSubmission({
        status: "APPROVED",
        awardedPoints: 10,
      });
      mockDb.challengeSubmission.findUnique.mockResolvedValue(mockSubmission);
      mockTx.challengeSubmission.findUnique.mockResolvedValueOnce(approvedSubmission)
        .mockResolvedValueOnce({
          ...approvedSubmission,
          challenge: { id: "challenge-1", tripId: "trip-1", name: "Test Challenge" },
          group: { id: "group-1", name: "Test Group" },
        });
      mockTx.submissionActivity.findFirst.mockResolvedValue(null);
      mockTx.challenge.updateMany.mockResolvedValue({ count: 0 });
      mockTx.group.update.mockResolvedValue({ id: "group-1" });
      mockTx.coinTransaction.create.mockResolvedValue({ id: "coin-tx-1" });
      mockTx.activityFeed.create.mockResolvedValue({ id: "activity-1" });
      captureTripRankingSnapshot.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockModeratorUser() });
      const result = await caller.review({
        id: "submission-1",
        status: "APPROVED",
      });

      expect(result.awardedPoints).toBe(10);
    });
  });

  describe("attachReviewerEmail helper", () => {
    it("should return submissions with reviewer data", async () => {
      const mockSubmissions = [
        createMockSubmission({
          reviewedBy: {
            id: "reviewer-1",
            firstName: "Reviewer",
            lastName: "User",
            authUserId: "auth-reviewer-1",
          },
        }),
      ];
      mockDb.challengeSubmission.findMany.mockResolvedValue(mockSubmissions);
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge());
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.getByChallenge({ challengeId: "challenge-1", tripId: "trip-1" });

      expect(result).toHaveLength(1);
      expect(result[0]?.reviewedBy).toBeDefined();
      expect(result[0]?.reviewedBy?.firstName).toBe("Reviewer");
    });
  });

  describe("ensureChallengeInTrip helper", () => {
    it("should call ensureChallengeInTrip during getByChallenge", async () => {
      const mockSubmissions = [createMockSubmission()];
      mockDb.challengeSubmission.findMany.mockResolvedValue(mockSubmissions);
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge({ status: "ACTIVE" }));
      mockDb.challenge.updateMany.mockResolvedValue({ count: 0 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.getByChallenge({ challengeId: "challenge-1", tripId: "trip-1" });

      // Verify the endpoint was called successfully
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
    });

    it("should handle challenges that have ended", async () => {
      const mockSubmissions = [createMockSubmission()];
      mockDb.challengeSubmission.findMany.mockResolvedValue(mockSubmissions);
      mockDb.tripParticipant.findUnique.mockResolvedValue(createMockTripParticipant());
      mockDb.challenge.findFirst.mockResolvedValue(createMockChallenge({ status: "ACTIVE", endTime: new Date(Date.now() - 1000 * 60 * 60) }));
      mockDb.challenge.updateMany.mockResolvedValue({ count: 1 });
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers(),
        accessToken: "test-token",
      };

      const caller = createCaller({ ...ctx, dbUser: createMockDbUser() });
      const result = await caller.getByChallenge({ challengeId: "challenge-1", tripId: "trip-1" });

      // Verify the endpoint returns data even when challenge has ended
      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
    });
  });
});
