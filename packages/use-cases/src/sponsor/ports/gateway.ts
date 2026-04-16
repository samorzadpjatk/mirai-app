import type { SponsorId, Connection } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { PaginationOptions } from "../../system/shared/dto";
import type {
  SponsorDTO,
  TripSponsorDTO,
  SponsorPaginatedResult,
} from "../dto";
import type { DatabaseError } from "./errors";

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
 * This interface defines what operations the application needs
 * from any sponsor gateway implementation.
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleSponsorGateway: Uses Drizzle ORM
 * - InMemorySponsorGateway: For testing
 */
export interface SponsorGateway {
  /**
   * Create a new sponsor
   */
  create(sponsor: SponsorDTO): Effect.Effect<SponsorDTO, DatabaseError, never>;

  /**
   * Find sponsor by ID
   * @returns SponsorDTO or null if not found
   */
  findById(
    id: SponsorId,
  ): Effect.Effect<SponsorDTO | null, DatabaseError, never>;

  /**
   * Find all sponsors with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<SponsorPaginatedResult, DatabaseError, never>;

  /**
   * Update sponsor
   */
  update(sponsor: SponsorDTO): Effect.Effect<SponsorDTO, DatabaseError, never>;

  /**
   * Delete sponsor
   */
  delete(id: SponsorId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if sponsor exists
   */
  exists(id: SponsorId): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Link sponsor to a trip
   */
  linkToTrip(
    tripId: string,
    sponsorId: SponsorId,
    tier: string,
  ): Effect.Effect<TripSponsorDTO, DatabaseError, never>;

  /**
   * Unlink sponsor from a trip
   */
  unlinkFromTrip(
    tripId: string,
    sponsorId: SponsorId,
  ): Effect.Effect<void, DatabaseError, never>;

  /**
   * Find all active sponsors with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findActiveConnection(
    args: SponsorConnectionArgs,
  ): Effect.Effect<Connection<SponsorDTO>, DatabaseError, never>;

  /**
   * Find sponsors by trip ID with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findByTripIdConnection(
    tripId: string,
    args: SponsorConnectionArgs,
  ): Effect.Effect<Connection<TripSponsorDTO>, DatabaseError, never>;
}

/**
 * SponsorGateway Context.Tag for Effect dependency injection
 */
export class SponsorGatewayTag extends Context.Tag("SponsorGateway")<
  SponsorGatewayTag,
  SponsorGateway
>() {}
