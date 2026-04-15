import type { Sponsor } from "../../entities/sponsor/Sponsor";
import type { Effect } from "effect";
import type { DatabaseError } from "../database-error";

/**
 * SponsorRepository Port
 *
 * Port interface for sponsor persistence.
 * Implemented by adapters (e.g., DrizzleSponsorGateway).
 */
export interface SponsorRepository {
  /**
   * Create a new sponsor
   */
  create(sponsor: Sponsor): Effect.Effect<Sponsor, DatabaseError, never>;

  /**
   * Find a sponsor by ID
   */
  findById(id: string): Effect.Effect<Sponsor | null, DatabaseError, never>;

  /**
   * Find all sponsors
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Sponsor[], DatabaseError, never>;

  /**
   * Find all active sponsors
   */
  findActive(): Effect.Effect<Sponsor[], DatabaseError, never>;

  /**
   * Find sponsors by trip ID
   */
  findByTripId(tripId: string): Effect.Effect<Sponsor[], DatabaseError, never>;

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
