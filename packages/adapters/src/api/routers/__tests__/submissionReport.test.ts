import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => ({
  user: {
    findFirst: mock(() => Promise.resolve(null)),
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
  },
  tripParticipant: {
    findUnique: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
  },
  submissionReport: {
    findMany: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve({})),
  },
  challengeSubmission: {
    findFirst: mock(() => Promise.resolve(null)),
    findMany: mock(() => Promise.resolve([])),
  },
  trip: {
    findUnique: mock(() => Promise.resolve(null)),
  },
  $transaction: async (callback: (tx: any) => Promise<any>) =>
    callback(createMockDb()),
});

const createMockSupabase = () => ({
  auth: {
    getUser: mock(() => Promise.resolve({ data: { user: null }, error: null })),
    admin: {
      getUserById: mock(() =>
        Promise.resolve({
          data: { user: { id: "auth-user-1", banned_until: null } },
          error: null,
        }),
      ),
      listUsers: mock(() =>
        Promise.resolve({
          data: { users: [{ id: "auth-user-1", email: "john@example.com" }] },
          error: null,
        }),
      ),
    },
  },
});

// Helper to create mock DI context with auth use cases
const createMockDIContext = (userId: string, role: string) => {
  return {
    container: {} as any,
    resolve: mock(<T>(token: string): T => {
      if (token === "authenticateUserUseCase") {
        return {
          execute: mock(() =>
            Promise.resolve({
              kind: "ok" as const,
              value: {
                userId: userId,
                role: role,
                authUserId: `auth-${userId}`,
                email: "test@example.com",
              },
            }),
          ),
        } as unknown as T;
      }
      if (token === "authorizeModeratorUseCase") {
        return {
          execute: mock(() => ({ kind: "ok" as const, value: undefined })),
        } as unknown as T;
      }
      if (token === "authorizeAdminUseCase") {
        return {
          execute: mock(() => ({ kind: "ok" as const, value: undefined })),
        } as unknown as T;
      }
      throw new Error(`Unknown token: ${token}`);
    }),
    scope: {
      requestId: "test-request-id",
      dispose: () => Promise.resolve(),
      container: {} as any,
    },
  };
};

// Helper to create headers with authorization
const createAuthHeaders = (token = "test-token") => {
  const headers = new Headers();
  headers.set("authorization", `Bearer ${token}`);
  return headers;
};

describe("[INTEGRATION] submissionReport router", () => {
  let mockCtx: any;

  const setupUserMocks = (userId = "user-1", role = "USER") => {
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
    // Update DI context with proper auth mocks
    mockCtx.di = createMockDIContext(userId, role);
  };

  beforeEach(() => {
    const db = createMockDb();
    mockCtx = {
      db,
      supabase: createMockSupabase(),
      headers: createAuthHeaders(),
      accessToken: "test-token",
      dbUser: {
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER" as const,
      },
      di: createMockDIContext("user-1", "USER"),
    };
  });

  describe("create", () => {
    test("creates report successfully", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        id: "participant-1",
        userId: "user-1",
        tripId: "trip-1",
      });
      mockCtx.db.challengeSubmission.findFirst.mockResolvedValueOnce({
        id: "submission-1",
      });
      mockCtx.db.submissionReport.create.mockResolvedValueOnce({
        id: "report-1",
        submissionId: "submission-1",
        reporterId: "participant-1",
        reason: "Inappropriate content",
        details: "This is offensive",
        createdAt: new Date(),
        reporter: {
          id: "participant-1",
          user: {
            id: "user-1",
            firstName: "John",
            lastName: "Doe",
            authUserId: "auth-user-1",
          },
        },
      });
      mockCtx.supabase.auth.admin.listUsers = mock(() =>
        Promise.resolve({
          data: { users: [{ id: "auth-user-1", email: "john@example.com" }] },
          error: null,
        }),
      );
      const caller = createCaller(mockCtx);
      const result = await caller.submissionReport.create({
        tripId: "trip-1",
        submissionId: "submission-1",
        reason: "Inappropriate content",
        details: "This is offensive",
      });
      expect(result.id).toBe("report-1");
      expect(result.reason).toBe("Inappropriate content");
    });

    test("throws NOT_FOUND when submission not found", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        id: "participant-1",
        userId: "user-1",
        tripId: "trip-1",
      });
      mockCtx.db.challengeSubmission.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.submissionReport.create({
          tripId: "trip-1",
          submissionId: "nonexistent",
          reason: "test",
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws FORBIDDEN when user is not trip participant", async () => {
      setupUserMocks();
      mockCtx.db.trip.findUnique.mockResolvedValueOnce({
        id: "trip-1",
        endDate: new Date(Date.now() + 86400000),
      });
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.submissionReport.create({
          tripId: "trip-1",
          submissionId: "submission-1",
          reason: "test",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getBySubmission", () => {
    test("returns reports for submission", async () => {
      setupUserMocks("user-1", "MODERATOR");
      mockCtx.db.submissionReport.findMany.mockResolvedValueOnce([
        {
          id: "report-1",
          submissionId: "submission-1",
          reporterId: "participant-1",
          reason: "Inappropriate content",
          details: "This is offensive",
          createdAt: new Date(),
          reporter: {
            id: "participant-1",
            user: {
              id: "user-1",
              firstName: "John",
              lastName: "Doe",
              authUserId: "auth-user-1",
            },
          },
        },
      ]);
      mockCtx.supabase.auth.admin.listUsers = mock(() =>
        Promise.resolve({
          data: { users: [{ id: "auth-user-1", email: "john@example.com" }] },
          error: null,
        }),
      );
      const caller = createCaller(mockCtx);
      const result = await caller.submissionReport.getBySubmission({
        submissionId: "submission-1",
      });
      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe("Inappropriate content");
    });

    test("returns empty array when no reports exist", async () => {
      setupUserMocks("user-1", "MODERATOR");
      mockCtx.db.submissionReport.findMany.mockResolvedValueOnce([]);
      const caller = createCaller(mockCtx);
      const result = await caller.submissionReport.getBySubmission({
        submissionId: "submission-1",
      });
      expect(result).toHaveLength(0);
    });
  });
});
