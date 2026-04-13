import type { Group, GroupStatus } from "@mirai-app/domain";
import { Context, Effect } from "effect";

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
  create(group: Group): Effect.Effect<Group, never, never>;

  /**
   * Find group by ID
   * @returns Group or null if not found
   */
  findById(id: string): Effect.Effect<Group | null, never, never>;

  /**
   * Find groups by trip ID
   */
  findByTripId(tripId: string): Effect.Effect<Group[], never, never>;

  /**
   * Find groups by status
   */
  findByStatus(status: GroupStatus): Effect.Effect<Group[], never, never>;

  /**
   * Find groups by trip ID and status
   */
  findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Effect.Effect<Group[], never, never>;

  /**
   * Find groups by organizer ID
   */
  findByOrganizerId(organizerId: string): Effect.Effect<Group[], never, never>;

  /**
   * Find group by code
   */
  findByCode(code: string): Effect.Effect<Group | null, never, never>;

  /**
   * Find all groups with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Group[], never, never>;

  /**
   * Update group
   */
  update(group: Group): Effect.Effect<Group, never, never>;

  /**
   * Delete group
   */
  delete(id: string): Effect.Effect<void, never, never>;

  /**
   * Check if group exists
   */
  exists(id: string): Effect.Effect<boolean, never, never>;

  /**
   * Count groups by trip ID
   */
  countByTripId(tripId: string): Effect.Effect<number, never, never>;
}

/**
 * GroupRepository Context.Tag for Effect dependency injection
 */
export class GroupRepositoryTag extends Context.Tag("GroupRepository")<
  GroupRepositoryTag,
  {
    create: (group: Group) => Effect.Effect<Group, never, never>;
    findById: (id: string) => Effect.Effect<Group | null, never, never>;
    findByTripId: (tripId: string) => Effect.Effect<Group[], never, never>;
    findByStatus: (status: GroupStatus) => Effect.Effect<Group[], never, never>;
    findByTripIdAndStatus: (
      tripId: string,
      status: GroupStatus,
    ) => Effect.Effect<Group[], never, never>;
    findByOrganizerId: (
      organizerId: string,
    ) => Effect.Effect<Group[], never, never>;
    findByCode: (code: string) => Effect.Effect<Group | null, never, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<Group[], never, never>;
    update: (group: Group) => Effect.Effect<Group, never, never>;
    delete: (id: string) => Effect.Effect<void, never, never>;
    exists: (id: string) => Effect.Effect<boolean, never, never>;
    countByTripId: (tripId: string) => Effect.Effect<number, never, never>;
  }
>() {}
