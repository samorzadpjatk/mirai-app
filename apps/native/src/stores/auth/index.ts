// Auth store - Better Auth exports
//
// This module re-exports Better Auth types and store from the frameworks package.
// For new code, import directly from @mirai-app/frameworks/stores

// Re-export from frameworks stores (preferred)
export {
  betterAuthStore,
  betterAuthStore as authStore,
} from "@mirai-app/frameworks/stores";

// Re-export types
export type {
  BetterAuthUser as AuthUser,
  BetterAuthSession,
  BetterAuthStore as AuthStore,
  BetterAuthState as AuthState,
  BetterAuthActions as AuthActions,
  AuthResult,
  SignInResultData,
  SignUpResultData,
  SessionResultData,
  AuthStoreError,
} from "@mirai-app/frameworks/stores";

// Export legacy local types for backward compatibility
export type {
  AuthState as LegacyAuthState,
  AuthActions as LegacyAuthActions,
} from "./authStore";
