import { describe, test, expect, mock, spyOn } from "bun:test";
import type { SupabaseUser, SupabaseClient } from "@mirai-app/supabase";
import type { User, Role, PrismaClient } from "@mirai-app/db";
import {
  decodeJwtPayload,
  hasRequiredRole,
  parseRolesFromToken,
  requireAuth,
  requireAdmin,
  requireModerator,
  syncUserToDatabase,
  AuthenticationError,
  AuthorizationError,
  mapDatabaseUserToAuthUser,
  getSession,
} from "../authServer";

const createMockSupabaseUser = (
  overrides: Partial<SupabaseUser> = {},
): SupabaseUser =>
  ({
    id: "auth-user-123",
    email: "test@example.com",
    email_confirmed_at: "2024-01-01T00:00:00Z",
    app_metadata: {},
    user_metadata: {},
    ...overrides,
  }) as SupabaseUser;

const createMockDbUser = (overrides: Partial<User> = {}): User =>
  ({
    id: "db-user-456",
    authUserId: "auth-user-123",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    name: "John Doe",
    hasAvatar: false,
    wristNumber: null,
    houseNumber: null,
    role: "USER",
    groupId: null,
    emailVerified: new Date(),
    ...overrides,
  }) as User;

const createMockSupabaseClient = (
  overrides: Partial<{
    getUser: Partial<ReturnType<SupabaseClient["auth"]["getUser"]>>;
    getSession: Partial<ReturnType<SupabaseClient["auth"]["getSession"]>>;
    adminGetUserById: Partial<{
      user: SupabaseUser | null;
      error: { message: string } | null;
    }>;
  }> = {},
) => {
  const mockGetUser = mock(() =>
    Promise.resolve({
      data: { user: overrides.getUser?.user ?? createMockSupabaseUser() },
      error: overrides.getUser?.error ?? null,
    }),
  );

  const mockGetSession = mock(() =>
    Promise.resolve({
      data: { session: overrides.getSession?.session ?? null },
      error: overrides.getSession?.error ?? null,
    }),
  );

  const mockAdminGetUserById = mock(() =>
    Promise.resolve({
      data: {
        user: overrides.adminGetUserById?.user ?? null,
      },
      error: overrides.adminGetUserById?.error ?? null,
    }),
  );

  return {
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
      admin: {
        getUserById: mockAdminGetUserById,
      },
    },
  } as unknown as SupabaseClient;
};

const createMockPrismaClient = (
  overrides: {
    userFindFirst?: Partial<ReturnType<PrismaClient["user"]["findFirst"]>>;
  } = {},
) => {
  const mockFindFirst = mock(() =>
    Promise.resolve(overrides.userFindFirst?.result ?? null),
  );

  return {
    user: {
      findFirst: mockFindFirst,
    },
  } as unknown as PrismaClient;
};

// Standard base64 encoding for JWT - uses Buffer for consistent behavior across environments
// Bun compatibility fix: Using Buffer.from().toString("base64") instead of btoa() because
// Bun's btoa() can produce encoding that Buffer.from(str, "base64") fails to decode correctly.
// This ensures mock JWT tokens are both encodable and decodable in the Bun test environment.
const base64Encode = (obj: object): string => {
  const json = JSON.stringify(obj);
  // Use Buffer.from for consistent base64 encoding (handles UTF-8 properly)
  return Buffer.from(json).toString("base64");
};

const createJwtPayload = (payload: object): string => {
  const header = base64Encode({ alg: "HS256", typ: "JWT" });
  const body = base64Encode(payload);
  const signature = "mock-signature";
  return `${header}.${body}.${signature}`;
};

// Helper to create a valid mock JWT token for use in tests
// This creates a valid JWT format without causing decode errors
const createValidMockToken = (
  overrides: { userId?: string; exp?: number } = {},
): string => {
  const payload = {
    sub: overrides.userId ?? "auth-user-123",
    exp: overrides.exp ?? Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
  };
  return createJwtPayload(payload);
};

describe("decodeJwtPayload", () => {
  test("returns null for token with missing payload", () => {
    const result = decodeJwtPayload("header..signature");
    expect(result).toBeNull();
  });

  test("returns null for empty string token", () => {
    const result = decodeJwtPayload("");
    expect(result).toBeNull();
  });

  test("returns decoded payload for valid token", () => {
    const payload = { userId: "123", role: "admin", exp: 9999999999 };
    const token = createJwtPayload(payload);
    const result = decodeJwtPayload<typeof payload>(token);
    expect(result).toEqual(payload);
  });

  test("returns decoded payload with special characters", () => {
    const payload = { name: "John Doe", email: "test@example.com" };
    const token = createJwtPayload(payload);
    const result = decodeJwtPayload<typeof payload>(token);
    expect(result).toEqual(payload);
  });

  test("returns null for malformed base64 in payload", () => {
    const result = decodeJwtPayload("header.invalid!!!base64.signature");
    expect(result).toBeNull();
  });
});

