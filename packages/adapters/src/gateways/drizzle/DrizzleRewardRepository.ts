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
} from "@mirai-app/domain";
import type {
  RewardRepository,
  RewardPurchaseRepository,
} from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import {
  RewardDrizzleMapper,
  RewardPurchaseDrizzleMapper,
} from "../../mappers/drizzle/RewardDrizzleMapper";

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

  async findByTripId(tripId: string): Promise<Reward[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.tripId, tripId));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findVisibleByTripId(tripId: string): Promise<Reward[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(
        and(eq(this.table.tripId, tripId), eq(this.table.isHidden, false)),
      );
    return records.map((r) => this.mapper.toDomain(r));
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

  async findByRewardId(rewardId: string): Promise<RewardPurchase[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.rewardId, rewardId));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async findByGroupId(groupId: string): Promise<RewardPurchase[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.groupId, groupId));
    return records.map((r) => this.mapper.toDomain(r));
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
    status: RewardPurchaseStatus,
    statusUpdatedById: string,
  ): Promise<RewardPurchase> {
    const [record] = await this.db
      .update(this.table)
      .set({
        status,
        statusUpdatedById,
        statusUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
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

  async countByRewardId(rewardId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.rewardId, rewardId));
    return result[0]?.count ?? 0;
  }
}
