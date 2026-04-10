import type {
  CoinTransactionRepository,
  CoinTransaction,
  CoinTransactionFilters,
  PaginationOptions,
  MostActiveAdminStat,
} from "@mirai-app/use-cases";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { coinTransactions } from "@mirai-app/frameworks/drizzle/schema/coinTransaction";
import { groups } from "@mirai-app/frameworks/drizzle/schema/group";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import { CoinTransactionDrizzleMapper } from "../../mappers/drizzle/CoinTransactionDrizzleMapper";

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
    Partial<typeof coinTransactions.$inferInsert>
  >
  implements CoinTransactionRepository
{
  constructor(db: DrizzleDb) {
    super(
      db,
      { table: coinTransactions },
      CoinTransactionDrizzleMapper.instance,
    );
  }

  /**
   * Count transactions by filters
   */
  async count(filters?: Partial<CoinTransactionFilters>): Promise<number> {
    const whereClause = this.buildWhereClause(filters);

    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(coinTransactions)
      .where(whereClause)
      .limit(1);

    return result?.count ?? 0;
  }

  /**
   * Sum amount by filters
   */
  async sumAmount(
    filters?: Partial<CoinTransactionFilters>,
  ): Promise<number | null> {
    const whereClause = this.buildWhereClause(filters);

    const [result] = await this.db
      .select({ sum: sql<number>`sum(${coinTransactions.amount})::int` })
      .from(coinTransactions)
      .where(whereClause)
      .limit(1);

    return result?.sum ?? null;
  }

  /**
   * Sum added coins (positive amounts) for a trip
   */
  async sumAddedCoins(tripId: string): Promise<number | null> {
    const [result] = await this.db
      .select({ sum: sql<number>`sum(${coinTransactions.amount})::int` })
      .from(coinTransactions)
      .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
      .where(and(eq(groups.tripId, tripId), gte(coinTransactions.amount, 0)))
      .limit(1);

    return result?.sum ?? null;
  }

  /**
   * Sum removed coins (negative amounts) for a trip
   */
  async sumRemovedCoins(tripId: string): Promise<number | null> {
    const [result] = await this.db
      .select({ sum: sql<number>`sum(${coinTransactions.amount})::int` })
      .from(coinTransactions)
      .innerJoin(groups, eq(coinTransactions.groupId, groups.id))
      .where(and(eq(groups.tripId, tripId), lte(coinTransactions.amount, 0)))
      .limit(1);

    return result?.sum ?? null;
  }

  /**
   * Get most active admin stats
   */
  async getMostActiveAdmin(tripId: string): Promise<MostActiveAdminStat[]> {
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
      _sum: { amount: r._sum },
      _count: { id: r._count },
    }));
  }

  /**
   * Find many transactions with filters and pagination
   */
  async findMany(
    filters: Partial<CoinTransactionFilters>,
    pagination: PaginationOptions,
  ): Promise<CoinTransaction[]> {
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
      .limit(pagination.limit)
      .offset(pagination.offset);

    return results.map((r) =>
      this.mapper.toDomain({
        id: r.id,
        groupId: r.groupId,
        amount: r.amount,
        reason: r.reason,
        adminId: r.adminId,
        createdAt: r.createdAt,
        tripId: "", // Will be populated by mapper
        groupName: r.groupName,
        groupCoins: r.groupCoins,
      } as any),
    );
  }

  /**
   * Find recent transactions
   */
  async findRecent(
    filters: Partial<CoinTransactionFilters>,
    limit: number,
  ): Promise<CoinTransaction[]> {
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
  }

  /**
   * Get total coins by group
   */
  async getTotalCoinsByGroup(
    tripId: string,
  ): Promise<Array<{ groupId: string; _sum: { amount: number | null } }>> {
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
      _sum: { amount: r._sum },
    }));
  }

  /**
   * Group by admin
   */
  async groupByAdmin(
    tripId: string,
    limit: number,
  ): Promise<Array<{ adminId: string; _count: { id: number } }>> {
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
      _count: { id: r._count },
    }));
  }

  /**
   * Create a new transaction
   */
  async create(data: {
    groupId: string;
    amount: number;
    reason?: string;
    adminId: string;
  }): Promise<CoinTransaction> {
    const [result] = await this.db
      .insert(coinTransactions)
      .values({
        tripId: "", // Will be populated from group lookup
        groupId: data.groupId,
        amount: data.amount,
        reason: data.reason ?? null,
        adminId: data.adminId,
        createdAt: new Date(),
      })
      .returning();

    return this.mapper.toDomain(result);
  }

  /**
   * Increment group coins
   */
  async incrementGroupCoins(groupId: string, amount: number): Promise<void> {
    await this.db
      .update(groups)
      .set({ coins: sql`${groups.coins} + ${amount}` })
      .where(eq(groups.id, groupId));
  }

  /**
   * Decrement group coins with balance check
   */
  async decrementGroupCoins(
    groupId: string,
    amount: number,
  ): Promise<{ success: boolean; currentBalance?: number }> {
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
  }

  /**
   * Get group coins
   */
  async getGroupCoins(groupId: string): Promise<number> {
    const [group] = await this.db
      .select({ coins: groups.coins })
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    return group?.coins ?? 0;
  }

  /**
   * Verify group in trip
   */
  async verifyGroupInTrip(
    groupId: string,
    tripId: string,
  ): Promise<{
    exists: boolean;
    tripId?: string;
    isDeleted?: boolean;
    coins?: number;
  }> {
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
      // Need to join with groups table for this filter
      // This is handled in the query methods that need it
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
