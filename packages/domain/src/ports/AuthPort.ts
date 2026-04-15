import type { AuthContext } from "../value-objects/AuthContext";
import type { Effect } from "effect";

/**
 * AuthPort - Authentication Port Interface
 *
 * This interface defines authentication operations needed by the use cases layer.
 * It abstracts the authentication mechanism, allowing different implementations
 * (Supabase Auth, JWT, etc.) in the adapters layer.
 */

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
 */
export interface AuthPort {
  /**
   * Validate an authentication token and return the auth context
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
   */
  refreshSession(
    sessionId: string,
  ): Effect.Effect<AuthContext, AuthError | SessionExpiredError, never>;
}