describe("hasRequiredRole", () => {
  test("returns true when user has required role", () => {
    const groups = ["user", "moderator", "admin"];
    expect(hasRequiredRole(groups, "user")).toBe(true);
    expect(hasRequiredRole(groups, "moderator")).toBe(true);
    expect(hasRequiredRole(groups, "admin")).toBe(true);
  });

  test("returns false when user lacks required role", () => {
    const groups = ["user", "viewer"];
    expect(hasRequiredRole(groups, "admin")).toBe(false);
    expect(hasRequiredRole(groups, "moderator")).toBe(false);
  });

  test("returns false for empty groups array", () => {
    expect(hasRequiredRole([], "user")).toBe(false);
  });

  test("handles role hierarchy correctly", () => {
    const adminGroups = ["admin", "moderator", "user"];
    const moderatorGroups = ["moderator", "user"];
    const userGroups = ["user"];

    expect(hasRequiredRole(adminGroups, "admin")).toBe(true);
    expect(hasRequiredRole(adminGroups, "moderator")).toBe(true);
    expect(hasRequiredRole(adminGroups, "user")).toBe(true);

    expect(hasRequiredRole(moderatorGroups, "admin")).toBe(false);
    expect(hasRequiredRole(moderatorGroups, "moderator")).toBe(true);
    expect(hasRequiredRole(moderatorGroups, "user")).toBe(true);

    expect(hasRequiredRole(userGroups, "admin")).toBe(false);
    expect(hasRequiredRole(userGroups, "moderator")).toBe(false);
    expect(hasRequiredRole(userGroups, "user")).toBe(true);
  });
});

describe("parseRolesFromToken", () => {
  test("returns empty array for undefined token", () => {
    expect(parseRolesFromToken(undefined)).toEqual([]);
  });

  test("returns empty array for token without groups", () => {
    const token = createJwtPayload({ userId: "123" });
    expect(parseRolesFromToken(token)).toEqual([]);
  });

  test("returns groups from token payload", () => {
    const token = createJwtPayload({ groups: ["admin", "moderator"] });
    expect(parseRolesFromToken(token)).toEqual(["admin", "moderator"]);
  });

  test("returns groups value as-is even when not an array", () => {
    const token = createJwtPayload({ groups: "admin" });
    expect(parseRolesFromToken(token)).toEqual("admin");
  });
});

describe("requireAuth", () => {
  test("throws AuthenticationError when no access token provided and no session", async () => {
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: null, error: null },
    });
    const mockDb = createMockPrismaClient();

    await expect(requireAuth(mockDb, mockSupabase, undefined)).rejects.toThrow(
      AuthenticationError,
    );
  });

  test("throws AuthenticationError when user not found in database", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: mockSupabaseUser },
      adminGetUserById: { user: mockSupabaseUser, error: null },
    });
    const mockDb = createMockPrismaClient({
      userFindFirst: { result: null },
    });

    await expect(
      requireAuth(mockDb, mockSupabase, createValidMockToken()),
    ).rejects.toThrow(AuthenticationError);
  });

  test("returns user and dbUser when authentication succeeds", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const mockDbUser = createMockDbUser();
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: mockSupabaseUser },
      adminGetUserById: { user: mockSupabaseUser, error: null },
    });
    const mockDb = createMockPrismaClient({
      userFindFirst: { result: mockDbUser },
    });

    const result = await requireAuth(
      mockDb,
      mockSupabase,
      createValidMockToken(),
    );
    expect(result.user).toBeDefined();
    expect(result.dbUser).toEqual(mockDbUser);
  });

  test("throws AuthenticationError when user is banned", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const bannedUser = { ...mockSupabaseUser, banned_until: futureDate };
    const mockDbUser = createMockDbUser();
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: mockSupabaseUser },
      adminGetUserById: { user: bannedUser, error: null },
    });
    const mockDb = createMockPrismaClient({
      userFindFirst: { result: mockDbUser },
    });

    await expect(
      requireAuth(mockDb, mockSupabase, createValidMockToken()),
    ).rejects.toThrow("User is banned");
  });
});

