import type { Sponsor } from "@mirai-app/domain";
import { Context, Effect } from "effect";

/**
 * SponsorRepository
 *
 * Port interface for sponsor persistence.
 * Implemented by adapters (e.g., PrismaSponsorRepository).
 */
export interface SponsorRepository {
  /**
   * Create a new sponsor
   */
  create(sponsor: Sponsor): Promise<Sponsor>;

  /**
   * Find a sponsor by ID
   */
  findById(id: string): Promise<Sponsor | null>;

  /**
   * Find all sponsors
   */
  findAll(options?: { limit?: number; offset?: number }): Promise<Sponsor[]>;

  /**
   * Find all active sponsors
   */
  findActive(): Promise<Sponsor[]>;

  /**
   * Find sponsors by trip ID
   */
  findByTripId(tripId: string): Promise<Sponsor[]>;

  /**
   * Update an existing sponsor
   */
  update(sponsor: Sponsor): Promise<Sponsor>;

  /**
   * Delete a sponsor by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a sponsor exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Check if a sponsor is associated with a trip
   */
  isLinkedToTrip(sponsorId: string, tripId: string): Promise<boolean>;

  /**
   * Link a sponsor to a trip
   */
  linkToTrip(sponsorId: string, tripId: string): Promise<void>;

  /**
   * Unlink a sponsor from a trip
   */
  unlinkFromTrip(sponsorId: string, tripId: string): Promise<void>;
}

/**
 * SponsorRepository Context.Tag for Effect dependency injection
 */
export class SponsorRepositoryTag extends Context.Tag("SponsorRepository")<
  SponsorRepositoryTag,
  {
    create: (sponsor: Sponsor) => Effect.Effect<Sponsor, never, never>;
    findById: (id: string) => Effect.Effect<Sponsor | null, never, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<Sponsor[], never, never>;
    findActive: () => Effect.Effect<Sponsor[], never, never>;
    findByTripId: (tripId: string) => Effect.Effect<Sponsor[], never, never>;
    update: (sponsor: Sponsor) => Effect.Effect<Sponsor, never, never>;
    delete: (id: string) => Effect.Effect<void, never, never>;
    exists: (id: string) => Effect.Effect<boolean, never, never>;
    isLinkedToTrip: (
      sponsorId: string,
      tripId: string,
    ) => Effect.Effect<boolean, never, never>;
    linkToTrip: (
      sponsorId: string,
      tripId: string,
    ) => Effect.Effect<void, never, never>;
    unlinkFromTrip: (
      sponsorId: string,
      tripId: string,
    ) => Effect.Effect<void, never, never>;
  }
>() {}
