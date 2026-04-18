import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { Location } from "../entities/Location";
import type { LocationSharingRequest } from "../entities/LocationSharingRequest";
import type {
  LocationId,
  LocationSharingRequestId,
} from "../value-objects/LocationId";
import type { UserId } from "../../user/value-objects/UserId";

/**
 * Location Repository Port
 *
 * Defines the interface for location persistence operations.
 * Methods requiring authorization use AuthContext pattern via Effect context.
 */
export interface ILocationPort {
  // ============================================================================
  // Location Operations
  // ============================================================================

  /**
   * Find location by ID
   *
   * Note: Authorization is handled via AuthContextTag in the Effect context,
   * not via explicit authToken parameter.
   */
  findById(
    id: LocationId,
  ): Effect.Effect<Location | null, IPortError, unknown>;

  /**
   * Find location by user ID
   *
   * Privacy: Users can only access their own location.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  findByUserId(
    userId: UserId,
  ): Effect.Effect<Location | null, IPortError, unknown>;

  /**
   * Find locations with sharing enabled
   *
   * Note: Authorization is handled via AuthContextTag in the Effect context.
   */
  findSharing(): Effect.Effect<Location[], IPortError, unknown>;

  /**
   * Find locations where user is in sharing list
   *
   * Privacy: Returns only locations explicitly shared with the requesting user.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  findByUserInSharingList(
    userId: UserId,
  ): Effect.Effect<Location[], IPortError, unknown>;

  /**
   * Create new location
   *
   * Privacy: Users can only create locations for themselves.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  create(location: Location): Effect.Effect<Location, IPortError, unknown>;

  /**
   * Update existing location
   *
   * Privacy: Users can only update their own location.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  update(location: Location): Effect.Effect<Location, IPortError, unknown>;

  /**
   * Upsert location for user
   *
   * Privacy: Users can only upsert their own location.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  upsert(location: Location): Effect.Effect<Location, IPortError, unknown>;

  /**
   * Delete location by ID
   *
   * Privacy: Users can only delete their own location.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  delete(id: LocationId): Effect.Effect<void, IPortError, unknown>;

  // ============================================================================
  // Location Sharing Request Operations
  // ============================================================================

  /**
   * Find location sharing request by ID
   */
  findSharingRequestById(
    id: LocationSharingRequestId,
  ): Effect.Effect<LocationSharingRequest | null, IPortError, unknown>;

  /**
   * Find location sharing request by sender and receiver
   */
  findSharingRequestBySenderAndReceiver(
    senderId: UserId,
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest | null, IPortError, unknown>;

  /**
   * Find pending sharing requests for receiver
   *
   * Privacy: Users can only view their own pending requests.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  findPendingSharingRequestsByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, unknown>;

  /**
   * Find all sharing requests sent by user
   *
   * Privacy: Users can only view their own sent requests.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  findSharingRequestsBySender(
    senderId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, unknown>;

  /**
   * Find all sharing requests received by user
   *
   * Privacy: Users can only view their own received requests.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  findSharingRequestsByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, unknown>;

  /**
   * Create location sharing request
   *
   * Privacy: Users can only create requests as themselves (sender).
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  createSharingRequest(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, IPortError, unknown>;

  /**
   * Update location sharing request
   *
   * Privacy: Users can only update requests they are involved in.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  updateSharingRequest(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, IPortError, unknown>;

  // ============================================================================
  // Sharing List Operations
  // ============================================================================

  /**
   * Connect user to location sharing list
   *
   * Privacy: Users can only modify their own sharing list.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  connectUserToSharing(
    locationOwnerId: UserId,
    userIdToShareWith: UserId,
  ): Effect.Effect<void, IPortError, unknown>;

  /**
   * Disconnect user from location sharing list
   *
   * Privacy: Users can only modify their own sharing list.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  disconnectUserFromSharing(
    locationOwnerId: UserId,
    userIdToRemove: UserId,
  ): Effect.Effect<void, IPortError, unknown>;

  /**
   * Set users to share with (replaces existing list)
   *
   * Privacy: Users can only modify their own sharing list.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  setUsersToShareWith(
    locationOwnerId: UserId,
    userIds: UserId[],
  ): Effect.Effect<void, IPortError, unknown>;

  /**
   * Get the list of users that a location owner is sharing with
   *
   * Privacy: Users can only view their own sharing list.
   * Authorization is handled via AuthContextTag in the Effect context.
   */
  getSharingListForUser(
    locationOwnerId: UserId,
  ): Effect.Effect<UserId[], IPortError, unknown>;
}
