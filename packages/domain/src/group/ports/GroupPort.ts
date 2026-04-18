import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { Group } from "../entities/Group";
import type { GroupId } from "../value-objects/GroupId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * Group Repository Port
 *
 * Defines the interface for group persistence operations.
 * All protected methods support optional authToken for authorization.
 */
export interface IGroupPort {
  /**
   * Find group by ID
   * @param authToken - Optional auth token for authorization (read permission)
   */
  findById(
    id: GroupId,
    authToken?: string,
  ): Effect.Effect<Group | null, IPortError, never>;

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
   * @param authToken - Optional auth token for authorization (write permission)
   */
  create(
    group: Group,
    authToken?: string,
  ): Effect.Effect<Group, IPortError, never>;

  /**
   * Update existing group
   * @param authToken - Optional auth token for authorization (write permission)
   */
  update(
    group: Group,
    authToken?: string,
  ): Effect.Effect<Group, IPortError, never>;

  /**
   * Delete group by ID
   * @param authToken - Optional auth token for authorization (admin permission)
   */
  delete(id: GroupId, authToken?: string): Effect.Effect<void, IPortError, never>;

  /**
   * Soft delete group by ID
   * @param authToken - Optional auth token for authorization (admin permission)
   */
  softDelete(
    id: GroupId,
    authToken?: string,
  ): Effect.Effect<void, IPortError, never>;

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
   * @param authToken - Optional auth token for authorization (write permission)
   */
  addCoins(
    groupId: GroupId,
    amount: number,
    authToken?: string,
  ): Effect.Effect<Group, IPortError, never>;

  /**
   * Subtract coins from group
   * @param authToken - Optional auth token for authorization (write permission)
   */
  subtractCoins(
    groupId: GroupId,
    amount: number,
    authToken?: string,
  ): Effect.Effect<Group, IPortError, never>;

  /**
   * Get group ranking for trip
   */
  getRanking(tripId: TripId): Effect.Effect<Group[], IPortError, never>;
}
