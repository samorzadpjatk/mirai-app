import type { LocationSharingRequest } from "../entities/location-sharing-request";
import type { LocationId as LocationSharingRequestId } from "../../location/value-objects/id";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

/**
 * Cursor data for location sharing request pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface LocationSharingRequestCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for location sharing request connection pagination
 */
export interface LocationSharingRequestConnectionArgs {
  first?: number;
  after?: LocationSharingRequestCursorData | null;
}

/**
 * LocationGateway Port
 *
 * This interface defines what operations the application needs
 * from any location gateway implementation.
 */
export interface LocationGateway {
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

  /**
   * Find location sharing requests by user ID with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findSharingRequestsConnection(
    userId: string,
    args: LocationSharingRequestConnectionArgs,
  ): Effect.Effect<Connection<LocationSharingRequest>, DatabaseError, never>;

  /**
   * Find received location sharing requests by user ID with cursor-based pagination
   */
  findReceivedSharingRequestsConnection(
    userId: string,
    args: LocationSharingRequestConnectionArgs,
  ): Effect.Effect<Connection<LocationSharingRequest>, DatabaseError, never>;
}
