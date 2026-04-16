import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  AuthServer,
  AuthenticationError,
  AuthorizationError,
  decodeJwtPayload,
  getAuthServerUser,
  getAuthServerSession,
  mapDatabaseUserToAuthUser,
  parseRolesFromToken,
  hasRequiredRole,
  syncUserToDatabase,
  type AuthUser,
  type AdminUserWithBan,
} from "./authServer";
import type {
  SupabaseClient,
  SupabaseUser,
} from "@mirai-app/frameworks/supabase";

/**
 * [UNIT] AuthServer Controller Tests
 *
 * Comprehensive unit tests for server-side authentication operations.
 * Tests JWT decoding, user/session retrieval, role checking, and AuthServer class.
 *
 * ## Summary
 *
 * - decodeJwtPayload: JWT payload decoding with Buffer and atob fallbacks
 * - getAuthServerUser: User retrieval from Supabase with token validation
 * - getAuthServerSession: Session retrieval with expiry calculations
 * - mapDatabaseUserToAuthUser: Database user to auth user mapping
 * - parseRolesFromToken: Role extraction from JWT tokens
 * - hasRequiredRole: Role validation logic
 * - AuthServer.getSession: Session with database user lookup
 * - AuthServer.requireAuth: Authentication with ban checking
 * - AuthServer.requireAdmin: Admin role enforcement
 * - AuthServer.requireModerator: Moderator role enforcement
 * - syncUserToDatabase: User synchronization with role mapping
 */

// ============================================================================
// Mock Data Factories
// ============================================================================

function createMockSupabaseUser(
  overrides: Partial<SupabaseUser> = {},
): SupabaseUser {
  return {
    id: overrides.id ?? "auth-user-123",
    email: overrides.email ?? "test@example.com",
    user_metadata: overrides.user_metadata ?? {},
    app_metadata: overrides.app_metadata ?? {},
    email_confirmed_at:
      overrides.email_confirmed_at !== undefined
        ? overrides.email_confirmed_at
        : new Date().toISOString(),
    phone: overrides.phone ?? null,
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at ?? new Date().toISOString(),
  } as SupabaseUser;
}

function createMockDatabaseUser(
  overrides: {
    id?: string;
    authUserId?: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    role?: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
    emailVerified?: Date | null;
    hasAvatar?: boolean;
  } = {},
) {
  return {
    id: overrides.id ?? "db-user-456",
    authUserId: overrides.authUserId ?? "auth-user-123",
    email: overrides.email ?? "test@example.com",
    firstName: overrides.firstName !== undefined ? overrides.firstName : "John",
    lastName: overrides.lastName !== undefined ? overrides.lastName : "Doe",
    name: overrides.name ?? null,
    hasAvatar: overrides.hasAvatar ?? false,
    wristNumber: null,
    houseNumber: null,
    role: overrides.role ?? "USER",
    groupId: null,
    emailVerified: overrides.emailVerified ?? null,
  };
}

function createMockPrismaClient(
  users: ReturnType<typeof createMockDatabaseUser>[] = [],
) {
  const userMap = new Map(users.map((u) => [u.authUserId, u]));

  return {
    user: {
      findFirst: async ({ where }: { where: { authUserId: string } }) => {
        return userMap.get(where.authUserId) ?? null;
      },
    },
  };
}

function createMockSupabaseClient(
  options: {
    user?: SupabaseUser | null;
    session?: {
      user: SupabaseUser;
      access_token: string;
      refresh_token: string | null;
      token_type: string;
      expires_in: number | null;
      expires_at: number | null;
    } | null;
    adminUser?: AdminUserWithBan | null;
    adminError?: Error | null;
  } = {},
) {
  return {
    auth: {
      getUser: async (token?: string) => {
        if (options.user && token) {
          return { data: { user: options.user }, error: null };
        }
        if (options.user === null && token) {
          return { data: { user: null }, error: new Error("Invalid token") };
        }
        return { data: { user: null }, error: null };
      },
      getSession: async () => {
        if (options.session) {
          return { data: { session: options.session }, error: null };
        }
        return { data: { session: null }, error: null };
      },
      admin: {
        getUserById: async (_userId: string) => {
          if (options.adminError) {
            return { data: { user: null }, error: options.adminError };
          }
          if (options.adminUser) {
            return { data: { user: options.adminUser }, error: null };
          }
          return { data: { user: null }, error: null };
        },
      },
    },
  } as unknown as SupabaseClient;
}

