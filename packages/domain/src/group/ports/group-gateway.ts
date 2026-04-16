import type { Group } from "../entities/group";
import type { GroupStatus } from "../../group/enums";
import type { TripParticipant } from "../../trip/entities/trip-participant";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

/**
 * Cursor data for group pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface GroupCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for group connection pagination
 */
export interface GroupConnectionArgs {
  first?: number;
  after?: GroupCursorData | null;
}

/**
 * GroupGateway Port
 *
 * This interface defines what operations the application needs
 * from any group gateway implementation.
 *
 * All methods return Effect.Effect for composable error handling.
 * Use Effect.runPromise at system boundaries (controllers/framework layer).
 */
export interface GroupGateway {
  /**
   * Create a new group
   */
  create(group: Group): Effect.Effect<Group, DatabaseError, never>;

  /**
   * Find group by ID
   * @returns Group or null if not found
   */
  findById(id: string): Effect.Effect<Group | null, DatabaseError, never>;

  /**
   * Find groups by trip ID with cursor-based pagination
   */
  findByTripIdConnection(
    tripId: string,
    args: GroupConnectionArgs,
  ): Effect.Effect<Connection<Group>, DatabaseError, never>;

  /**
   * Find groups by status with cursor-based pagination
   */
  findByStatusConnection(
    status: GroupStatus,
    args: GroupConnectionArgs,
  ): Effect.Effect<Connection<Group>, DatabaseError, never>;

  /**
   * Find groups by trip ID and status with cursor-based pagination
   */
  findByTripIdAndStatusConnection(
    tripId: string,
    status: GroupStatus,
    args: GroupConnectionArgs,
  ): Effect.Effect<Connection<Group>, DatabaseError, never>;

  /**
   * Find groups by organizer ID with cursor-based pagination
   */
  findByOrganizerIdConnection(
    organizerId: string,
    args: GroupConnectionArgs,
  ): Effect.Effect<Connection<Group>, DatabaseError, never>;

  /**
   * Find group by code
   */
  findByCode(code: string): Effect.Effect<Group | null, DatabaseError, never>;

  /**
   * Update group
   */
  update(group: Group): Effect.Effect<Group, DatabaseError, never>;

  /**
   * Delete group
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if group exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count groups by trip ID
   */
  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never>;

  /**
   * Find trip participant by user ID and trip ID
   */
  findParticipantByUserIdAndTripId(
    userId: string,
    tripId: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never>;

  /**
   * Find all trip participants with cursor-based pagination
   */
  findTripParticipantsConnection(
    tripId: string,
    args: GroupConnectionArgs,
  ): Effect.Effect<Connection<TripParticipant>, DatabaseError, never>;

  /**
   * Assign a user to a group by updating their participant record
   */
  assignUserToGroup(
    userId: string,
    groupId: string,
  ): Effect.Effect<TripParticipant, DatabaseError, never>;

  /**
   * Remove a user from their assigned group
   */
  removeUserFromGroup(
    userId: string,
    groupId: string,
  ): Effect.Effect<TripParticipant, DatabaseError, never>;
}
