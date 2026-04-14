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
import { Effect } from "effect";
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
import { DatabaseError } from "@mirai-app/use-cases/ports/errors";

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

  findByTripId(
    tripId: string,
    options?: { includeHidden?: boolean } & PaginationOptions,
  ): Effect.Effect<PaginatedResult<Reward>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          message: "Failed to find rewards by trip ID",
          cause: error,
        }),
    });
  }

  findVisibleByTripId(
    tripId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<Reward>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findVisibleByTripId",
          message: "Failed to find visible rewards by trip ID",
          cause: error,
        }),
    });
  }

  findAvailableByTripId(
    tripId: string,
  ): Effect.Effect<Reward[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAvailableByTripId",
          message: "Failed to find available rewards by trip ID",
          cause: error,
        }),
    });
  }

  findByCreatorId(
    creatorId: string,
  ): Effect.Effect<Reward[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.createdById, creatorId));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByCreatorId",
          message: "Failed to find rewards by creator ID",
          cause: error,
        }),
    });
  }

  hide(id: string): Effect.Effect<Reward, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({ isHidden: true, updatedAt: new Date() })
          .where(eq(this.table.id, id))
          .returning();
        if (!record) throw new Error(`Reward with id ${id} not found`);
        return this.mapper.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "hide",
          message: `Failed to hide reward with id ${id}`,
          cause: error,
        }),
    });
  }

  unhide(id: string): Effect.Effect<Reward, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({ isHidden: false, updatedAt: new Date() })
          .where(eq(this.table.id, id))
          .returning();
        if (!record) throw new Error(`Reward with id ${id} not found`);
        return this.mapper.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "unhide",
          message: `Failed to unhide reward with id ${id}`,
          cause: error,
        }),
    });
  }

  decrementAvailableQuantity(
    id: string,
    quantity: number = 1,
  ): Effect.Effect<Reward, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "decrementAvailableQuantity",
          message: `Failed to decrement available quantity for reward ${id}`,
          cause: error,
        }),
    });
  }

  decrementQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<Reward, DatabaseError, never> {
    return this.decrementAvailableQuantity(id, amount);
  }

  incrementQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<Reward, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "incrementQuantity",
          message: `Failed to increment quantity for reward ${id}`,
          cause: error,
        }),
    });
  }

  hasPurchases(id: RewardId): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(rewardPurchases)
          .where(eq(rewardPurchases.rewardId, id));
        return (result[0]?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "hasPurchases",
          message: `Failed to check if reward ${id} has purchases`,
          cause: error,
        }),
    });
  }

  getPurchaseCount(id: RewardId): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(rewardPurchases)
          .where(eq(rewardPurchases.rewardId, id));
        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getPurchaseCount",
          message: `Failed to get purchase count for reward ${id}`,
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
          message: "Failed to count rewards by trip ID",
          cause: error,
        }),
    });
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

  findByRewardId(
    rewardId: RewardId,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByRewardId",
          message: `Failed to find purchases for reward ${rewardId}`,
          cause: error,
        }),
    });
  }

  findByGroupId(
    groupId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByGroupId",
          message: `Failed to find purchases for group ${groupId}`,
          cause: error,
        }),
    });
  }

  findByTripId(
    tripId: string,
    options?: { groupId?: string } & PaginationOptions,
  ): Effect.Effect<PaginatedResult<RewardPurchase>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 50;
        const offset = options?.offset ?? 0;

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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          message: `Failed to find purchases for trip ${tripId}`,
          cause: error,
        }),
    });
  }

  findByStatus(
    status: RewardPurchaseStatus,
  ): Effect.Effect<RewardPurchase[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, status));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatus",
          message: `Failed to find purchases by status`,
          cause: error,
        }),
    });
  }

  updateStatus(
    id: string,
    status: string,
    updatedById: string,
    collectionMethod?: string | null,
  ): Effect.Effect<RewardPurchase, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "updateStatus",
          message: `Failed to update status for purchase ${id}`,
          cause: error,
        }),
    });
  }

  countByGroupId(groupId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.groupId, groupId));
        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByGroupId",
          message: `Failed to count purchases for group ${groupId}`,
          cause: error,
        }),
    });
  }

  countByRewardId(
    rewardId: RewardId,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.rewardId, rewardId));
        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByRewardId",
          message: `Failed to count purchases for reward ${rewardId}`,
          cause: error,
        }),
    });
  }
}