// Helper to create a valid JWT payload
function createJwtPayload(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

// ============================================================================
// decodeJwtPayload Tests
// ============================================================================

describe("[UNIT] decodeJwtPayload", () => {
  it("decodes valid JWT payload with Buffer", () => {
    const payload = {
      sub: "user-123",
      exp: 1234567890,
      groups: ["admin", "user"],
    };
    const token = createJwtPayload(payload);

    const result = decodeJwtPayload(token);

    expect(result).toEqual(payload);
  });

  it("decodes JWT with special base64url characters", () => {
    const payload = { data: "test-value_with+special/chars" };
    const token = createJwtPayload(payload);

    const result = decodeJwtPayload(token);

    expect(result).toEqual(payload);
  });

  it("returns null for invalid token format", () => {
    const result = decodeJwtPayload("invalid-token");

    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = decodeJwtPayload("");

    expect(result).toBeNull();
  });

  it("returns null for malformed payload", () => {
    const token = "header.invalid-payload.signature";

    const result = decodeJwtPayload(token);

    expect(result).toBeNull();
  });

  it("handles payload with nested objects", () => {
    const payload = {
      user: { id: "123", name: "Test" },
      metadata: { roles: ["admin"] },
    };
    const token = createJwtPayload(payload);

    const result = decodeJwtPayload(token);

    expect(result).toEqual(payload);
  });
});

// ============================================================================
// getAuthServerUser Tests
// ============================================================================

describe("[UNIT] getAuthServerUser", () => {
  it("returns user when valid access token provided", async () => {
    const mockUser = createMockSupabaseUser({ id: "auth-123" });
    const mockSupabase = createMockSupabaseClient({ user: mockUser });

    const result = await getAuthServerUser(mockSupabase, "valid-token");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("auth-123");
  });

  it("returns null when access token is missing", async () => {
    const mockSupabase = createMockSupabaseClient();

    const result = await getAuthServerUser(mockSupabase, undefined);

    expect(result).toBeNull();
  });

  it("returns null when access token is empty string", async () => {
    const mockSupabase = createMockSupabaseClient();

    const result = await getAuthServerUser(mockSupabase, "");

    expect(result).toBeNull();
  });

  it("returns null when Supabase returns error", async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });

    const result = await getAuthServerUser(mockSupabase, "invalid-token");

    expect(result).toBeNull();
  });
});

// ============================================================================
// getAuthServerSession Tests
// ============================================================================

