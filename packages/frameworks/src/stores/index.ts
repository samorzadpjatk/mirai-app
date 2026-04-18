/**
 * Frameworks Stores Module
 *
 * State management and persistence utilities for the Mirai App.
 *
 * @module @mirai-app/frameworks/stores
 */

// =============================================================================
// Better Auth Store (Mobile Auth with SecureStore)
// =============================================================================

export { betterAuthStore } from "./auth/better-auth";
export type {
  BetterAuthStore,
  BetterAuthState,
  BetterAuthActions,
  BetterAuthUser,
  BetterAuthSession,
  StoredSession,
  CookieJarEntry,
  CookieJar,
  SignInCredentials,
  SignUpCredentials,
  OtpVerificationData,
  BetterAuthClientConfig,
  BetterAuthClient,
  AuthResult,
  SignInResultData,
  SignUpResultData,
  SessionResultData,
  AuthStoreError,
} from "./auth/better-auth";

export {
  shouldRefreshSession,
  getSessionExpiryStatus,
} from "./auth/better-auth";
