/**
 * Group Enums
 *
 * Enums for group management.
 *
 * @module enums/group
 */

/**
 * Group status
 */
export enum GroupStatus {
  ACTIVE = "ACTIVE",
  DELETED = "DELETED",
}

/**
 * Type guard to check if a string is a valid GroupStatus
 */
export function isGroupStatus(value: string): value is GroupStatus {
  return Object.values(GroupStatus).includes(value as GroupStatus);
}

/**
 * Check if a group status is active
 */
export function isActiveGroupStatus(status: GroupStatus): boolean {
  return status === GroupStatus.ACTIVE;
}
