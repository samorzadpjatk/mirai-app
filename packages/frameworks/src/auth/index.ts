/**
 * Auth Client Module
 *
 * React hooks and provider for authentication in the native app.
 * Uses Better Auth store for session management.
 *
 * @module @mirai-app/frameworks/auth/client
 */

// =============================================================================
// Store Re-exports
// =============================================================================

export { betterAuthStore as authStore } from "../stores";
export type {
  BetterAuthStore as AuthStore,
  BetterAuthState as AuthState,
  BetterAuthActions as AuthActions,
  BetterAuthUser,
  BetterAuthSession,
  AuthResult,
  SignInResultData,
  SignUpResultData,
  SessionResultData,
} from "../stores";

// =============================================================================
// Hooks
// =============================================================================

export {
  useAuth,
  useUser,
  useSession,
  useIsAuthenticated,
  useAuthLoading,
  useLoginForm,
} from "./hooks";

// =============================================================================
// Provider
// =============================================================================

export { AuthStoreProvider } from "./provider";
export type { AuthStoreProviderProps } from "./provider";
