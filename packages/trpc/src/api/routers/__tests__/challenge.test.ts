import { describe, it, expect, vi, beforeEach } from "vitest";
import { challengeRouter } from "../../routers/challenge";
import { createCallerFactory } from "../../trpc";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { PrismaClient, User, Challenge } from "@mirai-app/db";
import { TRPCError } from "@trpc/server";

// Mock utility modules
vi.mock("../../../utils/storage", () => ({
  normalizeSupabaseStoragePath: vi.fn((value: string) => {
    if (value?.startsWith("challenge/")) {
      return { bucket: "images", path: value, storagePath: `images/${value}` };
    }
    if (value?.startsWith("http")) {
      return null;
    }
    return { bucket: "public", path: value, storagePath: `public/${value}` };
  }),
}));

vi.mock("../../../utils/activityFeed", () => ({
  createChallengeStatusActivityById: vi.fn().mockResolvedValue(undefined),
  createChallengeStatusActivityFromTransition: vi.fn().mockResolvedValue(undefined),
  finalizeVotingChallengesToCompletedWithFeed: vi.fn().mockResolvedValue([]),
  promoteActivePeerVotingChallengesToVotingPhaseWithFeed: vi.fn().mockResolvedValue([]),
  promoteVisibleChallengesToActiveWithFeed: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../../utils/recurringChallenges", () => ({
  ensureRecurringInstancesForTrip: vi.fn().mockResolvedValue([]),
  precreateRecurringInstancesForTemplate: vi.fn().mockResolvedValue([]),
  resolveRecurringChallengeIdForTrip: vi.fn().mockResolvedValue(null),
}));

const createCaller = createCallerFactory(challengeRouter);

