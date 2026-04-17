import type { Effect } from "effect";
import type { DatabaseError } from "../../shared/errors/domain-errors";
import type { Trip } from "../entities/Trip";
import type { TripId } from "../value-objects/TripId";

/**
 * Trip Repository Port
 *
 * Defines the interface for trip persistence operations.
 */
export interface ITripPort {
  /**
   * Find trip by ID
   */
  findById(id: TripId): Effect.Effect<Trip | null, DatabaseError, never>;

  /**
   * Find all trips
   */
  findAll(): Effect.Effect<Trip[], DatabaseError, never>;

  /**
   * Find active trips at a given date
   */
  findActive(atDate: Date): Effect.Effect<Trip[], DatabaseError, never>;

  /**
   * Create new trip
   */
  create(trip: Trip): Effect.Effect<Trip, DatabaseError, never>;

  /**
   * Update existing trip
   */
  update(trip: Trip): Effect.Effect<Trip, DatabaseError, never>;

  /**
   * Delete trip by ID
   */
  delete(id: TripId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if trip exists
   */
  exists(id: TripId): Effect.Effect<boolean, DatabaseError, never>;
}
