import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type AuthChangeEvent,
  type AuthUser,
  type SupabaseSession,
  _resetAuthStoreForTests,
  authStore,
} from "../authStore";

import { createMockSupabaseClient } from "../../test-utils/mock-factories";
import { flushPromises, mockConsole } from "../../test-utils/test-helpers";

describe("Auth Store", () => {
  let consoleMock: { restore: () => void };

  beforeEach(() => {
    _resetAuthStoreForTests();
    authStore.setState({
      user: null,
      session: null,
      isSessionLoading: true,
      isUserLoading: false,
      isLoading: true,
      isAuthenticated: false,
    });
    consoleMock = mockConsole(["error"]);
  });

  afterEach(() => {
    consoleMock.restore();
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = authStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isLoading).toBe(true);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("State Setters", () => {
    it("setUser should update user and isAuthenticated", () => {
      const mockUser: AuthUser = {
        id: "user-1",
        authUserId: "auth-1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        emailVerified: new Date(),
        role: "USER",
        hasName: true,
        hasEmail: true,
        isEmailVerified: true,
      };

      authStore.getState().setUser(mockUser);

      const state = authStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it("setUser with null should clear user and set isAuthenticated to false", () => {
      const mockUser: AuthUser = {
        id: "user-1",
        authUserId: "auth-1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        emailVerified: undefined,
        role: "USER",
        hasName: true,
        hasEmail: true,
        isEmailVerified: false,
      };

      authStore.getState().setUser(mockUser);
      expect(authStore.getState().isAuthenticated).toBe(true);

      authStore.getState().setUser(null);

      const state = authStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("setSession should update session", () => {
      const mockSession: SupabaseSession = {
        user: { id: "user-1", email: "test@example.com" },
        access_token: "token-123",
        refresh_token: "refresh-456",
      };

      authStore.getState().setSession(mockSession);

      expect(authStore.getState().session).toEqual(mockSession);
    });

    it("setSession with null should clear session", () => {
      const mockSession: SupabaseSession = {
        user: { id: "user-1" },
        access_token: "token",
      };

      authStore.getState().setSession(mockSession);
      authStore.getState().setSession(null);

      expect(authStore.getState().session).toBeNull();
    });

    it("setLoading should update isLoading state", () => {
      authStore.getState().setLoading(false);
      expect(authStore.getState().isLoading).toBe(false);

      authStore.getState().setLoading(true);
      expect(authStore.getState().isLoading).toBe(true);
    });
  });

  describe("Initialize", () => {
    it("should initialize with session and fetch user when session exists", async () => {
      const mockUser: AuthUser = {
        id: "user-1",
        authUserId: "auth-1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        emailVerified: undefined,
        role: "USER",
        hasName: true,
        hasEmail: true,
        isEmailVerified: false,
      };

      const mockSession: SupabaseSession = {
        user: { id: "auth-1", email: "test@example.com" },
        access_token: "token",
      };

      const mockClient = createMockSupabaseClient();
      mockClient.auth.getSession.mockResolvedValue({ data: { session: mockSession } });

      const onUserFetch = vi.fn().mockResolvedValue(mockUser);

      authStore.getState().initialize({
        client: mockClient,
        onUserFetch,
      });

      await flushPromises();

      expect(mockClient.auth.getSession).toHaveBeenCalled();
      expect(onUserFetch).toHaveBeenCalledWith("auth-1");

      const state = authStore.getState();
      expect(state.session).toEqual(mockSession);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it("should initialize without user when no session exists", async () => {
      const mockClient = createMockSupabaseClient();
      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      authStore.getState().initialize({
        client: mockClient,
      });

      await flushPromises();

      const state = authStore.getState();
      expect(state.session).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it("should handle user fetch error gracefully", async () => {
      const mockSession: SupabaseSession = {
        user: { id: "auth-1" },
        access_token: "token",
      };

      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: mockSession } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      const onUserFetch = vi.fn().mockRejectedValue(new Error("Fetch failed"));

      authStore.getState().initialize({
        client: mockClient,
        onUserFetch,
      });

      await flushPromises();

      const state = authStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it("should subscribe to auth state changes", () => {
      const unsubscribeMock = vi.fn();
      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } },
      });

      const cleanup = authStore.getState().initialize({
        client: mockClient,
      });

      expect(mockClient.auth.onAuthStateChange).toHaveBeenCalled();

      // Test cleanup function
      cleanup();
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it("should handle auth state change with new session", async () => {
      const mockUser: AuthUser = {
        id: "user-1",
        authUserId: "auth-1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        emailVerified: undefined,
        role: "USER",
        hasName: true,
        hasEmail: true,
        isEmailVerified: false,
      };

      let authStateCallback:
        | ((event: AuthChangeEvent, session: SupabaseSession | null) => void)
        | null = null;

      const mockClient = createMockSupabaseClient();
      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });
      mockClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      const onUserFetch = vi.fn().mockResolvedValue(mockUser);

      authStore.getState().initialize({
        client: mockClient,
        onUserFetch,
      });

      await flushPromises();

      // Simulate auth state change
      const newSession: SupabaseSession = {
        user: { id: "auth-1" },
        access_token: "new-token",
      };

      if (authStateCallback) {
        (authStateCallback as (event: AuthChangeEvent, session: SupabaseSession | null) => void)(
          "SIGNED_IN",
          newSession,
        );
      }

      await flushPromises();

      expect(authStore.getState().session).toEqual(newSession);
      expect(onUserFetch).toHaveBeenCalledWith("auth-1");
    });

    it("should handle auth state change with null session", async () => {
      let authStateCallback:
        | ((event: AuthChangeEvent, session: SupabaseSession | null) => void)
        | null = null;

      const mockClient = createMockSupabaseClient();
      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });
      mockClient.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      authStore.getState().initialize({
        client: mockClient,
      });

      await flushPromises();

      // Simulate sign out
      if (authStateCallback) {
        (authStateCallback as (event: AuthChangeEvent, session: SupabaseSession | null) => void)(
          "SIGNED_OUT",
          null,
        );
      }

      const state = authStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it("should initialize without onUserFetch callback", async () => {
      const mockSession: SupabaseSession = {
        user: { id: "auth-1" },
        access_token: "token",
      };

      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: mockSession } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      authStore.getState().initialize({
        client: mockClient,
      });

      await flushPromises();

      const state = authStore.getState();
      expect(state.session).toEqual(mockSession);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe("Session vs user loading phases", () => {
    const mockUser: AuthUser = {
      id: "user-1",
      authUserId: "auth-1",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      name: "John Doe",
      emailVerified: undefined,
      role: "USER",
      hasName: true,
      hasEmail: true,
      isEmailVerified: false,
    };

    const mockSession: SupabaseSession = {
      user: { id: "auth-1", email: "test@example.com" },
      access_token: "token",
    };

    it("starts with the session phase pending and the user phase idle", () => {
      const state = authStore.getState();
      expect(state.isSessionLoading).toBe(true);
      expect(state.isUserLoading).toBe(false);
      expect(state.isLoading).toBe(true);
    });

    it("publishes the session before the user fetch resolves", async () => {
      let resolveUser: ((user: AuthUser | null) => void) | null = null;
      const pendingUser = new Promise<AuthUser | null>((resolve) => {
        resolveUser = resolve;
      });

      const mockClient = createMockSupabaseClient();
      mockClient.auth.getSession.mockResolvedValue({ data: { session: mockSession } });
      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      authStore.getState().initialize({
        client: mockClient,
        onUserFetch: vi.fn().mockReturnValue(pendingUser),
      });

      await flushPromises();

      // The navigation tree can already mount here: the session is known even though
      // the (networked) user profile has not arrived.
      const pending = authStore.getState();
      expect(pending.session).toEqual(mockSession);
      expect(pending.isSessionLoading).toBe(false);
      expect(pending.isUserLoading).toBe(true);
      expect(pending.isLoading).toBe(true);
      expect(pending.user).toBeNull();

      (resolveUser as unknown as (user: AuthUser | null) => void)(mockUser);
      await flushPromises();

      const settled = authStore.getState();
      expect(settled.user).toEqual(mockUser);
      expect(settled.isSessionLoading).toBe(false);
      expect(settled.isUserLoading).toBe(false);
      expect(settled.isLoading).toBe(false);
    });

    it("clears the session phase immediately when there is no session", async () => {
      const mockClient = createMockSupabaseClient();
      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });
      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      authStore.getState().initialize({ client: mockClient, onUserFetch: vi.fn() });
      await flushPromises();

      const state = authStore.getState();
      expect(state.isSessionLoading).toBe(false);
      expect(state.isUserLoading).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it("keeps isLoading equal to the disjunction of both phases", async () => {
      const mockClient = createMockSupabaseClient();
      mockClient.auth.getSession.mockResolvedValue({ data: { session: mockSession } });
      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      authStore.getState().initialize({
        client: mockClient,
        onUserFetch: vi.fn().mockRejectedValue(new Error("boom")),
      });

      await flushPromises();

      const state = authStore.getState();
      expect(state.isLoading).toBe(state.isSessionLoading || state.isUserLoading);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("signInWithOtp", () => {
    it("should throw error when not initialized", async () => {
      await expect(authStore.getState().signInWithOtp("test@example.com")).rejects.toThrow(
        "[AuthStore] Not initialized. Call initialize() first.",
      );
    });

    it("should sign in with OTP successfully", async () => {
      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.signInWithOtp.mockResolvedValue({ error: null });

      authStore.getState().initialize({ client: mockClient });
      await flushPromises();

      await authStore.getState().signInWithOtp("test@example.com");

      expect(mockClient.auth.signInWithOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        options: { shouldCreateUser: false },
      });
    });

    it("should throw error when signInWithOtp fails", async () => {
      const mockError = new Error("Invalid email");
      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.signInWithOtp.mockResolvedValue({ error: mockError });

      authStore.getState().initialize({ client: mockClient });
      await flushPromises();

      await expect(authStore.getState().signInWithOtp("test@example.com")).rejects.toThrow(
        mockError,
      );
    });
  });

  describe("signInWithPassword", () => {
    it("should throw error when not initialized", async () => {
      await expect(
        authStore.getState().signInWithPassword("test@example.com", "password"),
      ).rejects.toThrow("[AuthStore] Not initialized. Call initialize() first.");
    });

    it("should sign in with password and fetch user", async () => {
      const mockUser: AuthUser = {
        id: "user-1",
        authUserId: "auth-1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        emailVerified: undefined,
        role: "USER",
        hasName: true,
        hasEmail: true,
        isEmailVerified: false,
      };

      const mockSession: SupabaseSession = {
        user: { id: "auth-1" },
        access_token: "token",
      };

      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const onUserFetch = vi.fn().mockResolvedValue(mockUser);

      authStore.getState().initialize({ client: mockClient, onUserFetch });
      await flushPromises();

      await authStore.getState().signInWithPassword("test@example.com", "password");

      expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
      expect(authStore.getState().session).toEqual(mockSession);
      expect(onUserFetch).toHaveBeenCalledWith("auth-1");
    });

    it("should throw error when signInWithPassword fails", async () => {
      const mockError = new Error("Invalid credentials");
      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.signInWithPassword.mockResolvedValue({
        error: mockError,
      });

      authStore.getState().initialize({ client: mockClient });
      await flushPromises();

      await expect(
        authStore.getState().signInWithPassword("test@example.com", "password"),
      ).rejects.toThrow(mockError);
    });

    it("should handle sign in without session in response", async () => {
      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: {},
        error: null,
      });

      authStore.getState().initialize({ client: mockClient });
      await flushPromises();

      await authStore.getState().signInWithPassword("test@example.com", "password");

      expect(authStore.getState().session).toBeNull();
    });
  });

  describe("verifyOtp", () => {
    it("should throw error when not initialized", async () => {
      await expect(authStore.getState().verifyOtp("test@example.com", "123456")).rejects.toThrow(
        "[AuthStore] Not initialized. Call initialize() first.",
      );
    });

    it("should verify OTP and fetch user", async () => {
      const mockUser: AuthUser = {
        id: "user-1",
        authUserId: "auth-1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        emailVerified: undefined,
        role: "USER",
        hasName: true,
        hasEmail: true,
        isEmailVerified: false,
      };

      const mockSession: SupabaseSession = {
        user: { id: "auth-1" },
        access_token: "token",
      };

      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: mockSession } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.verifyOtp.mockResolvedValue({ error: null });

      const onUserFetch = vi.fn().mockResolvedValue(mockUser);

      authStore.getState().initialize({ client: mockClient, onUserFetch });
      await flushPromises();

      await authStore.getState().verifyOtp("test@example.com", "123456");

      expect(mockClient.auth.verifyOtp).toHaveBeenCalledWith({
        email: "test@example.com",
        token: "123456",
        type: "email",
      });
      expect(authStore.getState().session).toEqual(mockSession);
    });

    it("should throw error when verifyOtp fails", async () => {
      const mockError = new Error("Invalid token");
      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.verifyOtp.mockResolvedValue({ error: mockError });

      authStore.getState().initialize({ client: mockClient });
      await flushPromises();

      await expect(authStore.getState().verifyOtp("test@example.com", "123456")).rejects.toThrow(
        mockError,
      );
    });
  });

  describe("signOut", () => {
    it("should throw error when not initialized", async () => {
      await expect(authStore.getState().signOut()).rejects.toThrow(
        "[AuthStore] Not initialized. Call initialize() first.",
      );
    });

    it("should sign out and clear state", async () => {
      const mockUser: AuthUser = {
        id: "user-1",
        authUserId: "auth-1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        emailVerified: undefined,
        role: "USER",
        hasName: true,
        hasEmail: true,
        isEmailVerified: false,
      };

      const mockSession: SupabaseSession = {
        user: { id: "auth-1" },
        access_token: "token",
      };

      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: mockSession } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.signOut.mockResolvedValue({ error: null });

      const onUserFetch = vi.fn().mockResolvedValue(mockUser);

      authStore.getState().initialize({ client: mockClient, onUserFetch });
      await flushPromises();

      // Verify user is logged in
      expect(authStore.getState().isAuthenticated).toBe(true);

      await authStore.getState().signOut();

      expect(mockClient.auth.signOut).toHaveBeenCalled();
      const state = authStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it("should throw error when signOut fails", async () => {
      const mockError = new Error("Sign out failed");
      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.signOut.mockResolvedValue({ error: mockError });

      authStore.getState().initialize({ client: mockClient });
      await flushPromises();

      await expect(authStore.getState().signOut()).rejects.toThrow(mockError);
    });
  });

  describe("refreshSession", () => {
    it("should throw error when not initialized", async () => {
      await expect(authStore.getState().refreshSession()).rejects.toThrow(
        "[AuthStore] Not initialized. Call initialize() first.",
      );
    });

    it("should refresh session successfully", async () => {
      const newSession: SupabaseSession = {
        user: { id: "auth-1" },
        access_token: "new-token",
      };

      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.refreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null,
      });

      authStore.getState().initialize({ client: mockClient });
      await flushPromises();

      await authStore.getState().refreshSession();

      expect(mockClient.auth.refreshSession).toHaveBeenCalled();
      expect(authStore.getState().session).toEqual(newSession);
    });

    it("should throw error when refreshSession fails", async () => {
      const mockError = new Error("Session expired");
      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.refreshSession.mockResolvedValue({
        error: mockError,
      });

      authStore.getState().initialize({ client: mockClient });
      await flushPromises();

      await expect(authStore.getState().refreshSession()).rejects.toThrow(mockError);
    });

    it("should handle refresh without session in response", async () => {
      const mockClient = createMockSupabaseClient();

      mockClient.auth.getSession.mockResolvedValue({ data: { session: null } });

      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      mockClient.auth.refreshSession.mockResolvedValue({
        data: {},
        error: null,
      });

      authStore.getState().initialize({ client: mockClient });
      await flushPromises();

      await authStore.getState().refreshSession();

      expect(authStore.getState().session).toBeUndefined();
    });
  });

  describe("refetchUser", () => {
    it("should throw error when not initialized", async () => {
      await expect(authStore.getState().refetchUser()).rejects.toThrow(
        "[AuthStore] Not initialized. Call initialize() first.",
      );
    });

    it("refetches the profile and clears the user loading phase", async () => {
      const session: SupabaseSession = {
        user: { id: "auth-1" },
        access_token: "token",
      };
      const refreshed = { id: "user-1", authUserId: "auth-1" } as AuthUser;
      const onUserFetch = vi.fn().mockResolvedValue(refreshed);

      const mockClient = createMockSupabaseClient();
      mockClient.auth.getSession.mockResolvedValue({ data: { session } });
      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      authStore.getState().initialize({ client: mockClient, onUserFetch });
      await flushPromises();
      onUserFetch.mockClear();

      await authStore.getState().refetchUser();

      expect(onUserFetch).toHaveBeenCalledWith("auth-1");
      expect(authStore.getState().user).toEqual(refreshed);
      expect(authStore.getState().isAuthenticated).toBe(true);
      expect(authStore.getState().isUserLoading).toBe(false);
    });

    it("leaves the loading phase clean when the refetch fails", async () => {
      const session: SupabaseSession = {
        user: { id: "auth-1" },
        access_token: "token",
      };
      const onUserFetch = vi.fn().mockRejectedValue(new Error("backend down"));

      const mockClient = createMockSupabaseClient();
      mockClient.auth.getSession.mockResolvedValue({ data: { session } });
      mockClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      });

      authStore.getState().initialize({ client: mockClient, onUserFetch });
      await flushPromises();

      await expect(authStore.getState().refetchUser()).resolves.toBeUndefined();
      expect(authStore.getState().isUserLoading).toBe(false);
    });
  });

  describe("AuthUser interface", () => {
    it("should support all role types", () => {
      const roles: ("USER" | "ADMIN" | "MODERATOR" | "SERVICE")[] = [
        "USER",
        "ADMIN",
        "MODERATOR",
        "SERVICE",
      ];

      for (const role of roles) {
        const user: AuthUser = {
          id: "user-1",
          authUserId: "auth-1",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          name: "John Doe",
          emailVerified: undefined,
          role,
          hasName: true,
          hasEmail: true,
          isEmailVerified: false,
        };
        expect(user.role).toBe(role);
      }
    });

    it("should support optional emailVerified as Date", () => {
      const verifiedDate = new Date("2024-01-01");
      const user: AuthUser = {
        id: "user-1",
        authUserId: "auth-1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        name: "John Doe",
        emailVerified: verifiedDate,
        role: "USER",
        hasName: true,
        hasEmail: true,
        isEmailVerified: true,
      };
      expect(user.emailVerified).toEqual(verifiedDate);
      expect(user.isEmailVerified).toBe(true);
    });
  });

  describe("SupabaseSession interface", () => {
    it("should support optional tokens", () => {
      const sessionWithTokens: SupabaseSession = {
        user: { id: "user-1", email: "test@example.com" },
        access_token: "token-123",
        refresh_token: "refresh-456",
      };
      expect(sessionWithTokens.access_token).toBe("token-123");
      expect(sessionWithTokens.refresh_token).toBe("refresh-456");

      const sessionWithoutTokens: SupabaseSession = {
        user: { id: "user-1" },
      };
      expect(sessionWithoutTokens.access_token).toBeUndefined();
      expect(sessionWithoutTokens.refresh_token).toBeUndefined();
    });
  });
});
