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
import { type ActivityId } from "@mirai-app/domain";
import type { ActivityFeedGateway } from "@mirai-app/use-cases";
import type {
  ActivityFeedDTO,
  ActivityReactionDTO,
  ActivityCursorResult,
  ActivityPagedResult,
} from "@mirai-app/use-cases";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { ActivityFeedDrizzleMapper } from "../../../activity/mappers/drizzle/mapper";
import { DatabaseError } from "../../../system/errors";
import { ActivityReactionDrizzleMapper } from "../../../activity/mappers/drizzle/mapper";

/**
 * DrizzleActivityFeedGateway
 *
 * Gateway implementation using Drizzle ORM for ActivityFeed entity.
 * Returns ActivityFeedDTOs instead of domain entities to satisfy the ActivityFeedGateway interface.
 */
export class DrizzleActivityFeedGateway
  extends BaseDrizzleGateway<
    ActivityFeedDTO,
    ActivityFeedSelect,
    ActivityFeedInsert,
    typeof activityFeed
  >
  implements ActivityFeedGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: activityFeed,
      mapper: ActivityFeedDrizzleMapper.instance,
    });
  }

  override findById(
    id: ActivityId,
  ): Effect.Effect<ActivityFeedDTO | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.id, id))
          .limit(1);
        const record = records[0];
        return record ? this.mapper.toDTO(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findById",
          message: `Failed to find activity by id ${id}`,
          cause: error,
        }),
    });
  }

  findByTripId(
    tripId: string,
    options?: {
      limit?: number;
      cursor?: { id: string; createdAt: Date; isPinned: boolean } | null;
      includeHidden?: boolean;
    },
  ): Effect.Effect<ActivityCursorResult, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 20;
        const cursor = options?.cursor;
        const includeHidden = options?.includeHidden ?? false;

        const conditions = [eq(this.table.tripId, tripId)];
        if (!includeHidden) {
          conditions.push(eq(this.table.isHidden, false));
        }

        // Get total count
        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(and(...conditions));

        const total = countResult?.count ?? 0;

        // Apply cursor if provided
        if (cursor) {
          conditions.push(
            sql`(${this.table.isPinned}, ${this.table.createdAt}, ${this.table.id}) < (${cursor.isPinned}, ${cursor.createdAt}, ${cursor.id})`,
          );
        }

        // Get paginated results
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.isPinned), desc(this.table.createdAt))
          .limit(limit + 1); // Get one extra to check hasMore

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        // Determine next cursor from the last item
        const lastItem = items[items.length - 1];
        const nextCursor =
          hasMore && lastItem
            ? {
                id: lastItem.id,
                createdAt: lastItem.createdAt,
                isPinned: lastItem.isPinned,
              }
            : null;

        return {
          items,
          nextCursor,
          hasMore,
          total,
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
  ): Effect.Effect<ActivityPagedResult, never, never> {
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
          items: records.map((r) => this.mapper.toDTO(r)),
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

  override create(
    dto: ActivityFeedDTO,
  ): Effect.Effect<ActivityFeedDTO, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const insertData = this.mapper.toDrizzleInsert(dto);
        const [record] = await this.db
          .insert(this.table)
          .values(insertData)
          .returning();

        if (!record) {
          throw new Error("Failed to create activity: no record returned");
        }

        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "create",
          message: "Failed to create activity",
          cause: error,
        }),
    });
  }

  override update(
    dto: ActivityFeedDTO,
  ): Effect.Effect<ActivityFeedDTO, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const updateData = this.mapper.toDrizzleUpdate(dto);
        const [record] = await this.db
          .update(this.table)
          .set(updateData)
          .where(eq(this.table.id, dto.id))
          .returning();

        if (!record) {
          throw new Error(`Failed to update activity with id ${dto.id}`);
        }

        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "update",
          message: `Failed to update activity with id ${dto.id}`,
          cause: error,
        }),
    });
  }

  override delete(id: ActivityId): Effect.Effect<void, never, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db.delete(this.table).where(eq(this.table.id, id));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "delete",
          message: `Failed to delete activity with id ${id}`,
          cause: error,
        }),
    });
  }

  override exists(id: ActivityId): Effect.Effect<boolean, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ id: this.table.id })
          .from(this.table)
          .where(eq(this.table.id, id))
          .limit(1);
        return !!result;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "exists",
          message: `Failed to check activity existence for id ${id}`,
          cause: error,
        }),
    });
  }

  findReactionsByActivityId(
    activityId: ActivityId,
  ): Effect.Effect<ActivityReactionDTO[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(activityReactions)
          .where(eq(activityReactions.activityId, activityId));
        return records.map((r) =>
          ActivityReactionDrizzleMapper.instance.toDTO(r),
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
  ): Effect.Effect<ActivityReactionDTO[], never, never> {
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
          ActivityReactionDrizzleMapper.instance.toDTO(r),
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

  addReaction(
    dto: ActivityReactionDTO,
  ): Effect.Effect<ActivityReactionDTO, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const insertData =
          ActivityReactionDrizzleMapper.instance.toDrizzleInsert(dto);
        const [record] = await this.db
          .insert(activityReactions)
          .values(insertData)
          .returning();

        if (!record) {
          throw new Error("Failed to create reaction: no record returned");
        }

        return ActivityReactionDrizzleMapper.instance.toDTO(record);
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
    activityId: ActivityId,
    userId: string,
    reactionType: string,
  ): Effect.Effect<void, never, never> {
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

  getReactionCounts(activityId: ActivityId): Effect.Effect<
    {
      total: number;
      counts: { heart: number; fire: number; clap: number; star: number };
    },
    never,
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
}
