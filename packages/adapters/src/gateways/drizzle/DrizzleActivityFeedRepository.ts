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
import { ActivityFeed, ActivityReaction } from "@mirai-app/domain";
import type { ActivityFeedRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "./BaseDrizzleRepository";
import {
  ActivityFeedDrizzleMapper,
  ActivityReactionDrizzleMapper,
} from "../../mappers/drizzle/ActivityFeedDrizzleMapper";

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

  async findByTripId(tripId: string): Promise<ActivityFeed[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.tripId, tripId))
      .orderBy(desc(this.table.createdAt));
    return records.map((r) => this.mapper.toDomain(r));
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

  async addReaction(
    activityId: string,
    userId: string,
    reactionType: string,
  ): Promise<ActivityReaction> {
    const id = crypto.randomUUID();
    const now = new Date();

    await this.db.insert(activityReactions).values({
      id,
      activityId,
      userId,
      reactionType,
      createdAt: now,
    });

    return ActivityReaction.create({
      id,
      activityId,
      userId,
      reactionType,
      createdAt: now,
    }).value as ActivityReaction;
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
