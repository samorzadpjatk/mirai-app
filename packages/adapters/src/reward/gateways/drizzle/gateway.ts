import { sql, eq, and, inArray, asc } from "drizzle-orm";
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
  type RewardPurchaseStatus,
  type RewardId,
  DatabaseError,
} from "@mirai-app/domain";
import type {
  RewardGateway,
  RewardPurchaseGateway,
  RewardDTO,
  RewardPurchaseDTO,
  RewardPaginatedResult,
  PurchasePaginatedResult,
  PaginationOptions,
  RewardConnectionArgs,
  RewardPurchaseConnectionArgs,
} from "@mirai-app/use-cases";
import type { Connection } from "@mirai-app/domain";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import {
  RewardDrizzleMapper,
  RewardPurchaseDrizzleMapper,
} from "../../mappers/drizzle/mapper";

/**
 * DrizzleRewardGateway
 *
 * Gateway implementation using Drizzle ORM for Reward entity.
 * Returns RewardDTOs instead of domain entities.
 */
export class DrizzleRewardGateway
  extends BaseDrizzleGateway<
    RewardDTO,
    RewardSelect,
    RewardInsert,
    typeof rewards
  >
  implements RewardGateway
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
  ): Effect.Effect<RewardPaginatedResult, DatabaseError, never> {
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
          items: records.map((r) => this.mapper.toDTO(r)),
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
  ): Effect.Effect<RewardPaginatedResult, DatabaseError, never> {
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
          items: records.map((r) => this.mapper.toDTO(r)),
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
  ): Effect.Effect<RewardDTO[], DatabaseError, never> {
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
        return records.map((r) => this.mapper.toDTO(r));
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
  ): Effect.Effect<RewardDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.createdById, creatorId));
        return records.map((r) => this.mapper.toDTO(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByCreatorId",
          message: "Failed to find rewards by creator ID",
          cause: error,
        }),
    });
  }

  hide(id: string): Effect.Effect<RewardDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({ isHidden: true, updatedAt: new Date() })
          .where(eq(this.table.id, id))
          .returning();
        if (!record) throw new Error(`Reward with id ${id} not found`);
        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "hide",
          message: `Failed to hide reward with id ${id}`,
          cause: error,
        }),
    });
  }

  unhide(id: string): Effect.Effect<RewardDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({ isHidden: false, updatedAt: new Date() })
          .where(eq(this.table.id, id))
          .returning();
        if (!record) throw new Error(`Reward with id ${id} not found`);
        return this.mapper.toDTO(record);
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
  ): Effect.Effect<RewardDTO, DatabaseError, never> {
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
        return this.mapper.toDTO(record);
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
  ): Effect.Effect<RewardDTO, DatabaseError, never> {
    return this.decrementAvailableQuantity(id, amount);
  }

  incrementQuantity(
    id: RewardId,
    amount: number,
  ): Effect.Effect<RewardDTO, DatabaseError, never> {
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
        return this.mapper.toDTO(record);
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

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find rewards by trip ID with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findByTripIdConnection(
    tripId: string,
    args: RewardConnectionArgs,
  ): Effect.Effect<Connection<RewardDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      tripId,
      args,
      () => undefined,
      "findByTripIdConnection",
    );
  }

  /**
   * Find visible rewards by trip ID with cursor-based pagination
   * Uses (createdAt, id) composite sort key for stable pagination
   */
  findVisibleByTripIdConnection(
    tripId: string,
    args: RewardConnectionArgs,
  ): Effect.Effect<Connection<RewardDTO>, DatabaseError, never> {
    return this.executeConnectionQuery(
      tripId,
      args,
      () => eq(this.table.isHidden, false),
      "findVisibleByTripIdConnection",
    );
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Uses (createdAt, id) > (cursor.createdAt, cursor.id) WHERE clause
   * Uses ORDER BY createdAt, id with LIMIT first + 1
   */
  private executeConnectionQuery(
    tripId: string,
    args: RewardConnectionArgs,
    buildFilterCondition: () =>
      | ReturnType<typeof eq>
      | ReturnType<typeof and>
      | undefined,
    operation: string,
  ): Effect.Effect<Connection<RewardDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions
        const conditions = [eq(this.table.tripId, tripId)];

        // Add filter condition if provided
        const filterCondition = buildFilterCondition();
        if (filterCondition) {
          conditions.push(filterCondition);
        }

        // Add cursor condition: (createdAt, id) > (cursor.createdAt, cursor.id)
        if (cursor) {
          const cursorDate = new Date(cursor.createdAt);
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(asc(this.table.createdAt), asc(this.table.id))
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
            createdAt: item.createdAt.toISOString(),
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

/**
 * DrizzleRewardPurchaseGateway
 *
 * Gateway implementation using Drizzle ORM for RewardPurchase entity.
 * Returns RewardPurchaseDTOs instead of domain entities.
 */
export class DrizzleRewardPurchaseGateway
  extends BaseDrizzleGateway<
    RewardPurchaseDTO,
    RewardPurchaseSelect,
    RewardPurchaseInsert,
    typeof rewardPurchases
  >
  implements RewardPurchaseGateway
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
  ): Effect.Effect<PurchasePaginatedResult, DatabaseError, never> {
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
          items: records.map((r) => this.mapper.toDTO(r)),
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
  ): Effect.Effect<PurchasePaginatedResult, DatabaseError, never> {
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
          items: records.map((r) => this.mapper.toDTO(r)),
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
  ): Effect.Effect<PurchasePaginatedResult, DatabaseError, never> {
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
          items: records.map((r) => this.mapper.toDTO(r)),
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
  ): Effect.Effect<RewardPurchaseDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, status));
        return records.map((r) => this.mapper.toDTO(r));
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
  ): Effect.Effect<RewardPurchaseDTO, DatabaseError, never> {
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
        return this.mapper.toDTO(record);
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

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find purchases by reward ID with cursor-based pagination
   * Uses (purchasedAt, id) composite sort key for stable pagination
   */
  findByRewardIdConnection(
    rewardId: RewardId,
    args: RewardPurchaseConnectionArgs,
  ): Effect.Effect<Connection<RewardPurchaseDTO>, DatabaseError, never> {
    return this.executePurchaseConnectionQuery(
      rewardId,
      args,
      (table) => eq(table.rewardId, rewardId),
      "findByRewardIdConnection",
    );
  }

  /**
   * Find purchases by group ID with cursor-based pagination
   * Uses (purchasedAt, id) composite sort key for stable pagination
   */
  findByGroupIdConnection(
    groupId: string,
    args: RewardPurchaseConnectionArgs,
  ): Effect.Effect<Connection<RewardPurchaseDTO>, DatabaseError, never> {
    return this.executePurchaseConnectionQuery(
      groupId,
      args,
      (table) => eq(table.groupId, groupId),
      "findByGroupIdConnection",
    );
  }

  /**
   * Find all purchases for a trip with cursor-based pagination
   * Uses (purchasedAt, id) composite sort key for stable pagination
   */
  findByTripIdConnection(
    tripId: string,
    args: RewardPurchaseConnectionArgs,
  ): Effect.Effect<Connection<RewardPurchaseDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base query with join to rewards table for trip filtering
        const conditions: Array<
          ReturnType<typeof eq> | ReturnType<typeof and>
        > = [];

        // Add cursor condition: (createdAt, id) > (cursor.purchasedAt, cursor.id)
        if (cursor) {
          const cursorDate = new Date(cursor.purchasedAt);
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select({ purchase: this.table })
          .from(this.table)
          .innerJoin(rewards, eq(this.table.rewardId, rewards.id))
          .where(and(eq(rewards.tripId, tripId), ...conditions))
          .orderBy(asc(this.table.createdAt), asc(this.table.id))
          .limit(first + 1);

        const hasMore = records.length > first;
        const items = records
          .slice(0, first)
          .map((record) => this.mapper.toDTO(record.purchase));

        // Build edges with cursors
        const edges = items.map((item) => ({
          node: item,
          cursor: encodeCursor({
            id: item.id,
            createdAt: item.purchasedAt.toISOString(),
            purchasedAt: item.purchasedAt.toISOString(),
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
          operation: "findByTripIdConnection",
          message: `Failed to find purchases for trip ${tripId}`,
          cause: error,
        }),
    });
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Uses (createdAt, id) > (cursor.purchasedAt, cursor.id) WHERE clause
   * Uses ORDER BY createdAt, id with LIMIT first + 1
   */
  private executePurchaseConnectionQuery(
    idValue: string,
    args: RewardPurchaseConnectionArgs,
    buildCondition: (table: typeof this.table) => ReturnType<typeof eq>,
    operation: string,
  ): Effect.Effect<Connection<RewardPurchaseDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build base conditions
        const conditions = [buildCondition(this.table)];

        // Add cursor condition: (createdAt, id) > (cursor.purchasedAt, cursor.id)
        if (cursor) {
          const cursorDate = new Date(cursor.purchasedAt);
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(asc(this.table.createdAt), asc(this.table.id))
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
            createdAt: item.purchasedAt.toISOString(),
            purchasedAt: item.purchasedAt.toISOString(),
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
