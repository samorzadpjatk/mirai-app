/**
 * User Enums
 *
 * Enums for users and user roles.
 *
 * @module enums/user
 */

/**
 * User roles in the system
 * Ordered by permission level (USER < MODERATOR < ADMIN < SERVICE)
 */
export enum UserRole {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
  SERVICE = "SERVICE",
}

/**
 * Role hierarchy for permission checking
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.MODERATOR]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SERVICE]: 4,
};

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

/**
 * Get all available user roles
 */
export function getAllUserRoles(): UserRole[] {
  return Object.values(UserRole);
}

/**
 * Check if a role has administrative privileges
 */
export function isAdminRole(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

/**
 * Check if a role has moderation privileges
 */
export function isModeratorRole(role: UserRole): boolean {
  return role === UserRole.MODERATOR || role === UserRole.ADMIN;
}
