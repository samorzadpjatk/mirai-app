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
   * Find group by code
   */
  findByCode(code: string): Effect.Effect<Group | null, IPortError, never>;

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
   * Check if group exists
   */
  exists(id: GroupId): Effect.Effect<boolean, IPortError, never>;
}
