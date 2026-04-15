import type { Trip } from "../../entities/trip/Trip";
import type { TripStatus } from "../../enums/trip";
import type { Effect } from "effect";
import type { DatabaseError } from "../database-error";

/**
 * TripRepository Port
 *
 * This interface defines what operations the application needs
 * from any trip repository implementation.
 */
export interface TripRepository {
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
   * Find trips by status
   */
  findByStatus(status: TripStatus): Effect.Effect<Trip[], DatabaseError, never>;

  /**
   * Find active trips
   */
  findActive(): Effect.Effect<Trip[], DatabaseError, never>;

  /**
   * Find all trips with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Trip[], DatabaseError, never>;

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
