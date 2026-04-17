import type { Effect } from "effect";
import type { DatabaseError } from "../../shared/errors/domain-errors";
import type { GroupJoinRequest } from "../entities/GroupJoinRequest";
import type { GroupJoinRequestId } from "../value-objects/GroupJoinRequestId";
import type { GroupId } from "../value-objects/GroupId";
import type { TripId } from "../../trip/value-objects/TripId";
import type { UserId } from "../../user/value-objects/UserId";

/**
 * Group Join Request Repository Port
 *
 * Defines the interface for group join request persistence operations.
 */
export interface IGroupJoinRequestPort {
  /**
   * Find join request by ID
   */
  findById(
    id: GroupJoinRequestId,
  ): Effect.Effect<GroupJoinRequest | null, DatabaseError, never>;

  /**
   * Find join request by user and trip
   */
  findByUserAndTrip(
    userId: UserId,
    tripId: TripId,
  ): Effect.Effect<GroupJoinRequest | null, DatabaseError, never>;

  /**
   * Find join request by user, trip, and group
   */
  findByUserTripAndGroup(
    userId: UserId,
    tripId: TripId,
    groupId: GroupId,
  ): Effect.Effect<GroupJoinRequest | null, DatabaseError, never>;

  /**
   * Find all pending join requests for a group
   */
  findPendingByGroupId(
    groupId: GroupId,
  ): Effect.Effect<GroupJoinRequest[], DatabaseError, never>;

  /**
   * Find all join requests for a group
   */
  findByGroupId(
    groupId: GroupId,
  ): Effect.Effect<GroupJoinRequest[], DatabaseError, never>;

  /**
   * Create new join request
   */
  create(
    request: GroupJoinRequest,
  ): Effect.Effect<GroupJoinRequest, DatabaseError, never>;

  /**
   * Update join request
   */
  update(
    request: GroupJoinRequest,
  ): Effect.Effect<GroupJoinRequest, DatabaseError, never>;

  /**
   * Delete join request by ID
   */
  delete(id: GroupJoinRequestId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Delete all join requests for a group
   */
  deleteByGroupId(groupId: GroupId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Delete all join requests for a user in a trip
   */
  deleteByUserAndTrip(
    userId: UserId,
    tripId: TripId,
  ): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if join request exists
   */
  exists(id: GroupJoinRequestId): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Check if user has pending request for any group in trip
   */
  hasPendingRequest(
    userId: UserId,
    tripId: TripId,
  ): Effect.Effect<boolean, DatabaseError, never>;
}
