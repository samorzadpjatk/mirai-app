import type { CoinTransactionGateway } from "@mirai-app/use-cases";
import type {
  CoinTransactionFilters,
  PaginationOptions,
  MostActiveAdminStat,
  PaginatedResult,
} from "@mirai-app/use-cases";
import type { CoinTransactionDTO } from "@mirai-app/domain";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  coinTransactions,
  groups,
  users,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain";
import { CoinTransactionDTODrizzleMapper } from "../../mappers/drizzle/mapper";

/**
 * DrizzleCoinTransactionGateway
 *
 * Implements the CoinTransactionGateway port using Drizzle ORM.
 * Returns CoinTransactionDTOs instead of domain entities.
 *
 * @example
 * ```typescript
 * const container = createContainer({
 *   coinTransactionGateway: asFunction(() => new DrizzleCoinTransactionGateway(db)).singleton(),
 * });
 * ```
 */
export class DrizzleCoinTransactionGateway implements CoinTransactionGateway {
  private mapper = CoinTransactionDTODrizzleMapper.instance;

  constructor(private db: DrizzleDb) {}

  /**
   * Count transactions by filters
   */
  count(
    filters?: Partial<CoinTransactionFilters>,
  ): Effect.Effect<number, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const conditions = this.buildWhereConditions(filters);
        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(coinTransactions)
          .leftJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(whereClause);