describe("[UNIT] getAuthServerSession", () => {
  it("returns session with calculated expiry when access token provided", async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const mockUser = createMockSupabaseUser({ id: "auth-123" });
    const mockSupabase = createMockSupabaseClient({ user: mockUser });

    const token = createJwtPayload({ exp: futureExp });
    const result = await getAuthServerSession(mockSupabase, token);

    expect(result).not.toBeNull();
    expect(result?.user).toEqual(mockUser);
    expect(result?.access_token).toBe(token);
    expect(result?.expires_at).toBe(futureExp);
    expect(result?.expires_in).toBeGreaterThan(0);
    expect(result?.expires_in).toBeLessThanOrEqual(3600);
  });

  it("returns null expiry when token has no exp claim", async () => {
    const mockUser = createMockSupabaseUser();
    const mockSupabase = createMockSupabaseClient({ user: mockUser });

    const token = createJwtPayload({ sub: "user-123" });
    const result = await getAuthServerSession(mockSupabase, token);

    expect(result?.expires_at).toBeNull();
    expect(result?.expires_in).toBeNull();
  });

  it("returns expires_in as 0 when token is expired", async () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const mockUser = createMockSupabaseUser();
    const mockSupabase = createMockSupabaseClient({ user: mockUser });

    const token = createJwtPayload({ exp: pastExp });
    const result = await getAuthServerSession(mockSupabase, token);

    expect(result?.expires_in).toBe(0);
  });

  it("returns null when no access token and no session", async () => {
    const mockSupabase = createMockSupabaseClient({ session: null });

    const result = await getAuthServerSession(mockSupabase, undefined);

    expect(result).toBeNull();
  });

  it("returns session from Supabase when no access token but session exists", async () => {
    const mockUser = createMockSupabaseUser({ id: "auth-456" });
    const mockSession = {
      user: mockUser,
      access_token: "session-token",
      refresh_token: "refresh-token" as const,
      token_type: "bearer" as const,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    const mockSupabase = createMockSupabaseClient({ session: mockSession });

    const result = await getAuthServerSession(mockSupabase, undefined);

    expect(result).not.toBeNull();
    expect(result?.user).toEqual(mockUser);
    expect(result?.access_token).toBe("session-token");
  });

  it("returns null when token validation fails", async () => {
    const mockSupabase = createMockSupabaseClient({ user: null });

    const result = await getAuthServerSession(mockSupabase, "invalid-token");

    expect(result).toBeNull();
  });
});

// ============================================================================
// mapDatabaseUserToAuthUser Tests
// ============================================================================

