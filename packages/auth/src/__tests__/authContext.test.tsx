import { render, screen, waitFor } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, AuthContext } from "../authContext";
import { useAuth } from "../authHooks";
import type { SupabaseClient } from "@supabase/supabase-js";
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
      getSession: jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      }),
      signInWithOAuth: jest.fn().mockResolvedValue({
        data: { url: "https://provider.com/oauth" },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({
        error: null,
      }),
      refreshSession: jest.fn().mockResolvedValue({
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
      const mockOnUserFetch = jest.fn().mockResolvedValue({
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
      const mockOnUserFetch = jest.fn().mockResolvedValue(mockUser);

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

  describe("signInWithEmail", () => {
    it("should sign in with email and password", async () => {
      const client = mockSupabaseClient();
      const mockOnUserFetch = jest.fn().mockResolvedValue(null);

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

      await act(async () => {
        await result.current.signInWithEmail({
          email: "test@example.com",
          password: "password123",
        });
      });

      expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should throw error on failed sign in", async () => {
      const client = mockSupabaseClient();
      const mockError = new Error("Invalid credentials");
      (client.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
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

      await expect(
        result.current.signInWithEmail({
          email: "test@example.com",
          password: "wrong",
        }),
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("signUpWithEmail", () => {
    it("should sign up with email and password", async () => {
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
        await result.current.signUpWithEmail({
          email: "newuser@example.com",
          password: "password123",
          metadata: { name: "New User" },
        });
      });

      expect(client.auth.signUp).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
        options: {
          data: { name: "New User" },
        },
      });
    });

    it("should throw error on failed sign up", async () => {
      const client = mockSupabaseClient();
      const mockError = new Error("Email already registered");
      (client.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
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

      await expect(
        result.current.signUpWithEmail({
          email: "existing@example.com",
          password: "password123",
        }),
      ).rejects.toThrow("Email already registered");
    });
  });

  describe("signInWithOAuth", () => {
    it("should initiate OAuth flow", async () => {
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
        await result.current.signInWithOAuth({
          provider: "google",
          redirectTo: "http://localhost:3000/callback",
        });
      });

      expect(client.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/callback",
        },
      });
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
      const mockOnUserFetch = jest.fn().mockResolvedValue(mockUser);

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
      (client.auth.refreshSession as jest.Mock).mockResolvedValue({
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

      await expect(result.current.refreshSession()).rejects.toThrow(
        "Refresh token expired",
      );
    });
  });
});
