import type { EventDTO, EventConnectionArgs } from "@mirai-app/use-cases";
import type { EventGateway } from "@mirai-app/use-cases";
import { EventType, EventStatus } from "@mirai-app/use-cases";
import type { Connection } from "@mirai-app/domain";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import { Effect } from "effect";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";

/**
 * In-Memory Event Gateway for Testing
 *
 * Implements EventGateway port with in-memory storage.
 * Stores events and user-event relationships separately for efficient querying.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryEventGateway();
 * gateway.seed([mockEventDTO]);
 *
 * const found = await Effect.runPromise(gateway.findById("event-123"));
 * expect(found).not.toBeNull();
 *
 * gateway.reset(); // Clean up for next test
 * ```
 */
export class InMemoryEventGateway
  extends InMemoryGateway<EventDTO>
  implements EventGateway
{
  // Separate storage for user-event relationships
  private userEventsStorage = new Map<
    string,
    { interestedIn: boolean; enlistedIn: boolean }
  >();

  private getUserEventKey(userId: string, eventId: string): string {
    return `${userId}:${eventId}`;
  }

  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      super.reset();
      this.userEventsStorage.clear();
    });
  }

  create(event: EventDTO): Effect.Effect<EventDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(event.id, event);
      return event;
    });
  }

  findById(id: string): Effect.Effect<EventDTO | null, never, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findByTripId(tripId: string): Effect.Effect<EventDTO[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((e) => e.tripId === tripId),
    );
  }

  findByGroupId(groupId: string): Effect.Effect<EventDTO[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((e) => e.groupId === groupId),
    );
  }

  findByIds(ids: string[]): Effect.Effect<EventDTO[], never, never> {
    const idSet = new Set(ids);
    return Effect.succeed(this.getAllItems().filter((e) => idSet.has(e.id)));
  }

  findByStatus(status: string): Effect.Effect<EventDTO[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((e) => e.status === status),
    );
  }

  findAll(options?: { limit?: number; offset?: number }): Effect.Effect<
    {
      items: EventDTO[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    },
    never,
    never
  > {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;
    let items = this.getAllItems();
    const total = items.length;

    // Apply offset
    if (options?.offset) {
      items = items.slice(options.offset);
    }

    // Apply limit
    if (options?.limit !== undefined) {
      items = items.slice(0, options.limit);
    }

    return Effect.succeed({
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    });
  }

  findUpcoming(): Effect.Effect<EventDTO[], never, never> {
    const now = new Date();
    return Effect.succeed(this.getAllItems().filter((e) => e.startTime > now));
  }

  findOngoing(): Effect.Effect<EventDTO[], never, never> {
    const now = new Date();
    return Effect.succeed(
      this.getAllItems().filter(
        (e) => e.startTime <= now && (e.endTime ?? now) >= now,
      ),
    );
  }

  findPast(): Effect.Effect<EventDTO[], never, never> {
    const now = new Date();
    return Effect.succeed(
      this.getAllItems().filter((e) => (e.endTime ?? e.startTime) < now),
    );
  }

  update(event: EventDTO): Effect.Effect<EventDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(event.id, event);
      return event;
    });
  }

  updateStatus(
    id: string,
    status: string,
  ): Effect.Effect<EventDTO, never, never> {
    return Effect.sync(() => {
      const existing = this.storage.get(id);
      if (!existing) {
        throw new Error("Event not found");
      }
      const updated: EventDTO = { ...existing, status: status as EventStatus };
      this.storage.set(id, updated);
      return updated;
    });
  }

  delete(id: string): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      // Clean up user-event relationships for this event
      for (const key of this.userEventsStorage.keys()) {
        if (key.endsWith(`:${id}`)) {
          this.userEventsStorage.delete(key);
        }
      }
      this.storage.delete(id);
    });
  }

  exists(id: string): Effect.Effect<boolean, never, never> {
    return Effect.succeed(this.storage.has(id));
  }

  countByStatus(status: string): Effect.Effect<number, never, never> {
    return Effect.succeed(
      this.getAllItems().filter((e) => e.status === status).length,
    );
  }

  // ============================================================
  // User Event Operations (Interest/Enlistment)
  // ============================================================

  markInterested(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      const key = this.getUserEventKey(userId, eventId);
      const existing = this.userEventsStorage.get(key);
      this.userEventsStorage.set(key, {
        interestedIn: true,
        enlistedIn: existing?.enlistedIn ?? false,
      });
    });
  }

  markEnlisted(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      const key = this.getUserEventKey(userId, eventId);
      const existing = this.userEventsStorage.get(key);
      this.userEventsStorage.set(key, {
        interestedIn: existing?.interestedIn ?? false,
        enlistedIn: true,
      });
    });
  }

  removeInterest(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      const key = this.getUserEventKey(userId, eventId);
      const existing = this.userEventsStorage.get(key);
      if (existing) {
        this.userEventsStorage.set(key, {
          ...existing,
          interestedIn: false,
        });
      }
    });
  }

  removeEnlistment(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      const key = this.getUserEventKey(userId, eventId);
      const existing = this.userEventsStorage.get(key);
      if (existing) {
        this.userEventsStorage.set(key, {
          ...existing,
          enlistedIn: false,
        });
      }
    });
  }

  isInterested(
    userId: string,
    eventId: string,
  ): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      this.userEventsStorage.get(this.getUserEventKey(userId, eventId))
        ?.interestedIn ?? false,
    );
  }

  isEnlisted(
    userId: string,
    eventId: string,
  ): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      this.userEventsStorage.get(this.getUserEventKey(userId, eventId))
        ?.enlistedIn ?? false,
    );
  }

  getInterestedUsers(eventId: string): Effect.Effect<string[], never, never> {
    return Effect.succeed(
      Array.from(this.userEventsStorage.entries())
        .filter(
          ([key, value]) => key.endsWith(`:${eventId}`) && value.interestedIn,
        )
        .map(([key]) => key.split(":")[0])
        .filter((id): id is string => id !== undefined),
    );
  }

  getEnlistedUsers(eventId: string): Effect.Effect<string[], never, never> {
    return Effect.succeed(
      Array.from(this.userEventsStorage.entries())
        .filter(
          ([key, value]) => key.endsWith(`:${eventId}`) && value.enlistedIn,
        )
        .map(([key]) => key.split(":")[0])
        .filter((id): id is string => id !== undefined),
    );
  }

  getInterestedEventsForUser(
    userId: string,
  ): Effect.Effect<EventDTO[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((e) => {
        const key = this.getUserEventKey(userId, e.id);
        return this.userEventsStorage.get(key)?.interestedIn ?? false;
      }),
    );
  }

  getEnlistedEventsForUser(
    userId: string,
  ): Effect.Effect<EventDTO[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((e) => {
        const key = this.getUserEventKey(userId, e.id);
        return this.userEventsStorage.get(key)?.enlistedIn ?? false;
      }),
    );
  }

  countInterested(eventId: string): Effect.Effect<number, never, never> {
    return Effect.succeed(
      Array.from(this.userEventsStorage.entries()).filter(
        ([key, value]) => key.endsWith(`:${eventId}`) && value.interestedIn,
      ).length,
    );
  }

  countEnlisted(eventId: string): Effect.Effect<number, never, never> {
    return Effect.succeed(
      Array.from(this.userEventsStorage.entries()).filter(
        ([key, value]) => key.endsWith(`:${eventId}`) && value.enlistedIn,
      ).length,
    );
  }

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find events by trip ID with cursor-based pagination
   * Sorts by startTime, then id, then slices
   */
  findByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<EventDTO>, never, never> {
    return this.executeConnectionQuery(tripId, args, () => true);
  }

  /**
   * Find upcoming events for a trip with cursor-based pagination
   * Events with startTime > now
   */
  findUpcomingByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<EventDTO>, never, never> {
    const now = new Date();
    return this.executeConnectionQuery(
      tripId,
      args,
      (event) => event.startTime > now,
    );
  }

  /**
   * Find ongoing events for a trip with cursor-based pagination
   * Events with startTime <= now <= endTime
   */
  findOngoingByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<EventDTO>, never, never> {
    const now = new Date();
    return this.executeConnectionQuery(
      tripId,
      args,
      (event) => event.startTime <= now && (event.endTime ?? now) >= now,
    );
  }

  /**
   * Find past events for a trip with cursor-based pagination
   * Events with endTime < now
   */
  findPastByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<EventDTO>, never, never> {
    const now = new Date();
    return this.executeConnectionQuery(
      tripId,
      args,
      (event) => (event.endTime ?? event.startTime) < now,
    );
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Sorts by startTime, then id, then slices
   */
  private executeConnectionQuery(
    tripId: string,
    args: EventConnectionArgs,
    filterFn: (event: EventDTO) => boolean,
  ): Effect.Effect<Connection<EventDTO>, never, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all events for the trip
      let events = this.getAllItems().filter(
        (e) => e.tripId === tripId && filterFn(e),
      );

      // Sort by startTime ascending, then by id as tiebreaker
      events.sort((a, b) => {
        const timeCompare = a.startTime.getTime() - b.startTime.getTime();
        if (timeCompare !== 0) return timeCompare;
        return a.id.localeCompare(b.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.startTime);
        startIndex = events.findIndex(
          (e) =>
            e.startTime > cursorDate ||
            (e.startTime.getTime() === cursorDate.getTime() &&
              e.id > cursor.id),
        );
        if (startIndex === -1) {
          startIndex = events.length;
        }
      }

      // Slice to get the page
      const items = events.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < events.length;

      // Build edges with cursors
      const edges = items.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.startTime.toISOString(),
          startTime: item.startTime.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: items,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    });
  }
}
