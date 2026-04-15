import type { Group, GroupStatus, TripParticipant } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "./errors";

/**
 * GroupRepository Port
 *
 * This interface defines what operations the application needs
 * from any group repository implementation.
 *
 * All methods return Effect.Effect for composable error handling.
 * Use Effect.runPromise at system boundaries (controllers/framework layer).
 */
export interface GroupRepository {
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
   * Find groups by trip ID
   */
  findByTripId(tripId: string): Effect.Effect<Group[], DatabaseError, never>;

  /**
   * Find groups by status
   */
  findByStatus(
    status: GroupStatus,
  ): Effect.Effect<Group[], DatabaseError, never>;

  /**
   * Find groups by trip ID and status
   */
  findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Effect.Effect<Group[], DatabaseError, never>;

  /**
   * Find groups by organizer ID
   */
  findByOrganizerId(
    organizerId: string,
  ): Effect.Effect<Group[], DatabaseError, never>;

  /**
   * Find group by code
   */
  findByCode(code: string): Effect.Effect<Group | null, DatabaseError, never>;

  /**
   * Find all groups with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Group[], DatabaseError, never>;

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
   * Find all participants assigned to a group
   */
  findParticipantsByGroupId(
    groupId: string,
  ): Effect.Effect<TripParticipant[], DatabaseError, never>;

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

/**
 * GroupRepository Context.Tag for Effect dependency injection
 */
export class GroupRepositoryTag extends Context.Tag("GroupRepository")<
  GroupRepositoryTag,
  GroupRepository
>() {}
