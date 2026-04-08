import { describe, expect, test, mock, beforeEach } from "bun:test";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const createMockDb = () => {
  const db = {
    user: {
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
    },
    challenge: {
      findUnique: mock(() => Promise.resolve(null)),
      findFirst: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve({})),
      update: mock(() => Promise.resolve({})),
      updateMany: mock(() => Promise.resolve({ count: 0 })),
      delete: mock(() => Promise.resolve({})),
      count: mock(() => Promise.resolve({ count: 0 })),
    },
    tripParticipant: {
      findUnique: mock(() => Promise.resolve(null)),
      findFirst: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
    },
    challengeSubmission: {
      groupBy: mock(() => Promise.resolve([])),
      findMany: mock(() => Promise.resolve([])),
      count: mock(() => Promise.resolve({ count: 0 })),
    },
    trip: {
      findUnique: mock(() => Promise.resolve(null)),
    },
    recurringChallengeInstance: {
      findFirst: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
    },
    activityFeed: {
      findMany: mock(() => Promise.resolve([])),
      create: mock(() => Promise.resolve({})),
    },
  };
  db.$transaction = async (callback: (tx: any) => Promise<any>) =>
    callback(createMockDb());
  return db;
};

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
          data: { signedUrl: "https://signed.url/image.jpg" },
          error: null,
        }),
      }),
    },
  };
};

describe("challenge router", () => {
  let mockCtx: any;

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

  beforeEach(() => {
    const db = createMockDb();
    mockCtx = {
      db,
      supabase: createMockSupabase(),
      headers: new Headers(),
      accessToken: "test-token",
      dbUser: {
        id: "admin-1",
        authUserId: "auth-admin-1",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
      },
    };
  });

  describe("getAll", () => {
    test.skip("admin can get all challenges", async () => {});
  });

  describe("getAllByTrip", () => {
    test.skip("returns paginated challenges for trip", async () => {});
  });

  describe("getById", () => {
    test.skip("returns challenge when found", async () => {});

    test.skip("throws NOT_FOUND when challenge not found", async () => {});
  });

  describe("create", () => {
    test("creates challenge successfully", async () => {
      setupAdminMocks();
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            challenge: {
              create: mock().mockResolvedValueOnce({
                id: "new-challenge",
                name: "New Challenge",
                status: "HIDDEN",
                submissionType: "IMAGE",
                scoringCategory: "SPEED",
              }),
            },
            activityFeed: { findMany: mock().mockResolvedValue([]) },
          });
        },
      );
      const caller = createCaller(mockCtx);
      const result = await caller.challenge.create({
        tripId: "trip-1",
        name: "New Challenge",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
      });
      expect(result.name).toBe("New Challenge");
    });

    test("throws error for invalid recurring peer voting", async () => {
      setupAdminMocks();
      const caller = createCaller(mockCtx);
      await expect(
        caller.challenge.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "IMAGE",
          scoringCategory: "PEER_VOTING",
          isRecurring: true,
          recurringDays: 5,
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws error for IMAGE_LOCATION with autoApprove", async () => {
      setupAdminMocks();
      const caller = createCaller(mockCtx);
      await expect(
        caller.challenge.create({
          tripId: "trip-1",
          name: "Invalid Challenge",
          submissionType: "IMAGE_LOCATION",
          scoringCategory: "SPEED",
          autoApprove: true,
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("update", () => {
    test("updates challenge successfully", async () => {
      setupAdminMocks();
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
        status: "ACTIVE",
        submissionType: "IMAGE",
        scoringCategory: "SPEED",
        isRecurring: false,
      });
      mockCtx.db.$transaction = mock().mockImplementation(
        async (callback: any) => {
          return callback({
            challenge: {
              update: mock().mockResolvedValueOnce({
                id: "challenge-1",
                name: "Updated Challenge",
              }),
            },
            activityFeed: { findMany: mock().mockResolvedValue([]) },
          });
        },
      );
      const caller = createCaller(mockCtx);
      const result = await caller.challenge.update({
        id: "challenge-1",
        tripId: "trip-1",
        name: "Updated Challenge",
      });
      expect(result.name).toBe("Updated Challenge");
    });

    test("throws NOT_FOUND when challenge not found", async () => {
      setupAdminMocks();
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.challenge.update({ id: "nonexistent", tripId: "trip-1" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("delete", () => {
    test("deletes challenge successfully", async () => {
      setupAdminMocks();
      mockCtx.db.challenge.findFirst.mockResolvedValueOnce({
        id: "challenge-1",
      });
      mockCtx.db.challenge.delete.mockResolvedValueOnce({ id: "challenge-1" });
      const caller = createCaller(mockCtx);
      const result = await caller.challenge.delete({
        id: "challenge-1",
        tripId: "trip-1",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("forceCloseVoting", () => {
    test.skip("force closes voting for peer voting challenge", async () => {});

    test.skip("throws error when challenge is not peer voting", async () => {});

    test.skip("throws error when challenge not in voting phase", async () => {});
  });
});