describe("requireAdmin", () => {
  test("throws AuthorizationError when user is not admin", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const mockDbUser = createMockDbUser({ role: "USER" });
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: mockSupabaseUser },
      adminGetUserById: { user: mockSupabaseUser, error: null },
    });
    const mockDb = createMockPrismaClient({
      userFindFirst: { result: mockDbUser },
    });

    await expect(
      requireAdmin(mockDb, mockSupabase, createValidMockToken()),
    ).rejects.toThrow(AuthorizationError);
  });

  test("returns dbUser when user is admin", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const mockDbUser = createMockDbUser({ role: "ADMIN" });
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: mockSupabaseUser },
      adminGetUserById: { user: mockSupabaseUser, error: null },
    });
    const mockDb = createMockPrismaClient({
      userFindFirst: { result: mockDbUser },
    });

    const result = await requireAdmin(
      mockDb,
      mockSupabase,
      createValidMockToken(),
    );
    expect(result).toEqual(mockDbUser);
  });

  test("throws AuthorizationError when user is moderator but not admin", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const mockDbUser = createMockDbUser({ role: "MODERATOR" });
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: mockSupabaseUser },
      adminGetUserById: { user: mockSupabaseUser, error: null },
    });
    const mockDb = createMockPrismaClient({
      userFindFirst: { result: mockDbUser },
    });

    await expect(
      requireAdmin(mockDb, mockSupabase, createValidMockToken()),
    ).rejects.toThrow(AuthorizationError);
  });
});

describe("requireModerator", () => {
  test("throws AuthorizationError when user is not moderator or admin", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const mockDbUser = createMockDbUser({ role: "USER" });
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: mockSupabaseUser },
      adminGetUserById: { user: mockSupabaseUser, error: null },
    });
    const mockDb = createMockPrismaClient({
      userFindFirst: { result: mockDbUser },
    });

    await expect(
      requireModerator(mockDb, mockSupabase, createValidMockToken()),
    ).rejects.toThrow(AuthorizationError);
  });

  test("returns dbUser when user is moderator", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const mockDbUser = createMockDbUser({ role: "MODERATOR" });
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: mockSupabaseUser },
      adminGetUserById: { user: mockSupabaseUser, error: null },
    });
    const mockDb = createMockPrismaClient({
      userFindFirst: { result: mockDbUser },
    });

    const result = await requireModerator(
      mockDb,
      mockSupabase,
      createValidMockToken(),
    );
    expect(result).toEqual(mockDbUser);
  });

  test("returns dbUser when user is admin (admin has moderator privileges)", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const mockDbUser = createMockDbUser({ role: "ADMIN" });
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: mockSupabaseUser },
      adminGetUserById: { user: mockSupabaseUser, error: null },
    });
    const mockDb = createMockPrismaClient({
      userFindFirst: { result: mockDbUser },
    });

    const result = await requireModerator(
      mockDb,
      mockSupabase,
      createValidMockToken(),
    );
    expect(result).toEqual(mockDbUser);
  });
});

