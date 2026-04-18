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
   * Authorization via AuthContext (admin only)
   */
  create(sponsor: Sponsor): Effect.Effect<Sponsor, IPortError, unknown>;

  /**
   * Update existing sponsor
   * Authorization via AuthContext (admin only)
   */
  update(sponsor: Sponsor): Effect.Effect<Sponsor, IPortError, unknown>;

  /**
   * Delete sponsor by ID
   * Authorization via AuthContext (admin only)
   */
  delete(id: SponsorId): Effect.Effect<void, IPortError, unknown>;

  /**
   * Check if sponsor exists
   */
  exists(id: SponsorId): Effect.Effect<boolean, IPortError, never>;
}