describe("[UNIT] mapDatabaseUserToAuthUser", () => {
  it("maps database user to auth user correctly", () => {
    const dbUser = createMockDatabaseUser({
      id: "db-123",
      authUserId: "auth-123",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
    });
    const supabaseUser = createMockSupabaseUser({
      id: "auth-123",
      email: "john@example.com",
      email_confirmed_at: "2024-01-01T00:00:00Z",
    });

    const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("db-123");
    expect(result?.authUserId).toBe("auth-123");
    expect(result?.email).toBe("john@example.com");
    expect(result?.firstName).toBe("John");
    expect(result?.lastName).toBe("Doe");
    expect(result?.name).toBe("John Doe");
    expect(result?.role).toBe("USER");
    expect(result?.emailVerified).toBeInstanceOf(Date);
  });

  it("returns null when database user is null", () => {
    const supabaseUser = createMockSupabaseUser();

    const result = mapDatabaseUserToAuthUser(null, supabaseUser);

    expect(result).toBeNull();
  });

  it("returns null when database user has no authUserId", () => {
    const dbUser = createMockDatabaseUser({ authUserId: "" });
    const supabaseUser = createMockSupabaseUser();

    const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

    expect(result).toBeNull();
  });

  it("uses email prefix as fallback display name when no first/last name", () => {
    const dbUser = createMockDatabaseUser({
      firstName: null,
      lastName: null,
    });
    const supabaseUser = createMockSupabaseUser({
      email: "testuser@example.com",
    });

    const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

    expect(result?.name).toBe("testuser");
  });

  it("returns null display name when no email and no names", () => {
    const dbUser = createMockDatabaseUser({
      firstName: null,
      lastName: null,
    });
    // Create supabase user with null email (need to build manually to avoid default)
    const supabaseUser = {
      id: "auth-123",
      email: null,
      user_metadata: {},
      app_metadata: {},
      email_confirmed_at: new Date().toISOString(),
      phone: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as SupabaseUser;

    const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

    expect(result?.name).toBeNull();
  });

  it("handles MODERATOR role", () => {
    const dbUser = createMockDatabaseUser({ role: "MODERATOR" });
    const supabaseUser = createMockSupabaseUser();

    const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

    expect(result?.role).toBe("MODERATOR");
  });

  it("handles ADMIN role", () => {
    const dbUser = createMockDatabaseUser({ role: "ADMIN" });
    const supabaseUser = createMockSupabaseUser();

    const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

    expect(result?.role).toBe("ADMIN");
  });

  it("handles SERVICE role", () => {
    const dbUser = createMockDatabaseUser({ role: "SERVICE" });
    const supabaseUser = createMockSupabaseUser();

    const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

    expect(result?.role).toBe("SERVICE");
  });

  it("returns null emailVerified when email not confirmed", () => {
    const dbUser = createMockDatabaseUser();
    // Create supabase user with null email_confirmed_at
    const supabaseUser = createMockSupabaseUser({
      email_confirmed_at: null as unknown as undefined,
    });

    const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

    expect(result?.emailVerified).toBeNull();
  });

  it("works without supabaseUser (null)", () => {
    const dbUser = createMockDatabaseUser({
      firstName: "Jane",
      lastName: "Smith",
    });

    const result = mapDatabaseUserToAuthUser(dbUser, null);

    expect(result).not.toBeNull();
    expect(result?.firstName).toBe("Jane");
    expect(result?.lastName).toBe("Smith");
    expect(result?.name).toBe("Jane Smith");
    expect(result?.email).toBeNull();
    expect(result?.emailVerified).toBeNull();
  });
});

// ============================================================================
// parseRolesFromToken Tests
// ============================================================================

describe("[UNIT] parseRolesFromToken", () => {
  it("parses roles from token payload", () => {
    const token = createJwtPayload({ groups: ["admin", "moderator", "user"] });

    const result = parseRolesFromToken(token);

    expect(result).toEqual(["admin", "moderator", "user"]);
  });

  it("returns empty array for undefined token", () => {
    const result = parseRolesFromToken(undefined);

    expect(result).toEqual([]);
  });

  it("returns empty array for empty string token", () => {
    const result = parseRolesFromToken("");

    expect(result).toEqual([]);
  });

  it("returns empty array when token has no groups claim", () => {
    const token = createJwtPayload({ sub: "user-123" });

    const result = parseRolesFromToken(token);

    expect(result).toEqual([]);
  });

  it("returns empty array for invalid token", () => {
    const result = parseRolesFromToken("invalid-token");

    expect(result).toEqual([]);
  });

  it("handles empty groups array", () => {
    const token = createJwtPayload({ groups: [] });

    const result = parseRolesFromToken(token);

    expect(result).toEqual([]);
  });
});

// ============================================================================
// hasRequiredRole Tests
// ============================================================================

describe("[UNIT] hasRequiredRole", () => {
  it("returns true when required role is present", () => {
    const groups = ["user", "admin", "moderator"];

    const result = hasRequiredRole(groups, "admin");

    expect(result).toBe(true);
  });

  it("returns false when required role is not present", () => {
    const groups = ["user", "moderator"];

    const result = hasRequiredRole(groups, "admin");

    expect(result).toBe(false);
  });

  it("returns false for empty groups array", () => {
    const result = hasRequiredRole([], "admin");

    expect(result).toBe(false);
  });

  it("returns true for exact match", () => {
    const result = hasRequiredRole(["admin"], "admin");

    expect(result).toBe(true);
  });

  it("is case-sensitive", () => {
    const result = hasRequiredRole(["Admin"], "admin");

    expect(result).toBe(false);
  });
});

// ============================================================================
// AuthenticationError Tests
// ============================================================================

describe("[UNIT] AuthenticationError", () => {
  it("creates error with default message", () => {
    const error = new AuthenticationError();

    expect(error.message).toBe("Not Authenticated");
    expect(error.name).toBe("AuthenticationError");
  });

  it("creates error with custom message", () => {
    const error = new AuthenticationError("Custom auth error");

    expect(error.message).toBe("Custom auth error");
    expect(error.name).toBe("AuthenticationError");
  });

  it("is instance of Error", () => {
    const error = new AuthenticationError();

    expect(error).toBeInstanceOf(Error);
  });
});

// ============================================================================
// AuthorizationError Tests
// ============================================================================

describe("[UNIT] AuthorizationError", () => {
  it("creates error with default message", () => {
    const error = new AuthorizationError();

    expect(error.message).toBe("Missing Required Permissions");
    expect(error.name).toBe("AuthorizationError");
  });

  it("creates error with custom message", () => {
    const error = new AuthorizationError("Custom authz error");

    expect(error.message).toBe("Custom authz error");
    expect(error.name).toBe("AuthorizationError");
  });

  it("is instance of Error", () => {
    const error = new AuthorizationError();

    expect(error).toBeInstanceOf(Error);
  });
});

// ============================================================================
// AuthServer Tests
// ============================================================================

describe("[UNIT] AuthServer", () => {
  let authServer: AuthServer;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    authServer = new AuthServer(mockPrisma);
  });

  // --------------------------------------------------------------------------
  // getSession Tests
  // --------------------------------------------------------------------------

  describe("getSession", () => {
    it("returns session with user when authenticated and user exists in DB", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-123" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-123",
        id: "db-456",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({ user: mockSupabaseUser });

      const result = await authServer.getSession(mockSupabase, "valid-token");

      expect(result).not.toBeNull();
      expect(result?.user).not.toBeNull();
      expect(result?.user?.id).toBe("db-456");
      expect(result?.user?.authUserId).toBe("auth-123");
      expect(result?.authUserId).toBe("auth-123");
    });

    it("returns null when no access token", async () => {
      const mockSupabase = createMockSupabaseClient();

      const result = await authServer.getSession(mockSupabase, undefined);

      expect(result).toBeNull();
    });

    it("returns null when Supabase user not found", async () => {
      const mockSupabase = createMockSupabaseClient({ user: null });

      const result = await authServer.getSession(mockSupabase, "invalid-token");

      expect(result).toBeNull();
    });

    it("returns session with null user when DB user not found", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-123" });
      mockPrisma = createMockPrismaClient([]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({ user: mockSupabaseUser });

      const result = await authServer.getSession(mockSupabase, "valid-token");

      expect(result).not.toBeNull();
      expect(result?.user).toBeNull();
      expect(result?.authUserId).toBe("auth-123");
    });

    it("correctly maps user role from database", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-admin" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-admin",
        role: "ADMIN",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({ user: mockSupabaseUser });

      const result = await authServer.getSession(mockSupabase, "valid-token");

      expect(result?.user?.role).toBe("ADMIN");
    });
  });

  // --------------------------------------------------------------------------
  // requireAuth Tests
  // --------------------------------------------------------------------------

  describe("requireAuth", () => {
    it("returns user and dbUser when authenticated", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-123" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-123",
        id: "db-456",
        role: "USER",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser: mockSupabaseUser as AdminUserWithBan,
      });

      const result = await authServer.requireAuth(mockSupabase, "valid-token");

      expect(result.user).not.toBeNull();
      expect(result.dbUser).not.toBeNull();
      expect(result.user.authUserId).toBe("auth-123");
      expect(result.dbUser.authUserId).toBe("auth-123");
    });

    it("throws AuthenticationError when no access token", async () => {
      const mockSupabase = createMockSupabaseClient();

      try {
        await authServer.requireAuth(mockSupabase, undefined);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
        expect((error as AuthenticationError).message).toBe("Unauthorized");
      }
    });

    it("throws AuthenticationError when user not authenticated", async () => {
      const mockSupabase = createMockSupabaseClient({ user: null });

      try {
        await authServer.requireAuth(mockSupabase, "invalid-token");
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
      }
    });

    it("throws AuthenticationError when user not found in database", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-123" });
      mockPrisma = createMockPrismaClient([]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser: mockSupabaseUser as AdminUserWithBan,
      });

      try {
        await authServer.requireAuth(mockSupabase, "valid-token");
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
        // When DB user not found, getSession returns user: null, triggering "Unauthorized"
        expect((error as AuthenticationError).message).toBe("Unauthorized");
      }
    });

    it("throws AuthenticationError when user is banned", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-123" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-123",
        role: "USER",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const futureBan = new Date(Date.now() + 86400000).toISOString(); // 1 day from now
      const bannedUser: AdminUserWithBan = {
        ...mockSupabaseUser,
        banned_until: futureBan,
      };

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser: bannedUser,
      });

      try {
        await authServer.requireAuth(mockSupabase, "valid-token");
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
        expect((error as AuthenticationError).message).toBe("User is banned");
      }
    });

    it("does not throw when ban has expired", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-123" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-123",
        role: "USER",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const pastBan = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
      const bannedUser: AdminUserWithBan = {
        ...mockSupabaseUser,
        banned_until: pastBan,
      };

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser: bannedUser,
      });

      // Should not throw
      const result = await authServer.requireAuth(mockSupabase, "valid-token");
      expect(result.user).not.toBeNull();
    });

    it("does not throw when admin lookup fails", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-123" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-123",
        role: "USER",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminError: new Error("Admin API not available"),
      });

      // Should not throw, continues without ban check
      const result = await authServer.requireAuth(mockSupabase, "valid-token");
      expect(result.user).not.toBeNull();
    });

    it("does not throw when banned_until is null", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-123" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-123",
        role: "USER",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const adminUser: AdminUserWithBan = {
        ...mockSupabaseUser,
        banned_until: undefined,
      };

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser,
      });

      const result = await authServer.requireAuth(mockSupabase, "valid-token");
      expect(result.user).not.toBeNull();
    });

    it("handles invalid ban date gracefully", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-123" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-123",
        role: "USER",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const adminUser: AdminUserWithBan = {
        ...mockSupabaseUser,
        banned_until: "invalid-date",
      };

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser,
      });

      // Should not throw, invalid date is treated as not banned
      const result = await authServer.requireAuth(mockSupabase, "valid-token");
      expect(result.user).not.toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // requireAdmin Tests
  // --------------------------------------------------------------------------

  describe("requireAdmin", () => {
    it("returns dbUser when user is admin", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-admin" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-admin",
        role: "ADMIN",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser: mockSupabaseUser as AdminUserWithBan,
      });

      const result = await authServer.requireAdmin(mockSupabase, "valid-token");

      expect(result).not.toBeNull();
      expect(result.role).toBe("ADMIN");
    });

    it("throws AuthorizationError when user is not admin", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-user" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-user",
        role: "USER",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser: mockSupabaseUser as AdminUserWithBan,
      });

      try {
        await authServer.requireAdmin(mockSupabase, "valid-token");
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError);
        expect((error as AuthorizationError).message).toBe(
          "Admin access required",
        );
      }
    });

    it("throws AuthorizationError when user is moderator but not admin", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-mod" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-mod",
        role: "MODERATOR",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser: mockSupabaseUser as AdminUserWithBan,
      });

      try {
        await authServer.requireAdmin(mockSupabase, "valid-token");
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError);
      }
    });

    it("throws AuthenticationError when not authenticated", async () => {
      const mockSupabase = createMockSupabaseClient({ user: null });

      try {
        await authServer.requireAdmin(mockSupabase, "invalid-token");
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
      }
    });
  });

  // --------------------------------------------------------------------------
  // requireModerator Tests
  // --------------------------------------------------------------------------

  describe("requireModerator", () => {
    it("returns dbUser when user is moderator", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-mod" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-mod",
        role: "MODERATOR",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser: mockSupabaseUser as AdminUserWithBan,
      });

      const result = await authServer.requireModerator(
        mockSupabase,
        "valid-token",
      );

      expect(result).not.toBeNull();
      expect(result.role).toBe("MODERATOR");
    });

    it("returns dbUser when user is admin (moderator privilege)", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-admin" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-admin",
        role: "ADMIN",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser: mockSupabaseUser as AdminUserWithBan,
      });

      const result = await authServer.requireModerator(
        mockSupabase,
        "valid-token",
      );

      expect(result).not.toBeNull();
      expect(result.role).toBe("ADMIN");
    });

    it("throws AuthorizationError when user is regular user", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-user" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-user",
        role: "USER",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser: mockSupabaseUser as AdminUserWithBan,
      });

      try {
        await authServer.requireModerator(mockSupabase, "valid-token");
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError);
        expect((error as AuthorizationError).message).toBe(
          "Moderator access required",
        );
      }
    });

    it("throws AuthorizationError when user is service role", async () => {
      const mockSupabaseUser = createMockSupabaseUser({ id: "auth-service" });
      const mockDbUser = createMockDatabaseUser({
        authUserId: "auth-service",
        role: "SERVICE",
      });
      mockPrisma = createMockPrismaClient([mockDbUser]);
      authServer = new AuthServer(mockPrisma);

      const mockSupabase = createMockSupabaseClient({
        user: mockSupabaseUser,
        adminUser: mockSupabaseUser as AdminUserWithBan,
      });

      try {
        await authServer.requireModerator(mockSupabase, "valid-token");
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError);
      }
    });

    it("throws AuthenticationError when not authenticated", async () => {
      const mockSupabase = createMockSupabaseClient({ user: null });

      try {
        await authServer.requireModerator(mockSupabase, "invalid-token");
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
      }
    });
  });
});

