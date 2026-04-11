import { sql, eq, and, inArray } from "drizzle-orm";
import {
  rewards,
  rewardPurchases,
  type RewardSelect,
  type RewardInsert,
  type RewardPurchaseSelect,
  type RewardPurchaseInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import {
  Reward,
  RewardPurchase,
  type RewardPurchaseStatus,
  type RewardId,
} from "@mirai-app/domain";
import type {
  RewardRepository,
  RewardPurchaseRepository,
  PaginatedResult,
  PaginationOptions,
} from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../base/repository";
import {
  RewardDrizzleMapper,
  RewardPurchaseDrizzleMapper,
} from "../../mappers/drizzle/reward";

/**
 * DrizzleRewardRepository
 *
 * Repository implementation using Drizzle ORM for Reward entity.
 */
export class DrizzleRewardRepository
  extends BaseDrizzleRepository<
    Reward,
    RewardSelect,
    RewardInsert,
    typeof rewards
  >
  implements RewardRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: rewards,
      mapper: RewardDrizzleMapper.instance,
    });
  }

  async findByTripId(
    tripId: string,
    options?: { includeHidden?: boolean } & PaginationOptions,
  ): Promise<PaginatedResult<Reward>> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    let whereClause = eq(this.table.tripId, tripId);
    if (!options?.includeHidden) {
      whereClause = and(whereClause, eq(this.table.isHidden, false))!;
    }

    const [records, countResult] = await Promise.all([
      this.db
        .select()
        .from(this.table)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(this.table)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      items: records.map((r) => this.mapper.toDomain(r)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findVisibleByTripId(
    tripId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<Reward>> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const whereClause = and(
      eq(this.table.tripId, tripId),
      eq(this.table.isHidden, false),
    )!;

    const [records, countResult] = await Promise.all([
      this.db
        .select()
        .from(this.table)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(this.table)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      items: records.map((r) => this.mapper.toDomain(r)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findAvailableByTripId(tripId: string): Promise<Reward[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.tripId, tripId),
          eq(this.table.isHidden, false),
          sql`${this.table.availableQuantity} > 0`,
        ),
      );
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findByCreatorId(creatorId: string): Promise<Reward[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.createdById, creatorId));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async hide(id: string): Promise<Reward> {
    const [record] = await this.db
      .update(this.table)
      .set({ isHidden: true, updatedAt: new Date() })
      .where(eq(this.table.id, id))
      .returning();
    if (!record) throw new Error(`Reward with id ${id} not found`);
    return this.mapper.toDomain(record);
  }

  async unhide(id: string): Promise<Reward> {
    const [record] = await this.db
      .update(this.table)
      .set({ isHidden: false, updatedAt: new Date() })
      .where(eq(this.table.id, id))
      .returning();
    if (!record) throw new Error(`Reward with id ${id} not found`);
    return this.mapper.toDomain(record);
  }

  async decrementAvailableQuantity(
    id: string,
    quantity: number = 1,
  ): Promise<Reward> {
    const [record] = await this.db
      .update(this.table)
      .set({
        availableQuantity: sql`${this.table.availableQuantity} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(this.table.id, id))
      .returning();
    if (!record) throw new Error(`Reward with id ${id} not found`);
    return this.mapper.toDomain(record);
  }

  // Alias for interface compatibility
  async decrementQuantity(id: RewardId, amount: number): Promise<Reward> {
    return this.decrementAvailableQuantity(id, amount);
  }

  async incrementQuantity(id: RewardId, amount: number): Promise<Reward> {
    const [record] = await this.db
      .update(this.table)
      .set({
        availableQuantity: sql`${this.table.availableQuantity} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(this.table.id, id))
      .returning();
    if (!record) throw new Error(`Reward with id ${id} not found`);
    return this.mapper.toDomain(record);
  }

  async hasPurchases(id: RewardId): Promise<boolean> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(rewardPurchases)
      .where(eq(rewardPurchases.rewardId, id));
    return (result[0]?.count ?? 0) > 0;
  }

  async getPurchaseCount(id: RewardId): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(rewardPurchases)
      .where(eq(rewardPurchases.rewardId, id));
    return result[0]?.count ?? 0;
  }

  async countByTripId(tripId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.tripId, tripId));
    return result[0]?.count ?? 0;
  }
}

/**
 * DrizzleRewardPurchaseRepository
 *
 * Repository implementation using Drizzle ORM for RewardPurchase entity.
 */
export class DrizzleRewardPurchaseRepository
  extends BaseDrizzleRepository<
    RewardPurchase,
    RewardPurchaseSelect,
    RewardPurchaseInsert,
    typeof rewardPurchases
  >
  implements RewardPurchaseRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: rewardPurchases,
      mapper: RewardPurchaseDrizzleMapper.instance,
    });
  }

  async findByRewardId(
    rewardId: RewardId,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const [records, countResult] = await Promise.all([
      this.db
        .select()
        .from(this.table)
        .where(eq(this.table.rewardId, rewardId))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(this.table)
        .where(eq(this.table.rewardId, rewardId)),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      items: records.map((r) => this.mapper.toDomain(r)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByGroupId(
    groupId: string,
    options?: PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const [records, countResult] = await Promise.all([
      this.db
        .select()
        .from(this.table)
        .where(eq(this.table.groupId, groupId))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(this.table)
        .where(eq(this.table.groupId, groupId)),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      items: records.map((r) => this.mapper.toDomain(r)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByTripId(
    tripId: string,
    options?: { groupId?: string } & PaginationOptions,
  ): Promise<PaginatedResult<RewardPurchase>> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    // Need to join with rewards table to filter by tripId
    const baseQuery = this.db
      .select({ purchase: this.table })
      .from(this.table)
      .innerJoin(rewards, eq(this.table.rewardId, rewards.id))
      .where(eq(rewards.tripId, tripId));

    const [records, countResult] = await Promise.all([
      baseQuery
        .limit(limit)
        .offset(offset)
        .then((rows) => rows.map((r) => r.purchase)),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(this.table)
        .innerJoin(rewards, eq(this.table.rewardId, rewards.id))
        .where(eq(rewards.tripId, tripId)),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      items: records.map((r) => this.mapper.toDomain(r)),
      total,
      limit,
      offset,
      hasMore: offset + records.length < total,
    };
  }

  async findByStatus(status: RewardPurchaseStatus): Promise<RewardPurchase[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.status, status));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async updateStatus(
    id: string,
    status: string,
    updatedById: string,
    collectionMethod?: string | null,
  ): Promise<RewardPurchase> {
    const updateData: Partial<RewardPurchaseInsert> = {
      status: status as RewardPurchaseStatus,
      statusUpdatedById: updatedById,
      statusUpdatedAt: new Date(),
      updatedAt: new Date(),
    };

    if (collectionMethod !== undefined) {
      updateData.collectionMethod = collectionMethod;
    }

    const [record] = await this.db
      .update(this.table)
      .set(updateData)
      .where(eq(this.table.id, id))
      .returning();
    if (!record) throw new Error(`RewardPurchase with id ${id} not found`);
    return this.mapper.toDomain(record);
  }

  async countByGroupId(groupId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.groupId, groupId));
    return result[0]?.count ?? 0;
  }

  async countByRewardId(rewardId: RewardId): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.rewardId, rewardId));
    return result[0]?.count ?? 0;
  }
}
