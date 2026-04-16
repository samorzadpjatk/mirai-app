import type { TripId, Connection, DatabaseError } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { PaginationOptions } from "../../system/shared/dto";
import type { TripDTO, TripPaginatedResult } from "../dto";

/**
 * Cursor data for trip pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface TripCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for trip connection pagination
 */
export interface TripConnectionArgs {
  first?: number;
  after?: TripCursorData | null;
}

/**
 * TripGateway Port
 *
 * This interface defines what operations the application needs
 * from any trip gateway implementation.
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleTripGateway: Uses Drizzle ORM
 * - InMemoryTripGateway: For testing
 */
export interface TripGateway {
  /**
   * Create a new trip
   */
  create(trip: TripDTO): Effect.Effect<TripDTO, DatabaseError, never>;

  /**
   * Find trip by ID
   * @returns TripDTO or null if not found
   */
  findById(id: TripId): Effect.Effect<TripDTO | null, DatabaseError, never>;

  /**
   * Find all trips with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findAllConnection(
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, DatabaseError, never>;

  /**
   * Find trips by status with cursor-based pagination
   */
  findByStatusConnection(
    status: string,
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, DatabaseError, never>;

  /**
   * Find active trips with cursor-based pagination
   */
  findActiveConnection(
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, DatabaseError, never>;

  /**
   * Update trip
   */
  update(trip: TripDTO): Effect.Effect<TripDTO, DatabaseError, never>;

  /**
   * Update trip status
   */
  updateStatus(
    id: TripId,
    status: string,
  ): Effect.Effect<TripDTO, DatabaseError, never>;

  /**
   * Delete trip
   */
  delete(id: TripId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if trip exists
   */
  exists(id: TripId): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count trips by status
   */
  countByStatus(status: string): Effect.Effect<number, DatabaseError, never>;
}

/**
 * TripGateway Context.Tag for Effect dependency injection
 */
export class TripGatewayTag extends Context.Tag("TripGateway")<
  TripGatewayTag,
  TripGateway
>() {}
