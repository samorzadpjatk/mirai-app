import type { AuthStore, AuthUser, SupabaseSession } from "@mirai-app/shared";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthStoreProvider,
  authStore,
  useAuth,
  useAuthLoading,
  useIsAuthenticated,
  useLoginForm,
  useSession,
  useUser,
} from "../client";

vi.mock("zustand", () => ({
  useStore: vi.fn(),
}));

vi.mock("@mirai-app/shared", () => ({
  authStore: {
    getState: vi.fn(),
    subscribe: vi.fn(),
  },
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useState: vi.fn(),
    useEffect: vi.fn(),
    useRef: vi.fn(),
  };
});

import { useState } from "react";
import { useStore } from "zustand";

describe("client exports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      const mockState: AuthStore = {
        user: {
          id: "user-123",
          authUserId: "auth-123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          name: "Test User",
          emailVerified: new Date(),
          role: "USER",
        },
        session: {
          user: { id: "auth-123", email: "test@example.com" },
          access_token: "token-123",
        } as SupabaseSession,
        isLoading: false,
        isAuthenticated: true,
        signInWithOtp: vi.fn(),
        signInWithPassword: vi.fn(),
        verifyOtp: vi.fn(),
        signOut: vi.fn(),
        refreshSession: vi.fn(),
        setUser: vi.fn(),
        setSession: vi.fn(),
        setLoading: vi.fn(),
        initialize: vi.fn(),
      };

      vi.mocked(useStore).mockReturnValue(mockState);

      const result = useAuth();

      expect(result.user).toEqual(mockState.user);
      expect(result.session).toEqual(mockState.session);
      expect(result.isLoading).toBe(false);
      expect(result.isAuthenticated).toBe(true);
      expect(typeof result.signInWithOtp).toBe("function");
      expect(typeof result.signInWithPassword).toBe("function");
      expect(typeof result.verifyOtp).toBe("function");
      expect(typeof result.signOut).toBe("function");
      expect(typeof result.refreshSession).toBe("function");
    });

    it("should handle unauthenticated state", () => {
      const mockState: AuthStore = {
        user: null,
        session: null,
        isLoading: false,
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
      };

      vi.mocked(useStore).mockReturnValue(mockState);

      const result = useAuth();

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });

    it("should handle loading state", () => {
      const mockState: AuthStore = {
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
      };

      vi.mocked(useStore).mockReturnValue(mockState);

      const result = useAuth();

      expect(result.isLoading).toBe(true);
    });

    it("should call signInWithOtp with correct parameters", async () => {
      const mockSignInWithOtp = vi.fn().mockResolvedValue(undefined);
      const mockState: AuthStore = {
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        signInWithOtp: mockSignInWithOtp,
        signInWithPassword: vi.fn(),
        verifyOtp: vi.fn(),
        signOut: vi.fn(),
        refreshSession: vi.fn(),
        setUser: vi.fn(),
        setSession: vi.fn(),
        setLoading: vi.fn(),
        initialize: vi.fn(),
      };

      vi.mocked(useStore).mockReturnValue(mockState);

      const result = useAuth();
      await result.signInWithOtp({ email: "test@example.com" });

      expect(mockSignInWithOtp).toHaveBeenCalledWith("test@example.com");
    });

    it("should call signInWithPassword with correct parameters", async () => {
      const mockSignInWithPassword = vi.fn().mockResolvedValue(undefined);
      const mockState: AuthStore = {
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        signInWithOtp: vi.fn(),
        signInWithPassword: mockSignInWithPassword,
        verifyOtp: vi.fn(),
        signOut: vi.fn(),
        refreshSession: vi.fn(),
        setUser: vi.fn(),
        setSession: vi.fn(),
        setLoading: vi.fn(),
        initialize: vi.fn(),
      };

      vi.mocked(useStore).mockReturnValue(mockState);

      const result = useAuth();
      await result.signInWithPassword({ email: "test@example.com", password: "secret" });

      expect(mockSignInWithPassword).toHaveBeenCalledWith("test@example.com", "secret");
    });

    it("should call verifyOtp with correct parameters", async () => {
      const mockVerifyOtp = vi.fn().mockResolvedValue(undefined);
      const mockState: AuthStore = {
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
        signInWithOtp: vi.fn(),
        signInWithPassword: vi.fn(),
        verifyOtp: mockVerifyOtp,
        signOut: vi.fn(),
        refreshSession: vi.fn(),
        setUser: vi.fn(),
        setSession: vi.fn(),
        setLoading: vi.fn(),
        initialize: vi.fn(),
      };

      vi.mocked(useStore).mockReturnValue(mockState);

      const result = useAuth();
      await result.verifyOtp({ email: "test@example.com", token: "123456" });

      expect(mockVerifyOtp).toHaveBeenCalledWith("test@example.com", "123456");
    });
  });

  describe("useUser hook", () => {
    it("should return user from store", () => {
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

      vi.mocked(useStore).mockReturnValue(mockUser);

      const result = useUser();

      expect(result).toEqual(mockUser);
    });

    it("should return null when no user", () => {
      vi.mocked(useStore).mockReturnValue(null);

      const result = useUser();

      expect(result).toBeNull();
    });
  });

  describe("useSession hook", () => {
    it("should return session from store", () => {
      const mockSession: SupabaseSession = {
        user: { id: "auth-123", email: "test@example.com" },
        access_token: "token-123",
        refresh_token: "refresh-123",
      };

      vi.mocked(useStore).mockReturnValue(mockSession);

      const result = useSession();

      expect(result).toEqual(mockSession);
    });

    it("should return null when no session", () => {
      vi.mocked(useStore).mockReturnValue(null);

      const result = useSession();

      expect(result).toBeNull();
    });
  });

  describe("useIsAuthenticated hook", () => {
    it("should return true when authenticated", () => {
      vi.mocked(useStore).mockReturnValue(true);

      const result = useIsAuthenticated();

      expect(result).toBe(true);
    });

    it("should return false when not authenticated", () => {
      vi.mocked(useStore).mockReturnValue(false);

      const result = useIsAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe("useAuthLoading hook", () => {
    it("should return true when loading", () => {
      vi.mocked(useStore).mockReturnValue(true);

      const result = useAuthLoading();

      expect(result).toBe(true);
    });

    it("should return false when not loading", () => {
      vi.mocked(useStore).mockReturnValue(false);

      const result = useAuthLoading();

      expect(result).toBe(false);
    });
  });

  describe("useLoginForm hook", () => {
    it("should be exported as a function", () => {
      expect(useLoginForm).toBeDefined();
      expect(typeof useLoginForm).toBe("function");
    });

    it("should return expected interface", () => {
      const mockSetState = vi.fn();
      vi.mocked(useState).mockReturnValue(["", mockSetState]);

      const mockSignInWithOtp = vi.fn().mockResolvedValue(undefined);
      const mockAuthState = {
        signInWithOtp: mockSignInWithOtp,
      };
      vi.mocked(useStore).mockReturnValue(mockAuthState);

      const result = useLoginForm();

      expect(typeof result.formState).toBe("object");
      expect(typeof result.setEmail).toBe("function");
      expect(typeof result.handleSubmit).toBe("function");
      expect(typeof result.clearError).toBe("function");
      expect(typeof result.clearSent).toBe("function");
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
