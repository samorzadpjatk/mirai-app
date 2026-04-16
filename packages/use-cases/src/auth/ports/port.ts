/**
 * AuthPort - Authentication Port Interface
 *
 * This interface defines authentication operations needed by the use cases layer.
 * It abstracts the authentication mechanism, allowing different implementations
 * (Supabase Auth, JWT, etc.) in the adapters layer.
 *
 * Key Design Decisions:
 * - Uses Effect type for composable error handling
 * - Returns AuthContext domain value object on success
 * - No framework dependencies (pure TypeScript interface)
 * - Supports structured concurrency patterns
 *
 * Implementations:
 * - SupabaseAuthAdapter: Uses Supabase Auth
 * - JwtAuthAdapter: Uses JWT tokens
 * - MockAuthAdapter: For testing
 *
 * @module ports
 */

import type { AuthContext } from "@mirai-app/domain";
import { Context, Effect } from "effect";

// =============================================================================
// Domain Errors
// =============================================================================

/**
 * Base error for authentication failures
 */
export class AuthError extends Error {
  readonly _tag = "AuthError" as const;
  readonly code = "AUTH_ERROR" as const;
  override readonly message: string;

  constructor(props: { message: string }) {
    super(props.message);
    this.message = props.message;
  }
}

/**
 * Error thrown when a token is invalid or malformed
 */
export class InvalidTokenError extends Error {
  readonly _tag = "InvalidTokenError" as const;
  readonly code = "INVALID_TOKEN" as const;
  readonly token?: string;
  override readonly message: string;

  constructor(props: { message: string; token?: string }) {
    super(props.message);
    this.message = props.message;
    this.token = props.token;
  }
}

/**
 * Error thrown when a session has expired
 */
export class SessionExpiredError extends Error {
  readonly _tag = "SessionExpiredError" as const;
  readonly code = "SESSION_EXPIRED" as const;
  readonly sessionId: string;
  readonly expiredAt: Date;
  override readonly message: string;

  constructor(props: { sessionId: string; expiredAt: Date; message?: string }) {
    super(props.message ?? `Session '${props.sessionId}' has expired`);
    this.sessionId = props.sessionId;
    this.expiredAt = props.expiredAt;
    this.message = props.message ?? `Session '${props.sessionId}' has expired`;
  }
}

// =============================================================================
// Port Interface
// =============================================================================

/**
 * AuthPort defines the contract for authentication operations
 *
 * This port abstracts the authentication mechanism from the use cases,
 * enabling different implementations without changing business logic.
 *
 * Note: This interface uses Effect for composable error handling and
 * supports structured concurrency patterns.
 */
export interface AuthPort {
  /**
   * Validate an authentication token and return the auth context
   *
   * @param token - The authentication token to validate
   * @returns Effect<AuthContext, AuthError | InvalidTokenError | SessionExpiredError, never>
   *
   * @example
   * ```typescript
   * const effect = authPort.validateToken("jwt-token-string");
   * try {
   *   const context = await Effect.runPromise(effect);
   *   // Use context.userId, context.role, etc.
   * } catch (error) {
   *   // Handle error
   * }
   * ```
   */
  validateToken(
    token: string,
  ): Effect.Effect<
    AuthContext,
    AuthError | InvalidTokenError | SessionExpiredError,
    never
  >;

  /**
   * Refresh an existing session and return updated auth context
   *
   * @param sessionId - The session identifier to refresh
   * @returns Effect<AuthContext, AuthError | SessionExpiredError, never>
   *
   * @example
   * ```typescript
   * const effect = authPort.refreshSession("session-123");
   * try {
   *   const context = await Effect.runPromise(effect);
   *   // Session refreshed, new tokens issued
   * } catch (error) {
   *   // Handle session expiration or other errors
   * }
   * ```
   */
  refreshSession(
    sessionId: string,
  ): Effect.Effect<AuthContext, AuthError | SessionExpiredError, never>;
}

/**
 * AuthPort Context.Tag for Effect dependency injection
 */
export class AuthPortTag extends Context.Tag("AuthPort")<
  AuthPortTag,
  {
    validateToken: (
      token: string,
    ) => Effect.Effect<
      AuthContext,
      AuthError | InvalidTokenError | SessionExpiredError,
      never
    >;
    refreshSession: (
      sessionId: string,
    ) => Effect.Effect<AuthContext, AuthError | SessionExpiredError, never>;
  }
>() {}
