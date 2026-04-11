import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { authStore, type AuthUser, type SupabaseSession } from "../authStore";

const resetStore = () => {
  authStore.setState({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });
};

beforeEach(() => {
  resetStore();
});

const createMockUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: "user-123",
  authUserId: "auth-123",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  name: "Test User",
  emailVerified: null,
  role: "USER",
  ...overrides,
});

const createMockSession = (
  overrides: Partial<SupabaseSession> = {},
): SupabaseSession => ({
  user: {
    id: "user-123",
    email: "test@example.com",
  },
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  ...overrides,
});

describe("[UNIT] authStore initial state", () => {
  test("has correct initial state values", () => {
    const state = authStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isAuthenticated).toBe(false);
  });
});

describe("[UNIT] authStore setUser action", () => {
  test("sets user and updates isAuthenticated to true when user is provided", () => {
    const { setUser } = authStore.getState();
    const mockUser = createMockUser();

    setUser(mockUser);

    const state = authStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  test("sets user to null and isAuthenticated to false when null is passed", () => {
    const { setUser } = authStore.getState();
    const { setSession } = authStore.getState();
    const mockUser = createMockUser();
    const mockSession = createMockSession();

    setUser(mockUser);
    setSession(mockSession);
    expect(authStore.getState().isAuthenticated).toBe(true);

    setUser(null);

    const state = authStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

describe("[UNIT] authStore setSession action", () => {
  test("sets session to provided value", () => {
    const { setSession } = authStore.getState();
    const mockSession = createMockSession();

    setSession(mockSession);

    const state = authStore.getState();
    expect(state.session).toEqual(mockSession);
  });

  test("sets session to null when null is passed", () => {
    const { setSession } = authStore.getState();
    const mockSession = createMockSession();

    setSession(mockSession);
    expect(authStore.getState().session).not.toBeNull();

    setSession(null);

    const state = authStore.getState();
    expect(state.session).toBeNull();
  });
});

describe("[UNIT] authStore setLoading action", () => {
  test("sets isLoading to true", () => {
    const { setLoading } = authStore.getState();

    setLoading(true);

    expect(authStore.getState().isLoading).toBe(true);
  });

  test("sets isLoading to false", () => {
    const { setLoading } = authStore.getState();

    setLoading(false);

    expect(authStore.getState().isLoading).toBe(false);
  });
});

describe("[UNIT] authStore isAuthenticated flag", () => {
  test("is false when both user and session are null", () => {
    expect(authStore.getState().isAuthenticated).toBe(false);
  });

  test("is true when user is set", () => {
    const { setUser } = authStore.getState();
    setUser(createMockUser());

    expect(authStore.getState().isAuthenticated).toBe(true);
  });

  test("is false when user is set to null", () => {
    const { setUser } = authStore.getState();
    setUser(createMockUser());
    expect(authStore.getState().isAuthenticated).toBe(true);

    setUser(null);
    expect(authStore.getState().isAuthenticated).toBe(false);
  });
});

describe("[UNIT] authStore state transitions", () => {
  test("transitions from initial to authenticated state", () => {
    const state = authStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.isAuthenticated).toBe(false);

    const { setLoading } = authStore.getState();
    const { setUser } = authStore.getState();
    setLoading(false);
    setUser(createMockUser());

    const finalState = authStore.getState();
    expect(finalState.isLoading).toBe(false);
    expect(finalState.user).not.toBeNull();
    expect(finalState.isAuthenticated).toBe(true);
  });

  test("transitions from authenticated to loading state", () => {
    const { setUser } = authStore.getState();
    const { setLoading } = authStore.getState();
    setUser(createMockUser());
    expect(authStore.getState().isAuthenticated).toBe(true);

    setLoading(true);

    const state = authStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.isAuthenticated).toBe(true);
  });
});

describe("[UNIT] authStore user role handling", () => {
  test("accepts USER role", () => {
    const { setUser } = authStore.getState();
    const user = createMockUser({ role: "USER" });
    setUser(user);

    expect(authStore.getState().user?.role).toBe("USER");
  });

  test("accepts ADMIN role", () => {
    const { setUser } = authStore.getState();
    const user = createMockUser({ role: "ADMIN" });
    setUser(user);

    expect(authStore.getState().user?.role).toBe("ADMIN");
  });

  test("accepts MODERATOR role", () => {
    const { setUser } = authStore.getState();
    const user = createMockUser({ role: "MODERATOR" });
    setUser(user);

    expect(authStore.getState().user?.role).toBe("MODERATOR");
  });

  test("accepts SERVICE role", () => {
    const { setUser } = authStore.getState();
    const user = createMockUser({ role: "SERVICE" });
    setUser(user);

    expect(authStore.getState().user?.role).toBe("SERVICE");
  });
});

describe("[UNIT] authStore user properties", () => {
  test("stores all user properties correctly", () => {
    const { setUser } = authStore.getState();
    const user: AuthUser = {
      id: "user-id",
      authUserId: "auth-id",
      email: "user@example.com",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      emailVerified: new Date("2024-01-01"),
      role: "USER",
    };

    setUser(user);

    const state = authStore.getState();
    expect(state.user).toEqual(user);
  });

  test("handles user with null optional properties", () => {
    const { setUser } = authStore.getState();
    const user = createMockUser({
      email: null,
      firstName: null,
      lastName: null,
      name: null,
      emailVerified: null,
    });

    setUser(user);

    const state = authStore.getState();
    expect(state.user?.email).toBeNull();
    expect(state.user?.firstName).toBeNull();
    expect(state.user?.lastName).toBeNull();
    expect(state.user?.name).toBeNull();
    expect(state.user?.emailVerified).toBeNull();
  });
});
