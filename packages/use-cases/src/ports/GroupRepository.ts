import type { Group, GroupStatus } from "@repo/domain";

/**
 * GroupRepository Port
 *
 * This interface defines what operations the application needs
 * from any group repository implementation.
 */
export interface GroupRepository {
  /**
   * Create a new group
   */
  create(group: Group): Promise<Group>;

  /**
   * Find group by ID
   * @returns Group or null if not found
   */
  findById(id: string): Promise<Group | null>;

  /**
   * Find groups by trip ID
   */
  findByTripId(tripId: string): Promise<Group[]>;

  /**
   * Find groups by status
   */
  findByStatus(status: GroupStatus): Promise<Group[]>;

  /**
   * Find groups by trip ID and status
   */
  findByTripIdAndStatus(tripId: string, status: GroupStatus): Promise<Group[]>;

  /**
   * Find groups by organizer ID
   */
  findByOrganizerId(organizerId: string): Promise<Group[]>;

  /**
   * Find group by code
   */
  findByCode(code: string): Promise<Group | null>;

  /**
   * Find all groups with pagination
   */
  findAll(options?: { limit?: number; offset?: number }): Promise<Group[]>;

  /**
   * Update group
   */
  update(group: Group): Promise<Group>;

  /**
   * Delete group
   */
  delete(id: string): Promise<void>;

  /**
   * Check if group exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count groups by trip ID
   */
  countByTripId(tripId: string): Promise<number>;
}
