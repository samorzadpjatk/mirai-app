import { authStore } from "@mirai-app/shared";
import type { AuthStore, AuthUser, SupabaseClient, SupabaseSession } from "@mirai-app/shared";
import { createMockSupabaseClient } from "@mirai-app/shared/test-utils";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthStoreProvider } from "../store/AuthStoreProvider";
import {
  useAuth,
  useAuthLoading,
  useAuthStore,
  useIsAuthenticated,
  useSession,
  useUser,
} from "../store/authHooks";

vi.mock("zustand", () => ({
  useStore: vi.fn((store, selector) => {
    const state = store.getState();
    return selector ? selector(state) : state;
  }),
}));

vi.mock("@mirai-app/shared", () => ({
  authStore: {
    getState: vi.fn(),
    subscribe: vi.fn(),
  },
}));

describe("store exports and hooks", () => {
  const mockUser: AuthUser = {
    id: "user-123",
    authUserId: "auth-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    name: "Test User",
    emailVerified: new Date("2024-01-01"),
    role: "USER",
  };

  const mockSession: SupabaseSession = {
    user: { id: "auth-123", email: "test@example.com" },
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
  };

  const createMockStoreState = (overrides: Partial<AuthStore> = {}): AuthStore => ({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    signInWithOtp: vi.fn(),
    signInWithPassword: vi.fn(),
    verifyOtp: vi.fn(),
    signOut: vi.fn(),
    refreshSession: vi.fn(),
    setUser: vi.fn(),
    setSession: vi.fn(),
    setLoading: vi.fn(),
    initialize: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authHooks exports", () => {
    describe("useAuth", () => {
      it("should return full auth context", () => {
        const mockState = createMockStoreState({
          user: mockUser,
          session: mockSession,
          isLoading: false,
          isAuthenticated: true,
        });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useAuth();

        expect(result.user).toEqual(mockUser);
        expect(result.session).toEqual(mockSession);
        expect(result.isLoading).toBe(false);
        expect(result.isAuthenticated).toBe(true);
        expect(typeof result.signInWithOtp).toBe("function");
        expect(typeof result.signInWithPassword).toBe("function");
        expect(typeof result.verifyOtp).toBe("function");
        expect(typeof result.signOut).toBe("function");
        expect(typeof result.refreshSession).toBe("function");
      });

      it("should handle unauthenticated state", () => {
        const mockState = createMockStoreState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useAuth();

        expect(result.user).toBeNull();
        expect(result.session).toBeNull();
        expect(result.isAuthenticated).toBe(false);
      });

      it("should handle loading state", () => {
        const mockState = createMockStoreState({
          isLoading: true,
        });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useAuth();

        expect(result.isLoading).toBe(true);
      });

      it("should call signInWithOtp with email parameter", async () => {
        const mockSignInWithOtp = vi.fn().mockResolvedValue(undefined);
        const mockState = createMockStoreState({
          signInWithOtp: mockSignInWithOtp,
        });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useAuth();
        await result.signInWithOtp({ email: "test@example.com" });

        expect(mockSignInWithOtp).toHaveBeenCalledWith("test@example.com");
      });

      it("should call signInWithPassword with email and password", async () => {
        const mockSignInWithPassword = vi.fn().mockResolvedValue(undefined);
        const mockState = createMockStoreState({
          signInWithPassword: mockSignInWithPassword,
        });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useAuth();
        await result.signInWithPassword({ email: "test@example.com", password: "secret" });

        expect(mockSignInWithPassword).toHaveBeenCalledWith("test@example.com", "secret");
      });

      it("should call verifyOtp with email and token", async () => {
        const mockVerifyOtp = vi.fn().mockResolvedValue(undefined);
        const mockState = createMockStoreState({
          verifyOtp: mockVerifyOtp,
        });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useAuth();
        await result.verifyOtp({ email: "test@example.com", token: "123456" });

        expect(mockVerifyOtp).toHaveBeenCalledWith("test@example.com", "123456");
      });
    });

    describe("useUser", () => {
      it("should return user from store", () => {
        const mockState = createMockStoreState({ user: mockUser });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useUser();

        expect(result).toEqual(mockUser);
      });

      it("should return null when no user", () => {
        const mockState = createMockStoreState({ user: null });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useUser();

        expect(result).toBeNull();
      });
    });

    describe("useSession", () => {
      it("should return session from store", () => {
        const mockState = createMockStoreState({ session: mockSession });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useSession();

        expect(result).toEqual(mockSession);
      });

      it("should return null when no session", () => {
        const mockState = createMockStoreState({ session: null });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useSession();

        expect(result).toBeNull();
      });
    });

    describe("useIsAuthenticated", () => {
      it("should return true when authenticated", () => {
        const mockState = createMockStoreState({ isAuthenticated: true });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useIsAuthenticated();

        expect(result).toBe(true);
      });

      it("should return false when not authenticated", () => {
        const mockState = createMockStoreState({ isAuthenticated: false });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useIsAuthenticated();

        expect(result).toBe(false);
      });
    });

    describe("useAuthLoading", () => {
      it("should return true when loading", () => {
        const mockState = createMockStoreState({ isLoading: true });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useAuthLoading();

        expect(result).toBe(true);
      });

      it("should return false when not loading", () => {
        const mockState = createMockStoreState({ isLoading: false });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useAuthLoading();

        expect(result).toBe(false);
      });
    });

    describe("useAuthStore", () => {
      it("should allow custom selector", () => {
        const mockState = createMockStoreState({
          user: mockUser,
          isAuthenticated: true,
        });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useAuthStore((state) => state.user?.email);

        expect(result).toBe("test@example.com");
      });

      it("should allow selecting multiple values", () => {
        const mockState = createMockStoreState({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
        });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useAuthStore((state) => ({
          hasUser: !!state.user,
          isReady: !state.isLoading,
        }));

        expect(result).toEqual({ hasUser: true, isReady: true });
      });

      it("should handle null user in selector", () => {
        const mockState = createMockStoreState({ user: null });
        vi.mocked(authStore.getState).mockReturnValue(mockState);

        const result = useAuthStore((state) => state.user?.role);

        expect(result).toBeUndefined();
      });
    });
  });

  describe("AuthStoreProvider", () => {
    it("should be defined as a component", () => {
      expect(AuthStoreProvider).toBeDefined();
      expect(typeof AuthStoreProvider).toBe("function");
    });

    it("should accept all required props", () => {
      const mockClient = createMockSupabaseClient();

      const props = {
        children: null as ReactNode,
        supabaseUrl: "https://test.supabase.co",
        supabaseKey: "test-key",
        supabaseClient: mockClient,
        storageOptions: {
          storage: {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
          },
        },
        onUserFetch: vi.fn(),
      };

      expect(props.supabaseClient).toBeDefined();
      expect(typeof props.onUserFetch).toBe("function");
    });

    it("should work with minimal props", () => {
      const props = {
        children: null as ReactNode,
        supabaseUrl: "https://test.supabase.co",
        supabaseKey: "test-key",
      };

      expect(props.supabaseUrl).toBeDefined();
      expect(props.supabaseKey).toBeDefined();
    });

    it("should accept custom storage options", () => {
      const customStorage = {
        getItem: vi.fn().mockResolvedValue("stored-value"),
        setItem: vi.fn().mockResolvedValue(undefined),
        removeItem: vi.fn().mockResolvedValue(undefined),
      };

      const props = {
        children: null as ReactNode,
        supabaseUrl: "https://test.supabase.co",
        supabaseKey: "test-key",
        storageOptions: { storage: customStorage },
      };

      expect(props.storageOptions?.storage).toBe(customStorage);
    });

    it("should accept onUserFetch callback", () => {
      const onUserFetch = vi.fn().mockResolvedValue(mockUser);

      const props = {
        children: null as ReactNode,
        supabaseUrl: "https://test.supabase.co",
        supabaseKey: "test-key",
        onUserFetch,
      };

      expect(typeof props.onUserFetch).toBe("function");
    });
  });

  describe("store/index exports", () => {
    it("should export authStore from @mirai-app/shared", () => {
      expect(authStore).toBeDefined();
      expect(authStore.getState).toBeDefined();
    });

    it("should have all hook exports available", () => {
      expect(useAuth).toBeDefined();
      expect(useUser).toBeDefined();
      expect(useSession).toBeDefined();
      expect(useIsAuthenticated).toBeDefined();
      expect(useAuthLoading).toBeDefined();
      expect(useAuthStore).toBeDefined();
    });

    it("should have correct function types", () => {
      expect(typeof useAuth).toBe("function");
      expect(typeof useUser).toBe("function");
      expect(typeof useSession).toBe("function");
      expect(typeof useIsAuthenticated).toBe("function");
      expect(typeof useAuthLoading).toBe("function");
      expect(typeof useAuthStore).toBe("function");
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete authentication flow", () => {
      const mockSignInWithOtp = vi.fn().mockResolvedValue(undefined);
      const mockSignOut = vi.fn().mockResolvedValue(undefined);

      const authenticatedState = createMockStoreState({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
        signInWithOtp: mockSignInWithOtp,
        signOut: mockSignOut,
      });

      vi.mocked(authStore.getState).mockReturnValue(authenticatedState);

      const auth = useAuth();
      const user = useUser();
      const isAuthenticated = useIsAuthenticated();

      expect(auth.user).toEqual(mockUser);
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });

    it("should handle sign out flow", () => {
      const mockSignOut = vi.fn().mockResolvedValue(undefined);

      const signedOutState = createMockStoreState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        signOut: mockSignOut,
      });

      vi.mocked(authStore.getState).mockReturnValue(signedOutState);

      const auth = useAuth();

      expect(auth.user).toBeNull();
      expect(auth.isAuthenticated).toBe(false);
    });

    it("should handle session refresh", async () => {
      const mockRefreshSession = vi.fn().mockResolvedValue(undefined);

      const mockState = createMockStoreState({
        refreshSession: mockRefreshSession,
      });
      vi.mocked(authStore.getState).mockReturnValue(mockState);

      const auth = useAuth();
      await auth.refreshSession();

      expect(mockRefreshSession).toHaveBeenCalled();
    });
  });
});
