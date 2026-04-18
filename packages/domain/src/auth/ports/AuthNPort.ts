import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";

/**
 * AuthN Port Interface (Authentication)
 *
 * Defines the contract for authentication operations (identity verification).
 * This includes sign-in, sign-up, sign-out, and session management.
 * Implemented by SupabaseAuthGateway in the adapters layer.
 *
 * Note: Authorization (permission checking) is handled by IAuthZPort.
 *
 * SECURITY: Implementations must ensure:
 * - Credentials are never logged or exposed in error messages
 * - Tokens are handled securely and refreshed appropriately
 * - Session data is validated before use
 */

/**
 * Authenticated user information
 */
export interface AuthUser {
  /** Unique user identifier (e.g., UUID from auth provider) */
  readonly id: string;

  /** User email address */
  readonly email: string;
}

/**
 * Authentication session containing access credentials
 */
export interface AuthSession {
  /** JWT access token for API authentication */
  readonly accessToken: string;
}

/**
 * Result of a successful sign-in operation
 */
export interface SignInResult {
  /** Authenticated user details */
  readonly user: AuthUser;

  /** Session with access token */
  readonly session: AuthSession;
}

/**
 * Result of a successful sign-up operation
 */
export interface SignUpResult {
  /** Created user details (null if email confirmation required) */
  readonly user: AuthUser | null;
}

/**
 * Result of a getSession operation
 */
export interface GetSessionResult {
  /** Current user if session is valid, null otherwise */
  readonly user: AuthUser | null;

  /** Current access token if session is valid, null otherwise */
  readonly accessToken: string | null;
}

/**
 * Result of a refreshSession operation
 */
export interface RefreshSessionResult {
  /** New session if refresh succeeded, null if session expired/invalid */
  readonly session: AuthSession | null;
}

/**
 * Authentication Port (AuthN)
 *
 * Provides methods for user authentication including sign-in, sign-up,
 * sign-out, and session management.
 *
 * All methods return Effect.Effect<T, IPortError, never> following
 * the domain layer purity pattern (no external dependencies).
 */
export interface IAuthNPort {
  /**
   * Sign in with email and password
   *
   * @param email - User email address
   * @param password - User password
   * @returns Effect with SignInResult on success, IPortError on failure
   */
  signInWithPassword(
    email: string,
    password: string,
  ): Effect.Effect<SignInResult, IPortError, never>;

  /**
   * Sign in with email OTP (One-Time Password)
   *
   * @param email - User email address
   * @param otp - One-time password/token
   * @returns Effect with SignInResult on success, IPortError on failure
   */
  signInWithOtp(
    email: string,
    otp: string,
  ): Effect.Effect<SignInResult, IPortError, never>;

  /**
   * Sign up a new user with email and password
   *
   * @param email - User email address
   * @param password - User password
   * @returns Effect with SignUpResult on success, IPortError on failure
   */
  signUp(
    email: string,
    password: string,
  ): Effect.Effect<SignUpResult, IPortError, never>;

  /**
   * Sign out the current user
   *
   * @returns Effect with void on success, IPortError on failure
   */
  signOut(): Effect.Effect<void, IPortError, never>;

  /**
   * Get the current session information
   *
   * @returns Effect with GetSessionResult containing user and token if valid session exists
   */
  getSession(): Effect.Effect<GetSessionResult, IPortError, never>;

  /**
   * Refresh the current session
   *
   * @returns Effect with RefreshSessionResult containing new session if refresh succeeded
   */
  refreshSession(): Effect.Effect<RefreshSessionResult, IPortError, never>;
}
