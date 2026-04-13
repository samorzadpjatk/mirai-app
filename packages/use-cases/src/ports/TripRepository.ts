import type { Trip, TripStatus } from "@mirai-app/domain";
import { Context, Effect } from "effect";

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
  create(trip: Trip): Effect.Effect<Trip, never, never>;

  /**
   * Find trip by ID
   * @returns Trip or null if not found
   */
  findById(id: string): Effect.Effect<Trip | null, never, never>;

  /**
   * Find trips by status
   */
  findByStatus(status: TripStatus): Effect.Effect<Trip[], never, never>;

  /**
   * Find active trips
   */
  findActive(): Effect.Effect<Trip[], never, never>;

  /**
   * Find all trips with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Trip[], never, never>;

  /**
   * Update trip
   */
  update(trip: Trip): Effect.Effect<Trip, never, never>;

  /**
   * Update trip status
   */
  updateStatus(
    id: string,
    status: TripStatus,
  ): Effect.Effect<Trip, never, never>;

  /**
   * Delete trip
   */
  delete(id: string): Effect.Effect<void, never, never>;

  /**
   * Check if trip exists
   */
  exists(id: string): Effect.Effect<boolean, never, never>;

  /**
   * Count trips by status
   */
  countByStatus(status: TripStatus): Effect.Effect<number, never, never>;
}

/**
 * TripRepository Context.Tag for Effect dependency injection
 */
export class TripRepositoryTag extends Context.Tag("TripRepository")<
  TripRepositoryTag,
  {
    create: (trip: Trip) => Effect.Effect<Trip, never, never>;
    findById: (id: string) => Effect.Effect<Trip | null, never, never>;
    findByStatus: (status: TripStatus) => Effect.Effect<Trip[], never, never>;
    findActive: () => Effect.Effect<Trip[], never, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<Trip[], never, never>;
    update: (trip: Trip) => Effect.Effect<Trip, never, never>;
    updateStatus: (
      id: string,
      status: TripStatus,
    ) => Effect.Effect<Trip, never, never>;
    delete: (id: string) => Effect.Effect<void, never, never>;
    exists: (id: string) => Effect.Effect<boolean, never, never>;
    countByStatus: (status: TripStatus) => Effect.Effect<number, never, never>;
  }
>() {}
