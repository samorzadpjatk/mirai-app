import type { User } from "@mirai-app/db";
import { users } from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { createMockSupabaseClient, createMockSupabaseUser } from "@mirai-app/shared/test-utils";
import { logger } from "@mirai-app/shared/utils";
import type { SupabaseClient, SupabaseUser } from "@mirai-app/supabase";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthenticationError,
  AuthorizationError,
  getAuthServerUser,
  getSession,
  hasRequiredRole,
  mapDatabaseUserToAuthUser,
  parseRolesFromToken,
  requireAdmin,
  requireAuth,
  requireModerator,
  syncUserToDatabase,
} from "../authServer";

vi.mock("@mirai-app/shared/utils", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@mirai-app/shared/users", () => ({
  formatDisplayName: (
    firstName?: string | null,
    lastName?: string | null,
    fallback?: string | null,
  ) => {
    const parts = [firstName, lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : (fallback ?? null);
  },
}));

describe("authServer", () => {
  let mockSupabase: SupabaseClient;
  let testDb: Awaited<ReturnType<typeof createPgliteTestDb>>;

  beforeAll(async () => {
    testDb = await createPgliteTestDb();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    await testDb.reset();
  });

  afterAll(async () => {
    await testDb.cleanup();
  });

  async function seedUser(overrides: Partial<typeof users.$inferInsert> = {}) {
    const userData = {
      id: "db-123",
      authUserId: "auth-123",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      hasAvatar: false,
      wristNumber: null,
      houseNumber: null,
      groupId: null,
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
    await testDb.db.insert(users).values(userData);
    return userData;
  }

  describe("getAuthServerUser", () => {
    it("should return null when no access token provided", async () => {
      const result = await getAuthServerUser(mockSupabase, undefined);
      expect(result).toBeNull();
    });

    it("should return user when valid access token provided", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" } as SupabaseUser;
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const result = await getAuthServerUser(mockSupabase, "valid-token");
      expect(result).toEqual(mockUser);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledWith("valid-token");
    });

    it("should return null when getUser returns error", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid token" },
      } as never);

      const result = await getAuthServerUser(mockSupabase, "invalid-token");
      expect(result).toBeNull();
    });
  });

  describe("getSession", () => {
    it("should return null when no supabase user found", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await getSession(testDb.db, mockSupabase, "token");
      expect(result).toBeNull();
    });

    it("should return session with user when found in database", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      await seedUser();

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);

      const result = await getSession(testDb.db, mockSupabase, "token");

      expect(result).not.toBeNull();
      expect(result?.authUserId).toBe("auth-123");
      expect(result?.user).not.toBeNull();
      expect(result?.user?.email).toBe("test@example.com");
    });

    it("should return authUserId with null user when db user not found", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);

      const result = await getSession(testDb.db, mockSupabase, "token");

      expect(result).not.toBeNull();
      expect(result?.authUserId).toBe("auth-123");
      expect(result?.user).toBeNull();
    });
  });

  describe("requireAuth", () => {
    it("should throw AuthenticationError when no session", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      await expect(requireAuth(testDb.db, mockSupabase, "token")).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("should throw AuthenticationError when session user is null", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);

      await expect(requireAuth(testDb.db, mockSupabase, "token")).rejects.toThrow("Unauthorized");
    });

    it("should return user and dbUser when authenticated", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      await seedUser();

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await requireAuth(testDb.db, mockSupabase, "token");

      expect(result.user).not.toBeNull();
      expect(result.dbUser).toMatchObject({
        id: "db-123",
        authUserId: "auth-123",
        firstName: "Test",
        lastName: "User",
        role: "USER",
      });
    });

    it("should throw AuthenticationError when user is banned", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      await seedUser();
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: { banned_until: futureDate } },
        error: null,
      } as never);

      await expect(requireAuth(testDb.db, mockSupabase, "token")).rejects.toThrow("User is banned");
    });

    it("should handle admin lookup error gracefully", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      await seedUser();

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: { message: "Admin lookup failed" },
      } as never);

      const result = await requireAuth(testDb.db, mockSupabase, "token");

      expect(logger.warn).toHaveBeenCalledWith(
        { authUserId: "auth-123", error: "Admin lookup failed" },
        "Failed to check ban status",
      );
      expect(result.dbUser).toMatchObject({
        id: "db-123",
        authUserId: "auth-123",
        role: "USER",
      });
    });

    it("should throw AuthenticationError when db user not found after auth", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      await seedUser();

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      // Delete the user after seeding so the second lookup fails
      await testDb.db.delete(users).where(eq(users.authUserId, "auth-123"));

      await expect(requireAuth(testDb.db, mockSupabase, "token")).rejects.toThrow("Unauthorized");
    });
  });

  describe("requireAdmin", () => {
    it("should throw AuthorizationError when user is not admin", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      await seedUser({ role: "USER" });

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      await expect(requireAdmin(testDb.db, mockSupabase, "token")).rejects.toThrow(
        AuthorizationError,
      );
    });

    it("should return dbUser when user is admin", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      await seedUser({ role: "ADMIN" });

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await requireAdmin(testDb.db, mockSupabase, "token");
      expect(result.role).toBe("ADMIN");
    });
  });

  describe("requireModerator", () => {
    it("should throw AuthorizationError when user is not moderator or admin", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      await seedUser({ role: "USER" });

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      await expect(requireModerator(testDb.db, mockSupabase, "token")).rejects.toThrow(
        AuthorizationError,
      );
    });

    it("should return dbUser when user is moderator", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      await seedUser({ role: "MODERATOR" });

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await requireModerator(testDb.db, mockSupabase, "token");
      expect(result.role).toBe("MODERATOR");
    });

    it("should return dbUser when user is admin", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      await seedUser({ role: "ADMIN" });

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await requireModerator(testDb.db, mockSupabase, "token");
      expect(result.role).toBe("ADMIN");
    });
  });

  describe("mapDatabaseUserToAuthUser", () => {
    it("should return null when dbUser has no authUserId", () => {
      const dbUser = { id: "db-123", authUserId: null } as User;
      const result = mapDatabaseUserToAuthUser(dbUser);
      expect(result).toBeNull();
    });

    it("should map db user to auth user correctly", () => {
      const dbUser = {
        id: "db-123",
        authUserId: "auth-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "USER",
      } as User;

      const supabaseUser = {
        email: "test@example.com",
        email_confirmed_at: "2024-01-01T00:00:00Z",
      } as SupabaseUser;

      const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

      expect(result).not.toBeNull();
      expect(result?.id).toBe("db-123");
      expect(result?.authUserId).toBe("auth-123");
      expect(result?.email).toBe("test@example.com");
      expect(result?.firstName).toBe("Test");
      expect(result?.lastName).toBe("User");
      expect(result?.role).toBe("USER");
      expect(result?.emailVerified).toBeInstanceOf(Date);
    });

    it("should use email prefix as display name when no name provided", () => {
      const dbUser = {
        id: "db-123",
        authUserId: "auth-123",
        firstName: null,
        lastName: null,
        role: "USER",
      } as User;

      const supabaseUser = {
        email: "test@example.com",
      } as SupabaseUser;

      const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

      expect(result?.name).toBe("test");
    });
  });

  describe("parseRolesFromToken", () => {
    it("should return empty array when token is undefined", () => {
      const result = parseRolesFromToken(undefined);
      expect(result).toEqual([]);
    });

    it("should return empty array when token has no groups claim", () => {
      const payload = btoa(JSON.stringify({ sub: "user-123" }));
      const token = `header.${payload}.signature`;
      const result = parseRolesFromToken(token);
      expect(result).toEqual([]);
    });

    it("should parse groups from JWT token", () => {
      const payload = btoa(JSON.stringify({ groups: ["admin", "moderator"] }));
      const token = `header.${payload}.signature`;
      const result = parseRolesFromToken(token);
      expect(result).toEqual(["admin", "moderator"]);
    });
  });

  describe("hasRequiredRole", () => {
    it("should return true when required role is in groups", () => {
      const result = hasRequiredRole(["admin", "user"], "admin");
      expect(result).toBe(true);
    });

    it("should return false when required role is not in groups", () => {
      const result = hasRequiredRole(["user"], "admin");
      expect(result).toBe(false);
    });

    it("should return false when groups is empty", () => {
      const result = hasRequiredRole([], "admin");
      expect(result).toBe(false);
    });
  });

  describe("syncUserToDatabase", () => {
    it("should sync user with default role", async () => {
      const mockSupabaseUser = {
        id: "auth-123",
        email: "test@example.com",
        user_metadata: {},
        app_metadata: {},
      } as SupabaseUser;

      const mockUpsertUser = vi.fn().mockResolvedValue({
        id: "db-123",
        authUserId: "auth-123",
        role: "USER",
      } as User);

      await syncUserToDatabase(mockSupabaseUser, mockUpsertUser);

      expect(mockUpsertUser).toHaveBeenCalledWith({
        authUserId: "auth-123",
        firstName: "test",
        lastName: null,
        role: "USER",
      });
    });

    it("should sync user with admin role from metadata", async () => {
      const mockSupabaseUser = {
        id: "auth-123",
        email: "test@example.com",
        user_metadata: { role: "admin" },
        app_metadata: {},
      } as SupabaseUser;

      const mockUpsertUser = vi.fn().mockResolvedValue({
        id: "db-123",
        authUserId: "auth-123",
        role: "ADMIN",
      } as User);

      await syncUserToDatabase(mockSupabaseUser, mockUpsertUser);

      expect(mockUpsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          authUserId: "auth-123",
          role: "ADMIN",
        }),
      );
    });

    it("should parse name from user metadata", async () => {
      const mockSupabaseUser = {
        id: "auth-123",
        email: "test@example.com",
        user_metadata: { name: "John Doe" },
        app_metadata: {},
      } as SupabaseUser;

      const mockUpsertUser = vi.fn().mockResolvedValue({
        id: "db-123",
        authUserId: "auth-123",
        role: "USER",
      } as User);

      await syncUserToDatabase(mockSupabaseUser, mockUpsertUser);

      expect(mockUpsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "John",
          lastName: "Doe",
        }),
      );
    });

    it("should handle single name", async () => {
      const mockSupabaseUser = {
        id: "auth-123",
        email: "test@example.com",
        user_metadata: { name: "John" },
        app_metadata: {},
      } as SupabaseUser;

      const mockUpsertUser = vi.fn().mockResolvedValue({
        id: "db-123",
        authUserId: "auth-123",
        role: "USER",
      } as User);

      await syncUserToDatabase(mockSupabaseUser, mockUpsertUser);

      expect(mockUpsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "John",
          lastName: null,
        }),
      );
    });

    it("should fallback to email prefix when no name in metadata", async () => {
      const mockSupabaseUser = {
        id: "auth-123",
        email: "john.doe@example.com",
        user_metadata: {},
        app_metadata: {},
      } as SupabaseUser;

      const mockUpsertUser = vi.fn().mockResolvedValue({
        id: "db-123",
        authUserId: "auth-123",
        role: "USER",
      } as User);

      await syncUserToDatabase(mockSupabaseUser, mockUpsertUser);

      expect(mockUpsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "john.doe",
          lastName: null,
        }),
      );
    });

    it("should handle null email by using null firstName", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-123", email: null });

      const mockUpsertUser = vi.fn().mockResolvedValue({
        id: "db-123",
        authUserId: "auth-123",
        role: "USER",
      } as User);

      await syncUserToDatabase(mockSupabaseUser, mockUpsertUser);

      expect(mockUpsertUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: null,
          lastName: null,
        }),
      );
    });
  });
});
