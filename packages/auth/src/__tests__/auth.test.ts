import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AuthenticationError,
  AuthorizationError,
  getAuthServerUser,
  getSession,
  requireAuth,
  requireAdmin,
  requireModerator,
  mapDatabaseUserToAuthUser,
  parseRolesFromToken,
  hasRequiredRole,
  syncUserToDatabase,
} from "../authServer";
import type { SupabaseClient, SupabaseUser } from "@mirai-app/supabase";
import type { User, PrismaClient } from "@mirai-app/db";

describe("authServer", () => {
  let mockSupabase: SupabaseClient;
  let mockDb: PrismaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
        getSession: vi.fn(),
        admin: {
          getUserById: vi.fn(),
        },
      },
    } as unknown as SupabaseClient;

    mockDb = {
      user: {
        findFirst: vi.fn(),
      },
    } as unknown as PrismaClient;
  });

  describe("AuthenticationError", () => {
    it("should create error with default message", () => {
      const error = new AuthenticationError();
      expect(error.name).toBe("AuthenticationError");
      expect(error.message).toBe("Not Authenticated");
    });

    it("should create error with custom message", () => {
      const error = new AuthenticationError("Custom auth error");
      expect(error.message).toBe("Custom auth error");
    });
  });

  describe("AuthorizationError", () => {
    it("should create error with default message", () => {
      const error = new AuthorizationError();
      expect(error.name).toBe("AuthorizationError");
      expect(error.message).toBe("Missing Required Permissions");
    });

    it("should create error with custom message", () => {
      const error = new AuthorizationError("Custom authz error");
      expect(error.message).toBe("Custom authz error");
    });
  });

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

      const result = await getSession(mockDb, mockSupabase, "token");
      expect(result).toBeNull();
    });

    it("should return session with user when found in database", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      const mockDbUser = {
        id: "db-123",
        authUserId: "auth-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "USER",
      } as User;

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockDb.user.findFirst).mockResolvedValue(mockDbUser as never);

      const result = await getSession(mockDb, mockSupabase, "token");

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
      vi.mocked(mockDb.user.findFirst).mockResolvedValue(null as never);

      const result = await getSession(mockDb, mockSupabase, "token");

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

      await expect(requireAuth(mockDb, mockSupabase, "token")).rejects.toThrow(
        AuthenticationError
      );
    });

    it("should throw AuthenticationError when session user is null", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockDb.user.findFirst).mockResolvedValue(null as never);

      await expect(requireAuth(mockDb, mockSupabase, "token")).rejects.toThrow(
        "Unauthorized"
      );
    });

    it("should return user and dbUser when authenticated", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      const mockDbUser = {
        id: "db-123",
        authUserId: "auth-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "USER",
      } as User;

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockDb.user.findFirst).mockResolvedValue(mockDbUser as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await requireAuth(mockDb, mockSupabase, "token");

      expect(result.user).not.toBeNull();
      expect(result.dbUser).toEqual(mockDbUser);
    });

    it("should throw AuthenticationError when user is banned", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      const mockDbUser = {
        id: "db-123",
        authUserId: "auth-123",
        role: "USER",
      } as User;
      const futureDate = new Date(Date.now() + 86400000).toISOString();

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockDb.user.findFirst).mockResolvedValue(mockDbUser as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: { banned_until: futureDate } },
        error: null,
      } as never);

      await expect(requireAuth(mockDb, mockSupabase, "token")).rejects.toThrow("User is banned");
    });
  });

  describe("requireAdmin", () => {
    it("should throw AuthorizationError when user is not admin", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      const mockDbUser = {
        id: "db-123",
        authUserId: "auth-123",
        role: "USER",
      } as User;

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockDb.user.findFirst).mockResolvedValue(mockDbUser as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      await expect(requireAdmin(mockDb, mockSupabase, "token")).rejects.toThrow(
        AuthorizationError
      );
    });

    it("should return dbUser when user is admin", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      const mockDbUser = {
        id: "db-123",
        authUserId: "auth-123",
        role: "ADMIN",
      } as User;

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockDb.user.findFirst).mockResolvedValue(mockDbUser as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await requireAdmin(mockDb, mockSupabase, "token");
      expect(result.role).toBe("ADMIN");
    });
  });

  describe("requireModerator", () => {
    it("should throw AuthorizationError when user is not moderator or admin", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      const mockDbUser = {
        id: "db-123",
        authUserId: "auth-123",
        role: "USER",
      } as User;

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockDb.user.findFirst).mockResolvedValue(mockDbUser as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      await expect(requireModerator(mockDb, mockSupabase, "token")).rejects.toThrow(
        AuthorizationError
      );
    });

    it("should return dbUser when user is moderator", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      const mockDbUser = {
        id: "db-123",
        authUserId: "auth-123",
        role: "MODERATOR",
      } as User;

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockDb.user.findFirst).mockResolvedValue(mockDbUser as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await requireModerator(mockDb, mockSupabase, "token");
      expect(result.role).toBe("MODERATOR");
    });

    it("should return dbUser when user is admin", async () => {
      const mockSupabaseUser = { id: "auth-123", email: "test@example.com" } as SupabaseUser;
      const mockDbUser = {
        id: "db-123",
        authUserId: "auth-123",
        role: "ADMIN",
      } as User;

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null,
      } as never);
      vi.mocked(mockDb.user.findFirst).mockResolvedValue(mockDbUser as never);
      vi.mocked(mockSupabase.auth.admin.getUserById).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await requireModerator(mockDb, mockSupabase, "token");
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
        })
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
        })
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
        })
      );
    });
  });
});
