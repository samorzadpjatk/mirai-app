import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
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
  findById(id: SponsorId): Effect.Effect<Sponsor | null, IPortError, never>;

  /**
   * Find all sponsors
   */
  findAll(): Effect.Effect<Sponsor[], IPortError, never>;

  /**
   * Find active sponsors
   */
  findActive(): Effect.Effect<Sponsor[], IPortError, never>;

  /**
   * Create new sponsor
   */
  create(sponsor: Sponsor): Effect.Effect<Sponsor, IPortError, never>;

  /**
   * Update existing sponsor
   */
  update(sponsor: Sponsor): Effect.Effect<Sponsor, IPortError, never>;

  /**
   * Delete sponsor by ID
   */
  delete(id: SponsorId): Effect.Effect<void, IPortError, never>;

  /**
   * Check if sponsor exists
   */
  exists(id: SponsorId): Effect.Effect<boolean, IPortError, never>;
}
