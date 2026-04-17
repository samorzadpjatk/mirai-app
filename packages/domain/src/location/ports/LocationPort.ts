import type { Effect } from "effect";
import type { DatabaseError } from "../../shared/errors/domain-errors";
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
 */
export interface ILocationPort {
  // ============================================================================
  // Location Operations
  // ============================================================================

  /**
   * Find location by ID
   */
  findById(
    id: LocationId,
  ): Effect.Effect<Location | null, DatabaseError, never>;

  /**
   * Find location by user ID
   */
  findByUserId(
    userId: UserId,
  ): Effect.Effect<Location | null, DatabaseError, never>;

  /**
   * Find locations with sharing enabled
   */
  findSharing(): Effect.Effect<Location[], DatabaseError, never>;

  /**
   * Find locations where user is in sharing list
   */
  findByUserInSharingList(
    userId: UserId,
  ): Effect.Effect<Location[], DatabaseError, never>;

  /**
   * Create new location
   */
  create(location: Location): Effect.Effect<Location, DatabaseError, never>;

  /**
   * Update existing location
   */
  update(location: Location): Effect.Effect<Location, DatabaseError, never>;

  /**
   * Upsert location for user
   */
  upsert(location: Location): Effect.Effect<Location, DatabaseError, never>;

  /**
   * Delete location by ID
   */
  delete(id: LocationId): Effect.Effect<void, DatabaseError, never>;

  // ============================================================================
  // Location Sharing Request Operations
  // ============================================================================

  /**
   * Find location sharing request by ID
   */
  findSharingRequestById(
    id: LocationSharingRequestId,
  ): Effect.Effect<LocationSharingRequest | null, DatabaseError, never>;

  /**
   * Find location sharing request by sender and receiver
   */
  findSharingRequestBySenderAndReceiver(
    senderId: UserId,
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest | null, DatabaseError, never>;

  /**
   * Find pending sharing requests for receiver
   */
  findPendingSharingRequestsByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never>;

  /**
   * Find all sharing requests sent by user
   */
  findSharingRequestsBySender(
    senderId: UserId,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never>;

  /**
   * Find all sharing requests received by user
   */
  findSharingRequestsByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never>;

  /**
   * Create location sharing request
   */
  createSharingRequest(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never>;

  /**
   * Update location sharing request
   */
  updateSharingRequest(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never>;

  // ============================================================================
  // Sharing List Operations
  // ============================================================================

  /**
   * Connect user to location sharing list
   */
  connectUserToSharing(
    locationOwnerId: UserId,
    userIdToShareWith: UserId,
  ): Effect.Effect<void, DatabaseError, never>;

  /**
   * Disconnect user from location sharing list
   */
  disconnectUserFromSharing(
    locationOwnerId: UserId,
    userIdToRemove: UserId,
  ): Effect.Effect<void, DatabaseError, never>;

  /**
   * Set users to share with (replaces existing list)
   */
  setUsersToShareWith(
    locationOwnerId: UserId,
    userIds: UserId[],
  ): Effect.Effect<void, DatabaseError, never>;
}
