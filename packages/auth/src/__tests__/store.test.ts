import { authStore } from "@mirai-app/common/stores";
import type { AuthStore, AuthUser, SupabaseSession } from "@mirai-app/common/stores";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useAuth,
  useAuthLoading,
  useAuthStore,
  useIsAuthenticated,
  useSession,
  useUser,
} from "../store/authHooks";

const mockUser: AuthUser = {
  id: "user-123",
  authUserId: "auth-123",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  name: "Test User",
  emailVerified: new Date("2024-01-01"),
  role: "USER",
  hasName: true,
  hasEmail: true,
  isEmailVerified: true,
};

const mockSession: SupabaseSession = {
  user: { id: "auth-123", email: "test@example.com" },
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
};

const initialAuthState: Partial<AuthStore> = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
};

const createMockStoreState = (overrides: Partial<AuthStore> = {}): Partial<AuthStore> => ({
  ...initialAuthState,
  ...overrides,
});

describe("store exports and hooks", () => {
  beforeEach(() => {
    authStore.setState(initialAuthState);
  });

  describe("authHooks exports", () => {
    describe("useAuth", () => {
      it("should return full auth context", () => {
        authStore.setState(
          createMockStoreState({
            user: mockUser,
            session: mockSession,
            isLoading: false,
            isAuthenticated: true,
          }),
        );

        const { result } = renderHook(() => useAuth());

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.session).toEqual(mockSession);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isAuthenticated).toBe(true);
        expect(typeof result.current.signInWithOtp).toBe("function");
        expect(typeof result.current.signInWithPassword).toBe("function");
        expect(typeof result.current.verifyOtp).toBe("function");
        expect(typeof result.current.signOut).toBe("function");
        expect(typeof result.current.refreshSession).toBe("function");
      });

      it("should handle unauthenticated state", () => {
        const { result } = renderHook(() => useAuth());

        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });

      it("should handle loading state", () => {
        authStore.setState(createMockStoreState({ isLoading: true }));

        const { result } = renderHook(() => useAuth());

        expect(result.current.isLoading).toBe(true);
      });

      it("should call signInWithOtp with email parameter", async () => {
        const mockSignInWithOtp = vi.fn().mockResolvedValue(undefined);
        authStore.setState(createMockStoreState({ signInWithOtp: mockSignInWithOtp }));

        const { result } = renderHook(() => useAuth());
        await result.current.signInWithOtp({ email: "test@example.com" });

        expect(mockSignInWithOtp).toHaveBeenCalledWith("test@example.com");
      });

      it("should call signInWithPassword with email and password", async () => {
        const mockSignInWithPassword = vi.fn().mockResolvedValue(undefined);
        authStore.setState(createMockStoreState({ signInWithPassword: mockSignInWithPassword }));

        const { result } = renderHook(() => useAuth());
        await result.current.signInWithPassword({ email: "test@example.com", password: "secret" });

        expect(mockSignInWithPassword).toHaveBeenCalledWith("test@example.com", "secret");
      });

      it("should call verifyOtp with email and token", async () => {
        const mockVerifyOtp = vi.fn().mockResolvedValue(undefined);
        authStore.setState(createMockStoreState({ verifyOtp: mockVerifyOtp }));

        const { result } = renderHook(() => useAuth());
        await result.current.verifyOtp({ email: "test@example.com", token: "123456" });

        expect(mockVerifyOtp).toHaveBeenCalledWith("test@example.com", "123456");
      });
    });

    describe("useUser", () => {
      it("should return user from store", () => {
        authStore.setState(createMockStoreState({ user: mockUser }));

        const { result } = renderHook(() => useUser());

        expect(result.current).toEqual(mockUser);
      });

      it("should return null when no user", () => {
        const { result } = renderHook(() => useUser());

        expect(result.current).toBeNull();
      });
    });

    describe("useSession", () => {
      it("should return session from store", () => {
        authStore.setState(createMockStoreState({ session: mockSession }));

        const { result } = renderHook(() => useSession());

        expect(result.current).toEqual(mockSession);
      });

      it("should return null when no session", () => {
        const { result } = renderHook(() => useSession());

        expect(result.current).toBeNull();
      });
    });

    describe("useIsAuthenticated", () => {
      it("should return true when authenticated", () => {
        authStore.setState(createMockStoreState({ isAuthenticated: true }));

        const { result } = renderHook(() => useIsAuthenticated());

        expect(result.current).toBe(true);
      });

      it("should return false when not authenticated", () => {
        const { result } = renderHook(() => useIsAuthenticated());

        expect(result.current).toBe(false);
      });
    });

    describe("useAuthLoading", () => {
      it("should return true when loading", () => {
        authStore.setState(createMockStoreState({ isLoading: true }));

        const { result } = renderHook(() => useAuthLoading());

        expect(result.current).toBe(true);
      });

      it("should return false when not loading", () => {
        authStore.setState({ isLoading: false });
        const { result } = renderHook(() => useAuthLoading());

        expect(result.current).toBe(false);
      });
    });

    describe("useAuthStore", () => {
      it("should allow custom selector", () => {
        authStore.setState(
          createMockStoreState({
            user: mockUser,
            isAuthenticated: true,
          }),
        );

        const { result } = renderHook(() => useAuthStore((state) => state.user?.email));

        expect(result.current).toBe("test@example.com");
      });

      it("should allow selecting multiple values", () => {
        authStore.setState(
          createMockStoreState({
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
          }),
        );

        const { result } = renderHook(() =>
          useAuthStore((state) => `${!!state.user}-${!state.isLoading}`),
        );

        expect(result.current).toBe("true-true");
      });

      it("should handle null user in selector", () => {
        const { result } = renderHook(() => useAuthStore((state) => state.user?.role));

        expect(result.current).toBeUndefined();
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete authentication flow", () => {
      const mockSignInWithOtp = vi.fn().mockResolvedValue(undefined);
      const mockSignOut = vi.fn().mockResolvedValue(undefined);

      authStore.setState(
        createMockStoreState({
          user: mockUser,
          session: mockSession,
          isLoading: false,
          isAuthenticated: true,
          signInWithOtp: mockSignInWithOtp,
          signOut: mockSignOut,
        }),
      );

      const { result: authResult } = renderHook(() => useAuth());
      const { result: userResult } = renderHook(() => useUser());
      const { result: isAuthenticatedResult } = renderHook(() => useIsAuthenticated());

      expect(authResult.current.user).toEqual(mockUser);
      expect(userResult.current).toEqual(mockUser);
      expect(isAuthenticatedResult.current).toBe(true);
    });

    it("should handle sign out flow", () => {
      const mockSignOut = vi.fn().mockResolvedValue(undefined);

      authStore.setState(
        createMockStoreState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
          signOut: mockSignOut,
        }),
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle session refresh", async () => {
      const mockRefreshSession = vi.fn().mockResolvedValue(undefined);

      authStore.setState(createMockStoreState({ refreshSession: mockRefreshSession }));

      const { result } = renderHook(() => useAuth());
      await result.current.refreshSession();

      expect(mockRefreshSession).toHaveBeenCalled();
    });
  });
});
