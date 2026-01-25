import { render, waitFor, renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Mock } from "vitest";
import { AuthProvider } from "../AuthContext";
import { useAuth } from "../authHooks";
import type { SupabaseClient } from "@integral-2025-app/supabase";
import type { AuthUser } from "../types";

const mockSupabaseClient = () => {
  const mockSession = {
    access_token: "mock-token",
    refresh_token: "mock-refresh",
    user: {
      id: "user-123",
      email: "test@example.com",
      created_at: "2024-01-01",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
    },
  };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
      refreshSession: vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
    },
  } as unknown as SupabaseClient;
};

describe("AuthContext", () => {
  describe("AuthProvider", () => {
    it("should initialize with loading state", async () => {
      const client = mockSupabaseClient();
      const mockOnUserFetch = vi.fn().mockResolvedValue({
        id: "db-1",
        authUserId: "user-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      } as AuthUser);

      render(
        <AuthProvider
          supabaseUrl="https://test.supabase.co"
          supabaseKey="test-key"
          supabaseClient={client}
          onUserFetch={mockOnUserFetch}
        >
          <div>Test Child</div>
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(client.auth.getSession).toHaveBeenCalled();
      });
    });

    it("should fetch user data when session exists", async () => {
      const client = mockSupabaseClient();
      const mockUser: AuthUser = {
        id: "db-1",
        authUserId: "user-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };
      const mockOnUserFetch = vi.fn().mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider
            supabaseUrl="https://test.supabase.co"
            supabaseKey="test-key"
            supabaseClient={client}
            onUserFetch={mockOnUserFetch}
          >
            {children}
          </AuthProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockOnUserFetch).toHaveBeenCalledWith("user-123");
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });







  describe("signOut", () => {
    it("should sign out user and clear state", async () => {
      const client = mockSupabaseClient();
      const mockUser: AuthUser = {
        id: "db-1",
        authUserId: "user-123",
        email: "test@example.com",
        name: "Test User",
        emailVerified: new Date(),
      };
      const mockOnUserFetch = vi.fn().mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider
            supabaseUrl="https://test.supabase.co"
            supabaseKey="test-key"
            supabaseClient={client}
            onUserFetch={mockOnUserFetch}
          >
            {children}
          </AuthProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(client.auth.signOut).toHaveBeenCalled();
    });
  });

  describe("refreshSession", () => {
    it("should refresh the session", async () => {
      const client = mockSupabaseClient();

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider
            supabaseUrl="https://test.supabase.co"
            supabaseKey="test-key"
            supabaseClient={client}
          >
            {children}
          </AuthProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(client.auth.refreshSession).toHaveBeenCalled();
    });

    it("should throw error on failed refresh", async () => {
      const client = mockSupabaseClient();
      const mockError = new Error("Refresh token expired");
      (client.auth.refreshSession as Mock).mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthProvider
            supabaseUrl="https://test.supabase.co"
            supabaseKey="test-key"
            supabaseClient={client}
          >
            {children}
          </AuthProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.refreshSession()).rejects.toThrow(
          "Refresh token expired",
        );
      });
    });
  });
});
