import type { Event } from "../entities/Event";
import type { Effect } from "effect";
import type { DatabaseError } from "./DatabaseError";

/**
 * EventRepository Port
 *
 * This interface defines what operations the application needs
 * from any event repository implementation.
 */
export interface EventRepository {
  /**
   * Create a new event
   */
  create(event: Event): Effect.Effect<Event, DatabaseError, never>;

  /**
   * Find event by ID
   * @returns Event or null if not found
   */
  findById(id: string): Effect.Effect<Event | null, DatabaseError, never>;

  /**
   * Find events by trip ID
   */
  findByTripId(tripId: string): Effect.Effect<Event[], DatabaseError, never>;

  /**
   * Find upcoming events for a trip
   */
  findUpcomingByTripId(
    tripId: string,
  ): Effect.Effect<Event[], DatabaseError, never>;

  /**
   * Find ongoing events for a trip
   */
  findOngoingByTripId(
    tripId: string,
  ): Effect.Effect<Event[], DatabaseError, never>;

  /**
   * Find past events for a trip
   */
  findPastByTripId(
    tripId: string,
  ): Effect.Effect<Event[], DatabaseError, never>;

  /**
   * Update event
   */
  update(event: Event): Effect.Effect<Event, DatabaseError, never>;

  /**
   * Delete event
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if event exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;
}
