import { renderHook } from "@testing-library/react";
import { useAuth, useUser, useSession, useIsAuthenticated } from "../authHooks";
import { AuthProvider } from "../AuthContext";
import type { SupabaseClient } from "@supabase/supabase-js";

const mockSupabaseClient = () => {
  return {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
    },
  } as unknown as SupabaseClient;
};

describe("Auth Hooks", () => {
  describe("useAuth", () => {
    it("should throw error when used outside AuthProvider", () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth hook cannot be used outside of AuthProvider");
    });

    it("should return auth context when used inside AuthProvider", () => {
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

      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("session");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("isAuthenticated");
      expect(result.current).toHaveProperty("signInWithEmail");
      expect(result.current).toHaveProperty("signUpWithEmail");
      expect(result.current).toHaveProperty("signInWithOAuth");
      expect(result.current).toHaveProperty("signOut");
      expect(result.current).toHaveProperty("refreshSession");
    });
  });

  describe("useUser", () => {
    it("should return user from auth context", () => {
      const client = mockSupabaseClient();

      const { result } = renderHook(() => useUser(), {
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

      expect(result.current).toBeNull();
    });
  });

  describe("useSession", () => {
    it("should return session from auth context", () => {
      const client = mockSupabaseClient();

      const { result } = renderHook(() => useSession(), {
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

      expect(result.current).toBeNull();
    });
  });

  describe("useIsAuthenticated", () => {
    it("should return false when not authenticated", () => {
      const client = mockSupabaseClient();

      const { result } = renderHook(() => useIsAuthenticated(), {
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

      expect(result.current).toBe(false);
    });
  });
});
