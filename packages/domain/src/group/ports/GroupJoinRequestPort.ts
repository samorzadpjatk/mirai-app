import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
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
  ): Effect.Effect<GroupJoinRequest | null, IPortError, never>;

  /**
   * Find join request by user and trip
   */
  findByUserAndTrip(
    userId: UserId,
    tripId: TripId,
  ): Effect.Effect<GroupJoinRequest | null, IPortError, never>;

  /**
   * Find join request by user, trip, and group
   */
  findByUserTripAndGroup(
    userId: UserId,
    tripId: TripId,
    groupId: GroupId,
  ): Effect.Effect<GroupJoinRequest | null, IPortError, never>;

  /**
   * Find all pending join requests for a group
   */
  findPendingByGroupId(
    groupId: GroupId,
  ): Effect.Effect<GroupJoinRequest[], IPortError, never>;

  /**
   * Find all join requests for a group
   */
  findByGroupId(
    groupId: GroupId,
  ): Effect.Effect<GroupJoinRequest[], IPortError, never>;

  /**
   * Create new join request
   */
  create(
    request: GroupJoinRequest,
  ): Effect.Effect<GroupJoinRequest, IPortError, never>;

  /**
   * Update join request
   */
  update(
    request: GroupJoinRequest,
  ): Effect.Effect<GroupJoinRequest, IPortError, never>;

  /**
   * Delete join request by ID
   */
  delete(id: GroupJoinRequestId): Effect.Effect<void, IPortError, never>;

  /**
   * Delete all join requests for a group
   */
  deleteByGroupId(groupId: GroupId): Effect.Effect<void, IPortError, never>;

  /**
   * Delete all join requests for a user in a trip
   */
  deleteByUserAndTrip(
    userId: UserId,
    tripId: TripId,
  ): Effect.Effect<void, IPortError, never>;

  /**
   * Delete all join requests for multiple users in a trip
   */
  deleteByUsersAndTrip(
    userIds: UserId[],
    tripId: TripId,
  ): Effect.Effect<void, IPortError, never>;

  /**
   * Check if join request exists
   */
  exists(id: GroupJoinRequestId): Effect.Effect<boolean, IPortError, never>;

  /**
   * Check if user has pending request for any group in trip
   */
  hasPendingRequest(
    userId: UserId,
    tripId: TripId,
  ): Effect.Effect<boolean, IPortError, never>;
}
