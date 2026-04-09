import { describe, expect, test, mock, beforeEach } from "bun:test";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { appRouter } from "../../root";
import { createCallerFactory } from "../../trpc";

const createCaller = createCallerFactory(appRouter);

const mockDb = () => {
  return {
    user: {
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve({})),
      create: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
      count: mock(() => Promise.resolve({ count: 0 })),
    },
    tripParticipant: {
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
      upsert: mock(() => Promise.resolve({})),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
      count: mock(() => Promise.resolve(0)),
    },
    group: {
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      findMany: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve({})),
      create: mock(() => Promise.resolve({})),
      count: mock(() => Promise.resolve({ count: 0 })),
    },
    $transaction: async (callback: (tx: any) => Promise<any>) =>
      callback(mockDb()),
  } as any;
};

const mockSupabase = () => {
  return {
    auth: {
      getUser: mock(() =>
        Promise.resolve({ data: { user: null }, error: null }),
      ),
      admin: {
        getUserById: mock(() =>
          Promise.resolve({ data: { user: null }, error: null }),
        ),
        listUsers: mock(() =>
          Promise.resolve({ data: { users: [] }, error: null }),
        ),
        createUser: mock(() =>
          Promise.resolve({ data: { user: null }, error: null }),
        ),
        updateUserById: mock(() =>
          Promise.resolve({ data: { user: null }, error: null }),
        ),
        deleteUser: mock(() => Promise.resolve({ error: null })),
      },
    },
    storage: {
      from: mock(() => ({ uploadFile: mock(), downloadFile: mock() })),
    },
  } as any;
};

