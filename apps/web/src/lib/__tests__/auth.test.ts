// Set environment variables BEFORE any imports execute
process.env.PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key";
process.env.PUBLIC_TRPC_API_URL = "http://localhost:3001/trpc";
process.env.PUBLIC_TRPC_WS_URL = "ws://localhost:3001/trpc";

import { describe, expect, test, beforeEach, mock } from "bun:test";

// Mocks
const mockQuery = mock(() => Promise.resolve(null));
const mockCleanup = mock(() => Promise.resolve());
const mockGetUser = mock(() =>
  Promise.resolve({ data: { user: null }, error: null }),
);

mock.module("@repo/frameworks/trpc/client", () => ({
  getTRPCClient: () => ({
    client: {
      user: {
        getMy: {
          query: mockQuery,
        },
      },
    },
    cleanup: mockCleanup,
  }),
}));

mock.module("../supabase", () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
  },
}));

// Import after mocks
import { onAuthUserFetch, checkIsAdminUser } from "../auth";
import { authStore } from "@repo/frameworks/auth/client";

// Reset authStore before each test
const resetAuthStore = () => {
  authStore.setState({
    user: null,
    session: null,
    isLoading: false,
    isAuthenticated: false,
  });
};

beforeEach(() => {
  resetAuthStore();
  mockQuery.mockClear();
  mockCleanup.mockClear();
  mockGetUser.mockClear();
});

const createMockSession = (accessToken: string = "mock-token") => ({
  user: { id: "auth-user-123", email: "test@example.com" },
  access_token: accessToken,
  refresh_token: "mock-refresh",
});

const createMockUserResponse = (
  overrides: Partial<{
    id: string;
    authUserId: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
  }> = {},
) => ({
  id: "user-123",
  authUserId: "auth-user-123",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "USER" as const,
  ...overrides,
});

describe("[INTEGRATION] onAuthUserFetch", () => {
  test("returns null when no session exists", async () => {
    const result = await onAuthUserFetch("auth-user-123");
    expect(result).toBeNull();
  });

  test("returns null when no access token in session", async () => {
    authStore.setState({
      session: { user: { id: "auth-user-123" } } as any,
    });

    const result = await onAuthUserFetch("auth-user-123");
    expect(result).toBeNull();
  });

  test("fetches user via tRPC and returns mapped AuthUser", async () => {
    const mockUser = createMockUserResponse({
      firstName: "John",
      lastName: "Doe",
    });
    mockQuery.mockImplementation(() => Promise.resolve(mockUser));

    authStore.setState({
      session: createMockSession(),
    });

    const result = await onAuthUserFetch("auth-user-123");

    expect(result).not.toBeNull();
    expect(result?.id).toBe("user-123");
    expect(result?.authUserId).toBe("auth-user-123");
    expect(result?.email).toBe("test@example.com");
    expect(result?.firstName).toBe("John");
    expect(result?.lastName).toBe("Doe");
    expect(result?.name).toBe("John Doe");
    expect(result?.role).toBe("USER");
    expect(mockCleanup).toHaveBeenCalled();
  });

  test("returns null when tRPC user authUserId doesn't match", async () => {
    const mockUser = createMockUserResponse({
      authUserId: "different-auth-id",
    });
    mockQuery.mockImplementation(() => Promise.resolve(mockUser));

    authStore.setState({
      session: createMockSession(),
    });

    const result = await onAuthUserFetch("auth-user-123");
    expect(result).toBeNull();
  });

  test("handles tRPC error and falls back to Supabase", async () => {
    mockQuery.mockImplementation(() =>
      Promise.reject(new Error("tRPC failed")),
    );

    const supabaseUser = {
      id: "auth-user-123",
      email: "fallback@example.com",
      user_metadata: {
        firstName: "Fallback",
        lastName: "User",
      },
      app_metadata: {
        role: "ADMIN",
      },
    };
    mockGetUser.mockImplementation(() =>
      Promise.resolve({ data: { user: supabaseUser }, error: null }),
    );

    authStore.setState({
      session: createMockSession(),
    });

    const result = await onAuthUserFetch("auth-user-123");

    expect(result).not.toBeNull();
    expect(result?.email).toBe("fallback@example.com");
    expect(result?.firstName).toBe("Fallback");
    expect(result?.lastName).toBe("User");
    expect(result?.name).toBe("Fallback User");
    expect(result?.role).toBe("ADMIN");
  });

  test("returns null when Supabase user ID doesn't match", async () => {
    mockQuery.mockImplementation(() =>
      Promise.reject(new Error("tRPC failed")),
    );

    const supabaseUser = {
      id: "different-auth-id",
      email: "wrong@example.com",
    };
    mockGetUser.mockImplementation(() =>
      Promise.resolve({ data: { user: supabaseUser }, error: null }),
    );

    authStore.setState({
      session: createMockSession(),
    });

    const result = await onAuthUserFetch("auth-user-123");
    expect(result).toBeNull();
  });

  test("returns null when Supabase getUser returns error", async () => {
    mockQuery.mockImplementation(() =>
      Promise.reject(new Error("tRPC failed")),
    );
    mockGetUser.mockImplementation(() =>
      Promise.resolve({
        data: { user: null },
        error: new Error("Auth failed"),
      }),
    );

    authStore.setState({
      session: createMockSession(),
    });

    const result = await onAuthUserFetch("auth-user-123");
    expect(result).toBeNull();
  });

  test("maps name correctly when only firstName is provided", async () => {
    const mockUser = createMockUserResponse({
      firstName: "John",
      lastName: null,
    });
    mockQuery.mockImplementation(() => Promise.resolve(mockUser));

    authStore.setState({
      session: createMockSession(),
    });

    const result = await onAuthUserFetch("auth-user-123");
    expect(result?.name).toBe("John");
  });

  test("maps name correctly when only lastName is provided", async () => {
    const mockUser = createMockUserResponse({
      firstName: null,
      lastName: "Doe",
    });
    mockQuery.mockImplementation(() => Promise.resolve(mockUser));

    authStore.setState({
      session: createMockSession(),
    });

    const result = await onAuthUserFetch("auth-user-123");
    expect(result?.name).toBe("Doe");
  });

  test("maps name as null when neither first nor last name provided", async () => {
    const mockUser = createMockUserResponse({
      firstName: null,
      lastName: null,
    });
    mockQuery.mockImplementation(() => Promise.resolve(mockUser));

    authStore.setState({
      session: createMockSession(),
    });

    const result = await onAuthUserFetch("auth-user-123");
    expect(result?.name).toBeNull();
  });

  test("handles different roles correctly", async () => {
    const roles: Array<"USER" | "ADMIN" | "MODERATOR" | "SERVICE"> = [
      "USER",
      "ADMIN",
      "MODERATOR",
      "SERVICE",
    ];

    for (const role of roles) {
      mockQuery.mockClear();
      const mockUser = createMockUserResponse({ role });
      mockQuery.mockImplementation(() => Promise.resolve(mockUser));

      authStore.setState({
        session: createMockSession(),
      });

      const result = await onAuthUserFetch("auth-user-123");
      expect(result?.role).toBe(role);
    }
  });

  test("handles Supabase fallback with missing metadata", async () => {
    mockQuery.mockImplementation(() =>
      Promise.reject(new Error("tRPC failed")),
    );

    const supabaseUser = {
      id: "auth-user-123",
      email: "minimal@example.com",
      user_metadata: {},
      app_metadata: {},
    };
    mockGetUser.mockImplementation(() =>
      Promise.resolve({ data: { user: supabaseUser }, error: null }),
    );

    authStore.setState({
      session: createMockSession(),
    });

    const result = await onAuthUserFetch("auth-user-123");
    expect(result?.firstName).toBeNull();
    expect(result?.lastName).toBeNull();
    expect(result?.name).toBeNull();
    expect(result?.role).toBe("USER"); // Default role
  });
});

