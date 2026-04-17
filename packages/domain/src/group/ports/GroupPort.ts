import type { Effect } from "effect";
import type { DatabaseError } from "../../shared/errors/domain-errors";
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
  findById(id: GroupId): Effect.Effect<Group | null, DatabaseError, never>;

  /**
   * Find groups by trip
   */
  findByTripId(tripId: TripId): Effect.Effect<Group[], DatabaseError, never>;

  /**
   * Find group by code
   */
  findByCode(code: string): Effect.Effect<Group | null, DatabaseError, never>;

  /**
   * Create new group
   */
  create(group: Group): Effect.Effect<Group, DatabaseError, never>;

  /**
   * Update existing group
   */
  update(group: Group): Effect.Effect<Group, DatabaseError, never>;

  /**
   * Delete group by ID
   */
  delete(id: GroupId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if group exists
   */
  exists(id: GroupId): Effect.Effect<boolean, DatabaseError, never>;
}
