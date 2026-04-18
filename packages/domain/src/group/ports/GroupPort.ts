import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { Group } from "../entities/Group";
import type { GroupId } from "../value-objects/GroupId";
import type { TripId } from "../../trip/value-objects/TripId";

/**
 * Group Repository Port
 *
 * Defines the interface for group persistence operations.
 * Methods requiring authorization use AuthContext pattern via Effect context.
 */
export interface IGroupPort {
  /**
   * Find group by ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context, not via explicit authToken parameter.
   */
  findById(
    id: GroupId,
  ): Effect.Effect<Group | null, IPortError, unknown>;

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
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context, not via explicit authToken parameter.
   */
  create(group: Group): Effect.Effect<Group, IPortError, unknown>;

  /**
   * Update existing group
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context, not via explicit authToken parameter.
   */
  update(group: Group): Effect.Effect<Group, IPortError, unknown>;

  /**
   * Delete group by ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context, not via explicit authToken parameter.
   */
  delete(id: GroupId): Effect.Effect<void, IPortError, unknown>;

  /**
   * Soft delete group by ID
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context, not via explicit authToken parameter.
   */
  softDelete(id: GroupId): Effect.Effect<void, IPortError, unknown>;

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
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context, not via explicit authToken parameter.
   */
  addCoins(
    groupId: GroupId,
    amount: number,
  ): Effect.Effect<Group, IPortError, unknown>;

  /**
   * Subtract coins from group
   *
   * Note: Authorization is handled via AuthContextTag and AuthZPortTag
   * in the Effect context, not via explicit authToken parameter.
   */
  subtractCoins(
    groupId: GroupId,
    amount: number,
  ): Effect.Effect<Group, IPortError, unknown>;

  /**
   * Get group ranking for trip
   */
  getRanking(tripId: TripId): Effect.Effect<Group[], IPortError, never>;
}
