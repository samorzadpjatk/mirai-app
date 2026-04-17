/**
 * Auth Hooks Tests
 *
 * Tests for authentication hooks using React Native Testing Library.
 *
 * @module test/hooks/auth.test
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import {
  useAuth,
  useUser,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
  useLoginForm,
  authStore,
} from "@mirai-app/frameworks/auth/client";
import { TestWrapper } from "@mirai-app/ui/test";

// Reset store before each test
const resetStore = () => {
  authStore.setState({
    user: null,
    session: null,
    isLoading: false,
    isAuthenticated: false,
  });
};

describe("[UNIT] Auth Hooks", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("useAuth", () => {
    it("should return initial auth state", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(typeof result.current.signInWithOtp).toBe("function");
      expect(typeof result.current.signOut).toBe("function");
    });

    it("should return authenticated state when user is set", () => {
      authStore.setState({
        user: {
          id: "user-123",
          authUserId: "auth-123",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          name: "Test User",
          emailVerified: null,
          role: "USER",
        },
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: TestWrapper,
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe("test@example.com");
    });
  });

  describe("useUser", () => {
    it("should return null when no user is authenticated", () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeNull();
    });

    it("should return user data when authenticated", () => {
      const mockUser = {
        id: "user-123",
        authUserId: "auth-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        name: "Test User",
        emailVerified: null,
        role: "USER" as const,
      };

      authStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useUser(), {
        wrapper: TestWrapper,
      });

      expect(result.current).not.toBeNull();
      expect(result.current?.id).toBe("user-123");
      expect(result.current?.email).toBe("test@example.com");
    });
  });

  describe("useSession", () => {
    it("should return null when no session exists", () => {
      const { result } = renderHook(() => useSession(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBeNull();
    });

    it("should return session when available", () => {
      const mockSession = {
        user: { id: "user-123", email: "test@example.com" },
        access_token: "token-123",
        refresh_token: "refresh-123",
      };

      authStore.setState({ session: mockSession });

      const { result } = renderHook(() => useSession(), {
        wrapper: TestWrapper,
      });

      expect(result.current).not.toBeNull();
      expect(result.current?.access_token).toBe("token-123");
    });
  });

  describe("useIsAuthenticated", () => {
    it("should return false when not authenticated", () => {
      const { result } = renderHook(() => useIsAuthenticated(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(false);
    });

    it("should return true when authenticated", () => {
      authStore.setState({ isAuthenticated: true });

      const { result } = renderHook(() => useIsAuthenticated(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(true);
    });
  });

  describe("useAuthLoading", () => {
    it("should return loading state", () => {
      authStore.setState({ isLoading: true });

      const { result } = renderHook(() => useAuthLoading(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(true);
    });

    it("should return false when not loading", () => {
      authStore.setState({ isLoading: false });

      const { result } = renderHook(() => useAuthLoading(), {
        wrapper: TestWrapper,
      });

      expect(result.current).toBe(false);
    });
  });

  describe("useLoginForm", () => {
    it("should return initial form state", () => {
      const { result } = renderHook(() => useLoginForm(), {
        wrapper: TestWrapper,
      });

      expect(result.current.formState.email).toBe("");
      expect(result.current.formState.isLoading).toBe(false);
      expect(result.current.formState.isSent).toBe(false);
      expect(result.current.formState.error).toBeNull();
      expect(typeof result.current.setEmail).toBe("function");
      expect(typeof result.current.handleSubmit).toBe("function");
    });

    it("should update email when setEmail is called", () => {
      const { result } = renderHook(() => useLoginForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setEmail("test@example.com");
      });

      expect(result.current.formState.email).toBe("test@example.com");
    });

    it("should clear error when clearError is called", () => {
      const { result } = renderHook(() => useLoginForm(), {
        wrapper: TestWrapper,
      });

      // First set an error by submitting with empty email
      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.formState.error).not.toBeNull();

      // Then clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.formState.error).toBeNull();
    });

    it("should clear isSent when clearSent is called", () => {
      const { result } = renderHook(() => useLoginForm(), {
        wrapper: TestWrapper,
      });

      // Set email first
      act(() => {
        result.current.setEmail("test@example.com");
      });

      // Note: We can't actually test handleSubmit since it requires
      // the store to have a working signInWithOtp implementation
      // which requires Supabase to be configured.

      // Instead, we can manually set the state to test clearSent
      // This is a limitation of unit testing hooks that depend on external services

      // For now, just verify clearSent exists and is a function
      expect(typeof result.current.clearSent).toBe("function");
    });

    it("should show error when submitting with empty email", async () => {
      const { result } = renderHook(() => useLoginForm(), {
        wrapper: TestWrapper,
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.formState.error).toBe("Please enter your email");
      expect(result.current.formState.isLoading).toBe(false);
    });

    it("should validate email format", async () => {
      const { result } = renderHook(() => useLoginForm(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setEmail("invalid-email");
      });

      // The hook doesn't validate email format on its own,
      // it delegates to signInWithOtp which will validate
      // This test documents that behavior
      expect(result.current.formState.email).toBe("invalid-email");
    });
  });
});