describe("syncUserToDatabase", () => {
  test("creates new user with USER role by default", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const expectedDbUser = createMockDbUser();
    const upsertUser = mock(() => Promise.resolve(expectedDbUser));

    const result = await syncUserToDatabase(mockSupabaseUser, upsertUser);

    expect(result).toEqual(expectedDbUser);
    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        authUserId: mockSupabaseUser.id,
        role: "USER",
      }),
    );
  });

  test("maps admin role from app_metadata", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      app_metadata: { role: "admin" },
    });
    const expectedDbUser = createMockDbUser({ role: "ADMIN" });
    const upsertUser = mock(() => Promise.resolve(expectedDbUser));

    await syncUserToDatabase(mockSupabaseUser, upsertUser);

    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "ADMIN",
      }),
    );
  });

  test("maps moderator role from user_metadata", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      user_metadata: { role: "moderator" },
    });
    const expectedDbUser = createMockDbUser({ role: "MODERATOR" });
    const upsertUser = mock(() => Promise.resolve(expectedDbUser));

    await syncUserToDatabase(mockSupabaseUser, upsertUser);

    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "MODERATOR",
      }),
    );
  });

  test("maps service role correctly", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      app_metadata: { role: "service" },
    });
    const expectedDbUser = createMockDbUser({ role: "SERVICE" });
    const upsertUser = mock(() => Promise.resolve(expectedDbUser));

    await syncUserToDatabase(mockSupabaseUser, upsertUser);

    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "SERVICE",
      }),
    );
  });

  test("parses full name into firstName and lastName", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      user_metadata: { name: "John Doe" },
    });
    const expectedDbUser = createMockDbUser({
      firstName: "John",
      lastName: "Doe",
    });
    const upsertUser = mock(() => Promise.resolve(expectedDbUser));

    await syncUserToDatabase(mockSupabaseUser, upsertUser);

    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "John",
        lastName: "Doe",
      }),
    );
  });

  test("uses email prefix as fallback for name", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      email: "johndoe@example.com",
    });
    const expectedDbUser = createMockDbUser();
    const upsertUser = mock(() => Promise.resolve(expectedDbUser));

    await syncUserToDatabase(mockSupabaseUser, upsertUser);

    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "johndoe",
        lastName: null,
      }),
    );
  });

  test("handles single name part", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      user_metadata: { name: "John" },
    });
    const expectedDbUser = createMockDbUser();
    const upsertUser = mock(() => Promise.resolve(expectedDbUser));

    await syncUserToDatabase(mockSupabaseUser, upsertUser);

    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "John",
        lastName: null,
      }),
    );
  });

  test("handles DB failure by propagating error", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const dbError = new Error("Database connection failed");
    const upsertUser = mock(() => Promise.reject(dbError));

    await expect(
      syncUserToDatabase(mockSupabaseUser, upsertUser),
    ).rejects.toThrow("Database connection failed");
  });

  test("updates existing user with changed email", async () => {
    const mockSupabaseUser = createMockSupabaseUser({
      email: "newemail@example.com",
    });
    const updatedDbUser = createMockDbUser({
      email: "newemail@example.com",
    });
    const upsertUser = mock(() => Promise.resolve(updatedDbUser));

    const result = await syncUserToDatabase(mockSupabaseUser, upsertUser);

    expect(result.email).toBe("newemail@example.com");
    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        authUserId: mockSupabaseUser.id,
      }),
    );
  });
});

describe("mapDatabaseUserToAuthUser", () => {
  test("returns null when dbUser is null", () => {
    const result = mapDatabaseUserToAuthUser(null);
    expect(result).toBeNull();
  });

  test("returns null when dbUser has no authUserId", () => {
    const dbUser = createMockDbUser({ authUserId: "" });
    const result = mapDatabaseUserToAuthUser(dbUser);
    expect(result).toBeNull();
  });

  test("maps database user to auth user correctly", () => {
    const dbUser = createMockDbUser({
      id: "db-123",
      authUserId: "auth-456",
      firstName: "Jane",
      lastName: "Smith",
      role: "ADMIN",
    });
    const supabaseUser = createMockSupabaseUser({
      id: "auth-456",
      email: "jane@example.com",
      email_confirmed_at: "2024-01-01T00:00:00Z",
    });

    const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

    expect(result).toEqual({
      id: "db-123",
      authUserId: "auth-456",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Smith",
      name: "Jane Smith",
      emailVerified: new Date("2024-01-01T00:00:00Z"),
      role: "ADMIN",
    });
  });

  test("uses email prefix as fallback for display name", () => {
    const dbUser = createMockDbUser({
      firstName: null,
      lastName: null,
    });
    const supabaseUser = createMockSupabaseUser({
      email: "testuser@example.com",
    });

    const result = mapDatabaseUserToAuthUser(dbUser, supabaseUser);

    expect(result?.name).toBe("testuser");
  });
});

describe("getSession", () => {
  test("returns null when no access token and no session", async () => {
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: null },
      getSession: { session: null },
    });
    const mockDb = createMockPrismaClient();

    const result = await getSession(mockDb, mockSupabase);
    expect(result).toBeNull();
  });

  test("returns user data when session exists", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const mockDbUser = createMockDbUser();
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: mockSupabaseUser },
    });
    const mockDb = createMockPrismaClient({
      userFindFirst: { result: mockDbUser },
    });

    const result = await getSession(
      mockDb,
      mockSupabase,
      createValidMockToken(),
    );

    expect(result).toEqual({
      user: expect.objectContaining({
        id: mockDbUser.id,
        authUserId: mockDbUser.authUserId,
      }),
      authUserId: mockSupabaseUser.id,
    });
  });

  test("returns user: null when db user not found", async () => {
    const mockSupabaseUser = createMockSupabaseUser();
    const mockSupabase = createMockSupabaseClient({
      getUser: { user: mockSupabaseUser },
    });
    const mockDb = createMockPrismaClient({
      userFindFirst: { result: null },
    });

    const result = await getSession(
      mockDb,
      mockSupabase,
      createValidMockToken(),
    );

    expect(result?.user).toBeNull();
    expect(result?.authUserId).toBe(mockSupabaseUser.id);
  });
});