const createMockChallenge = (overrides?: Record<string, unknown>): Challenge =>
  ({
    id: "challenge-1",
    tripId: "trip-1",
    name: "Test Challenge",
    description: "Test description",
    image: "challenge/test-image.jpg",
    submissionType: "IMAGE",
    scoringCategory: "SPEED",
    isRecurring: false,
    dailyStartTime: null,
    dailyEndTime: null,
    basePoints: 100,
    firstPlacePoints: null,
    secondPlacePoints: null,
    thirdPlacePoints: null,
    status: "ACTIVE",
    startTime: new Date("2025-01-01"),
    endTime: new Date("2025-12-31"),
    votingStartTime: null,
    votingEndTime: null,
    targetLatitude: null,
    targetLongitude: null,
    expectedValue: null,
    autoApprove: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as unknown as Challenge;

describe("challengeRouter", () => {
  let mockDb: PrismaClient;
  let mockSupabase: SupabaseClient;
  let mockAdminUser: User;
  let mockUser: User;
  let mockChallenge: Challenge;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdminUser = {
      id: "admin-db-id",
      authUserId: "admin-auth-id",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      hasAvatar: false,
      wristNumber: null,
      houseNumber: null,
      role: "ADMIN",
      groupId: null,
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUser = {
      id: "user-db-id",
      authUserId: "user-auth-id",
      email: "user@example.com",
      firstName: "Test",
      lastName: "User",
      hasAvatar: false,
      wristNumber: null,
      houseNumber: null,
      role: "USER",
      groupId: "group-1",
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockChallenge = {
      id: "challenge-1",
      tripId: "trip-1",
      name: "Test Challenge",
      description: "Test description",
      image: "challenge/test-image.jpg",
      submissionType: "IMAGE",
      scoringCategory: "SPEED",
      isRecurring: false,
      dailyStartTime: null,
      dailyEndTime: null,
      basePoints: 100,
      firstPlacePoints: null,
      secondPlacePoints: null,
      thirdPlacePoints: null,
      status: "ACTIVE",
      startTime: new Date("2025-01-01"),
      endTime: new Date("2025-12-31"),
      votingStartTime: null,
      votingEndTime: null,
      targetLatitude: null,
      targetLongitude: null,
      expectedValue: null,
      autoApprove: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Setup mock Supabase client with storage
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-auth-id", email: "admin@example.com" } },
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: "admin-token" } },
          error: null,
        }),
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-auth-id", email: "admin@example.com" } },
            error: null,
          }),
        },
      },
      storage: {
        from: vi.fn((bucket: string) => ({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: `https://signed-url.example.com/${bucket}/test.jpg` },
            error: null,
          }),
        })),
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
        findMany: vi.fn().mockResolvedValue([mockChallenge]),
        findUnique: vi.fn().mockResolvedValue(mockChallenge),
        findFirst: vi.fn().mockResolvedValue(mockChallenge),
        create: vi.fn().mockResolvedValue(mockChallenge),
        update: vi.fn().mockResolvedValue(mockChallenge),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        delete: vi.fn().mockResolvedValue(mockChallenge),
        count: vi.fn().mockResolvedValue(1),
        groupBy: vi.fn().mockResolvedValue([]),
      },
      challengeSubmission: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        delete: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
        groupBy: vi.fn().mockResolvedValue([]),
      },
      tripParticipant: {
        findUnique: vi.fn().mockResolvedValue({
          userId: "user-db-id",
          tripId: "trip-1",
          groupId: "group-1",
        }),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(1),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(mockAdminUser),
        findUnique: vi.fn().mockResolvedValue(mockAdminUser),
        findMany: vi.fn().mockResolvedValue([mockAdminUser]),
        create: vi.fn().mockResolvedValue(mockAdminUser),
        update: vi.fn().mockResolvedValue(mockAdminUser),
        delete: vi.fn().mockResolvedValue(mockAdminUser),
        count: vi.fn().mockResolvedValue(1),
      },
      activityFeed: {
        create: vi.fn().mockResolvedValue({}),
      },
      challengeActivity: {
        create: vi.fn().mockResolvedValue({}),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      submissionActivity: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      group: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      },
      coinTransaction: {
        create: vi.fn().mockResolvedValue({}),
      },
      userAgent: {
        create: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn((cb) => cb(mockDb)),
    } as unknown as PrismaClient;
  });

  describe("getAll (adminProcedure)", () => {
    it("should return all challenges for admin", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: mockChallenge.id,
        name: mockChallenge.name,
        qrCodeValue: mockChallenge.expectedValue,
      });
      expect(mockDb.challenge.findMany).toHaveBeenCalledWith({
        where: { isRecurring: false },
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    it("should resolve challenge images with signed URLs", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      await caller.getAll();

      expect(mockSupabase.storage.from).toHaveBeenCalledWith("images");
    });

    it("should activate visible challenges before returning", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      await caller.getAll();

      expect(mockDb.challenge.updateMany).toHaveBeenCalled();
    });
  });

  describe("getAllByTrip (protectedProcedure)", () => {
    it("should return paginated challenges for trip", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAllByTrip({
        tripId: "trip-1",
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.challenges).toHaveLength(1);
      expect(result.pagination).toMatchObject({
        total: 1,
        limit: 10,
        offset: 0,
        hasMore: false,
      });
    });

    it("should include participant submission counts", async () => {
      mockDb.challengeSubmission.groupBy.mockResolvedValue([
        { challengeId: "challenge-1", _count: { _all: 5 } }
      ]);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAllByTrip({ tripId: "trip-1" });

      expect(result.challenges[0]).toHaveProperty("participantGroupsCount", 5);
    });

    it("should include my group submission status", async () => {
      mockDb.challengeSubmission.findMany.mockResolvedValue([
        { challengeId: "challenge-1", status: "PENDING" }
      ]);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAllByTrip({ tripId: "trip-1" });

      expect(result.challenges[0]).toHaveProperty("myGroupSubmissionStatus", "PENDING");
    });

    it("should handle empty challenges list", async () => {
      mockDb.challenge.findMany.mockResolvedValue([]);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAllByTrip({ tripId: "trip-1" });

      expect(result.challenges).toHaveLength(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it("should use default pagination when not provided", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAllByTrip({ tripId: "trip-1" });

      expect(result.pagination.limit).toBe(30);
      expect(result.pagination.offset).toBe(0);
    });
  });

  describe("getById (protectedProcedure)", () => {
    it("should return challenge by id", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getById({ id: "challenge-1", tripId: "trip-1" });

      expect(result.id).toBe("challenge-1");
      expect(result.name).toBe("Test Challenge");
      expect(result).toHaveProperty("qrCodeValue");
    });

    it("should throw NOT_FOUND when challenge does not exist", async () => {
      mockDb.challenge.findFirst.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.getById({ id: "nonexistent", tripId: "trip-1" })).rejects.toThrow(
        TRPCError
      );
    });

    it("should resolve recurring challenge id for non-admin users", async () => {
      const { resolveRecurringChallengeIdForTrip } = await import("../../../utils/recurringChallenges");
      resolveRecurringChallengeIdForTrip.mockResolvedValue(null);

      mockDb.user.findFirst.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      await caller.getById({ id: "challenge-1", tripId: "trip-1" });

      expect(resolveRecurringChallengeIdForTrip).toHaveBeenCalled();
    });

    it("should use original id for admin/moderator users", async () => {
      const { resolveRecurringChallengeIdForTrip } = await import("../../../utils/recurringChallenges");

      mockDb.challenge.findFirst.mockResolvedValue(mockChallenge);
      resolveRecurringChallengeIdForTrip.mockResolvedValue("recurring-challenge-id");

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getById({ id: "challenge-1", tripId: "trip-1" });

      expect(result.id).toBe("challenge-1");
    });
  });

  describe("create (adminProcedure)", () => {
    it("should create a basic challenge", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        name: "New Challenge",
        description: "Test description",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
      });

      expect(result.name).toBe("Test Challenge");
      expect(mockDb.challenge.create).toHaveBeenCalled();
    });

    it("should create challenge with QR code value", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        name: "QR Challenge",
        submissionType: "QR_CODE",
        scoringCategory: "SPEED",
        qrCodeValue: "SECRET123",
      });

      expect(result).toHaveProperty("qrCodeValue");
    });

    it("should create challenge with text expected phrase", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        name: "Text Challenge",
        submissionType: "TEXT",
        scoringCategory: "SPEED",
        textExpectedPhrase: "Expected Answer",
      });

      expect(result).toHaveProperty("qrCodeValue");
    });

    it("should create peer voting challenge with duration", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        name: "Voting Challenge",
        submissionType: "IMAGE",
        scoringCategory: "PEER_VOTING",
        endTime: new Date("2025-12-31"),
        votingDurationHours: 24,
      });

      expect(result).toBeDefined();
    });

    it("should throw error for peer voting with non-image/video submission type", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "TEXT",
          scoringCategory: "PEER_VOTING",
          endTime: new Date("2025-12-31"),
          votingDurationHours: 24,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for peer voting without end time", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "IMAGE",
          scoringCategory: "PEER_VOTING",
          votingDurationHours: 24,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for peer voting without voting duration or window", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "IMAGE",
          scoringCategory: "PEER_VOTING",
          endTime: new Date("2025-12-31"),
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for invalid voting duration", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "IMAGE",
          scoringCategory: "PEER_VOTING",
          endTime: new Date("2025-12-31"),
          votingDurationHours: 0,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for invalid voting time window", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "IMAGE",
          scoringCategory: "PEER_VOTING",
          endTime: new Date("2025-12-31"),
          votingStartTime: new Date("2025-12-31"),
          votingEndTime: new Date("2025-01-01"),
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for recurring peer voting challenge", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "IMAGE",
          scoringCategory: "PEER_VOTING",
          isRecurring: true,
          recurringDays: 7,
          dailyStartTime: "09:00",
          dailyEndTime: "18:00",
          endTime: new Date("2025-12-31"),
          votingDurationHours: 24,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for recurring challenge without daily times", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          isRecurring: true,
          recurringDays: 7,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for recurring challenge without days", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          isRecurring: true,
          dailyStartTime: "09:00",
          dailyEndTime: "18:00",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for IMAGE_LOCATION with auto-approve", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "IMAGE_LOCATION",
          scoringCategory: "SPEED",
          autoApprove: true,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for TEXT auto-approve without expected phrase", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "TEXT",
          scoringCategory: "SPEED",
          autoApprove: true,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should auto-approve QR_CODE challenges", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        name: "QR Challenge",
        submissionType: "QR_CODE",
        scoringCategory: "SPEED",
        qrCodeValue: "SECRET",
      });

      expect(result).toBeDefined();
    });

    it("should auto-approve LOCATION challenges", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        name: "Location Challenge",
        submissionType: "LOCATION",
        scoringCategory: "SPEED",
        targetLatitude: 52.2297,
        targetLongitude: 21.0122,
      });

      expect(result).toBeDefined();
    });

    it("should create recurring challenge with proper window", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        name: "Recurring Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        isRecurring: true,
        recurringDays: 7,
        dailyStartTime: "09:00",
        dailyEndTime: "18:00",
        startTime: new Date("2025-01-01"),
      });

      expect(result).toBeDefined();
    });

    it("should activate challenge immediately when conditions met", async () => {
      const pastDate = new Date(Date.now() - 1000);
      const futureDate = new Date(Date.now() + 10000);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      await caller.create({
        tripId: "trip-1",
        name: "Auto Active Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        status: "VISIBLE",
        startTime: pastDate,
        endTime: futureDate,
      });

      // Should create activity for challenge start
      const { createChallengeStatusActivityById } = await import("../../../utils/activityFeed");
      expect(createChallengeStatusActivityById).toHaveBeenCalled();
    });

    it("should precreate recurring instances for recurring challenge", async () => {
      const { precreateRecurringInstancesForTemplate } = await import("../../../utils/recurringChallenges");

      mockDb.challenge.create.mockResolvedValue({
        ...mockChallenge,
        isRecurring: true,
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      await caller.create({
        tripId: "trip-1",
        name: "Recurring Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        isRecurring: true,
        recurringDays: 7,
        dailyStartTime: "09:00",
        dailyEndTime: "18:00",
        startTime: new Date("2025-01-01"),
      });

      expect(precreateRecurringInstancesForTemplate).toHaveBeenCalled();
    });

    it("should validate challenge image URL", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        name: "Challenge with Image",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        image: "https://example.com/image.jpg",
      });

      expect(result).toBeDefined();
    });

    it("should reject invalid image URL", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      normalizeSupabaseStoragePath.mockReturnValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
          image: "not-a-valid-url",
        })
      ).rejects.toThrow();
    });
  });

  describe("update (adminProcedure)", () => {
    it("should update challenge name", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.update({
        id: "challenge-1",
        tripId: "trip-1",
        name: "Updated Challenge",
      });

      expect(result.name).toBe("Test Challenge");
      expect(mockDb.challenge.update).toHaveBeenCalled();
    });

    it("should throw NOT_FOUND when challenge does not exist", async () => {
      mockDb.challenge.findFirst.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "nonexistent",
          tripId: "trip-1",
          name: "Updated Challenge",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should update challenge status and create activity", async () => {
      const { createChallengeStatusActivityFromTransition } = await import("../../../utils/activityFeed");

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      await caller.update({
        id: "challenge-1",
        tripId: "trip-1",
        status: "ACTIVE",
      });

      expect(createChallengeStatusActivityFromTransition).toHaveBeenCalled();
    });

    it("should validate peer voting transition to voting phase", async () => {
      mockDb.challenge.findFirst.mockResolvedValue({
        ...mockChallenge,
        scoringCategory: "PEER_VOTING",
        submissionType: "IMAGE",
        status: "ACTIVE",
        votingDurationHours: 24,
        votingStartTime: new Date("2025-12-31"),
        votingEndTime: new Date("2026-01-01"),
        endTime: new Date("2025-12-31"),
      });

      mockDb.challengeSubmission.count.mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.update({
        id: "challenge-1",
        tripId: "trip-1",
        status: "VOTING_PHASE",
      });

      expect(result).toBeDefined();
    });

    it("should throw error when transitioning to voting phase with no submissions", async () => {
      mockDb.challenge.findFirst.mockResolvedValue({
        ...mockChallenge,
        scoringCategory: "PEER_VOTING",
        submissionType: "IMAGE",
        status: "ACTIVE",
      });

      mockDb.challengeSubmission.count.mockResolvedValue(0);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "challenge-1",
          tripId: "trip-1",
          status: "VOTING_PHASE",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error when transitioning to voting phase with pending submissions", async () => {
      mockDb.challenge.findFirst.mockResolvedValue({
        ...mockChallenge,
        scoringCategory: "PEER_VOTING",
        submissionType: "IMAGE",
        status: "ACTIVE",
      });

      mockDb.challengeSubmission.count.mockResolvedValueOnce(5) // total submissions
        .mockResolvedValueOnce(2); // pending submissions

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "challenge-1",
          tripId: "trip-1",
          status: "VOTING_PHASE",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should update recurring challenge with inferred days", async () => {
      mockDb.challenge.findFirst.mockResolvedValue({
        ...mockChallenge,
        isRecurring: true,
        dailyStartTime: "09:00",
        dailyEndTime: "18:00",
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.update({
        id: "challenge-1",
        tripId: "trip-1",
        isRecurring: true,
        recurringDays: 7,
      });

      expect(result).toBeDefined();
    });

    it("should update challenge with new submission type", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.update({
        id: "challenge-1",
        tripId: "trip-1",
        submissionType: "QR_CODE",
        qrCodeValue: "NEWCODE",
      });

      expect(result).toBeDefined();
    });

    it("should handle description set to empty string", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.update({
        id: "challenge-1",
        tripId: "trip-1",
        description: "",
      });

      expect(result).toBeDefined();
    });

    it("should validate peer voting timeline on update", async () => {
      mockDb.challenge.findFirst.mockResolvedValue({
        ...mockChallenge,
        scoringCategory: "PEER_VOTING",
        submissionType: "IMAGE",
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "challenge-1",
          tripId: "trip-1",
          votingDurationHours: 0,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for IMAGE_LOCATION with auto-approve on update", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "challenge-1",
          tripId: "trip-1",
          submissionType: "IMAGE_LOCATION",
          autoApprove: true,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error for TEXT auto-approve without expected phrase on update", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.update({
          id: "challenge-1",
          tripId: "trip-1",
          submissionType: "TEXT",
          autoApprove: true,
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should precreate recurring instances on update", async () => {
      const { precreateRecurringInstancesForTemplate } = await import("../../../utils/recurringChallenges");

      mockDb.challenge.findFirst.mockResolvedValue({
        ...mockChallenge,
        isRecurring: true,
        dailyStartTime: "09:00",
        dailyEndTime: "18:00",
        startTime: new Date("2025-01-01"),
      });
      mockDb.challenge.update.mockResolvedValue(createMockChallenge({ isRecurring: true }));

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      await caller.update({
        id: "challenge-1",
        tripId: "trip-1",
        isRecurring: true,
        recurringDays: 7,
      });

      expect(precreateRecurringInstancesForTemplate).toHaveBeenCalled();
    });
  });

  describe("delete (adminProcedure)", () => {
    it("should delete challenge", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.delete({ id: "challenge-1", tripId: "trip-1" });

      expect(result.success).toBe(true);
      expect(mockDb.challenge.delete).toHaveBeenCalledWith({
        where: { id: "challenge-1" },
      });
    });

    it("should throw NOT_FOUND when challenge does not exist", async () => {
      mockDb.challenge.findFirst.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.delete({ id: "nonexistent", tripId: "trip-1" })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("forceCloseVoting (adminProcedure)", () => {
    it("should force close voting for peer voting challenge", async () => {
      mockDb.challenge.findFirst.mockResolvedValue({
        ...mockChallenge,
        scoringCategory: "PEER_VOTING",
        submissionType: "IMAGE",
        status: "VOTING_PHASE",
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.forceCloseVoting({ id: "challenge-1", tripId: "trip-1" });

      expect(result).toBeDefined();
      expect(mockDb.challenge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "COMPLETED",
          }),
        })
      );
    });

    it("should throw NOT_FOUND when challenge does not exist", async () => {
      mockDb.challenge.findFirst.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.forceCloseVoting({ id: "nonexistent", tripId: "trip-1" })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw BAD_REQUEST for non-peer voting challenge", async () => {
      mockDb.challenge.findFirst.mockResolvedValue({
        ...mockChallenge,
        scoringCategory: "SPEED",
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.forceCloseVoting({ id: "challenge-1", tripId: "trip-1" })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw BAD_REQUEST when challenge is not in voting phase", async () => {
      mockDb.challenge.findFirst.mockResolvedValue({
        ...mockChallenge,
        scoringCategory: "PEER_VOTING",
        submissionType: "IMAGE",
        status: "ACTIVE",
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.forceCloseVoting({ id: "challenge-1", tripId: "trip-1" })
      ).rejects.toThrow(TRPCError);
    });

    it("should create activity on force close", async () => {
      const { createChallengeStatusActivityFromTransition } = await import("../../../utils/activityFeed");

      mockDb.challenge.findFirst.mockResolvedValue({
        ...mockChallenge,
        scoringCategory: "PEER_VOTING",
        submissionType: "IMAGE",
        status: "VOTING_PHASE",
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      await caller.forceCloseVoting({ id: "challenge-1", tripId: "trip-1" });

      expect(createChallengeStatusActivityFromTransition).toHaveBeenCalled();
    });
  });

  describe("Input validation", () => {
    it("should validate tripId is required", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.create({
          name: "Test Challenge",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
        })
      ).rejects.toThrow();
    });

    it("should validate name is non-empty", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
        })
      ).rejects.toThrow();
    });

    it("should validate submissionType enum", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Test Challenge",
          // @ts-expect-error - Testing invalid enum value
          submissionType: "INVALID_TYPE",
          scoringCategory: "SPEED",
        })
      ).rejects.toThrow();
    });

    it("should validate scoringCategory enum", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Test Challenge",
          submissionType: "IMAGE",
          // @ts-expect-error - Testing invalid enum value
          scoringCategory: "INVALID_CATEGORY",
        })
      ).rejects.toThrow();
    });

    it("should validate pagination limit range", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.getAllByTrip({
          tripId: "trip-1",
          pagination: { limit: 101, offset: 0 },
        })
      ).rejects.toThrow();
    });

    it("should validate pagination offset is non-negative", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.getAllByTrip({
          tripId: "trip-1",
          pagination: { limit: 10, offset: -1 },
        })
      ).rejects.toThrow();
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle database errors gracefully", async () => {
      mockDb.challenge.findMany.mockRejectedValue(new Error("Test error"));

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(caller.getAll()).rejects.toThrow();
    });

    it("should handle missing supabase storage signed URL", async () => {
      const { normalizeSupabaseStoragePath } = await import("../../../utils/storage");
      normalizeSupabaseStoragePath.mockReturnValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAll();

      expect(result).toHaveLength(1);
      expect(result[0].image).toBe("challenge/test-image.jpg");
    });

    it("should handle participant without group", async () => {
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAllByTrip({ tripId: "trip-1" });

      expect(result.challenges[0]).toHaveProperty("myGroupSubmissionStatus", null);
    });

    it("should handle challenge with external URL image", async () => {
      mockDb.challenge.findMany.mockResolvedValue([
        { ...mockChallenge, id: "challenge-external", image: "https://external.com/image.jpg" }
      ]);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAll();

      expect(result[0].image).toBe("https://external.com/image.jpg");
    });

    it("should handle challenge without image", async () => {
      mockDb.challenge.findMany.mockResolvedValue([
        { ...mockChallenge, id: "challenge-no-image", image: null }
      ]);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getAll();

      expect(result[0].image).toBeNull();
    });

    it("should handle transaction errors", async () => {
      mockDb.$transaction.mockRejectedValue(new Error("Test error"));

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer admin-token" }),
        accessToken: "admin-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          name: "Test Challenge",
          submissionType: "IMAGE",
          scoringCategory: "SPEED",
        })
      ).rejects.toThrow();
    });
  });
});