describe("[INTEGRATION] user router", () => {
  let mockCtx: any;

  const setupAuthMocks = (role: "USER" | "MODERATOR" | "ADMIN" = "USER") => {
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-user-1` } },
      error: null,
    });
    mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: `auth-user-1` } },
      error: null,
    });
    mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
      data: { user: { id: "auth-user-1", banned_until: null } },
      error: null,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "user-1",
      authUserId: "auth-user-1",
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
    mockCtx.db.user.findFirst.mockResolvedValueOnce({
      id: "user-1",
      authUserId: "auth-user-1",
      firstName: "John",
      lastName: "Doe",
      role: role,
    });
    mockCtx.dbUser.role = role;
  };

  beforeEach(() => {
    mockCtx = {
      db: mockDb(),
      supabase: mockSupabase(),
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

  describe("getBanStatus", () => {
    test("returns not banned when no access token", async () => {
      mockCtx.accessToken = null;
      const caller = createCaller(mockCtx);
      const result = await caller.user.getBanStatus();
      expect(result).toEqual({
        banned: false,
        bannedUntil: null,
        reason: null,
      });
    });

    test("returns not banned when user not found in supabase", async () => {
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.user.getBanStatus();
      expect(result.banned).toBe(false);
    });

    test("returns banned when user has valid ban", async () => {
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: "auth-user-1",
            banned_until: new Date(Date.now() + 86400000).toISOString(),
            app_metadata: { ban_reason: "Test ban" },
          },
        },
        error: null,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.user.getBanStatus();
      expect(result.banned).toBe(true);
      expect(result.reason).toBe("Test ban");
    });

    test("returns not banned when ban has expired", async () => {
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: "auth-user-1",
            banned_until: new Date(Date.now() - 86400000).toISOString(),
            app_metadata: { ban_reason: "Expired ban" },
          },
        },
        error: null,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.user.getBanStatus();
      expect(result.banned).toBe(false);
    });
  });

  describe("getBanStatusByEmail", () => {
    test("throws error when supabase fails", async () => {
      mockCtx.supabase.auth.admin.listUsers.mockResolvedValueOnce({
        data: null,
        error: { message: "Server error" },
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.user.getBanStatusByEmail({ email: "test@example.com" }),
      ).rejects.toThrow(TRPCError);
    });

    test("returns exists false when email not found", async () => {
      mockCtx.supabase.auth.admin.listUsers.mockResolvedValueOnce({
        data: { users: [] },
        error: null,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.user.getBanStatusByEmail({
        email: "notfound@example.com",
      });
      expect(result.exists).toBe(false);
    });

    test("returns banned status when user is banned", async () => {
      mockCtx.supabase.auth.admin.listUsers.mockResolvedValueOnce({
        data: { users: [{ id: "auth-user-1", email: "test@example.com" }] },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: "auth-user-1",
            banned_until: new Date(Date.now() + 86400000).toISOString(),
            app_metadata: { ban_reason: "Spam" },
          },
        },
        error: null,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.user.getBanStatusByEmail({
        email: "test@example.com",
      });
      expect(result.exists).toBe(true);
      expect(result.banned).toBe(true);
    });
  });

  describe("getMy", () => {
    test("returns user when found", async () => {
      const mockUser = {
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      };
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", email: "john@example.com" } },
        error: null,
      });
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", email: "john@example.com" } },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", banned_until: null } },
        error: null,
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce(mockUser);
      mockCtx.db.user.findFirst.mockResolvedValueOnce(mockUser);
      mockCtx.db.user.findUnique.mockResolvedValueOnce(mockUser);
      const caller = createCaller(mockCtx);
      const result = await caller.user.getMy();
      expect(result?.id).toBe("user-1");
    });

    test("throws unauthorized when user not in database", async () => {
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", email: "john@example.com" } },
        error: null,
      });
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", email: "john@example.com" } },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", banned_until: null } },
        error: null,
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce(null);
      mockCtx.db.user.findFirst.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(caller.user.getMy()).rejects.toThrow(TRPCError);
    });
  });

  describe("updateAvatar", () => {
    test("updates avatar successfully", async () => {
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", banned_until: null } },
        error: null,
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      });
      mockCtx.db.user.update.mockResolvedValueOnce({ hasAvatar: true });
      const caller = createCaller(mockCtx);
      const result = await caller.user.updateAvatar({ hasAvatar: true });
      expect(result.hasAvatar).toBe(true);
    });
  });

  describe("updateMyProfile", () => {
    test("updates profile successfully", async () => {
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", banned_until: null } },
        error: null,
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      });
      mockCtx.db.user.update.mockResolvedValueOnce({
        id: "user-1",
        firstName: "Jane",
        lastName: "Doe",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.user.updateMyProfile({
        firstName: "Jane",
        lastName: "Doe",
      });
      expect(result.firstName).toBe("Jane");
    });

    test("throws error for invalid name with digits", async () => {
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", banned_until: null } },
        error: null,
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.user.updateMyProfile({ firstName: "J4ne", lastName: "Doe" }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws error for name too short", async () => {
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", banned_until: null } },
        error: null,
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.user.updateMyProfile({ firstName: "J", lastName: "Doe" }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("updateUserAdminStatus", () => {
    test("admin cannot remove their own admin status", async () => {
      mockCtx.dbUser.id = "admin-user";
      mockCtx.dbUser.role = "ADMIN";
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-admin" } },
        error: null,
      });
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-admin" } },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "auth-admin", banned_until: null } },
        error: null,
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "admin-user",
        authUserId: "auth-admin",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "admin-user",
        authUserId: "auth-admin",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      });
      mockCtx.db.user.update.mockResolvedValueOnce({
        id: "admin-user",
        authUserId: "auth-admin",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.user.updateUserAdminStatus({
          userId: "admin-user",
          role: "USER",
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("admin can update other user roles", async () => {
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", banned_until: null } },
        error: null,
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "ADMIN",
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "ADMIN",
      });
      mockCtx.db.user.update.mockResolvedValueOnce({
        id: "user-2",
        authUserId: "auth-user-2",
        firstName: "Other",
        lastName: "User",
        role: "MODERATOR",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.user.updateUserAdminStatus({
        userId: "user-2",
        role: "MODERATOR",
      });
      expect(result.role).toBe("MODERATOR");
    });
  });

  describe("getAllAdminsNames", () => {
    test("returns all admins", async () => {
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1" } },
        error: null,
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "auth-user-1", banned_until: null } },
        error: null,
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "ADMIN",
      });
      mockCtx.db.user.findFirst.mockResolvedValueOnce({
        id: "user-1",
        authUserId: "auth-user-1",
        firstName: "John",
        lastName: "Doe",
        role: "ADMIN",
      });
      mockCtx.db.user.findMany.mockResolvedValueOnce([
        { id: "admin-1", firstName: "Admin", lastName: "One" },
        { id: "admin-2", firstName: "Admin", lastName: "Two" },
      ]);
      const caller = createCaller(mockCtx);
      const result = await caller.user.getAllAdminsNames();
      expect(result).toHaveLength(2);
    });
  });

  describe("getById", () => {
    test("returns user when found", async () => {
      setupAuthMocks("MODERATOR");
      mockCtx.db.user.findUnique.mockResolvedValueOnce({
        id: "user-2",
        authUserId: "auth-user-2",
        firstName: "Jane",
        lastName: "Smith",
        role: "USER",
      });
      mockCtx.supabase.auth.admin.listUsers = mock(() =>
        Promise.resolve({
          data: { users: [{ id: "auth-user-2", email: "jane@example.com" }] },
          error: null,
        }),
      );
      const caller = createCaller(mockCtx);
      const result = await caller.user.getById({ id: "user-2" });
      expect(result?.id).toBe("user-2");
    });

    test("returns null when user not found", async () => {
      setupAuthMocks("MODERATOR");
      mockCtx.db.user.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      const result = await caller.user.getById({ id: "nonexistent" });
      expect(result).toBeNull();
    });
  });

  describe("getAll", () => {
    test("returns all trip participants", async () => {
      setupAuthMocks("MODERATOR");
      mockCtx.db.tripParticipant.findMany.mockResolvedValueOnce([
        {
          id: "p1",
          userId: "user-1",
          tripId: "trip-1",
          wristNumber: "A1",
          houseNumber: "H1",
          user: {
            id: "user-1",
            authUserId: "auth-user-1",
            firstName: "John",
            lastName: "Doe",
            role: "USER",
          },
          group: { id: "group-1", name: "Group A" },
        },
      ]);
      mockCtx.supabase.auth.admin.listUsers = mock(() =>
        Promise.resolve({
          data: { users: [{ id: "auth-user-1", email: "john@example.com" }] },
          error: null,
        }),
      );
      const caller = createCaller(mockCtx);
      const result = await caller.user.getAll({ tripId: "trip-1" });
      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe("John");
    });
  });

  describe("createUser", () => {
    test.skip("creates new user successfully", async () => {});

    test("throws error when supabase auth fails", async () => {
      setupAuthMocks("ADMIN");
      mockCtx.supabase.auth.admin.createUser.mockResolvedValueOnce({
        data: null,
        error: { message: "Email already exists" },
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.user.createUser({
          tripId: "trip-1",
          firstName: "New",
          lastName: "User",
          email: "existing@example.com",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("updateName", () => {
    test("updates user name successfully", async () => {
      setupAuthMocks("ADMIN");
      mockCtx.db.user.update.mockResolvedValueOnce({
        id: "user-2",
        authUserId: "auth-user-2",
        firstName: "Updated",
        lastName: "Name",
        role: "USER",
      });
      mockCtx.supabase.auth.admin.listUsers = mock(() =>
        Promise.resolve({
          data: { users: [{ id: "auth-user-2", email: "user2@example.com" }] },
          error: null,
        }),
      );
      const caller = createCaller(mockCtx);
      const result = await caller.user.updateName({
        userId: "user-2",
        firstName: "Updated",
        lastName: "Name",
      });
      expect(result.firstName).toBe("Updated");
    });
  });

  describe("banUserUntil", () => {
    test("bans user successfully", async () => {
      setupAuthMocks("ADMIN");
      mockCtx.db.user.findUnique.mockResolvedValueOnce({
        id: "user-2",
        authUserId: "auth-user-2",
      });
      mockCtx.supabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { id: "auth-user-2", app_metadata: {} } },
        error: null,
      });
      mockCtx.supabase.auth.admin.updateUserById.mockResolvedValueOnce({
        data: {},
        error: null,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.user.banUserUntil({
        userId: "user-2",
        bannedUntilMs: Date.now() + 86400000,
        reason: "Test ban",
      });
      expect(result.bannedUntil).toBeDefined();
    });

    test("throws NOT_FOUND when user not found", async () => {
      setupAuthMocks("ADMIN");
      mockCtx.db.user.findUnique.mockResolvedValueOnce(null);
      const caller = createCaller(mockCtx);
      await expect(
        caller.user.banUserUntil({
          userId: "nonexistent",
          bannedUntilMs: Date.now() + 86400000,
        }),
      ).rejects.toThrow(TRPCError);
    });

    test("throws BAD_REQUEST when ban date is in the past", async () => {
      setupAuthMocks("ADMIN");
      mockCtx.db.user.findUnique.mockResolvedValueOnce({
        id: "user-2",
        authUserId: "auth-user-2",
      });
      const caller = createCaller(mockCtx);
      await expect(
        caller.user.banUserUntil({
          userId: "user-2",
          bannedUntilMs: Date.now() - 86400000,
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("deleteUser", () => {
    test.skip("deletes user from system when last trip", async () => {});

    test.skip("keeps user when other trips exist", async () => {});
  });

  describe("updateWristNumber", () => {
    test("updates wrist number successfully", async () => {
      setupAuthMocks("ADMIN");
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce(null);
      mockCtx.db.tripParticipant.upsert.mockResolvedValueOnce({
        user: {
          id: "user-2",
          authUserId: "auth-user-2",
          firstName: "John",
          lastName: "Doe",
          role: "USER",
        },
        wristNumber: "A5",
        tripId: "trip-1",
      });
      mockCtx.supabase.auth.admin.listUsers = mock(() =>
        Promise.resolve({
          data: { users: [{ id: "auth-user-2", email: "john@example.com" }] },
          error: null,
        }),
      );
      const caller = createCaller(mockCtx);
      const result = await caller.user.updateWristNumber({
        userId: "user-2",
        tripId: "trip-1",
        wristNumber: "A5",
      });
      expect(result.wristNumber).toBe("A5");
    });

    test("throws CONFLICT when wrist number already taken", async () => {
      setupAuthMocks("ADMIN");
      mockCtx.db.tripParticipant.findFirst.mockResolvedValueOnce({
        userId: "user-3",
        user: {
          id: "user-3",
          authUserId: "auth-user-3",
          firstName: "Other",
          lastName: "User",
          role: "USER",
        },
      });
      mockCtx.supabase.auth.admin.listUsers = mock(() =>
        Promise.resolve({
          data: { users: [{ id: "auth-user-3", email: "other@example.com" }] },
          error: null,
        }),
      );
      const caller = createCaller(mockCtx);
      await expect(
        caller.user.updateWristNumber({
          userId: "user-2",
          tripId: "trip-1",
          wristNumber: "A5",
        }),
      ).rejects.toThrow(TRPCError);
    });
  });

  describe("getTripParticipant", () => {
    test("returns participant info", async () => {
      setupAuthMocks("MODERATOR");
      mockCtx.db.tripParticipant.findUnique.mockResolvedValueOnce({
        userId: "user-1",
        tripId: "trip-1",
        wristNumber: "A1",
        houseNumber: "H1",
      });
      const caller = createCaller(mockCtx);
      const result = await caller.user.getTripParticipant({
        userId: "user-1",
        tripId: "trip-1",
      });
      expect(result?.wristNumber).toBe("A1");
    });
  });

  describe("getMyWithGroup", () => {
    test("returns user with group info", async () => {
      setupAuthMocks("USER");
      mockCtx.db.user.findUnique.mockResolvedValueOnce({
        id: "user-1",
        firstName: "John",
        lastName: "Doe",
        trips: [
          {
            tripId: "trip-1",
            group: { id: "group-1", name: "Group A" },
            trip: { id: "trip-1", name: "Trip 1" },
          },
        ],
        organizerGroup: null,
      });
      const caller = createCaller(mockCtx);
      const result = await caller.user.getMyWithGroup({ tripId: "trip-1" });
      expect(result?.trips[0]?.group?.name).toBe("Group A");
    });
  });

  describe("removeWristNumber", () => {
    test("removes wrist number successfully", async () => {
      setupAuthMocks("ADMIN");
      mockCtx.db.tripParticipant.update.mockResolvedValueOnce({
        user: {
          id: "user-2",
          authUserId: "auth-user-2",
          firstName: "John",
          lastName: "Doe",
          role: "USER",
        },
        wristNumber: null,
        tripId: "trip-1",
      });
      mockCtx.supabase.auth.admin.listUsers = mock(() =>
        Promise.resolve({
          data: { users: [{ id: "auth-user-2", email: "john@example.com" }] },
          error: null,
        }),
      );
      const caller = createCaller(mockCtx);
      const result = await caller.user.removeWristNumber({
        userId: "user-2",
        tripId: "trip-1",
      });
      expect(result.wristNumber).toBeNull();
    });
  });

  describe("updateHouseNumber", () => {
    test("updates house number successfully", async () => {
      setupAuthMocks("ADMIN");
      mockCtx.db.tripParticipant.upsert.mockResolvedValueOnce({
        user: {
          id: "user-2",
          authUserId: "auth-user-2",
          firstName: "John",
          lastName: "Doe",
          role: "USER",
        },
        houseNumber: "H5",
        tripId: "trip-1",
      });
      mockCtx.supabase.auth.admin.listUsers = mock(() =>
        Promise.resolve({
          data: { users: [{ id: "auth-user-2", email: "john@example.com" }] },
          error: null,
        }),
      );
      const caller = createCaller(mockCtx);
      const result = await caller.user.updateHouseNumber({
        userId: "user-2",
        tripId: "trip-1",
        houseNumber: "H5",
      });
      expect(result.houseNumber).toBe("H5");
    });
  });

  describe("removeHouseNumber", () => {
    test("removes house number successfully", async () => {
      setupAuthMocks("ADMIN");
      mockCtx.db.tripParticipant.update.mockResolvedValueOnce({
        user: {
          id: "user-2",
          authUserId: "auth-user-2",
          firstName: "John",
          lastName: "Doe",
          role: "USER",
        },
        houseNumber: null,
        tripId: "trip-1",
      });
      mockCtx.supabase.auth.admin.listUsers = mock(() =>
        Promise.resolve({
          data: { users: [{ id: "auth-user-2", email: "john@example.com" }] },
          error: null,
        }),
      );
      const caller = createCaller(mockCtx);
      const result = await caller.user.removeHouseNumber({
        userId: "user-2",
        tripId: "trip-1",
      });
      expect(result.houseNumber).toBeNull();
    });
  });
});
