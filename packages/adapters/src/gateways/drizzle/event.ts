import {
  events,
  userEvents,
  type EventSelect,
  type EventInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { eq, and, gt, lt, gte, lte, sql, inArray } from "drizzle-orm";
import { Effect } from "effect";
import { Event } from "@mirai-app/domain";
import type { EventRepository } from "@mirai-app/domain/ports";
import { BaseDrizzleRepository } from "../base/repository";
import { EventDrizzleMapper } from "../../mappers/drizzle/event";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * DrizzleEventRepository
 *
 * Repository implementation using Drizzle ORM for Event entity.
 * This repository manages both the events table and the userEvents
 * join table for tracking user interest and enlistment.
 */
export class DrizzleEventRepository
  extends BaseDrizzleRepository<Event, EventSelect, EventInsert, typeof events>
  implements EventRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: events,
      mapper: EventDrizzleMapper.instance,
    });
  }

  // Override base class methods to match interface error types
  override create(event: Event): Effect.Effect<Event, DatabaseError, never> {
    return super.create(event);
  }

  override findById(
    id: string,
  ): Effect.Effect<Event | null, DatabaseError, never> {
    return super.findById(id);
  }

  override update(
    event: Event & { id: string },
  ): Effect.Effect<Event, DatabaseError, never> {
    return super.update(event);
  }

  override delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return super.delete(id);
  }

  override exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return super.exists(id);
  }

  /**
   * Find events by creator ID
   */
  findByCreatorId(
    creatorId: string,
  ): Effect.Effect<Event[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.creatorId, creatorId))
          .orderBy(this.table.startTime);

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByCreatorId",
          message: "Failed to find events by creator ID",
          cause: error,
        }),
    });
  }

  /**
   * Find events by organizer group ID
   */
  findByOrganizerGroupId(
    groupId: string,
  ): Effect.Effect<Event[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.organizerGroupId, groupId))
          .orderBy(this.table.startTime);

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByOrganizerGroupId",
          message: "Failed to find events by organizer group ID",
          cause: error,
        }),
    });
  }

  /**
   * Find events by IDs
   */
  findByIds(ids: string[]): Effect.Effect<Event[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (ids.length === 0) return [];

        const records = await this.db
          .select()
          .from(this.table)
          .where(inArray(this.table.id, ids));

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByIds",
          message: "Failed to find events by IDs",
          cause: error,
        }),
    });
  }

  /**
   * Find all events with pagination
   */
  override findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: { column: string; direction: "asc" | "desc" };
  }): Effect.Effect<Event[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const orderColumn = options?.orderBy?.column ?? "startTime";
        const orderDirection = options?.orderBy?.direction ?? "asc";

        const columnRef = (this.table as unknown as Record<string, unknown>)[
          orderColumn
        ];

        const buildQuery = () => {
          let query = this.db.select().from(this.table);

          if (columnRef) {
            query = query.orderBy(
              orderDirection === "asc"
                ? (columnRef as never)
                : sql`${columnRef as never} DESC`,
            ) as unknown as typeof query;
          }

          return query;
        };

        let query = buildQuery();

        if (options?.limit) {
          query = query.limit(options.limit) as unknown as typeof query;
        }
        if (options?.offset) {
          query = query.offset(options.offset) as unknown as typeof query;
        }

        const records = await query;
        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: "Failed to find events with pagination",
          cause: error,
        }),
    });
  }

  /**
   * Find upcoming events (startTime > now)
   */
  findUpcoming(): Effect.Effect<Event[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const records = await this.db
          .select()
          .from(this.table)
          .where(gt(this.table.startTime, now))
          .orderBy(this.table.startTime);

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findUpcoming",
          message: "Failed to find upcoming events",
          cause: error,
        }),
    });
  }

  /**
   * Find ongoing events (startTime <= now <= endTime)
   */
  findOngoing(): Effect.Effect<Event[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(lte(this.table.startTime, now), gte(this.table.endTime, now)),
          )
          .orderBy(this.table.startTime);

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findOngoing",
          message: "Failed to find ongoing events",
          cause: error,
        }),
    });
  }

  /**
   * Find past events (endTime < now)
   */
  findPast(): Effect.Effect<Event[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const records = await this.db
          .select()
          .from(this.table)
          .where(lt(this.table.endTime, now))
          .orderBy(sql`${this.table.startTime} DESC`);

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findPast",
          message: "Failed to find past events",
          cause: error,
        }),
    });
  }

  /**
   * Find events starting within a time range
   */
  findStartingBetween(
    start: Date,
    end: Date,
  ): Effect.Effect<Event[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(
              gte(this.table.startTime, start),
              lte(this.table.startTime, end),
            ),
          )
          .orderBy(this.table.startTime);

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findStartingBetween",
          message: "Failed to find events starting between dates",
          cause: error,
        }),
    });
  }

  /**
   * Count total events
   */
  count(): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table);

        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "count",
          message: "Failed to count events",
          cause: error,
        }),
    });
  }

  /**
   * Count events by organizer group ID
   */
  countByOrganizerGroupId(
    groupId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.organizerGroupId, groupId));

        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByOrganizerGroupId",
          message: "Failed to count events by organizer group ID",
          cause: error,
        }),
    });
  }

  /**
   * Mark a user as interested in an event
   */
  markInterested(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .insert(userEvents)
          .values({
            userId,
            eventId,
            interestedIn: true,
            enlistedIn: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [userEvents.userId, userEvents.eventId],
            set: { interestedIn: true, updatedAt: new Date() },
          });
      },
      catch: (error) =>
        new DatabaseError({
          operation: "markInterested",
          message: "Failed to mark user as interested",
          cause: error,
        }),
    });
  }

  /**
   * Mark a user as enlisted in an event
   */
  markEnlisted(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .insert(userEvents)
          .values({
            userId,
            eventId,
            interestedIn: false,
            enlistedIn: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [userEvents.userId, userEvents.eventId],
            set: { enlistedIn: true, updatedAt: new Date() },
          });
      },
      catch: (error) =>
        new DatabaseError({
          operation: "markEnlisted",
          message: "Failed to mark user as enlisted",
          cause: error,
        }),
    });
  }

  /**
   * Remove a user's interest in an event
   */
  removeInterest(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .update(userEvents)
          .set({ interestedIn: false, updatedAt: new Date() })
          .where(
            and(eq(userEvents.userId, userId), eq(userEvents.eventId, eventId)),
          );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "removeInterest",
          message: "Failed to remove user interest",
          cause: error,
        }),
    });
  }

  /**
   * Remove a user's enlistment from an event
   */
  removeEnlistment(
    userId: string,
    eventId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .update(userEvents)
          .set({ enlistedIn: false, updatedAt: new Date() })
          .where(
            and(eq(userEvents.userId, userId), eq(userEvents.eventId, eventId)),
          );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "removeEnlistment",
          message: "Failed to remove user enlistment",
          cause: error,
        }),
    });
  }

  /**
   * Check if user is interested in event
   */
  isInterested(
    userId: string,
    eventId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .select({ interestedIn: userEvents.interestedIn })
          .from(userEvents)
          .where(
            and(eq(userEvents.userId, userId), eq(userEvents.eventId, eventId)),
          )
          .limit(1);

        return record?.interestedIn ?? false;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "isInterested",
          message: "Failed to check if user is interested",
          cause: error,
        }),
    });
  }

  /**
   * Check if user is enlisted in event
   */
  isEnlisted(
    userId: string,
    eventId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .select({ enlistedIn: userEvents.enlistedIn })
          .from(userEvents)
          .where(
            and(eq(userEvents.userId, userId), eq(userEvents.eventId, eventId)),
          )
          .limit(1);

        return record?.enlistedIn ?? false;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "isEnlisted",
          message: "Failed to check if user is enlisted",
          cause: error,
        }),
    });
  }

  /**
   * Get interested users for an event
   */
  getInterestedUsers(
    eventId: string,
  ): Effect.Effect<string[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({ userId: userEvents.userId })
          .from(userEvents)
          .where(
            and(
              eq(userEvents.eventId, eventId),
              eq(userEvents.interestedIn, true),
            ),
          );

        return records.map((r) => r.userId);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getInterestedUsers",
          message: "Failed to get interested users",
          cause: error,
        }),
    });
  }

  /**
   * Get enlisted users for an event
   */
  getEnlistedUsers(
    eventId: string,
  ): Effect.Effect<string[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({ userId: userEvents.userId })
          .from(userEvents)
          .where(
            and(
              eq(userEvents.eventId, eventId),
              eq(userEvents.enlistedIn, true),
            ),
          );

        return records.map((r) => r.userId);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getEnlistedUsers",
          message: "Failed to get enlisted users",
          cause: error,
        }),
    });
  }

  /**
   * Get events a user is interested in
   */
  getInterestedEventsForUser(
    userId: string,
  ): Effect.Effect<Event[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({
            id: this.table.id,
            creatorId: this.table.creatorId,
            organizerGroupId: this.table.organizerGroupId,
            title: this.table.title,
            startTime: this.table.startTime,
            endTime: this.table.endTime,
            location: this.table.location,
            description: this.table.description,
            files: this.table.files,
            createdAt: this.table.createdAt,
            updatedAt: this.table.updatedAt,
          })
          .from(this.table)
          .innerJoin(userEvents, eq(this.table.id, userEvents.eventId))
          .where(
            and(
              eq(userEvents.userId, userId),
              eq(userEvents.interestedIn, true),
            ),
          )
          .orderBy(this.table.startTime);

        return records.map((record) =>
          this.mapper.toDomain(record as EventSelect),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getInterestedEventsForUser",
          message: "Failed to get interested events for user",
          cause: error,
        }),
    });
  }

  /**
   * Get events a user is enlisted in
   */
  getEnlistedEventsForUser(
    userId: string,
  ): Effect.Effect<Event[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({
            id: this.table.id,
            creatorId: this.table.creatorId,
            organizerGroupId: this.table.organizerGroupId,
            title: this.table.title,
            startTime: this.table.startTime,
            endTime: this.table.endTime,
            location: this.table.location,
            description: this.table.description,
            files: this.table.files,
            createdAt: this.table.createdAt,
            updatedAt: this.table.updatedAt,
          })
          .from(this.table)
          .innerJoin(userEvents, eq(this.table.id, userEvents.eventId))
          .where(
            and(eq(userEvents.userId, userId), eq(userEvents.enlistedIn, true)),
          )
          .orderBy(this.table.startTime);

        return records.map((record) =>
          this.mapper.toDomain(record as EventSelect),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getEnlistedEventsForUser",
          message: "Failed to get enlisted events for user",
          cause: error,
        }),
    });
  }

  /**
   * Count interested users for an event
   */
  countInterested(
    eventId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(userEvents)
          .where(
            and(
              eq(userEvents.eventId, eventId),
              eq(userEvents.interestedIn, true),
            ),
          );

        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countInterested",
          message: "Failed to count interested users",
          cause: error,
        }),
    });
  }

  /**
   * Count enlisted users for an event
   */
  countEnlisted(eventId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(userEvents)
          .where(
            and(
              eq(userEvents.eventId, eventId),
              eq(userEvents.enlistedIn, true),
            ),
          );

        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countEnlisted",
          message: "Failed to count enlisted users",
          cause: error,
        }),
    });
  }
}
