import type { Sponsor } from "../entities/sponsor";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

/**
 * Cursor data for sponsor pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface SponsorCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for sponsor connection pagination
 */
export interface SponsorConnectionArgs {
  first?: number;
  after?: SponsorCursorData | null;
}

/**
 * SponsorGateway Port
 *
 * Port interface for sponsor persistence.
 * Implemented by adapters (e.g., DrizzleSponsorGateway).
 */
export interface SponsorGateway {
  /**
   * Create a new sponsor
   */
  create(sponsor: Sponsor): Effect.Effect<Sponsor, DatabaseError, never>;

  /**
   * Find a sponsor by ID
   */
  findById(id: string): Effect.Effect<Sponsor | null, DatabaseError, never>;

  /**
   * Find all active sponsors with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findActiveConnection(
    args: SponsorConnectionArgs,
  ): Effect.Effect<Connection<Sponsor>, DatabaseError, never>;

  /**
   * Find sponsors by trip ID with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findByTripIdConnection(
    tripId: string,
    args: SponsorConnectionArgs,
  ): Effect.Effect<Connection<Sponsor>, DatabaseError, never>;

  /**
   * Update an existing sponsor
   */
  update(sponsor: Sponsor): Effect.Effect<Sponsor, DatabaseError, never>;

  /**
   * Delete a sponsor by ID
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if a sponsor exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Check if a sponsor is associated with a trip
   */
  isLinkedToTrip(
    sponsorId: string,
    tripId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Link a sponsor to a trip
   */
  linkToTrip(
    sponsorId: string,
    tripId: string,
  ): Effect.Effect<void, DatabaseError, never>;

  /**
   * Unlink a sponsor from a trip
   */
  unlinkFromTrip(
    sponsorId: string,
    tripId: string,
  ): Effect.Effect<void, DatabaseError, never>;
}
