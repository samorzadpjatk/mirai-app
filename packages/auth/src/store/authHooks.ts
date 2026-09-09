"use client";

import {
  type AuthStore,
  type AuthUser,
  type SupabaseSession,
  authStore,
} from "@mirai-app/common/stores";
import { useStore } from "zustand";

/**
 * Hook to access the full auth context (backward-compatible with useAuth).
 */
export function useAuth() {
  const state = useStore(authStore);
  return {
    user: state.user,
    session: state.session,
    isLoading: state.isLoading,
    isSessionLoading: state.isSessionLoading,
    isUserLoading: state.isUserLoading,
    isAuthenticated: state.isAuthenticated,
    signInWithOtp: (options: { email: string }) => state.signInWithOtp(options.email),
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
 * Hook to check if auth is loading (session read OR user profile fetch).
 *
 * Prefer {@link useSessionLoading} for anything that gates rendering: this combined
 * flag stays `true` until the networked user profile arrives.
 */
export function useAuthLoading(): boolean {
  return useStore(authStore, (state) => state.isLoading);
}

/**
 * Hook to check whether the initial session read is still in flight. This is the cheap
 * gate — it does not wait for the backend user profile.
 */
export function useSessionLoading(): boolean {
  return useStore(authStore, (state) => state.isSessionLoading);
}

/**
 * Hook to check whether the backend user profile is still being fetched.
 */
export function useUserLoading(): boolean {
  return useStore(authStore, (state) => state.isUserLoading);
}

/**
 * Hook to access a specific slice of the auth store.
 */
export function useAuthStore<T>(selector: (state: AuthStore) => T): T {
  return useStore(authStore, selector);
}
