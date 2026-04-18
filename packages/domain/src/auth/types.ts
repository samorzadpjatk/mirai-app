import type { Effect } from "effect";
import type { IPortError } from "../shared/errors/ports";

/**
 * Resource types that support access control
 */
export type ResourceType =
  | "trip"
  | "group"
  | "challenge"
  | "user"
  | "activity"
  | "notification"
  | "reward"
  | "sponsor"
  | "coin"
  | "challengeSubmission";

/**
 * Permission levels for access control
 */
export type PermissionLevel = "read" | "write" | "admin";

/**
 * Request to verify access to a resource
 *
 * SECURITY NOTE: The token field is sensitive and should NEVER be logged
 * or exposed in error messages. Use sanitizeAccessCheckRequest() for logging.
 */
export interface AccessCheckRequest {
  /** Authentication token (JWT) - SENSITIVE: Never log this */
  token: string;

  /** Type of resource being accessed */
  resourceType: ResourceType;

  /** Unique identifier of the resource */
  resourceId: string;

  /** Required permission level for the operation */
  requiredPermission: PermissionLevel;

  /** Whether to require resource ownership (user must be owner/creator) */
  requireOwnership?: boolean;
}

/**
 * Creates a safe, loggable version of AccessCheckRequest with token redacted.
 * Always use this when logging request information.
 *
 * @param request - The original AccessCheckRequest
 * @returns Sanitized object safe for logging
 */
export const sanitizeAccessCheckRequest = (
  request: AccessCheckRequest,
): Omit<AccessCheckRequest, "token"> & { token: string } => ({
  ...request,
  token: "[REDACTED]",
});

/**
 * Creates a summary string for logging without exposing sensitive data.
 * This is safe to use in logs and error messages.
 *
 * @param request - The AccessCheckRequest to summarize
 * @returns Safe string representation for logging
 */
export const accessCheckRequestToString = (
  request: AccessCheckRequest,
): string => {
  return `AccessCheckRequest{resourceType:${request.resourceType}, resourceId:${request.resourceId}, requiredPermission:${request.requiredPermission}, token:[REDACTED]${request.requireOwnership !== undefined ? ", requireOwnership:" + request.requireOwnership : ""}}`;
};

/**
 * Auth Port Interface
 *
 * Defines the contract for authentication and authorization operations.
 * Implemented by SupabaseAuthGateway in the adapters layer.
 *
 * SECURITY: Implementations must ensure:
 * - Token values are never logged or exposed in error messages
 * - Use sanitizeAccessCheckRequest() or accessCheckRequestToString() for logging
 * - Performance timing should exclude network latency from external auth services
 */
export interface IAuthPort {
  /**
   * Verify access to a resource
   *
   * Validates the authentication token and checks if the user has the
   * required permissions for the specified resource.
   *
   * PERFORMANCE TARGET: < 50ms for local operations (excluding Supabase network calls)
   *
   * SECURITY: Implementations must never log the full token value.
   * Use token.substring(0, 8) + "..." pattern or [REDACTED] placeholder.
   *
   * @param request - Access check request containing token, resource info, and required permissions
   * @returns Effect that succeeds if access is granted, fails with IPortError otherwise
   */
  verifyAccess(
    request: AccessCheckRequest,
  ): Effect.Effect<void, IPortError, never>;
}
