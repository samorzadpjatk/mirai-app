/**
 * AuthPort - Authentication Port Interface
 *
 * This interface defines authentication operations needed by the use cases layer.
 * It abstracts the authentication mechanism, allowing different implementations
 * (Supabase Auth, JWT, etc.) in the adapters layer.
 *
 * Key Design Decisions:
 * - Uses Result type for explicit error handling
 * - Returns AuthContext domain value object on success
 * - No framework dependencies (pure TypeScript interface)
 * - Async operations return Promises
 *
 * Implementations:
 * - SupabaseAuthAdapter: Uses Supabase Auth
 * - JwtAuthAdapter: Uses JWT tokens
 * - MockAuthAdapter: For testing
 *
 * @module ports
 */

import type { Result } from "@mirai-app/domain";
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
 */
export interface AuthPort {
  /**
   * Validate an authentication token and return the auth context
   *
   * @param token - The authentication token to validate
   * @returns Result<AuthContext, AuthError | InvalidTokenError>
   *
   * @example
   * ```typescript
   * const result = await authPort.validateToken("jwt-token-string");
   * if (isOk(result)) {
   *   const context = result.value;
   *   // Use context.userId, context.role, etc.
   * } else {
   *   // Handle error: result.error
   * }
   * ```
   */
  validateToken(
    token: string,
  ): Promise<
    Result<AuthContext, AuthError | InvalidTokenError | SessionExpiredError>
  >;

  /**
   * Refresh an existing session and return updated auth context
   *
   * @param sessionId - The session identifier to refresh
   * @returns Result<AuthContext, AuthError | SessionExpiredError>
   *
   * @example
   * ```typescript
   * const result = await authPort.refreshSession("session-123");
   * if (isOk(result)) {
   *   const context = result.value;
   *   // Session refreshed, new tokens issued
   * } else {
   *   // Handle session expiration or other errors
   * }
   * ```
   */
  refreshSession(
    sessionId: string,
  ): Promise<Result<AuthContext, AuthError | SessionExpiredError>>;
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
