"use client";

import { useStore } from "zustand";
import {
  authStore,
  type AuthStore,
  type SupabaseSession,
  type AuthUser,
} from "../../stores/auth";

/**
 * Hook to access the full auth context (backward-compatible with useAuth).
 */
export function useAuth() {
  const state = useStore(authStore);
  return {
    user: state.user,
    session: state.session,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    signInWithOtp: (options: { email: string }) =>
      state.signInWithOtp(options.email),
    signInWithPassword: (options: { email: string; password: string }) =>
      state.signInWithPassword(options.email, options.password),
    verifyOtp: (options: { email: string; token: string }) =>
      state.verifyOtp(options.email, options.token),
    signOut: state.signOut,
    refreshSession: state.refreshSession,
  };
}

/**
 * Hook to access the current user.
 */
export function useUser(): AuthUser | null {
  return useStore(authStore, (state) => state.user);
}

/**
 * Hook to access the current session.
 */
export function useSession(): SupabaseSession | null {
  return useStore(authStore, (state) => state.session);
}

/**
 * Hook to check if user is authenticated.
 */
export function useIsAuthenticated(): boolean {
  return useStore(authStore, (state) => state.isAuthenticated);
}

/**
 * Hook to check if auth is loading.
 */
export function useAuthLoading(): boolean {
  return useStore(authStore, (state) => state.isLoading);
}

/**
 * Hook to access a specific slice of the auth store.
 */
export function useAuthStore<T>(selector: (state: AuthStore) => T): T {
  return useStore(authStore, selector);
}
