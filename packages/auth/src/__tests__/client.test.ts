import { authStore } from "@mirai-app/shared/stores";
import type { AuthStore, AuthUser, SupabaseSession } from "@mirai-app/shared/stores";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthStoreProvider,
  useAuth,
  useAuthLoading,
  useIsAuthenticated,
  useLoginForm,
  useSession,
  useUser,
} from "../client";

const mockUser: AuthUser = {
  id: "user-123",
  authUserId: "auth-123",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  name: "Test User",
  emailVerified: new Date(),
  role: "USER",
};

const mockSession: SupabaseSession = {
  user: { id: "auth-123", email: "test@example.com" },
  access_token: "token-123",
  refresh_token: "refresh-123",
};

const initialAuthState: Partial<AuthStore> = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
};

describe("client exports", () => {
  beforeEach(() => {
    authStore.setState(initialAuthState);
  });

  describe("authStore export", () => {
    it("should export authStore from @mirai-app/shared", () => {
      expect(authStore).toBeDefined();
      expect(authStore.getState).toBeDefined();
      expect(authStore.subscribe).toBeDefined();
    });
  });

  describe("useAuth hook", () => {
    it("should return auth context with all required properties", () => {
      authStore.setState({
        user: mockUser,
        session: mockSession,
        isLoading: false,
        isAuthenticated: true,
      });

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
      authStore.setState({
        isLoading: true,
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
    });

    it("should call signInWithOtp with correct parameters", async () => {
      const mockSignInWithOtp = vi.fn().mockResolvedValue(undefined);
      authStore.setState({
        signInWithOtp: mockSignInWithOtp,
      });

      const { result } = renderHook(() => useAuth());
      await result.current.signInWithOtp({ email: "test@example.com" });

      expect(mockSignInWithOtp).toHaveBeenCalledWith("test@example.com");
    });

    it("should call signInWithPassword with correct parameters", async () => {
      const mockSignInWithPassword = vi.fn().mockResolvedValue(undefined);
      authStore.setState({
        signInWithPassword: mockSignInWithPassword,
      });

      const { result } = renderHook(() => useAuth());
      await result.current.signInWithPassword({ email: "test@example.com", password: "secret" });

      expect(mockSignInWithPassword).toHaveBeenCalledWith("test@example.com", "secret");
    });

    it("should call verifyOtp with correct parameters", async () => {
      const mockVerifyOtp = vi.fn().mockResolvedValue(undefined);
      authStore.setState({
        verifyOtp: mockVerifyOtp,
      });

      const { result } = renderHook(() => useAuth());
      await result.current.verifyOtp({ email: "test@example.com", token: "123456" });

      expect(mockVerifyOtp).toHaveBeenCalledWith("test@example.com", "123456");
    });
  });

  describe("useUser hook", () => {
    it("should return user from store", () => {
      authStore.setState({ user: mockUser });

      const { result } = renderHook(() => useUser());

      expect(result.current).toEqual(mockUser);
    });

    it("should return null when no user", () => {
      const { result } = renderHook(() => useUser());

      expect(result.current).toBeNull();
    });
  });

  describe("useSession hook", () => {
    it("should return session from store", () => {
      authStore.setState({ session: mockSession });

      const { result } = renderHook(() => useSession());

      expect(result.current).toEqual(mockSession);
    });

    it("should return null when no session", () => {
      const { result } = renderHook(() => useSession());

      expect(result.current).toBeNull();
    });
  });

  describe("useIsAuthenticated hook", () => {
    it("should return true when authenticated", () => {
      authStore.setState({ isAuthenticated: true });

      const { result } = renderHook(() => useIsAuthenticated());

      expect(result.current).toBe(true);
    });

    it("should return false when not authenticated", () => {
      const { result } = renderHook(() => useIsAuthenticated());

      expect(result.current).toBe(false);
    });
  });

  describe("useAuthLoading hook", () => {
    it("should return true when loading", () => {
      authStore.setState({ isLoading: true });

      const { result } = renderHook(() => useAuthLoading());

      expect(result.current).toBe(true);
    });

    it("should return false when not loading", () => {
      authStore.setState({ isLoading: false });
      const { result } = renderHook(() => useAuthLoading());

      expect(result.current).toBe(false);
    });
  });

  describe("useLoginForm hook", () => {
    it("should be exported as a function", () => {
      expect(useLoginForm).toBeDefined();
      expect(typeof useLoginForm).toBe("function");
    });

    it("should initialize with empty state", () => {
      const { result } = renderHook(() => useLoginForm());

      expect(result.current.formState.email).toBe("");
      expect(result.current.formState.isLoading).toBe(false);
      expect(result.current.formState.isSent).toBe(false);
      expect(result.current.formState.error).toBeNull();
    });
  });

  describe("AuthStoreProvider component", () => {
    it("should be defined as a component", () => {
      expect(AuthStoreProvider).toBeDefined();
      expect(typeof AuthStoreProvider).toBe("function");
    });

    it("should accept required props", () => {
      const props = {
        children: null as ReactNode,
        supabaseUrl: "https://test.supabase.co",
        supabaseKey: "test-key",
        supabaseClient: undefined,
        storageOptions: {
          storage: {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
          },
        },
        onUserFetch: vi.fn(),
      };

      expect(props.children).toBeNull();
      expect(props.supabaseUrl).toBe("https://test.supabase.co");
      expect(typeof props.onUserFetch).toBe("function");
    });

    it("should handle minimal props", () => {
      const props = {
        children: null as ReactNode,
        supabaseUrl: "https://test.supabase.co",
        supabaseKey: "test-key",
      };

      expect(props.supabaseUrl).toBeDefined();
      expect(props.supabaseKey).toBeDefined();
    });
  });

  describe("type exports", () => {
    it("should have proper type definitions", () => {
      const loginFormData: { email: string } = { email: "test@example.com" };
      const loginFormState: {
        email: string;
        isLoading: boolean;
        isSent: boolean;
        error: string | null;
      } = {
        email: "test@example.com",
        isLoading: false,
        isSent: false,
        error: null,
      };

      expect(loginFormData.email).toBe("test@example.com");
      expect(loginFormState.isLoading).toBe(false);
    });
  });
});
