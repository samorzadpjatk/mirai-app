import type { Event } from "@mirai-app/domain";
import { Context, Effect } from "effect";

/**
 * EventRepository Port
 *
 * This interface defines what operations the application needs
 * from any event repository implementation.
 *
 * Events represent trip-level activities that users can express interest in
 * or enlist for. Events can be organized by groups or created independently.
 *
 * Implementations (in adapters layer):
 * - PrismaEventRepository: Uses Prisma ORM
 * - DrizzleEventRepository: Uses Drizzle ORM (Phase 1 migration)
 * - InMemoryEventRepository: For testing
 */
export interface EventRepository {
  /**
   * Create a new event
   */
  create(event: Event): Effect.Effect<Event, never, never>;

  /**
   * Find event by ID
   * @returns Event or null if not found
   */
  findById(id: string): Effect.Effect<Event | null, never, never>;

  /**
   * Find events by creator ID
   */
  findByCreatorId(creatorId: string): Effect.Effect<Event[], never, never>;

  /**
   * Find events by organizer group ID
   */
  findByOrganizerGroupId(groupId: string): Effect.Effect<Event[], never, never>;

  /**
   * Find events by IDs
   */
  findByIds(ids: string[]): Effect.Effect<Event[], never, never>;

  /**
   * Find all events with optional pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: { column: string; direction: "asc" | "desc" };
  }): Effect.Effect<Event[], never, never>;

  /**
   * Find upcoming events (startTime > now)
   */
  findUpcoming(): Effect.Effect<Event[], never, never>;

  /**
   * Find ongoing events (startTime <= now <= endTime)
   */
  findOngoing(): Effect.Effect<Event[], never, never>;

  /**
   * Find past events (endTime < now)
   */
  findPast(): Effect.Effect<Event[], never, never>;

  /**
   * Find events starting within a time range
   */
  findStartingBetween(
    start: Date,
    end: Date,
  ): Effect.Effect<Event[], never, never>;

  /**
   * Update event
   */
  update(event: Event): Effect.Effect<Event, never, never>;

  /**
   * Delete event
   */
  delete(id: string): Effect.Effect<void, never, never>;

  /**
   * Check if event exists
   */
  exists(id: string): Effect.Effect<boolean, never, never>;

  /**
   * Count total events
   */
  count(): Effect.Effect<number, never, never>;

  /**
   * Count events by organizer group ID
   */
  countByOrganizerGroupId(groupId: string): Effect.Effect<number, never, never>;

  // ============================================================
  // User Event Operations (Interest/Enlistment)
  // ============================================================

  /**
   * Mark a user as interested in an event
   */
  markInterested(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, never, never>;

  /**
   * Mark a user as enlisted in an event
   */
  markEnlisted(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, never, never>;

  /**
   * Remove a user's interest in an event
   */
  removeInterest(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, never, never>;

  /**
   * Remove a user's enlistment from an event
   */
  removeEnlistment(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, never, never>;

  /**
   * Check if user is interested in event
   */
  isInterested(
    userId: string,
    eventId: string,
  ): Effect.Effect<boolean, never, never>;

  /**
   * Check if user is enlisted in event
   */
  isEnlisted(
    userId: string,
    eventId: string,
  ): Effect.Effect<boolean, never, never>;

  /**
   * Get interested users for an event
   */
  getInterestedUsers(eventId: string): Effect.Effect<string[], never, never>;

  /**
   * Get enlisted users for an event
   */
  getEnlistedUsers(eventId: string): Effect.Effect<string[], never, never>;

  /**
   * Get events a user is interested in
   */
  getInterestedEventsForUser(
    userId: string,
  ): Effect.Effect<Event[], never, never>;

  /**
   * Get events a user is enlisted in
   */
  getEnlistedEventsForUser(
    userId: string,
  ): Effect.Effect<Event[], never, never>;

  /**
   * Count interested users for an event
   */
  countInterested(eventId: string): Effect.Effect<number, never, never>;

  /**
   * Count enlisted users for an event
   */
  countEnlisted(eventId: string): Effect.Effect<number, never, never>;
}

/**
 * EventRepository Context.Tag for Effect dependency injection
 */
export class EventRepositoryTag extends Context.Tag("EventRepository")<
  EventRepositoryTag,
  {
    create: (event: Event) => Effect.Effect<Event, never, never>;
    findById: (id: string) => Effect.Effect<Event | null, never, never>;
    findByCreatorId: (
      creatorId: string,
    ) => Effect.Effect<Event[], never, never>;
    findByOrganizerGroupId: (
      groupId: string,
    ) => Effect.Effect<Event[], never, never>;
    findByIds: (ids: string[]) => Effect.Effect<Event[], never, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
      orderBy?: { column: string; direction: "asc" | "desc" };
    }) => Effect.Effect<Event[], never, never>;
    findUpcoming: () => Effect.Effect<Event[], never, never>;
    findOngoing: () => Effect.Effect<Event[], never, never>;
    findPast: () => Effect.Effect<Event[], never, never>;
    findStartingBetween: (
      start: Date,
      end: Date,
    ) => Effect.Effect<Event[], never, never>;
    update: (event: Event) => Effect.Effect<Event, never, never>;
    delete: (id: string) => Effect.Effect<void, never, never>;
    exists: (id: string) => Effect.Effect<boolean, never, never>;
    count: () => Effect.Effect<number, never, never>;
    countByOrganizerGroupId: (
      groupId: string,
    ) => Effect.Effect<number, never, never>;
    markInterested: (
      userId: string,
      eventId: string,
    ) => Effect.Effect<void, never, never>;
    markEnlisted: (
      userId: string,
      eventId: string,
    ) => Effect.Effect<void, never, never>;
    removeInterest: (
      userId: string,
      eventId: string,
    ) => Effect.Effect<void, never, never>;
    removeEnlistment: (
      userId: string,
      eventId: string,
    ) => Effect.Effect<void, never, never>;
    isInterested: (
      userId: string,
      eventId: string,
    ) => Effect.Effect<boolean, never, never>;
    isEnlisted: (
      userId: string,
      eventId: string,
    ) => Effect.Effect<boolean, never, never>;
    getInterestedUsers: (
      eventId: string,
    ) => Effect.Effect<string[], never, never>;
    getEnlistedUsers: (
      eventId: string,
    ) => Effect.Effect<string[], never, never>;
    getInterestedEventsForUser: (
      userId: string,
    ) => Effect.Effect<Event[], never, never>;
    getEnlistedEventsForUser: (
      userId: string,
    ) => Effect.Effect<Event[], never, never>;
    countInterested: (eventId: string) => Effect.Effect<number, never, never>;
    countEnlisted: (eventId: string) => Effect.Effect<number, never, never>;
  }
>() {}
