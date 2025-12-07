import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth, useUser, useSession, useIsAuthenticated } from "../authHooks";
import { AuthProvider } from "../AuthContext";
import type { SupabaseClient } from "@integral-2025-app/supabase";

const mockSupabaseClient = () => {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
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
