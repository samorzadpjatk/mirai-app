import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { Group } from "../entities/Group";
import type { GroupId } from "../value-objects/GroupId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * Group Repository Port
 *
 * Defines the interface for group persistence operations.
 */
export interface IGroupPort {
  /**
   * Find group by ID
   */
  findById(id: GroupId): Effect.Effect<Group | null, IPortError, never>;

  /**
   * Find groups by trip
   */
  findByTripId(tripId: TripId): Effect.Effect<Group[], IPortError, never>;

  /**
   * Find groups by trip with pagination
   */
  findByTripIdPaginated(
    tripId: TripId,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { groups: Group[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;

  /**
   * Find group by code
   */
  findByCode(code: string): Effect.Effect<Group | null, IPortError, never>;

  /**
   * Find groups by organizer
   */
  findByOrganizerId(
    organizerId: string,
  ): Effect.Effect<Group[], IPortError, never>;

  /**
   * Create new group
   */
  create(group: Group): Effect.Effect<Group, IPortError, never>;

  /**
   * Update existing group
   */
  update(group: Group): Effect.Effect<Group, IPortError, never>;

  /**
   * Delete group by ID
   */
  delete(id: GroupId): Effect.Effect<void, IPortError, never>;

  /**
   * Soft delete group by ID
   */
  softDelete(id: GroupId): Effect.Effect<void, IPortError, never>;

  /**
   * Check if group exists
   */
  exists(id: GroupId): Effect.Effect<boolean, IPortError, never>;

  /**
   * Count groups by trip
   */
  countByTripId(tripId: TripId): Effect.Effect<number, IPortError, never>;

  /**
   * Add coins to group
   */
  addCoins(
    groupId: GroupId,
    amount: number,
  ): Effect.Effect<Group, IPortError, never>;

  /**
   * Subtract coins from group
   */
  subtractCoins(
    groupId: GroupId,
    amount: number,
  ): Effect.Effect<Group, IPortError, never>;

  /**
   * Get group ranking for trip
   */
  getRanking(tripId: TripId): Effect.Effect<Group[], IPortError, never>;
}