describe("[INTEGRATION] checkIsAdminUser", () => {
  test("returns false when no session exists", async () => {
    const result = await checkIsAdminUser();
    expect(result).toBe(false);
  });

  test("returns true when tRPC returns ADMIN role", async () => {
    const mockUser = createMockUserResponse({ role: "ADMIN" });
    mockQuery.mockImplementation(() => Promise.resolve(mockUser));

    authStore.setState({
      session: createMockSession(),
    });

    const result = await checkIsAdminUser();
    expect(result).toBe(true);
  });

  test("returns false when tRPC returns non-ADMIN role", async () => {
    const mockUser = createMockUserResponse({ role: "USER" });
    mockQuery.mockImplementation(() => Promise.resolve(mockUser));

    authStore.setState({
      session: createMockSession(),
    });

    const result = await checkIsAdminUser();
    expect(result).toBe(false);
  });

  test("returns false when tRPC returns MODERATOR role", async () => {
    const mockUser = createMockUserResponse({ role: "MODERATOR" });
    mockQuery.mockImplementation(() => Promise.resolve(mockUser));

    authStore.setState({
      session: createMockSession(),
    });

    const result = await checkIsAdminUser();
    expect(result).toBe(false);
  });

  test("returns false when tRPC returns null user", async () => {
    mockQuery.mockImplementation(() => Promise.resolve(null));

    authStore.setState({
      session: createMockSession(),
    });

    const result = await checkIsAdminUser();
    expect(result).toBe(false);
  });

  test("falls back to Supabase when tRPC fails", async () => {
    mockQuery.mockImplementation(() =>
      Promise.reject(new Error("tRPC failed")),
    );

    const supabaseUser = {
      id: "auth-user-123",
      email: "admin@example.com",
      app_metadata: {
        role: "ADMIN",
      },
    };
    mockGetUser.mockImplementation(() =>
      Promise.resolve({ data: { user: supabaseUser }, error: null }),
    );

    authStore.setState({
      session: createMockSession(),
    });

    const result = await checkIsAdminUser();
    expect(result).toBe(true);
  });

  test("returns false on Supabase fallback when not ADMIN", async () => {
    mockQuery.mockImplementation(() =>
      Promise.reject(new Error("tRPC failed")),
    );

    const supabaseUser = {
      id: "auth-user-123",
      email: "user@example.com",
      app_metadata: {
        role: "USER",
      },
    };
    mockGetUser.mockImplementation(() =>
      Promise.resolve({ data: { user: supabaseUser }, error: null }),
    );

    authStore.setState({
      session: createMockSession(),
    });

    const result = await checkIsAdminUser();
    expect(result).toBe(false);
  });

  test("returns false when Supabase getUser fails", async () => {
    mockQuery.mockImplementation(() =>
      Promise.reject(new Error("tRPC failed")),
    );
    mockGetUser.mockImplementation(() =>
      Promise.resolve({
        data: { user: null },
        error: new Error("Auth failed"),
      }),
    );

    authStore.setState({
      session: createMockSession(),
    });

    const result = await checkIsAdminUser();
    expect(result).toBe(false);
  });

  test("returns false when Supabase returns no user", async () => {
    mockQuery.mockImplementation(() =>
      Promise.reject(new Error("tRPC failed")),
    );
    mockGetUser.mockImplementation(() =>
      Promise.resolve({ data: { user: null }, error: null }),
    );

    authStore.setState({
      session: createMockSession(),
    });

    const result = await checkIsAdminUser();
    expect(result).toBe(false);
  });
});
