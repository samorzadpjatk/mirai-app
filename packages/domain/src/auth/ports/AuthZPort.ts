import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type {
  AccessCheckRequest,
  PermissionLevel,
  ResourceType,
  TripRole,
} from "../../shared/services";
import type { Role } from "../../user/entities/User";

/**
 * Authorization Port Interface (AuthZ)
 *
 * Defines the contract for authorization operations including:
 * - Role-based access control (RBAC)
 * - Resource permission checks
 * - User role validation
 *
 * This is the authorization complement to IAuthNPort (authentication).
 * IAuthZPort focuses on "what you can do" while IAuthNPort focuses on "who you are".
 *
 * Implemented by UserDrizzleGateway in the adapters layer (has Role data access).
 *
 * Uses AuthContext data instead of raw token for clean separation:
 * - AuthN (authentication) happens before AuthContext is created
 * - AuthZ (authorization) uses userId, role, tripRoles from AuthContext
 *
 * SECURITY: Implementations must ensure:
 * - All fields from AccessCheckRequest are safe to log (no token present)
 * - Role checks should consider inheritance (ADMIN/MODERATOR hierarchy)
 */
export interface IAuthZPort {
  /**
   * Verify access to a resource with role-based authorization
   *
   * Validates the user's role and checks if they have the required permissions
   * for the specified resource. Uses AuthContext data (userId, role, tripRoles)
   * which assumes authentication has already been performed.
   *
   * PERFORMANCE TARGET: < 30ms for local operations (database role lookups)
   *
   * @param request - Access check request containing AuthContext data (userId, role, tripRoles),
   *                   resource info, and required permissions
   * @returns Effect that succeeds if access is granted, fails with IPortError otherwise
   */
  verifyAccess(
    request: AccessCheckRequest,
  ): Effect.Effect<void, IPortError, never>;

  /**
   * Check if a user with a specific role has permission for an operation
   *
   * Performs role-based permission checking using AuthContext data.
   * Useful for internal service operations or when AuthContext is already available.
   *
   * Role hierarchy consideration:
   * - ADMIN: Has all permissions implicitly
   * - MODERATOR: Has most write permissions, limited admin access
   * - USER: Standard permissions, resource ownership required for some operations
   * - SERVICE: System-level operations only
   *
   * @param userId - The unique identifier of the user (from AuthContext)
   * @param role - The user's global role in the system (from AuthContext)
   * @param tripRoles - Map of tripId to user's role within each trip (from AuthContext)
   * @param resourceType - Type of resource being accessed
   * @param resourceId - Unique identifier of the resource being accessed
   * @param requiredPermission - Required permission level (read, write, admin)
   * @returns Effect that resolves to true if permission is granted, false otherwise
   */
  checkRolePermission(
    userId: string,
    role: Role,
    tripRoles: Record<string, TripRole>,
    resourceType: ResourceType,
    resourceId: string,
    requiredPermission: PermissionLevel,
  ): Effect.Effect<boolean, IPortError, never>;
}

/**
 * Re-export supporting types for convenience
 */
export type {
  AccessCheckRequest,
  PermissionLevel,
  ResourceType,
  TripRole,
} from "../../shared/services";
export type { Role } from "../../user/entities/User";
