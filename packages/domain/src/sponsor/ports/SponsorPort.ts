import type { Effect } from "effect";
import type { DatabaseError } from "../../shared/errors/domain-errors";
import type { Sponsor } from "../entities/Sponsor";
import type { SponsorId } from "../value-objects/SponsorId";

/**
 * Sponsor Repository Port
 *
 * Defines the interface for sponsor persistence operations.
 */
export interface ISponsorPort {
  /**
   * Find sponsor by ID
   */
  findById(id: SponsorId): Effect.Effect<Sponsor | null, DatabaseError, never>;

  /**
   * Find all sponsors
   */
  findAll(): Effect.Effect<Sponsor[], DatabaseError, never>;

  /**
   * Find active sponsors
   */
  findActive(): Effect.Effect<Sponsor[], DatabaseError, never>;

  /**
   * Create new sponsor
   */
  create(sponsor: Sponsor): Effect.Effect<Sponsor, DatabaseError, never>;

  /**
   * Update existing sponsor
   */
  update(sponsor: Sponsor): Effect.Effect<Sponsor, DatabaseError, never>;

  /**
   * Delete sponsor by ID
   */
  delete(id: SponsorId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if sponsor exists
   */
  exists(id: SponsorId): Effect.Effect<boolean, DatabaseError, never>;
}
