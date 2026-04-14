import { sql, eq, and, inArray, desc } from "drizzle-orm";
import {
  activityFeed,
  activityReactions,
  type ActivityFeedSelect,
  type ActivityFeedInsert,
  type ActivityReactionSelect,
  type ActivityReactionInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import {
  ActivityFeed,
  ActivityReaction,
  type ActivityId,
} from "@mirai-app/domain";
import type { ActivityFeedRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../base/repository";
import {
  ActivityFeedDrizzleMapper,
  ActivityReactionDrizzleMapper,
} from "../../mappers/drizzle/activity-feed";
import { DatabaseError } from "@mirai-app/use-cases/ports/errors";

/**
 * DrizzleActivityFeedRepository
 *
 * Repository implementation using Drizzle ORM for ActivityFeed entity.
 */
export class DrizzleActivityFeedRepository
  extends BaseDrizzleRepository<
    ActivityFeed,
    ActivityFeedSelect,
    ActivityFeedInsert,
    typeof activityFeed
  >
  implements ActivityFeedRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: activityFeed,
      mapper: ActivityFeedDrizzleMapper.instance,
    });
  }

  // Override base class methods to match interface error types
  override create(
    entity: ActivityFeed,
  ): Effect.Effect<ActivityFeed, DatabaseError, never> {
    return super.create(entity);
  }

  override findById(
    id: ActivityId,
  ): Effect.Effect<ActivityFeed | null, DatabaseError, never> {
    return super.findById(id);
  }

  override update(
    entity: ActivityFeed & { id: string },
  ): Effect.Effect<ActivityFeed, DatabaseError, never> {
    return super.update(entity);
  }

  override delete(id: ActivityId): Effect.Effect<void, DatabaseError, never> {
    return super.delete(id);
  }

  override exists(
    id: ActivityId,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return super.exists(id);
  }

  findByTripId(
    tripId: string,
    options?: {
      limit?: number;
      cursor?: { id: string; createdAt: Date; isPinned: boolean } | null;
      includeHidden?: boolean;
    },
  ): Effect.Effect<
    {
      activities: ActivityFeed[];
      nextCursor: { id: string; createdAt: Date; isPinned: boolean } | null;
      hasMore: boolean;
    },
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 20;
        const cursor = options?.cursor;
        const includeHidden = options?.includeHidden ?? false;

        let conditions = [eq(this.table.tripId, tripId)];

        if (!includeHidden) {
          conditions.push(eq(this.table.isHidden, false));
        }

        if (cursor) {
          conditions.push(
            sql`(${this.table.isPinned}, ${this.table.createdAt}, ${this.table.id}) <= (${cursor.isPinned}, ${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.isPinned), desc(this.table.createdAt))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const activities = records
          .slice(0, limit)
          .map((r) => this.mapper.toDomain(r));

        const lastRecord = records[limit - 1];
        const nextCursor =
          hasMore && lastRecord
            ? {
                id: lastRecord.id,
                createdAt: lastRecord.createdAt,
                isPinned: lastRecord.isPinned,
              }
            : null;

        return {
          activities,
          nextCursor,
          hasMore,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          message: "Failed to find activities by trip ID",
          cause: error,
        }),
    });
  }

  findByTripIdPaged(
    tripId: string,
    options: {
      page: number;
      pageSize: number;
      includeHidden?: boolean;
    },
  ): Effect.Effect<
    {
      activities: ActivityFeed[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      hasMore: boolean;
    },
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const { page, pageSize, includeHidden = false } = options;
        const offset = (page - 1) * pageSize;

        const conditions = [eq(this.table.tripId, tripId)];
        if (!includeHidden) {
          conditions.push(eq(this.table.isHidden, false));
        }

        const countResult = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(and(...conditions));
        const total = countResult[0]?.count ?? 0;

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.isPinned), desc(this.table.createdAt))
          .limit(pageSize)
          .offset(offset);

        const totalPages = Math.ceil(total / pageSize);
        const hasMore = page < totalPages;

        return {
          activities: records.map((r) => this.mapper.toDomain(r)),
          total,
          page,
          pageSize,
          totalPages,
          hasMore,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdPaged",
          message: "Failed to find activities by trip ID with pagination",
          cause: error,
        }),
    });
  }

  findReactionsByActivityId(
    activityId: ActivityId,
  ): Effect.Effect<ActivityReaction[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(activityReactions)
          .where(eq(activityReactions.activityId, activityId));
        return records.map((r) =>
          ActivityReactionDrizzleMapper.instance.toDomain(r),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findReactionsByActivityId",
          message: "Failed to find reactions by activity ID",
          cause: error,
        }),
    });
  }

  findUserReactions(
    activityId: ActivityId,
    userId: string,
  ): Effect.Effect<ActivityReaction[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(activityReactions)
          .where(
            and(
              eq(activityReactions.activityId, activityId),
              eq(activityReactions.userId, userId),
            ),
          );
        return records.map((r) =>
          ActivityReactionDrizzleMapper.instance.toDomain(r),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findUserReactions",
          message: "Failed to find user reactions",
          cause: error,
        }),
    });
  }

  getReactionCounts(activityId: ActivityId): Effect.Effect<
    {
      total: number;
      counts: { heart: number; fire: number; clap: number; star: number };
    },
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({
            reactionType: activityReactions.reactionType,
            count: sql<number>`count(*)::int`,
          })
          .from(activityReactions)
          .where(eq(activityReactions.activityId, activityId))
          .groupBy(activityReactions.reactionType);

        const counts = {
          heart: 0,
          fire: 0,
          clap: 0,
          star: 0,
        };

        for (const record of records) {
          const type = record.reactionType.toLowerCase();
          if (type === "heart") counts.heart = record.count;
          else if (type === "fire") counts.fire = record.count;
          else if (type === "clap") counts.clap = record.count;
          else if (type === "star") counts.star = record.count;
        }

        const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

        return { total, counts };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getReactionCounts",
          message: "Failed to get reaction counts",
          cause: error,
        }),
    });
  }

  findByTripIdAndType(
    tripId: string,
    activityType: string,
  ): Effect.Effect<ActivityFeed[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(
              eq(this.table.tripId, tripId),
              eq(this.table.activityType, activityType),
            ),
          )
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdAndType",
          message: "Failed to find activities by trip ID and type",
          cause: error,
        }),
    });
  }

  findPinnedByTripId(
    tripId: string,
  ): Effect.Effect<ActivityFeed[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(eq(this.table.tripId, tripId), eq(this.table.isPinned, true)),
          )
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findPinnedByTripId",
          message: "Failed to find pinned activities by trip ID",
          cause: error,
        }),
    });
  }

  findVisibleByTripId(
    tripId: string,
  ): Effect.Effect<ActivityFeed[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(eq(this.table.tripId, tripId), eq(this.table.isHidden, false)),
          )
          .orderBy(desc(this.table.createdAt));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findVisibleByTripId",
          message: "Failed to find visible activities by trip ID",
          cause: error,
        }),
    });
  }

  findByUserIds(
    userIds: string[],
  ): Effect.Effect<ActivityFeed[], never, never> {
    return Effect.succeed([]);
  }

  addReaction(
    reaction: ActivityReaction,
  ): Effect.Effect<ActivityReaction, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const insertData =
          ActivityReactionDrizzleMapper.instance.toDrizzleInsert(reaction);

        await this.db.insert(activityReactions).values(insertData);

        return reaction;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "addReaction",
          message: "Failed to add reaction",
          cause: error,
        }),
    });
  }

  removeReaction(
    activityId: string,
    userId: string,
    reactionType: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .delete(activityReactions)
          .where(
            and(
              eq(activityReactions.activityId, activityId),
              eq(activityReactions.userId, userId),
              eq(activityReactions.reactionType, reactionType),
            ),
          );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "removeReaction",
          message: "Failed to remove reaction",
          cause: error,
        }),
    });
  }

  getReactions(
    activityId: string,
  ): Effect.Effect<ActivityReaction[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(activityReactions)
          .where(eq(activityReactions.activityId, activityId));
        return records.map((r) =>
          ActivityReactionDrizzleMapper.instance.toDomain(r),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getReactions",
          message: "Failed to get reactions",
          cause: error,
        }),
    });
  }

  pinActivity(id: string): Effect.Effect<ActivityFeed, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({ isPinned: true, updatedAt: new Date() })
          .where(eq(this.table.id, id))
          .returning();
        if (!record) throw new Error(`Activity with id ${id} not found`);
        return this.mapper.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "pinActivity",
          message: `Failed to pin activity with id ${id}`,
          cause: error,
        }),
    });
  }

  unpinActivity(id: string): Effect.Effect<ActivityFeed, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({ isPinned: false, updatedAt: new Date() })
          .where(eq(this.table.id, id))
          .returning();
        if (!record) throw new Error(`Activity with id ${id} not found`);
        return this.mapper.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "unpinActivity",
          message: `Failed to unpin activity with id ${id}`,
          cause: error,
        }),
    });
  }

  hideActivity(
    id: string,
    hiddenByAdmin: string,
    reason?: string,
  ): Effect.Effect<ActivityFeed, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({
            isHidden: true,
            hiddenByAdmin,
            hiddenAt: new Date(),
            hiddenReason: reason ?? null,
            updatedAt: new Date(),
          })
          .where(eq(this.table.id, id))
          .returning();
        if (!record) throw new Error(`Activity with id ${id} not found`);
        return this.mapper.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "hideActivity",
          message: `Failed to hide activity with id ${id}`,
          cause: error,
        }),
    });
  }

  unhideActivity(
    id: string,
  ): Effect.Effect<ActivityFeed, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({
            isHidden: false,
            hiddenByAdmin: null,
            hiddenAt: null,
            hiddenReason: null,
            updatedAt: new Date(),
          })
          .where(eq(this.table.id, id))
          .returning();
        if (!record) throw new Error(`Activity with id ${id} not found`);
        return this.mapper.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "unhideActivity",
          message: `Failed to unhide activity with id ${id}`,
          cause: error,
        }),
    });
  }

  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.tripId, tripId));
        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByTripId",
          message: "Failed to count activities by trip ID",
          cause: error,
        }),
    });
  }
}
