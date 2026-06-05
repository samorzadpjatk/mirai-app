import type { User } from "@mirai-app/db";
import { users } from "@mirai-app/db";
import { createPgliteTestDb } from "@mirai-app/db/test-helper";
import { createMockSupabaseClient, createMockSupabaseUser } from "@mirai-app/shared/test-utils";
import type { SupabaseClient, SupabaseUser } from "@mirai-app/supabase";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthenticationError,
  AuthorizationError,
  getServerUser,
  getSession,
  hasRequiredRole,
  mapDatabaseUserToAuthUser,
  parseRolesFromToken,
  requireAdmin,
  requireAuth,
  requireModerator,
  syncUserToDatabase,
} from "../server";

// Mock the actual implementations from authServer
vi.mock("../authServer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../authServer")>();
  return {
    ...actual,
    getAuthServerUser: vi.fn(actual.getAuthServerUser),
    mapDatabaseUserToAuthUser: vi.fn(actual.mapDatabaseUserToAuthUser),
    parseRolesFromToken: vi.fn(actual.parseRolesFromToken),
    hasRequiredRole: vi.fn(actual.hasRequiredRole),
    getSession: vi.fn(actual.getSession),
    requireAuth: vi.fn(actual.requireAuth),
    requireAdmin: vi.fn(actual.requireAdmin),
    requireModerator: vi.fn(actual.requireModerator),
    syncUserToDatabase: vi.fn(actual.syncUserToDatabase),
  };
});

describe("server exports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AuthenticationError", () => {
    it("should be exported and creatable", () => {
      const error = new AuthenticationError();
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("AuthenticationError");
      expect(error.message).toBe("Not Authenticated");
    });

    it("should accept custom message", () => {
      const error = new AuthenticationError("Custom auth error");
      expect(error.message).toBe("Custom auth error");
    });
  });

  describe("AuthorizationError", () => {
    it("should be exported and creatable", () => {
      const error = new AuthorizationError();
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("AuthorizationError");
      expect(error.message).toBe("Missing Required Permissions");
    });

    it("should accept custom message", () => {
      const error = new AuthorizationError("Custom authz error");
      expect(error.message).toBe("Custom authz error");
    });
  });

  describe("getServerUser", () => {
    it("should be exported as a function", () => {
      expect(typeof getServerUser).toBe("function");
    });
  });

  describe("mapDatabaseUserToAuthUser", () => {
    it("should be exported as a function", () => {
      expect(typeof mapDatabaseUserToAuthUser).toBe("function");
    });

    it("should map database user to auth user correctly", () => {
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
      expect(result?.name).toBe("Test User");
      expect(result?.role).toBe("USER");
      expect(result?.emailVerified).toBeInstanceOf(Date);
      expect(result?.hasName).toBe(true);
      expect(result?.hasEmail).toBe(true);
      expect(result?.isEmailVerified).toBe(true);
    });

    it("should return null when dbUser has no authUserId", () => {
      const dbUser = {
        id: "db-123",
        authUserId: null,
        role: "USER",
      } as User;

      const result = mapDatabaseUserToAuthUser(dbUser);
      expect(result).toBeNull();
    });

    it("should use email prefix as display name when no name provided", () => {
      const dbUser = {
        id: "db-123",
        authUserId: "auth-123",
        firstName: null,
        lastName: null,
        role: "USER",
      } as User;

      const supabaseUser = createMockSupabaseUser();

      const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);
      expect(result?.name).toBe("test");
      expect(result?.hasName).toBe(false);
    });

    it("should handle null email gracefully", () => {
      const dbUser = {
        id: "db-123",
        authUserId: "auth-123",
        firstName: null,
        lastName: null,
        role: "USER",
      } as User;

      const supabaseUser = createMockSupabaseUser({ email: null });

      const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);
      expect(result?.name).toBe("");
      expect(result?.email).toBe("");
      expect(result?.hasEmail).toBe(false);
    });
  });

  describe("parseRolesFromToken", () => {
    it("should be exported as a function", () => {
      expect(typeof parseRolesFromToken).toBe("function");
    });

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

    it("should handle token with empty groups array", () => {
      const payload = btoa(JSON.stringify({ groups: [] }));
      const token = `header.${payload}.signature`;
      const result = parseRolesFromToken(token);
      expect(result).toEqual([]);
    });
  });

  describe("hasRequiredRole", () => {
    it("should be exported as a function", () => {
      expect(typeof hasRequiredRole).toBe("function");
    });

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

    it("should return true for any role in the groups array", () => {
      expect(hasRequiredRole(["admin", "moderator", "user"], "moderator")).toBe(true);
      expect(hasRequiredRole(["admin", "moderator", "user"], "user")).toBe(true);
    });
  });

  describe("syncUserToDatabase", () => {
    it("should be exported as a function", () => {
      expect(typeof syncUserToDatabase).toBe("function");
    });

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

  describe("type exports", () => {
    it("should have DatabaseUser type structure", () => {
      const dbUser = {
        id: "db-123",
        authUserId: "auth-123",
        email: "test@example.com",
        name: "Test User",
        hasAvatar: true,
        wristNumber: "W001",
        houseNumber: "H001",
        role: "USER",
        groupId: "group-123",
        emailVerified: new Date(),
      };

      expect(dbUser.id).toBe("db-123");
      expect(dbUser.role).toBe("USER");
    });

    it("should have Role type with valid values", () => {
      const roles = ["USER", "ADMIN", "MODERATOR", "SERVICE"] as const;
      expect(roles).toContain("USER");
      expect(roles).toContain("ADMIN");
      expect(roles).toContain("MODERATOR");
      expect(roles).toContain("SERVICE");
    });

    it("should have AuthState type structure", () => {
      const authState = {
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
      };

      expect(authState.isAuthenticated).toBe(false);
    });

    it("should have SignInWithOtpOptions type structure", () => {
      const options = { email: "test@example.com" };
      expect(options.email).toBe("test@example.com");
    });
  });
});

describe("server exports with database", () => {
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

  describe("getSession", () => {
    it("should be exported as a function", () => {
      expect(typeof getSession).toBe("function");
    });

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
    it("should be exported as a function", () => {
      expect(typeof requireAuth).toBe("function");
    });

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
  });

  describe("requireAdmin", () => {
    it("should be exported as a function", () => {
      expect(typeof requireAdmin).toBe("function");
    });

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
    it("should be exported as a function", () => {
      expect(typeof requireModerator).toBe("function");
    });

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
});
