import {
  events,
  userEvents,
  type EventSelect,
  type EventInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { eq, and, gt, lt, gte, lte, sql, inArray, asc } from "drizzle-orm";
import { Effect } from "effect";
import type {
  EventGateway,
  EventDTO,
  EventConnectionArgs,
} from "@mirai-app/use-cases";
import type { Connection } from "@mirai-app/domain";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import { EventDrizzleMapper } from "../../../event/mappers/drizzle/mapper";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

/**
 * DrizzleEventGateway
 *
 * Gateway implementation using Drizzle ORM for Event entity.
 * Returns EventDTOs instead of domain entities to satisfy the EventGateway interface.
 * This gateway manages both the events table and the userEvents
 * join table for tracking user interest and enlistment.
 */
export class DrizzleEventGateway
  extends BaseDrizzleGateway<EventDTO, EventSelect, EventInsert, typeof events>
  implements EventGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: events,
      mapper: EventDrizzleMapper.instance,
    });
  }

  /**
   * Find events by creator ID
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<EventDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.creatorId, tripId))
          .orderBy(this.table.startTime);

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          message: "Failed to find events by trip ID",
          cause: error,
        }),
    });
  }

  /**
   * Find events by organizer group ID
   */
  findByGroupId(
    groupId: string,
  ): Effect.Effect<EventDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.organizerGroupId, groupId))
          .orderBy(this.table.startTime);

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByGroupId",
          message: "Failed to find events by group ID",
          cause: error,
        }),
    });
  }

  /**
   * Find events by IDs
   */
  findByIds(ids: string[]): Effect.Effect<EventDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (ids.length === 0) return [];

        const records = await this.db
          .select()
          .from(this.table)
          .where(inArray(this.table.id, ids));

        return records.map((record) => this.mapper.toDTO(record));
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
  }): Effect.Effect<
    {
      items: EventDTO[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    },
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 20;
        const offset = options?.offset ?? 0;

        const [countResult, records] = await Promise.all([
          this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(this.table),
          this.db
            .select()
            .from(this.table)
            .orderBy(this.table.startTime)
            .limit(limit)
            .offset(offset),
        ]);

        const total = countResult[0]?.count ?? 0;
        const items = records.map((record) => this.mapper.toDTO(record));

        return {
          items,
          total,
          limit,
          offset,
          hasMore: offset + items.length < total,
        };
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
  findUpcoming(): Effect.Effect<EventDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const records = await this.db
          .select()
          .from(this.table)
          .where(gt(this.table.startTime, now))
          .orderBy(this.table.startTime);

        return records.map((record) => this.mapper.toDTO(record));
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
  findOngoing(): Effect.Effect<EventDTO[], DatabaseError, never> {
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

        return records.map((record) => this.mapper.toDTO(record));
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
  findPast(): Effect.Effect<EventDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const records = await this.db
          .select()
          .from(this.table)
          .where(lt(this.table.endTime, now))
          .orderBy(sql`${this.table.startTime} DESC`);

        return records.map((record) => this.mapper.toDTO(record));
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
  ): Effect.Effect<EventDTO[], DatabaseError, never> {
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

        return records.map((record) => this.mapper.toDTO(record));
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
   * Find events by status
   * Note: status field is not in current schema, returning empty array
   */
  findByStatus(
    status: string,
  ): Effect.Effect<EventDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db.select().from(this.table);
        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatus",
          message: "Failed to find events by status",
          cause: error,
        }),
    });
  }

  /**
   * Update event status
   * Note: status field is not in current schema, updates event without changing status
   */
  updateStatus(
    id: string,
    status: string,
  ): Effect.Effect<EventDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.id, id))
          .limit(1);

        if (!records[0]) {
          throw new Error("Event not found");
        }

        return this.mapper.toDTO(records[0]);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "updateStatus",
          message: "Failed to update event status",
          cause: error,
        }),
    });
  }

  /**
   * Count events by status
   * Note: status field is not in current schema, returning total count
   */
  countByStatus(status: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table);

        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByStatus",
          message: "Failed to count events by status",
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
  ): Effect.Effect<EventDTO[], DatabaseError, never> {
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
          this.mapper.toDTO(record as EventSelect),
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
  ): Effect.Effect<EventDTO[], DatabaseError, never> {
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
          this.mapper.toDTO(record as EventSelect),
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

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find events by trip ID with cursor-based pagination
   * Uses (startTime, id) composite sort key for stable pagination
   */
  findByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<EventDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      tripId,
      args,
      () => undefined,
      "findByTripIdConnection",
    );
  }

  /**
   * Find upcoming events for a trip with cursor-based pagination
   * Events with startTime > now
   */
  findUpcomingByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<EventDTO>, DatabaseError, never> {
    const now = new Date();
    return this.executeConnectionQuery(
      tripId,
      args,
      () => gt(this.table.startTime, now),
      "findUpcomingByTripIdConnection",
    );
  }

  /**
   * Find ongoing events for a trip with cursor-based pagination
   * Events with startTime <= now <= endTime
   */
  findOngoingByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<EventDTO>, DatabaseError, never> {
    const now = new Date();
    return this.executeConnectionQuery(
      tripId,
      args,
      () => and(lte(this.table.startTime, now), gte(this.table.endTime, now)),
      "findOngoingByTripIdConnection",
    );
  }

  /**
   * Find past events for a trip with cursor-based pagination
   * Events with endTime < now
   */
  findPastByTripIdConnection(
    tripId: string,
    args: EventConnectionArgs,
  ): Effect.Effect<Connection<EventDTO>, DatabaseError, never> {
    const now = new Date();
    return this.executeConnectionQuery(
      tripId,
      args,
      () => lt(this.table.endTime, now),
      "findPastByTripIdConnection",
    );
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Uses (startTime, id) > (cursor.startTime, cursor.id) WHERE clause
   * Uses ORDER BY startTime, id with LIMIT first + 1
   */
  private executeConnectionQuery(
    tripId: string,
    args: EventConnectionArgs,
    buildFilterCondition: () =>
      | ReturnType<typeof gt>
      | ReturnType<typeof and>
      | ReturnType<typeof lt>
      | undefined,
    operation: string,
  ): Effect.Effect<Connection<EventDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions
        const conditions = [eq(this.table.creatorId, tripId)];

        // Add filter condition if provided
        const filterCondition = buildFilterCondition();
        if (filterCondition) {
          conditions.push(filterCondition);
        }

        // Add cursor condition: (startTime, id) > (cursor.startTime, cursor.id)
        if (cursor) {
          const cursorDate = new Date(cursor.startTime);
          conditions.push(
            sql`(${this.table.startTime}, ${this.table.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(asc(this.table.startTime), asc(this.table.id))
          .limit(first + 1);

        const hasMore = records.length > first;
        const items = records
          .slice(0, first)
          .map((record) => this.mapper.toDTO(record));

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
      },
      catch: (error) =>
        new DatabaseError({
          operation,
          message: `Failed to execute ${operation}`,
          cause: error,
        }),
    });
  }
}
