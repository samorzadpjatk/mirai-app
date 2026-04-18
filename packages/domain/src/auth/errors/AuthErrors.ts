import { Data } from "effect";
import type { IPortError } from "../../shared/errors/ports";

/**
 * Auth Domain Errors
 *
 * Authentication and authorization errors using Data.TaggedError for:
 * - Type-safe error matching with Effect.catchTag
 * - Serializable error objects
 * - Natural union composition with IPortError interface
 */

/**
 * Error thrown when authentication session has expired.
 * User needs to re-authenticate.
 */
export class AuthSessionExpiredError
  extends Data.TaggedError("AuthSessionExpiredError")<{
    expiredAt?: Date;
  }>
  implements IPortError
{
  override readonly message = "Authentication session has expired";
}

/**
 * Error thrown when user lacks required permissions for an action.
 * Used for authorization failures.
 */
export class PermissionDeniedError
  extends Data.TaggedError("PermissionDeniedError")<{
    action: string;
    resource: string;
    userId?: string;
  }>
  implements IPortError
{
  override readonly message = "Permission denied for this action";
}

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
 * Used for general auth service failures (e.g., Supabase auth errors).
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
