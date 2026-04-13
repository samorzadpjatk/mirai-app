import { Data } from "effect";

/**
 * AuthError - Authentication-specific error classes
 *
 * These errors represent failures that occur during authentication operations
 * with Supabase. They use Effect's Data.TaggedError pattern for type-safe
 * error handling.
 *
 * ## Error Types
 *
 * - AuthInitializationError - Store not initialized before use
 * - AuthSignInError - Sign in operation failures
 * - AuthSignOutError - Sign out operation failures
 * - AuthVerificationError - OTP verification failures
 * - AuthSessionRefreshError - Session refresh failures
 * - AuthNotInitializedError - Attempt to use auth before initialization
 *
 * @module AuthErrors
 */

/**
 * Error thrown when the auth store is not initialized before use
 *
 * @example
 * ```typescript
 * const error = new AuthInitializationError({
 *   message: "Call initialize() first"
 * });
 * ```
 */
export class AuthInitializationError extends Data.TaggedError(
  "AuthInitializationError",
)<{
  readonly message: string;
}> {
  readonly code = "AUTH_NOT_INITIALIZED" as const;
}

/**
 * Error thrown when a sign-in operation fails
 *
 * @example
 * ```typescript
 * const error = new AuthSignInError({
 *   operation: "signInWithOtp",
 *   message: "Invalid email format",
 *   cause: supabaseError
 * });
 * ```
 */
export class AuthSignInError extends Data.TaggedError("AuthSignInError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "AUTH_SIGN_IN_ERROR" as const;
}

/**
 * Error thrown when a sign-out operation fails
 *
 * @example
 * ```typescript
 * const error = new AuthSignOutError({
 *   message: "Failed to sign out",
 *   cause: supabaseError
 * });
 * ```
 */
export class AuthSignOutError extends Data.TaggedError("AuthSignOutError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "AUTH_SIGN_OUT_ERROR" as const;
}

/**
 * Error thrown when an OTP verification fails
 *
 * @example
 * ```typescript
 * const error = new AuthVerificationError({
 *   message: "Invalid OTP code",
 *   cause: supabaseError
 * });
 * ```
 */
export class AuthVerificationError extends Data.TaggedError(
  "AuthVerificationError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "AUTH_VERIFICATION_ERROR" as const;
}

/**
 * Error thrown when a session refresh fails
 *
 * @example
 * ```typescript
 * const error = new AuthSessionRefreshError({
 *   message: "Session expired",
 *   cause: supabaseError
 * });
 * ```
 */
export class AuthSessionRefreshError extends Data.TaggedError(
  "AuthSessionRefreshError",
)<{
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "AUTH_SESSION_REFRESH_ERROR" as const;
}

/**
 * Error thrown when user fetch fails after authentication
 *
 * @example
 * ```typescript
 * const error = new AuthUserFetchError({
 *   authUserId: "uuid",
 *   message: "User not found in database"
 * });
 * ```
 */
export class AuthUserFetchError extends Data.TaggedError("AuthUserFetchError")<{
  readonly authUserId: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "AUTH_USER_FETCH_ERROR" as const;
}

// =============================================================================
// Union Type and Type Guards
// =============================================================================

/**
 * Union type of all auth errors
 */
export type AuthError =
  | AuthInitializationError
  | AuthSignInError
  | AuthSignOutError
  | AuthVerificationError
  | AuthSessionRefreshError
  | AuthUserFetchError;

/**
 * Type guard to check if an error is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    error instanceof AuthInitializationError ||
    error instanceof AuthSignInError ||
    error instanceof AuthSignOutError ||
    error instanceof AuthVerificationError ||
    error instanceof AuthSessionRefreshError ||
    error instanceof AuthUserFetchError
  );
}

/**
 * Get a human-readable error message from any auth error
 */
export function getAuthErrorMessage(error: AuthError): string {
  return error.message;
}

/**
 * Get error code from any auth error
 */
export function getAuthErrorCode(error: AuthError): string {
  return error.code;
}
