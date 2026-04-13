import type { Sponsor } from "@mirai-app/domain";
import { Context, Effect } from "effect";

/**
 * Repository error type for port interfaces
 * This is a common error type used across all repository implementations
 */
export class DatabaseError extends Error {
  readonly _tag = "DatabaseError" as const;
  readonly code = "DATABASE_ERROR" as const;
  readonly operation: string;
  override readonly message: string;
  override readonly cause?: unknown;

  constructor(props: { operation: string; message: string; cause?: unknown }) {
    super(`Database error in '${props.operation}': ${props.message}`);
    this.operation = props.operation;
    this.message = props.message;
    this.cause = props.cause;
  }
}

/**
 * SponsorRepository
 *
 * Port interface for sponsor persistence.
 * Implemented by adapters (e.g., DrizzleSponsorRepository).
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

/**
 * SponsorRepository Context.Tag for Effect dependency injection
 */
export class SponsorRepositoryTag extends Context.Tag("SponsorRepository")<
  SponsorRepositoryTag,
  {
    create: (sponsor: Sponsor) => Effect.Effect<Sponsor, DatabaseError, never>;
    findById: (
      id: string,
    ) => Effect.Effect<Sponsor | null, DatabaseError, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<Sponsor[], DatabaseError, never>;
    findActive: () => Effect.Effect<Sponsor[], DatabaseError, never>;
    findByTripId: (
      tripId: string,
    ) => Effect.Effect<Sponsor[], DatabaseError, never>;
    update: (sponsor: Sponsor) => Effect.Effect<Sponsor, DatabaseError, never>;
    delete: (id: string) => Effect.Effect<void, DatabaseError, never>;
    exists: (id: string) => Effect.Effect<boolean, DatabaseError, never>;
    isLinkedToTrip: (
      sponsorId: string,
      tripId: string,
    ) => Effect.Effect<boolean, DatabaseError, never>;
    linkToTrip: (
      sponsorId: string,
      tripId: string,
    ) => Effect.Effect<void, DatabaseError, never>;
    unlinkFromTrip: (
      sponsorId: string,
      tripId: string,
    ) => Effect.Effect<void, DatabaseError, never>;
  }
>() {}
