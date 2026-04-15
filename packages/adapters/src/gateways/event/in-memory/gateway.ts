import type { Event } from "@mirai-app/domain";
import type { EventRepository } from "@mirai-app/domain/ports";
import { Effect } from "effect";
import { InMemoryGateway } from "../_shared/in-memory-base";

/**
 * In-Memory Event Gateway for Testing
 *
 * Implements EventRepository port with in-memory storage.
 * Stores events and user-event relationships separately for efficient querying.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryEventGateway();
 * gateway.seed([mockEvent]);
 *
 * const found = await Effect.runPromise(gateway.findById("event-123"));
 * expect(found).not.toBeNull();
 *
 * gateway.reset(); // Clean up for next test
 * ```
 */
export class InMemoryEventGateway
  extends InMemoryGateway<Event>
  implements EventRepository
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

  create(event: Event): Effect.Effect<Event, never, never> {
    return Effect.sync(() => {
      this.storage.set(event.id, event);
      return event;
    });
  }

  findById(id: string): Effect.Effect<Event | null, never, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findByCreatorId(creatorId: string): Effect.Effect<Event[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((e) => e.creatorId === creatorId),
    );
  }

  findByOrganizerGroupId(
    groupId: string,
  ): Effect.Effect<Event[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((e) => e.organizerGroupId === groupId),
    );
  }

  findByIds(ids: string[]): Effect.Effect<Event[], never, never> {
    const idSet = new Set(ids);
    return Effect.succeed(this.getAllItems().filter((e) => idSet.has(e.id)));
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: { column: string; direction: "asc" | "desc" };
  }): Effect.Effect<Event[], never, never> {
    let items = this.getAllItems();

    // Sort if orderBy is specified
    if (options?.orderBy) {
      const { column, direction } = options.orderBy;
      items = [...items].sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[column];
        const bVal = (b as unknown as Record<string, unknown>)[column];
        if (aVal === undefined || bVal === undefined) return 0;
        if (aVal === null || bVal === null) return 0;
        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Apply offset
    if (options?.offset) {
      items = items.slice(options.offset);
    }

    // Apply limit
    if (options?.limit !== undefined) {
      items = items.slice(0, options.limit);
    }

    return Effect.succeed(items);
  }

  findUpcoming(): Effect.Effect<Event[], never, never> {
    const now = new Date();
    return Effect.succeed(this.getAllItems().filter((e) => e.startTime > now));
  }

  findOngoing(): Effect.Effect<Event[], never, never> {
    const now = new Date();
    return Effect.succeed(
      this.getAllItems().filter((e) => e.startTime <= now && e.endTime >= now),
    );
  }

  findPast(): Effect.Effect<Event[], never, never> {
    const now = new Date();
    return Effect.succeed(this.getAllItems().filter((e) => e.endTime < now));
  }

  findStartingBetween(
    start: Date,
    end: Date,
  ): Effect.Effect<Event[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (e) => e.startTime >= start && e.startTime <= end,
      ),
    );
  }

  update(event: Event): Effect.Effect<Event, never, never> {
    return Effect.sync(() => {
      this.storage.set(event.id, event);
      return event;
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

  count(): Effect.Effect<number, never, never> {
    return Effect.succeed(this.storage.size);
  }

  countByOrganizerGroupId(
    groupId: string,
  ): Effect.Effect<number, never, never> {
    return Effect.succeed(
      this.getAllItems().filter((e) => e.organizerGroupId === groupId).length,
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
  ): Effect.Effect<Event[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((e) => {
        const key = this.getUserEventKey(userId, e.id);
        return this.userEventsStorage.get(key)?.interestedIn ?? false;
      }),
    );
  }

  getEnlistedEventsForUser(
    userId: string,
  ): Effect.Effect<Event[], never, never> {
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
}
