import { Context, Effect } from "effect";
import type {
  Location,
  LocationSharingRequest,
  IPortError,
  UserId,
  LocationId,
  LocationSharingRequestId,
} from "@mirai-app/domain";

/**
 * Location Port - Repository interface with Context.Tag for Effect DI
 */
export interface ILocationPort {
  // ============================================================================
  // Location Operations
  // ============================================================================

  /**
   * Find location by ID
   */
  findById(id: LocationId): Effect.Effect<Location | null, IPortError, never>;

  /**
   * Find location by user ID
   */
  findByUserId(
    userId: UserId,
  ): Effect.Effect<Location | null, IPortError, never>;

  /**
   * Find locations with sharing enabled
   */
  findSharing(): Effect.Effect<Location[], IPortError, never>;

  /**
   * Find locations where user is in sharing list
   */
  findByUserInSharingList(
    userId: UserId,
  ): Effect.Effect<Location[], IPortError, never>;

  /**
   * Create new location
   */
  create(location: Location): Effect.Effect<Location, IPortError, never>;

  /**
   * Update existing location
   */
  update(location: Location): Effect.Effect<Location, IPortError, never>;

  /**
   * Upsert location for user
   */
  upsert(location: Location): Effect.Effect<Location, IPortError, never>;

  /**
   * Delete location by ID
   */
  delete(id: LocationId): Effect.Effect<void, IPortError, never>;

  // ============================================================================
  // Location Sharing Request Operations
  // ============================================================================

  /**
   * Find location sharing request by ID
   */
  findSharingRequestById(
    id: LocationSharingRequestId,
  ): Effect.Effect<LocationSharingRequest | null, IPortError, never>;

  /**
   * Find location sharing request by sender and receiver
   */
  findSharingRequestBySenderAndReceiver(
    senderId: UserId,
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest | null, IPortError, never>;

  /**
   * Find pending sharing requests for receiver
   */
  findPendingSharingRequestsByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, never>;

  /**
   * Find all sharing requests sent by user
   */
  findSharingRequestsBySender(
    senderId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, never>;

  /**
   * Find all sharing requests received by user
   */
  findSharingRequestsByReceiver(
    receiverId: UserId,
  ): Effect.Effect<LocationSharingRequest[], IPortError, never>;

  /**
   * Create location sharing request
   */
  createSharingRequest(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, IPortError, never>;

  /**
   * Update location sharing request
   */
  updateSharingRequest(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, IPortError, never>;

  // ============================================================================
  // Sharing List Operations
  // ============================================================================

  /**
   * Connect user to location sharing list
   */
  connectUserToSharing(
    locationOwnerId: UserId,
    userIdToShareWith: UserId,
  ): Effect.Effect<void, IPortError, never>;

  /**
   * Disconnect user from location sharing list
   */
  disconnectUserFromSharing(
    locationOwnerId: UserId,
    userIdToRemove: UserId,
  ): Effect.Effect<void, IPortError, never>;

  /**
   * Set users to share with (replaces existing list)
   */
  setUsersToShareWith(
    locationOwnerId: UserId,
    userIds: UserId[],
  ): Effect.Effect<void, IPortError, never>;
}

export class LocationPortTag extends Context.Tag("LocationPort")<
  LocationPortTag,
  ILocationPort
>() {}
