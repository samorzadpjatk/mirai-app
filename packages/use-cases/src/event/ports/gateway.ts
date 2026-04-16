import { Context, Effect } from "effect";
import type { DatabaseError } from "@mirai-app/domain";
import type { PaginationOptions } from "../../system/shared/dto";
import type { EventDTO, EventPaginatedResult } from "../dto";

/**
 * EventGateway Port
 *
 * This interface defines what operations the application needs
 * from any event gateway implementation.
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleEventGateway: Uses Drizzle ORM
 * - InMemoryEventGateway: For testing
 */
export interface EventGateway {
  /**
   * Create a new event
   */
  create(event: EventDTO): Effect.Effect<EventDTO, DatabaseError, never>;

  /**
   * Find event by ID
   * @returns EventDTO or null if not found
   */
  findById(id: string): Effect.Effect<EventDTO | null, DatabaseError, never>;

  /**
   * Find events by trip ID
   */
  findByTripId(tripId: string): Effect.Effect<EventDTO[], DatabaseError, never>;

  /**
   * Find events by status
   */
  findByStatus(status: string): Effect.Effect<EventDTO[], DatabaseError, never>;

  /**
   * Find upcoming events
   */
  findUpcoming(): Effect.Effect<EventDTO[], DatabaseError, never>;

  /**
   * Find ongoing events
   */
  findOngoing(): Effect.Effect<EventDTO[], DatabaseError, never>;

  /**
   * Find past events
   */
  findPast(): Effect.Effect<EventDTO[], DatabaseError, never>;

  /**
   * Find all events with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<EventPaginatedResult, DatabaseError, never>;

  /**
   * Update event
   */
  update(event: EventDTO): Effect.Effect<EventDTO, DatabaseError, never>;

  /**
   * Update event status
   */
  updateStatus(
    id: string,
    status: string,
  ): Effect.Effect<EventDTO, DatabaseError, never>;

  /**
   * Delete event
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if event exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count events by status
   */
  countByStatus(status: string): Effect.Effect<number, DatabaseError, never>;
}

/**
 * EventGateway Context.Tag for Effect dependency injection
 */
export class EventGatewayTag extends Context.Tag("EventGateway")<
  EventGatewayTag,
  EventGateway
>() {}
