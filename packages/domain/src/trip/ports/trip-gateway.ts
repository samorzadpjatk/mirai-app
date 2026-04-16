import type { Trip } from "../entities/trip";
import type { TripStatus } from "../../trip/enums";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

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
 */
export interface TripGateway {
  /**
   * Create a new trip
   */
  create(trip: Trip): Effect.Effect<Trip, DatabaseError, never>;

  /**
   * Find trip by ID
   * @returns Trip or null if not found
   */
  findById(id: string): Effect.Effect<Trip | null, DatabaseError, never>;

  /**
   * Find all trips with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findAllConnection(
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<Trip>, DatabaseError, never>;

  /**
   * Find trips by status with cursor-based pagination
   */
  findByStatusConnection(
    status: TripStatus,
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<Trip>, DatabaseError, never>;

  /**
   * Find active trips with cursor-based pagination
   */
  findActiveConnection(
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<Trip>, DatabaseError, never>;

  /**
   * Update trip
   */
  update(trip: Trip): Effect.Effect<Trip, DatabaseError, never>;

  /**
   * Update trip status
   */
  updateStatus(
    id: string,
    status: TripStatus,
  ): Effect.Effect<Trip, DatabaseError, never>;

  /**
   * Delete trip
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if trip exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count trips by status
   */
  countByStatus(
    status: TripStatus,
  ): Effect.Effect<number, DatabaseError, never>;
}