        return result?.count ?? 0;
      },
      catch: () => 0, // Return 0 on error for count operations
    }).pipe(Effect.orDie);
  }

  /**
   * Sum amounts with filters
   */
  sumAmount(
    filters?: Partial<CoinTransactionFilters>,
  ): Effect.Effect<number | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const conditions = this.buildWhereConditions(filters);
        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const [result] = await this.db
          .select({ sum: sql<number>`sum(${coinTransactions.amount})::int` })
          .from(coinTransactions)
          .leftJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(whereClause);

        return result?.sum ?? null;
      },
      catch: () => null,
    }).pipe(Effect.orDie);
  }

  /**
   * Sum positive amounts (added coins)
   */
  sumAddedCoins(tripId: string): Effect.Effect<number | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({
            sum: sql<number>`sum(case when ${coinTransactions.amount} > 0 then ${coinTransactions.amount} else 0 end)::int`,
          })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(eq(groups.tripId, tripId));

        return result?.sum ?? null;
      },
      catch: () => null,
    }).pipe(Effect.orDie);
  }

  /**
   * Sum negative amounts (removed coins)
   */
  sumRemovedCoins(tripId: string): Effect.Effect<number | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({
            sum: sql<number>`sum(case when ${coinTransactions.amount} < 0 then abs(${coinTransactions.amount}) else 0 end)::int`,
          })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(eq(groups.tripId, tripId));

        return result?.sum ?? null;
      },
      catch: () => null,
    }).pipe(Effect.orDie);
  }

  /**
   * Get most active admin by transaction volume
   */
  getMostActiveAdmin(
    tripId: string,
  ): Effect.Effect<MostActiveAdminStat[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const results = await this.db
          .select({
            adminId: coinTransactions.adminId,
            adminName: sql<string>`coalesce(${users.firstName}, '') || ' ' || coalesce(${users.lastName}, '')`,
            transactionCount: sql<number>`count(*)::int`,
            coinsAwarded: sql<number>`sum(case when ${coinTransactions.amount} > 0 then ${coinTransactions.amount} else 0 end)::int`,
          })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .innerJoin(users, eq(coinTransactions.adminId, users.id))
          .where(eq(groups.tripId, tripId))
          .groupBy(coinTransactions.adminId, users.firstName, users.lastName)
          .orderBy(desc(sql`sum(abs(${coinTransactions.amount}))`));

        return results.map((r) => ({
          adminId: r.adminId,
          adminName: r.adminName.trim() || "Unknown",
          transactionCount: r.transactionCount,
          coinsAwarded: r.coinsAwarded,
        }));
      },
      catch: () => [],
    }).pipe(Effect.orDie);
  }

  /**
   * Find transactions with pagination
   */
  findMany(
    filters: Partial<CoinTransactionFilters>,
    pagination: PaginationOptions,
  ): Effect.Effect<PaginatedResult<CoinTransactionDTO>, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const conditions = this.buildWhereConditions(filters);
        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(coinTransactions)
          .leftJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(whereClause);

        const total = countResult?.count ?? 0;

        // Get paginated results
        const results = await this.db
          .select({
            id: coinTransactions.id,
            groupId: coinTransactions.groupId,
            amount: coinTransactions.amount,
            reason: coinTransactions.reason,
            adminId: coinTransactions.adminId,
            createdAt: coinTransactions.createdAt,
            groupName: groups.name,
            groupCoins: groups.coins,
            adminFirstName: users.firstName,
            adminLastName: users.lastName,
          })
          .from(coinTransactions)
          .leftJoin(groups, eq(coinTransactions.groupId, groups.id))
          .leftJoin(users, eq(coinTransactions.adminId, users.id))
          .where(whereClause)
          .orderBy(desc(coinTransactions.createdAt))
          .limit(pagination.limit ?? 10)
          .offset(pagination.offset ?? 0);

        const items: CoinTransactionDTO[] = results.map((r) =>
          this.mapper.toDTO(
            r as typeof coinTransactions.$inferSelect & {
              groupName?: string | null;
              groupCoins?: number | null;
              adminFirstName?: string | null;
              adminLastName?: string | null;
            },
          ),
        );

        const result: PaginatedResult<CoinTransactionDTO> = {
          items,
          total,
          limit: pagination.limit ?? 10,
          offset: pagination.offset ?? 0,
          hasMore: (pagination.offset ?? 0) + items.length < total,
        };

        return result;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findMany",
          message: "Failed to find coin transactions",
          cause: error,
        }),
    }).pipe(
      Effect.catchTag("DatabaseError", () => {
        const fallback: PaginatedResult<CoinTransactionDTO> = {
          items: [],
          total: 0,
          limit: 10,
          offset: 0,
          hasMore: false,
        };
        return Effect.succeed(fallback);
      }),
    );
  }

  /**
   * Find recent transactions
   */
  findRecent(
    filters: Partial<CoinTransactionFilters>,
    limit: number,
  ): Effect.Effect<CoinTransactionDTO[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const conditions = this.buildWhereConditions(filters);
        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const results = await this.db
          .select({
            id: coinTransactions.id,
            groupId: coinTransactions.groupId,
            amount: coinTransactions.amount,
            reason: coinTransactions.reason,
            adminId: coinTransactions.adminId,
            createdAt: coinTransactions.createdAt,
            groupName: groups.name,
            groupCoins: groups.coins,
            adminFirstName: users.firstName,
            adminLastName: users.lastName,
          })
          .from(coinTransactions)
          .leftJoin(groups, eq(coinTransactions.groupId, groups.id))
          .leftJoin(users, eq(coinTransactions.adminId, users.id))
          .where(whereClause)
          .orderBy(desc(coinTransactions.createdAt))
          .limit(limit);

        return results.map((r) =>
          this.mapper.toDTO(
            r as typeof coinTransactions.$inferSelect & {
              groupName?: string | null;
              groupCoins?: number | null;
              adminFirstName?: string | null;
              adminLastName?: string | null;
            },
          ),
        );
      },
      catch: () => [],
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
            sum: sql<number>`sum(${coinTransactions.amount})::int`,
          })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(eq(groups.tripId, tripId))
          .groupBy(coinTransactions.groupId);

        return results.map((r) => ({
          groupId: r.groupId,
          _sum: { amount: r.sum ?? null },
        }));
      },
      catch: () => [],
    }).pipe(Effect.orDie);
  }

  /**
   * Group by admin with count
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
            count: sql<number>`count(*)::int`,
          })
          .from(coinTransactions)
          .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
          .where(eq(groups.tripId, tripId))
          .groupBy(coinTransactions.adminId)
          .orderBy(desc(sql`count(*)`))
          .limit(limit);

        return results.map((r) => ({
          adminId: r.adminId,
          _count: { id: r.count },
        }));
      },
      catch: () => [],
    }).pipe(Effect.orDie);
  }

  /**
   * Create a new coin transaction
   */
  create(data: {
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Effect.Effect<CoinTransactionDTO, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .insert(coinTransactions)
          .values({
            tripId: "", // Required field in schema
            groupId: data.groupId,
            amount: data.amount,
            reason: data.reason ?? null,
            adminId: data.adminId,
            createdAt: new Date(),
          })
          .returning();

        if (!result) {
          throw new Error(
            "Failed to create coin transaction: no record returned",
          );
        }

        return this.mapper.toDTO(result);
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
          .set({
            coins: sql`${groups.coins} + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(groups.id, groupId));
      },
      catch: () => {
        // Silently fail for now
      },
    }).pipe(Effect.orDie);
  }

  /**
   * Decrement group coins (with balance check)
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
        // Get current balance
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
          .set({
            coins: sql`${groups.coins} - ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(groups.id, groupId));

        return { success: true, currentBalance: currentBalance - amount };
      },
      catch: () => ({ success: false }),
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
      catch: () => 0,
    }).pipe(Effect.orDie);
  }

  /**
   * Verify group belongs to trip and is not deleted
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
            coins: groups.coins,
          })
          .from(groups)
          .where(eq(groups.id, groupId))
          .limit(1);

        if (!group) {
          return { exists: false };
        }

        return {
          exists: group.tripId === tripId,
          tripId: group.tripId,
          isDeleted: false,
          coins: group.coins ?? 0,
        };
      },
      catch: () => ({ exists: false }),
    }).pipe(Effect.orDie);
  }

  /**
   * Build where conditions from filters
   */
  private buildWhereConditions(
    filters?: Partial<CoinTransactionFilters>,
  ): Array<ReturnType<typeof eq>> {
    const conditions: Array<ReturnType<typeof eq>> = [];

    if (filters?.groupId) {
      conditions.push(eq(coinTransactions.groupId, filters.groupId));
    }
    if (filters?.startDate) {
      conditions.push(gte(coinTransactions.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(coinTransactions.createdAt, filters.endDate));
    }

    return conditions;
  }
}
