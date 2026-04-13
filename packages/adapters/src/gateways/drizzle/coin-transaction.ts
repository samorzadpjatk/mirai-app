import type {
  CoinTransactionRepository,
  CoinTransaction,
  CoinTransactionFilters,
  PaginationOptions,
  MostActiveAdminStat,
} from "@mirai-app/use-cases";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { coinTransactions, groups } from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { Effect } from "effect";
import { BaseDrizzleRepository } from "../base/repository";
import { CoinTransactionDrizzleMapper } from "../../mappers/drizzle/coin-transaction";
import { DatabaseError } from "../../errors/adapter-errors";

/**
 * DrizzleCoinTransactionRepository
 *
 * Implements the CoinTransactionRepository port using Drizzle ORM.
 * Uses BaseDrizzleRepository for standard CRUD operations.
 */
export class DrizzleCoinTransactionRepository
  extends BaseDrizzleRepository<
    CoinTransaction,
    typeof coinTransactions.$inferSelect,
    Partial<typeof coinTransactions.$inferInsert>,
    typeof coinTransactions
  >
  implements CoinTransactionRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: coinTransactions,
      mapper: CoinTransactionDrizzleMapper.instance,
    });
  }

  /**
   * Count transactions by filters
   */
  count(
    filters?: Partial<CoinTransactionFilters>,
  ): Effect.Effect<number, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const whereClause = this.buildWhereClause(filters);

        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(coinTransactions)
          .where(whereClause)
          .limit(1);

        return result?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "count",
          message: "Failed to count transactions",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Sum amount by filters
   */
  sumAmount(
    filters?: Partial<CoinTransactionFilters>,
  ): Effect.Effect<number | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const whereClause = this.buildWhereClause(filters);

        const [result] = await this.db
          .select({ sum: sql<number>`sum(${coinTransactions.amount})::int` })
          .from(coinTransactions)
          .where(whereClause)
          .limit(1);

        return result?.sum ?? null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "sumAmount",
          message: "Failed to sum transaction amounts",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Sum added coins (positive amounts) for a trip
   */
  sumAddedCoins(
    tripId: string,
  ): Effect.Effect<number | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ sum: sql<number>`sum(${coinTransactions.amount})::int` })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(
            and(eq(groups.tripId, tripId), gte(coinTransactions.amount, 0)),
          )
          .limit(1);

        return result?.sum ?? null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "sumAddedCoins",
          message: "Failed to sum added coins",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Sum removed coins (negative amounts) for a trip
   */
  sumRemovedCoins(
    tripId: string,
  ): Effect.Effect<number | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ sum: sql<number>`sum(${coinTransactions.amount})::int` })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(
            and(eq(groups.tripId, tripId), lte(coinTransactions.amount, 0)),
          )
          .limit(1);

        return result?.sum ?? null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "sumRemovedCoins",
          message: "Failed to sum removed coins",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Get most active admin stats
   */
  getMostActiveAdmin(
    tripId: string,
  ): Effect.Effect<MostActiveAdminStat[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const results = await this.db
          .select({
            adminId: coinTransactions.adminId,
            _sum: sql<number>`sum(${coinTransactions.amount})::int`,
            _count: sql<number>`count(*)::int`,
          })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(eq(groups.tripId, tripId))
          .groupBy(coinTransactions.adminId)
          .orderBy(desc(sql`sum(${coinTransactions.amount})`))
          .limit(1);

        return results.map((r) => ({
          adminId: r.adminId,
          _sum: { amount: r._sum ?? 0 },
          _count: { id: r._count ?? 0 },
        }));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getMostActiveAdmin",
          message: "Failed to get most active admin stats",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Find many transactions with filters and pagination
   */
  findMany(
    filters: Partial<CoinTransactionFilters>,
    pagination: PaginationOptions,
  ): Effect.Effect<CoinTransaction[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const whereClause = this.buildWhereClause(filters);

        const results = await this.db
          .select({
            id: coinTransactions.id,
            amount: coinTransactions.amount,
            reason: coinTransactions.reason,
            createdAt: coinTransactions.createdAt,
            groupId: coinTransactions.groupId,
            adminId: coinTransactions.adminId,
            groupName: groups.name,
            groupCoins: groups.coins,
          })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(whereClause)
          .orderBy(desc(coinTransactions.createdAt))
          .limit(pagination.limit ?? 10)
          .offset(pagination.offset ?? 0);

        return results.map((r) =>
          this.mapper.toDomain({
            id: r.id,
            groupId: r.groupId,
            amount: r.amount,
            reason: r.reason,
            adminId: r.adminId,
            createdAt: r.createdAt,
            tripId: "",
            groupName: r.groupName,
            groupCoins: r.groupCoins,
          } as any),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findMany",
          message: "Failed to find transactions with filters",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Find recent transactions
   */
  findRecent(
    filters: Partial<CoinTransactionFilters>,
    limit: number,
  ): Effect.Effect<CoinTransaction[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const whereClause = this.buildWhereClause(filters);

        const results = await this.db
          .select({
            id: coinTransactions.id,
            groupId: coinTransactions.groupId,
            amount: coinTransactions.amount,
            reason: coinTransactions.reason,
            adminId: coinTransactions.adminId,
            createdAt: coinTransactions.createdAt,
            groupName: groups.name,
            tripId: groups.tripId,
          })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(whereClause)
          .orderBy(desc(coinTransactions.createdAt))
          .limit(limit);

        return results.map(
          (r) =>
            ({
              id: r.id,
              groupId: r.groupId,
              amount: r.amount,
              reason: r.reason,
              adminId: r.adminId,
              createdAt: r.createdAt,
              tripId: r.tripId,
              group: { id: r.groupId, name: r.groupName ?? "", coins: 0 },
            }) as CoinTransaction,
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findRecent",
          message: "Failed to find recent transactions",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Get total coins by group
   */
  getTotalCoinsByGroup(
    tripId: string,
  ): Effect.Effect<
    Array<{ groupId: string; _sum: { amount: number | null } }>,
    never,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const results = await this.db
          .select({
            groupId: coinTransactions.groupId,
            _sum: sql<number | null>`sum(${coinTransactions.amount})::int`,
          })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(eq(groups.tripId, tripId))
          .groupBy(coinTransactions.groupId)
          .orderBy(desc(sql`sum(${coinTransactions.amount})`));

        return results.map((r) => ({
          groupId: r.groupId,
          _sum: { amount: r._sum ?? null },
        }));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getTotalCoinsByGroup",
          message: "Failed to get total coins by group",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Group by admin
   */
  groupByAdmin(
    tripId: string,
    limit: number,
  ): Effect.Effect<
    Array<{ adminId: string; _count: { id: number } }>,
    never,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const results = await this.db
          .select({
            adminId: coinTransactions.adminId,
            _count: sql<number>`count(*)::int`,
          })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(eq(groups.tripId, tripId))
          .groupBy(coinTransactions.adminId)
          .orderBy(desc(sql`count(*)`))
          .limit(limit);

        return results.map((r) => ({
          adminId: r.adminId,
          _count: { id: r._count ?? 0 },
        }));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "groupByAdmin",
          message: "Failed to group transactions by admin",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Create a new transaction
   */
  override create(
    data:
      | CoinTransaction
      | {
          groupId: string;
          amount: number;
          reason?: string;
          adminId: string;
        },
  ): Effect.Effect<CoinTransaction, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const input = data as {
          groupId: string;
          amount: number;
          reason?: string;
          adminId: string;
        };
        const [result] = await this.db
          .insert(coinTransactions)
          .values({
            tripId: "",
            groupId: input.groupId,
            amount: input.amount,
            reason: input.reason ?? null,
            adminId: input.adminId,
            createdAt: new Date(),
          })
          .returning();

        if (!result) {
          throw new Error(
            "Failed to create coin transaction: no record returned",
          );
        }

        return this.mapper.toDomain(result);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "create",
          message: "Failed to create coin transaction",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Increment group coins
   */
  incrementGroupCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<void, never, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db
          .update(groups)
          .set({ coins: sql`${groups.coins} + ${amount}` })
          .where(eq(groups.id, groupId));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "incrementGroupCoins",
          message: "Failed to increment group coins",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Decrement group coins with balance check
   */
  decrementGroupCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<
    { success: boolean; currentBalance?: number },
    never,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const [group] = await this.db
          .select({ coins: groups.coins })
          .from(groups)
          .where(eq(groups.id, groupId))
          .limit(1);

        const currentBalance = group?.coins ?? 0;

        if (currentBalance < amount) {
          return { success: false, currentBalance };
        }

        await this.db
          .update(groups)
          .set({ coins: sql`${groups.coins} - ${amount}` })
          .where(eq(groups.id, groupId));

        return { success: true, currentBalance: currentBalance - amount };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "decrementGroupCoins",
          message: "Failed to decrement group coins",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Get group coins
   */
  getGroupCoins(groupId: string): Effect.Effect<number, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const [group] = await this.db
          .select({ coins: groups.coins })
          .from(groups)
          .where(eq(groups.id, groupId))
          .limit(1);

        return group?.coins ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getGroupCoins",
          message: "Failed to get group coins",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Verify group in trip
   */
  verifyGroupInTrip(
    groupId: string,
    tripId: string,
  ): Effect.Effect<
    {
      exists: boolean;
      tripId?: string;
      isDeleted?: boolean;
      coins?: number;
    },
    never,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const [group] = await this.db
          .select({
            tripId: groups.tripId,
            isDeleted: groups.isDeleted,
            coins: groups.coins,
          })
          .from(groups)
          .where(eq(groups.id, groupId))
          .limit(1);

        if (!group) {
          return { exists: false };
        }

        return {
          exists: true,
          tripId: group.tripId,
          isDeleted: group.isDeleted,
          coins: group.coins,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "verifyGroupInTrip",
          message: "Failed to verify group in trip",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Build where clause from filters
   */
  private buildWhereClause(
    filters?: Partial<CoinTransactionFilters>,
  ): ReturnType<typeof and> | undefined {
    const conditions = [];

    if (filters?.groupId) {
      conditions.push(eq(coinTransactions.groupId, filters.groupId));
    }

    if (filters?.tripId) {
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
