import type { Effect } from "effect";
import type { IPortError } from "../shared/errors/ports";
import type { Role } from "../user/entities/User";

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
 * Uses AuthContext data (userId, role, tripRoles) instead of raw token
 * for clean separation between AuthN (authentication) and AuthZ (authorization).
 * The token validation is assumed to be done before AuthContext is created.
 */
export interface AccessCheckRequest {
  /** User ID from AuthContext (already authenticated) */
  userId: string;

  /** User's global role from AuthContext */
  role: Role;

  /** Map of tripId to user's role within that trip from AuthContext */
  tripRoles: Record<string, TripRole>;

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
 * TripRole - Role of a user within a specific trip
 * Used in tripRoles map to track user's permissions per trip
 */
export type TripRole = "MEMBER" | "LEADER";

/**
 * Creates a safe, loggable version of AccessCheckRequest.
 * All fields are safe to log since no token is present.
 *
 * @param request - The original AccessCheckRequest
 * @returns Sanitized object safe for logging
 */
export const sanitizeAccessCheckRequest = (
  request: AccessCheckRequest,
): AccessCheckRequest => ({
  ...request,
});

/**
 * Creates a summary string for logging.
 * All fields are safe to log since AuthContext data is used instead of token.
 *
 * @param request - The AccessCheckRequest to summarize
 * @returns Safe string representation for logging
 */
export const accessCheckRequestToString = (
  request: AccessCheckRequest,
): string => {
  return `AccessCheckRequest{userId:${request.userId}, role:${request.role}, resourceType:${request.resourceType}, resourceId:${request.resourceId}, requiredPermission:${request.requiredPermission}${request.requireOwnership !== undefined ? ", requireOwnership:" + request.requireOwnership : ""}}`;
};

/**
 * Auth Port Interface
 *
 * Defines the contract for authentication and authorization operations.
 * Implemented by SupabaseAuthGateway in the adapters layer.
 *
 * Uses AuthContext data (userId, role, tripRoles) instead of raw token
 * for clean separation between AuthN and AuthZ.
 *
 * SECURITY: All AccessCheckRequest fields are safe to log (no token present).
 * Performance timing should exclude network latency from external auth services.
 */
export interface IAuthPort {
  /**
   * Verify access to a resource
   *
   * Validates the user's role and checks if they have the required permissions
   * for the specified resource. Uses AuthContext data (userId, role, tripRoles)
   * which assumes authentication has already been performed.
   *
   * PERFORMANCE TARGET: < 50ms for local operations (excluding Supabase network calls)
   *
   * @param request - Access check request containing AuthContext data (userId, role, tripRoles),
   *                   resource info, and required permissions
   * @returns Effect that succeeds if access is granted, fails with IPortError otherwise
   */
  verifyAccess(
    request: AccessCheckRequest,
  ): Effect.Effect<void, IPortError, never>;
}
