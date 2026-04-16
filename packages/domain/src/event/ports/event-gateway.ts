import type { Event } from "../entities/event";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

/**
 * Cursor data for event pagination
 * Uses startTime as the primary sort field with id as tiebreaker
 */
export interface EventCursorData {
  id: string;
  startTime: string;
}

/**
 * Arguments for event connection pagination
 */
export interface EventConnectionArgs {
  first?: number;
  after?: EventCursorData | null;
}

/**
 * EventGateway Port
 *
 * This interface defines what operations the application needs
 * from any event gateway implementation.
 */
export interface EventGateway {
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
   * Find events by trip ID with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<Event>, DatabaseError, never>;

  /**
   * Find upcoming events for a trip with cursor-based pagination
   */
  findUpcomingByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<Event>, DatabaseError, never>;

  /**
   * Find ongoing events for a trip with cursor-based pagination
   */
  findOngoingByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<Event>, DatabaseError, never>;

  /**
   * Find past events for a trip with cursor-based pagination
   */
  findPastByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<Event>, DatabaseError, never>;

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
