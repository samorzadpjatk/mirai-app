/* eslint-disable @typescript-eslint/no-unsafe-call */
 
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { submissionReportRouter } from "../../routers/submissionReport";
import { createCallerFactory } from "../../trpc";
import type { TRPCContext } from "../../trpc";
import type { SupabaseClient } from "@mirai-app/supabase";
import type { PrismaClient, User, TripParticipant, ChallengeSubmission, SubmissionReport } from "@mirai-app/db";
import { TRPCError } from "@trpc/server";
import * as authEmails from "../../../utils/authEmails";
import * as tripGuards from "../../../utils/tripGuards";

// Mock utility modules
vi.mock("../../../utils/authEmails", () => ({
  buildAuthEmailLookup: vi.fn(),
  resolveAuthEmail: vi.fn((lookup: Map<string, string | null>, authUserId: string | null | undefined): string | null => {
    if (!authUserId) return null;
    return lookup.get(authUserId) ?? null;
  }),
}));

vi.mock("../../../utils/tripGuards", () => ({
  ensureTripNotEnded: vi.fn(),
}));

const createCaller = createCallerFactory(submissionReportRouter);

describe("submissionReportRouter", () => {
  let mockDb: PrismaClient;
  let mockSupabase: SupabaseClient;
  let mockUser: User;
  let mockModerator: User;
  let mockParticipant: TripParticipant;
  let mockSubmission: ChallengeSubmission;
  let mockReport: SubmissionReport;
  let mockBuildAuthEmailLookup: ReturnType<typeof vi.mocked<typeof authEmails.buildAuthEmailLookup>>;
  let mockEnsureTripNotEnded: ReturnType<typeof vi.mocked<typeof tripGuards.ensureTripNotEnded>>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockBuildAuthEmailLookup = vi.mocked(authEmails.buildAuthEmailLookup);
    mockEnsureTripNotEnded = vi.mocked(tripGuards.ensureTripNotEnded);
    mockEnsureTripNotEnded.mockResolvedValue(undefined);

    mockUser = {
      id: "user-db-id",
      authUserId: "auth-user-1",
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

    mockModerator = {
      id: "moderator-db-id",
      authUserId: "auth-moderator-1",
      email: "moderator@example.com",
      firstName: "Moderator",
      lastName: "User",
      hasAvatar: false,
      wristNumber: null,
      houseNumber: null,
      role: "MODERATOR",
      groupId: "group-1",
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockParticipant = {
      id: "participant-1",
      userId: "user-db-id",
      tripId: "trip-1",
      groupId: "group-1",
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockSubmission = {
      id: "submission-1",
      challengeId: "challenge-1",
      groupId: "group-1",
      status: "PENDING",
      content: "Test submission",
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReport = {
      id: "report-1",
      submissionId: "submission-1",
      reporterId: "participant-1",
      reason: "Inappropriate content",
      details: "This submission contains offensive material",
      createdAt: new Date(),
      reporter: {
        id: "participant-1",
        user: {
          id: "user-db-id",
          firstName: "Test",
          lastName: "User",
          authUserId: "auth-user-1",
        },
      },
    } as unknown as SubmissionReport;

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "auth-user-1", email: "user@example.com" } },
          error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: "user-token" } },
          error: null,
        }),
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { id: "auth-user-1", email: "user@example.com" } },
            error: null,
          }),
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
    } as unknown as SupabaseClient;

    // Setup mock database client
    mockDb = {
      tripParticipant: {
        findUnique: vi.fn().mockResolvedValue(mockParticipant),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([mockParticipant]),
        create: vi.fn().mockResolvedValue(mockParticipant),
        update: vi.fn().mockResolvedValue(mockParticipant),
        delete: vi.fn().mockResolvedValue(mockParticipant),
        count: vi.fn().mockResolvedValue(1),
      },
      challengeSubmission: {
        findFirst: vi.fn().mockResolvedValue(mockSubmission),
        findUnique: vi.fn().mockResolvedValue(mockSubmission),
        findMany: vi.fn().mockResolvedValue([mockSubmission]),
        create: vi.fn().mockResolvedValue(mockSubmission),
        update: vi.fn().mockResolvedValue(mockSubmission),
        delete: vi.fn().mockResolvedValue(mockSubmission),
        count: vi.fn().mockResolvedValue(1),
      },
      submissionReport: {
        findMany: vi.fn().mockResolvedValue([mockReport]),
        findUnique: vi.fn().mockResolvedValue(mockReport),
        findFirst: vi.fn().mockResolvedValue(mockReport),
        create: vi.fn((args: { data: { submissionId: string; reporterId: string; reason: string; details?: string } }) => 
          Promise.resolve({
            ...mockReport,
            submissionId: args.data.submissionId,
            reporterId: args.data.reporterId,
            reason: args.data.reason,
            details: args.data.details,
          })
        ),
        update: vi.fn().mockResolvedValue(mockReport),
        delete: vi.fn().mockResolvedValue(mockReport),
        count: vi.fn().mockResolvedValue(1),
      },
      trip: {
        findUnique: vi.fn().mockResolvedValue({
          id: "trip-1",
          name: "Test Trip",
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        }),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(1),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(mockUser),
        findUnique: vi.fn().mockResolvedValue(mockUser),
        findMany: vi.fn().mockResolvedValue([mockUser]),
        create: vi.fn().mockResolvedValue(mockUser),
        update: vi.fn().mockResolvedValue(mockUser),
        delete: vi.fn().mockResolvedValue(mockUser),
        count: vi.fn().mockResolvedValue(1),
      },
      $transaction: vi.fn(<T>(cb: (db: typeof mockDb) => T): T => cb(mockDb)),
    } as unknown as PrismaClient;
  });

  describe("create (protectedProcedure)", () => {
    it("should create a submission report successfully", async () => {
      mockBuildAuthEmailLookup.mockResolvedValue(
        new Map([["auth-user-1", "user@example.com"]])
      );

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        submissionId: "submission-1",
        reason: "Inappropriate content",
        details: "This submission contains offensive material",
      });

      expect(result).toBeDefined();
      expect(result.reason).toBe("Inappropriate content");
      expect(result.details).toBe("This submission contains offensive material");
      expect(result.submissionId).toBe("submission-1");
      expect(result.reporter).toBeDefined();
      expect(result.reporter.user.email).toBe("user@example.com");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.submissionReport.create).toHaveBeenCalledWith({
        data: {
          submissionId: "submission-1",
          reporterId: "participant-1",
          reason: "Inappropriate content",
          details: "This submission contains offensive material",
        },
         
        select: expect.any(Object),
      });
    });

    it("should create a report without optional details", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        submissionId: "submission-1",
        reason: "Spam",
      });

      expect(result).toBeDefined();
      expect(result.reason).toBe("Spam");
      expect(result.details).toBeUndefined();
    });

    it("should throw FORBIDDEN when user is not a trip participant", async () => {
       
      mockDb.tripParticipant.findUnique.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          submissionId: "submission-1",
          reason: "Inappropriate content",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw NOT_FOUND when submission does not exist", async () => {
       
      mockDb.challengeSubmission.findFirst.mockResolvedValue(null);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          submissionId: "nonexistent-submission",
          reason: "Inappropriate content",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should throw error when trip has ended", async () => {
      mockEnsureTripNotEnded.mockImplementation(() => {
        throw new TRPCError({ code: "FORBIDDEN", message: "Trip has ended" });
      });

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          submissionId: "submission-1",
          reason: "Inappropriate content",
        })
      ).rejects.toThrow(TRPCError);
    });

    it("should validate reason is non-empty", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          submissionId: "submission-1",
          reason: "",
        })
      ).rejects.toThrow();
    });

    it("should validate tripId is required", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.create({
          submissionId: "submission-1",
          reason: "Inappropriate content",
        })
      ).rejects.toThrow();
    });

    it("should validate submissionId is required", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.create({
          tripId: "trip-1",
          reason: "Inappropriate content",
        })
      ).rejects.toThrow();
    });

    it("should handle database errors gracefully", async () => {
       
      mockDb.submissionReport.create.mockRejectedValue(new Error("Database error"));

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          submissionId: "submission-1",
          reason: "Inappropriate content",
        })
      ).rejects.toThrow();
    });

    it("should handle missing auth email gracefully", async () => {
      mockBuildAuthEmailLookup.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        submissionId: "submission-1",
        reason: "Inappropriate content",
      });

      expect(result.reporter.user.email).toBeNull();
    });
  });

  describe("getBySubmission (moderatorProcedure)", () => {
    it("should return all reports for a submission", async () => {
      const mockReports = [
        {
          ...mockReport,
          id: "report-1",
          reason: "Spam",
          reporter: {
            id: "participant-1",
            user: {
              id: "user-db-id",
              firstName: "Test",
              lastName: "User",
              authUserId: "auth-user-1",
            },
          },
        },
        {
          ...mockReport,
          id: "report-2",
          reason: "Inappropriate content",
          details: "Offensive material",
          reporter: {
            id: "participant-2",
            user: {
              id: "user-db-id-2",
              firstName: "Another",
              lastName: "User",
              authUserId: "auth-user-2",
            },
          },
        },
      ];

       
      mockDb.submissionReport.findMany.mockResolvedValue(mockReports);

      mockBuildAuthEmailLookup.mockResolvedValue(
        new Map([
          ["auth-user-1", "user1@example.com"],
          ["auth-user-2", "user2@example.com"],
        ])
      );

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer moderator-token" }),
        accessToken: "moderator-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getBySubmission({ submissionId: "submission-1" });

      expect(result).toHaveLength(2);
      expect(result[0].reason).toBe("Spam");
      expect(result[1].reason).toBe("Inappropriate content");
      expect(result[0].reporter.user.email).toBe("user1@example.com");
      expect(result[1].reporter.user.email).toBe("user2@example.com");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.submissionReport.findMany).toHaveBeenCalledWith({
        where: { submissionId: "submission-1" },
         
        select: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return empty array when no reports exist", async () => {
       
      mockDb.submissionReport.findMany.mockResolvedValue([]);

      mockBuildAuthEmailLookup.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer moderator-token" }),
        accessToken: "moderator-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getBySubmission({ submissionId: "submission-1" });

      expect(result).toHaveLength(0);
    });

    it("should order reports by createdAt descending", async () => {
      const mockReports = [
        {
          ...mockReport,
          id: "report-1",
          createdAt: new Date("2025-01-01"),
          reporter: {
            id: "participant-1",
            user: {
              id: "user-db-id",
              firstName: "Test",
              lastName: "User",
              authUserId: "auth-user-1",
            },
          },
        },
        {
          ...mockReport,
          id: "report-2",
          createdAt: new Date("2025-01-02"),
          reporter: {
            id: "participant-2",
            user: {
              id: "user-db-id-2",
              firstName: "Another",
              lastName: "User",
              authUserId: "auth-user-2",
            },
          },
        },
      ];

       
      mockDb.submissionReport.findMany.mockResolvedValue(mockReports);

      mockBuildAuthEmailLookup.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer moderator-token" }),
        accessToken: "moderator-token",
      };

      const caller = createCaller(ctx);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _result = await caller.getBySubmission({ submissionId: "submission-1" });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockDb.submissionReport.findMany).toHaveBeenCalledWith(
         
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });

    it("should validate submissionId is required", async () => {
      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer moderator-token" }),
        accessToken: "moderator-token",
      };

      const caller = createCaller(ctx);

      await expect(
        // @ts-expect-error - Testing missing required field
        caller.getBySubmission({})
      ).rejects.toThrow();
    });

    it("should handle database errors gracefully", async () => {
       
      mockDb.submissionReport.findMany.mockRejectedValue(new Error("Database error"));

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer moderator-token" }),
        accessToken: "moderator-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.getBySubmission({ submissionId: "submission-1" })
      ).rejects.toThrow();
    });

    it("should handle missing auth emails gracefully", async () => {
      const mockReports = [
        {
          ...mockReport,
          reporter: {
            id: "participant-1",
            user: {
              id: "user-db-id",
              firstName: "Test",
              lastName: "User",
              authUserId: "auth-user-1",
            },
          },
        },
      ];

       
      mockDb.submissionReport.findMany.mockResolvedValue(mockReports);

      mockBuildAuthEmailLookup.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer moderator-token" }),
        accessToken: "moderator-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getBySubmission({ submissionId: "submission-1" });

      expect(result[0].reporter.user.email).toBeNull();
    });

    it("should handle null authUserId gracefully", async () => {
      const mockReports = [
        {
          ...mockReport,
          reporter: {
            id: "participant-1",
            user: {
              id: "user-db-id",
              firstName: "Test",
              lastName: "User",
              authUserId: null,
            },
          },
        },
      ];

       
      mockDb.submissionReport.findMany.mockResolvedValue(mockReports);

      mockBuildAuthEmailLookup.mockResolvedValue(new Map());

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer moderator-token" }),
        accessToken: "moderator-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.getBySubmission({ submissionId: "submission-1" });

      expect(result[0].reporter.user.email).toBeNull();
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle participant without groupId", async () => {
      const participantWithoutGroup = {
        ...mockParticipant,
        groupId: null,
      };
       
      mockDb.tripParticipant.findUnique.mockResolvedValue(participantWithoutGroup);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        submissionId: "submission-1",
        reason: "Inappropriate content",
      });

      expect(result).toBeDefined();
    });

    it("should handle database errors during create", async () => {
       
      mockDb.submissionReport.create.mockRejectedValue(new Error("Database error"));

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);

      await expect(
        caller.create({
          tripId: "trip-1",
          submissionId: "submission-1",
          reason: "Inappropriate content",
        })
      ).rejects.toThrow();
    });

    it("should handle very long reason text", async () => {
      const longReason = "a".repeat(1000);

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        submissionId: "submission-1",
        reason: longReason,
      });

      expect(result.reason).toBe(longReason);
    });

    it("should handle special characters in reason and details", async () => {
      const specialReason = "Inappropriate <script>alert('xss')</script> content";
      const specialDetails = "Details with unicode: 日本語 🎉 \\n \\t";

      const ctx: TRPCContext = {
        db: mockDb,
        supabase: mockSupabase,
        headers: new Headers({ Authorization: "Bearer user-token" }),
        accessToken: "user-token",
      };

      const caller = createCaller(ctx);
      const result = await caller.create({
        tripId: "trip-1",
        submissionId: "submission-1",
        reason: specialReason,
        details: specialDetails,
      });

      expect(result.reason).toBe(specialReason);
      expect(result.details).toBe(specialDetails);
    });
  });
});