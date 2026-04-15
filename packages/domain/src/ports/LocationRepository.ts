import type { LocationSharingRequest } from "../entities/LocationSharingRequest";
import type { LocationId as LocationSharingRequestId } from "../value-objects/LocationId";
import type { Effect } from "effect";
import type { DatabaseError } from "./DatabaseError";

/**
 * LocationRepository Port
 *
 * This interface defines what operations the application needs
 * from any location repository implementation.
 */
export interface LocationRepository {
  /**
   * Create a new location sharing request
   */
  create(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never>;

  /**
   * Find location sharing request by ID
   * @returns Request or null if not found
   */
  findById(
    id: LocationSharingRequestId,
  ): Effect.Effect<LocationSharingRequest | null, DatabaseError, never>;

  /**
   * Find active location sharing requests for a trip
   */
  findActiveByTripId(
    tripId: string,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never>;

  /**
   * Find location sharing requests by user ID
   */
  findByUserId(
    userId: string,
  ): Effect.Effect<LocationSharingRequest[], DatabaseError, never>;

  /**
   * Find active location sharing request for a user in a trip
   */
  findActiveByUserAndTrip(
    userId: string,
    tripId: string,
  ): Effect.Effect<LocationSharingRequest | null, DatabaseError, never>;

  /**
   * Update location sharing request
   */
  update(
    request: LocationSharingRequest,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never>;

  /**
   * End location sharing (set endedAt)
   */
  endSharing(
    id: LocationSharingRequestId,
  ): Effect.Effect<LocationSharingRequest, DatabaseError, never>;

  /**
   * Delete location sharing request
   */
  delete(
    id: LocationSharingRequestId,
  ): Effect.Effect<void, DatabaseError, never>;
}
