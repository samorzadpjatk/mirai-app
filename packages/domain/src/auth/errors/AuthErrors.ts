import { Data } from "effect";
import type { IPortError } from "../../shared/errors/ports";

/**
 * Auth Domain Errors for Better Auth migration
 *
 * Authentication and authorization errors using Data.TaggedError for:
 * - Type-safe error matching with Effect.catchTag
 * - Serializable error objects
 * - Natural union composition with IPortError interface
 */

/**
 * Error thrown when an authentication session token is invalid or expired.
 * This indicates the user needs to re-authenticate.
 */
export class AuthSessionExpiredError
  extends Data.TaggedError("AuthSessionExpiredError")<{
    token?: string;
    expiredAt?: Date;
    cause?: unknown;
  }>
  implements IPortError
{
  override readonly message = "Session has expired, please sign in again";
}

/**
 * Error thrown when a user attempts to access a resource without proper permissions.
 */
export class PermissionDeniedError
  extends Data.TaggedError("PermissionDeniedError")<{
    resourceType: string;
    resourceId?: string;
    requiredPermission: string;
    userId?: string;
  }>
  implements IPortError
{
  override get message(): string {
    return `Permission denied: ${this.requiredPermission} access to ${this.resourceType}${this.resourceId ? ` (${this.resourceId})` : ""}`;
  }
}

/**
 * Error thrown when attempting to register a user that already exists in the system.
 */
export class UserAlreadyExistsError
  extends Data.TaggedError("UserAlreadyExistsError")<{
    identifier: string;
    identifierType: "email" | "username" | "phone";
  }>
  implements IPortError
{
  override get message(): string {
    return `User with ${this.identifierType} "${this.identifier}" already exists`;
  }
}

/**
 * Error thrown when authentication rate limits are exceeded.
 * Includes retryAfter field to indicate when the client can retry.
 */
export class RateLimitError
  extends Data.TaggedError("RateLimitError")<{
    operation: string;
    retryAfter: number;
    limit: number;
    windowSeconds: number;
  }>
  implements IPortError
{
  override get message(): string {
    return `Rate limit exceeded for ${this.operation}. Retry after ${this.retryAfter} seconds`;
  }
}

/**
 * General authentication error for cases that don't fit specific error types.
 * Used for unexpected authentication failures.
 */
export class AuthenticationError
  extends Data.TaggedError("AuthenticationError")<{
    operation: string;
    cause?: unknown;
    details?: Record<string, unknown>;
  }>
  implements IPortError
{
  override get message(): string {
    return `Authentication failed during ${this.operation}`;
  }
}

// ============================================================================
// Legacy/Additional Auth Errors (retained for backward compatibility)
// ============================================================================

/**
 * Error thrown when authentication token is missing.
 * Used when a protected operation is attempted without credentials.
 */
export class TokenMissingError
  extends Data.TaggedError("TokenMissingError")<{
    operation: string;
  }>
  implements IPortError
{
  override readonly message = "Authentication token is missing";
}

/**
 * Error thrown when authentication service fails.
 * Used for general auth service failures (e.g., Better Auth errors).
 */
export class AuthServiceError
  extends Data.TaggedError("AuthServiceError")<{
    operation: string;
    cause?: unknown;
  }>
  implements IPortError
{
  override readonly message = "Authentication service error";
}

/**
 * Error thrown when access is forbidden.
 * Similar to PermissionDeniedError but for explicit access restrictions.
 */
export class ForbiddenError
  extends Data.TaggedError("ForbiddenError")<{
    resource: string;
    reason?: string;
  }>
  implements IPortError
{
  override readonly message = "Access to this resource is forbidden";
}