// ============================================================================
// syncUserToDatabase Tests
// ============================================================================

describe("[UNIT] syncUserToDatabase", () => {
  it("syncs user with default USER role", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      id: "auth-123",
      user_metadata: {},
    });

    const upsertedUsers: Array<{
      authUserId: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
    }> = [];

    const mockUpsert = async (data: {
      authUserId: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
    }) => {
      upsertedUsers.push(data);
      return createMockDatabaseUser({
        authUserId: data.authUserId,
        role: data.role as "USER" | "ADMIN" | "MODERATOR" | "SERVICE",
      });
    };

    const result = await syncUserToDatabase(mockSupabaseUser, mockUpsert);

    expect(upsertedUsers).toHaveLength(1);
    expect(upsertedUsers[0]?.role).toBe("USER");
  });

  it("syncs user with ADMIN role from app_metadata", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      id: "auth-admin",
      app_metadata: { role: "admin" },
    });

    const mockUpsert = async (data: { role: string }) => {
      return createMockDatabaseUser({
        authUserId: "auth-admin",
        role: data.role as "USER" | "ADMIN" | "MODERATOR" | "SERVICE",
      });
    };

    const result = await syncUserToDatabase(mockSupabaseUser, mockUpsert);

    expect(result.role).toBe("ADMIN");
  });

  it("syncs user with MODERATOR role from user_metadata", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      id: "auth-mod",
      user_metadata: { role: "moderator" },
    });

    const mockUpsert = async (data: { role: string }) => {
      return createMockDatabaseUser({
        authUserId: "auth-mod",
        role: data.role as "USER" | "ADMIN" | "MODERATOR" | "SERVICE",
      });
    };

    const result = await syncUserToDatabase(mockSupabaseUser, mockUpsert);

    expect(result.role).toBe("MODERATOR");
  });

  it("syncs user with SERVICE role", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      id: "auth-service",
      app_metadata: { role: "service" },
    });

    const mockUpsert = async (data: { role: string }) => {
      return createMockDatabaseUser({
        authUserId: "auth-service",
        role: data.role as "USER" | "ADMIN" | "MODERATOR" | "SERVICE",
      });
    };

    const result = await syncUserToDatabase(mockSupabaseUser, mockUpsert);

    expect(result.role).toBe("SERVICE");
  });

  it("parses name from user_metadata", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      id: "auth-123",
      user_metadata: { name: "John Michael Doe" },
    });

    const mockUpsert = async (data: {
      authUserId: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
    }) => {
      expect(data.firstName).toBe("John");
      expect(data.lastName).toBe("Michael Doe");
      return createMockDatabaseUser({
        authUserId: data.authUserId,
        firstName: data.firstName,
        lastName: data.lastName,
      });
    };

    await syncUserToDatabase(mockSupabaseUser, mockUpsert);
  });

  it("uses email prefix when name not provided", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      id: "auth-123",
      email: "testuser@example.com",
      user_metadata: {},
    });

    const mockUpsert = async (data: {
      firstName: string | null;
      lastName: string | null;
    }) => {
      expect(data.firstName).toBe("testuser");
      expect(data.lastName).toBeNull();
      return createMockDatabaseUser({
        firstName: data.firstName,
        lastName: data.lastName,
      });
    };

    await syncUserToDatabase(mockSupabaseUser, mockUpsert);
  });

  it("handles single name part", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      id: "auth-123",
      user_metadata: { name: "Madonna" },
    });

    const mockUpsert = async (data: {
      firstName: string | null;
      lastName: string | null;
    }) => {
      expect(data.firstName).toBe("Madonna");
      expect(data.lastName).toBeNull();
      return createMockDatabaseUser({
        firstName: data.firstName,
        lastName: data.lastName,
      });
    };

    await syncUserToDatabase(mockSupabaseUser, mockUpsert);
  });

  it("handles empty name gracefully", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      id: "auth-123",
      user_metadata: { name: "" },
      email: "fallback@example.com",
    });

    const mockUpsert = async (data: {
      firstName: string | null;
      lastName: string | null;
    }) => {
      // Empty string name becomes null (parseName converts empty to null)
      expect(data.firstName).toBeNull();
      return createMockDatabaseUser({
        firstName: data.firstName,
      });
    };

    await syncUserToDatabase(mockSupabaseUser, mockUpsert);
  });

  it("handles null email gracefully", async () => {
    // Need to create a custom mock without the default email
    const mockSupabaseUser = {
      id: "auth-123",
      email: null,
      user_metadata: {},
      app_metadata: {},
      email_confirmed_at: new Date().toISOString(),
      phone: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as SupabaseUser;

    const mockUpsert = async (data: {
      firstName: string | null;
      lastName: string | null;
    }) => {
      expect(data.firstName).toBeNull();
      expect(data.lastName).toBeNull();
      return createMockDatabaseUser({
        firstName: data.firstName,
        lastName: data.lastName,
      });
    };

    await syncUserToDatabase(mockSupabaseUser, mockUpsert);
  });

  it("is case-insensitive for role mapping", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      id: "auth-123",
      app_metadata: { role: "ADMIN" }, // uppercase
    });

    const mockUpsert = async (data: { role: string }) => {
      expect(data.role).toBe("ADMIN");
      return createMockDatabaseUser({
        role: data.role as "USER" | "ADMIN" | "MODERATOR" | "SERVICE",
      });
    };

    await syncUserToDatabase(mockSupabaseUser, mockUpsert);
  });

  it("prioritizes app_metadata over user_metadata for role", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      id: "auth-123",
      app_metadata: { role: "admin" },
      user_metadata: { role: "user" },
    });

    const mockUpsert = async (data: { role: string }) => {
      expect(data.role).toBe("ADMIN");
      return createMockDatabaseUser({
        role: data.role as "USER" | "ADMIN" | "MODERATOR" | "SERVICE",
      });
    };

    await syncUserToDatabase(mockSupabaseUser, mockUpsert);
  });
});
