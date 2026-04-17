import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
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
  findById(id: TripId): Effect.Effect<Trip | null, IPortError, never>;

  /**
   * Find all trips
   */
  findAll(): Effect.Effect<Trip[], IPortError, never>;

  /**
   * Find active trips at a given date
   */
  findActive(atDate: Date): Effect.Effect<Trip[], IPortError, never>;

  /**
   * Create new trip
   */
  create(trip: Trip): Effect.Effect<Trip, IPortError, never>;

  /**
   * Update existing trip
   */
  update(trip: Trip): Effect.Effect<Trip, IPortError, never>;

  /**
   * Delete trip by ID
   */
  delete(id: TripId): Effect.Effect<void, IPortError, never>;

  /**
   * Check if trip exists
   */
  exists(id: TripId): Effect.Effect<boolean, IPortError, never>;
}
