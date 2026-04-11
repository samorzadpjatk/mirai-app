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

  async findByTripId(
    tripId: string,
    options?: {
      limit?: number;
      cursor?: { id: string; createdAt: Date; isPinned: boolean } | null;
      includeHidden?: boolean;
    },
  ): Promise<{
    activities: ActivityFeed[];
    nextCursor: { id: string; createdAt: Date; isPinned: boolean } | null;
    hasMore: boolean;
  }> {
    const limit = options?.limit ?? 20;
    const cursor = options?.cursor;
    const includeHidden = options?.includeHidden ?? false;

    // Build the where clause
    let conditions = [eq(this.table.tripId, tripId)];

    if (!includeHidden) {
      conditions.push(eq(this.table.isHidden, false));
    }

    if (cursor) {
      // Cursor pagination: get records after the cursor
      // Order: pinned first, then by createdAt desc
      conditions.push(
        sql`(${this.table.isPinned}, ${this.table.createdAt}, ${this.table.id}) <= (${cursor.isPinned}, ${cursor.createdAt}, ${cursor.id})`,
      );
    }

    // Query with limit + 1 to check for more
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
  }

  async findByTripIdPaged(
    tripId: string,
    options: {
      page: number;
      pageSize: number;
      includeHidden?: boolean;
    },
  ): Promise<{
    activities: ActivityFeed[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    const { page, pageSize, includeHidden = false } = options;
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const conditions = [eq(this.table.tripId, tripId)];
    if (!includeHidden) {
      conditions.push(eq(this.table.isHidden, false));
    }

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(and(...conditions));
    const total = countResult[0]?.count ?? 0;

    // Get paginated activities
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
  }

  async findReactionsByActivityId(
    activityId: ActivityId,
  ): Promise<ActivityReaction[]> {
    const records = await this.db
      .select()
      .from(activityReactions)
      .where(eq(activityReactions.activityId, activityId));
    return records.map((r) =>
      ActivityReactionDrizzleMapper.instance.toDomain(r),
    );
  }

  async findUserReactions(
    activityId: ActivityId,
    userId: string,
  ): Promise<ActivityReaction[]> {
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
  }

  async getReactionCounts(activityId: ActivityId): Promise<{
    total: number;
    counts: { heart: number; fire: number; clap: number; star: number };
  }> {
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
  }

  async findByTripIdAndType(
    tripId: string,
    activityType: string,
  ): Promise<ActivityFeed[]> {
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
  }

  async findPinnedByTripId(tripId: string): Promise<ActivityFeed[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.tripId, tripId), eq(this.table.isPinned, true)))
      .orderBy(desc(this.table.createdAt));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findVisibleByTripId(tripId: string): Promise<ActivityFeed[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.tripId, tripId), eq(this.table.isHidden, false)))
      .orderBy(desc(this.table.createdAt));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findByUserIds(userIds: string[]): Promise<ActivityFeed[]> {
    // This would need a join with activityReactions or other user-related tables
    return [];
  }

  async addReaction(reaction: ActivityReaction): Promise<ActivityReaction> {
    const insertData =
      ActivityReactionDrizzleMapper.instance.toDrizzleInsert(reaction);

    await this.db.insert(activityReactions).values(insertData);

    return reaction;
  }

  async removeReaction(
    activityId: string,
    userId: string,
    reactionType: string,
  ): Promise<void> {
    await this.db
      .delete(activityReactions)
      .where(
        and(
          eq(activityReactions.activityId, activityId),
          eq(activityReactions.userId, userId),
          eq(activityReactions.reactionType, reactionType),
        ),
      );
  }

  async getReactions(activityId: string): Promise<ActivityReaction[]> {
    const records = await this.db
      .select()
      .from(activityReactions)
      .where(eq(activityReactions.activityId, activityId));
    return records.map((r) =>
      ActivityReactionDrizzleMapper.instance.toDomain(r),
    );
  }

  async pinActivity(id: string): Promise<ActivityFeed> {
    const [record] = await this.db
      .update(this.table)
      .set({ isPinned: true, updatedAt: new Date() })
      .where(eq(this.table.id, id))
      .returning();
    if (!record) throw new Error(`Activity with id ${id} not found`);
    return this.mapper.toDomain(record);
  }

  async unpinActivity(id: string): Promise<ActivityFeed> {
    const [record] = await this.db
      .update(this.table)
      .set({ isPinned: false, updatedAt: new Date() })
      .where(eq(this.table.id, id))
      .returning();
    if (!record) throw new Error(`Activity with id ${id} not found`);
    return this.mapper.toDomain(record);
  }

  async hideActivity(
    id: string,
    hiddenByAdmin: string,
    reason?: string,
  ): Promise<ActivityFeed> {
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
  }

  async unhideActivity(id: string): Promise<ActivityFeed> {
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
  }

  async countByTripId(tripId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.tripId, tripId));
    return result[0]?.count ?? 0;
  }
}
