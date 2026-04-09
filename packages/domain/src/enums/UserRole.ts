/**
 * UserRole - Enumeration of user roles in the system
 *
 * Roles define the permissions and capabilities of users:
 * - ADMIN: Full system access, can manage all resources
 * - MODERATOR: Can moderate content, manage users, and approve submissions
 * - USER: Standard user with basic permissions
 *
 * @module enums
 */

export enum UserRole {
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  USER = "USER",
  SERVICE = "SERVICE",
}

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
