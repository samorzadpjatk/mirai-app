"use client";

import { createStore } from "zustand/vanilla";
import type {
  BetterAuthUser,
  BetterAuthSession,
  BetterAuthStore,
} from "@mirai-app/frameworks/stores";

export type {
  BetterAuthUser as AuthUser,
  BetterAuthSession,
  BetterAuthStore,
} from "@mirai-app/frameworks/stores";

/**
 * Auth state interface (using Better Auth types)
 */
export interface AuthState {
  /** Current user or null */
  user: BetterAuthUser | null;
  /** Current session or null */
  session: BetterAuthSession | null;
  /** Whether auth is loading */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Auth actions interface
 * Note: Actual implementation is in betterAuthStore
 * This is kept for backward compatibility
 */
export interface AuthActions {
  /** Set user manually */
  setUser: (user: BetterAuthUser | null) => void;
  /** Set session manually */
  setSession: (session: BetterAuthSession | null) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
}

/**
 * Combined auth store type
 * Re-export of BetterAuthStore for compatibility
 */
export type AuthStore = BetterAuthStore;

/**
 * Legacy auth store - re-exports betterAuthStore
 *
 * @deprecated Use betterAuthStore from @mirai-app/frameworks/stores directly
 */
export const authStore = createStore<AuthStore>()(() => ({
  // State (these are just defaults, betterAuthStore has the real implementation)
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  lastError: null,

  // Actions (placeholders - use betterAuthStore for actual implementation)
  initialize: () => () => {},
  signInWithPassword: async () => ({ success: false, error: { code: "NOT_INITIALIZED", message: "Use betterAuthStore" } }),
  signInWithOtp: async () => ({ success: false, error: { code: "NOT_INITIALIZED", message: "Use betterAuthStore" } }),
  sendSignInOtp: async () => ({ success: false, error: { code: "NOT_INITIALIZED", message: "Use betterAuthStore" } }),
  signUp: async () => ({ success: false, error: { code: "NOT_INITIALIZED", message: "Use betterAuthStore" } }),
  signOut: async () => ({ success: false, error: { code: "NOT_INITIALIZED", message: "Use betterAuthStore" } }),
  refreshSession: async () => ({ success: false, error: { code: "NOT_INITIALIZED", message: "Use betterAuthStore" } }),
  getSession: async () => ({ user: null, session: null }),
  setSession: async () => ({ success: false, error: { code: "NOT_INITIALIZED", message: "Use betterAuthStore" } }),
  clearSession: async () => {},
  setUser: () => {},
  setLoading: () => {},
  extractCookies: async () => {},
  getCookiesForRequest: async () => "",
}));
