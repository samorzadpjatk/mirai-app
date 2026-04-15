import type { CoinTransactionRepository } from "@mirai-app/domain/ports";
import type {
  CoinTransaction,
  CoinTransactionFilters,
  MostActiveAdminStat,
  CoinStatistics,
  PaginationOptions,
  PaginatedResult,
} from "@mirai-app/domain/ports";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  coinTransactions,
  groups,
  users,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, desc, gte, lte, sql, isNull } from "drizzle-orm";
import { Effect } from "effect";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * DrizzleCoinTransactionGateway
 *
 * Implements the CoinTransactionRepository port using Drizzle ORM.
 */
export class DrizzleCoinTransactionGateway implements CoinTransactionRepository {
  constructor(private db: DrizzleDb) {}

  /**
   * Find transaction by ID
   */
  findById(
    id: string,
  ): Effect.Effect<CoinTransaction | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({
            id: coinTransactions.id,
            groupId: coinTransactions.groupId,
            amount: coinTransactions.amount,
            reason: coinTransactions.reason,
            adminId: coinTransactions.adminId,
            createdAt: coinTransactions.createdAt,
            groupName: groups.name,
            adminFirstName: users.firstName,
            adminLastName: users.lastName,
          })
          .from(coinTransactions)
          .leftJoin(groups, eq(coinTransactions.groupId, groups.id))
          .leftJoin(users, eq(coinTransactions.adminId, users.id))
          .where(eq(coinTransactions.id, id))
          .limit(1);

        if (!result) return null;

        // Cast to CoinTransaction - the plain object shape matches the interface
        return {
          id: result.id,
          groupId: result.groupId,
          amount: result.amount,
          reason: result.reason,
          adminId: result.adminId,
          createdAt: result.createdAt,
          updatedAt: result.createdAt,
          group: result.groupName
            ? {
                id: result.groupId,
                name: result.groupName,
                coins: 0,
              }
            : undefined,
          admin:
            result.adminFirstName !== undefined
              ? {
                  id: result.adminId,
                  firstName: result.adminFirstName,
                  lastName: result.adminLastName ?? null,
                }
              : undefined,
        } as CoinTransaction;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findById",
          message: "Failed to find coin transaction by ID",
          cause: error,
        }),
    });
  }

  /**
   * Find transactions by group ID with pagination
   */
  findByGroupId(
    groupId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<CoinTransaction>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 10;
        const offset = options?.offset ?? 0;

        // Get total count
        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(coinTransactions)
          .where(eq(coinTransactions.groupId, groupId));

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
            adminFirstName: users.firstName,
            adminLastName: users.lastName,
          })
          .from(coinTransactions)
          .leftJoin(groups, eq(coinTransactions.groupId, groups.id))
          .leftJoin(users, eq(coinTransactions.adminId, users.id))
          .where(eq(coinTransactions.groupId, groupId))
          .orderBy(desc(coinTransactions.createdAt))
          .limit(limit)
          .offset(offset);

        const items: CoinTransaction[] = results.map(
          (r) =>
            ({
              id: r.id,
              groupId: r.groupId,
              amount: r.amount,
              reason: r.reason,
              adminId: r.adminId,
              createdAt: r.createdAt,
              updatedAt: r.createdAt,
              group: r.groupName
                ? {
                    id: r.groupId,
                    name: r.groupName,
                    coins: 0,
                  }
                : undefined,
              admin:
                r.adminFirstName !== undefined
                  ? {
                      id: r.adminId,
                      firstName: r.adminFirstName,
                      lastName: r.adminLastName ?? null,
                    }
                  : undefined,
            }) as CoinTransaction,
        );

        return {
          items,
          total,
          limit,
          offset,
          hasMore: offset + items.length < total,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByGroupId",
          message: "Failed to find coin transactions by group ID",
          cause: error,
        }),
    });
  }

  /**
   * Find transactions with filters and pagination
   */
  findMany(
    filters: CoinTransactionFilters,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<CoinTransaction>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 10;
        const offset = options?.offset ?? 0;

        // Build where conditions
        const conditions = [];
        if (filters.groupId) {
          conditions.push(eq(coinTransactions.groupId, filters.groupId));
        }
        if (filters.startDate) {
          conditions.push(gte(coinTransactions.createdAt, filters.startDate));
        }
        if (filters.endDate) {
          conditions.push(lte(coinTransactions.createdAt, filters.endDate));
        }
        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        // Get total count
        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(coinTransactions)
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
            adminFirstName: users.firstName,
            adminLastName: users.lastName,
          })
          .from(coinTransactions)
          .leftJoin(groups, eq(coinTransactions.groupId, groups.id))
          .leftJoin(users, eq(coinTransactions.adminId, users.id))
          .where(whereClause)
          .orderBy(desc(coinTransactions.createdAt))
          .limit(limit)
          .offset(offset);

        const items: CoinTransaction[] = results.map(
          (r) =>
            ({
              id: r.id,
              groupId: r.groupId,
              amount: r.amount,
              reason: r.reason,
              adminId: r.adminId,
              createdAt: r.createdAt,
              updatedAt: r.createdAt,
              group: r.groupName
                ? {
                    id: r.groupId,
                    name: r.groupName,
                    coins: 0,
                  }
                : undefined,
              admin:
                r.adminFirstName !== undefined
                  ? {
                      id: r.adminId,
                      firstName: r.adminFirstName,
                      lastName: r.adminLastName ?? null,
                    }
                  : undefined,
            }) as CoinTransaction,
        );

        return {
          items,
          total,
          limit,
          offset,
          hasMore: offset + items.length < total,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findMany",
          message: "Failed to find coin transactions",
          cause: error,
        }),
    });
  }

  /**
   * Create a new coin transaction
   */
  create(
    transaction: CoinTransaction,
  ): Effect.Effect<CoinTransaction, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .insert(coinTransactions)
          .values({
            tripId: "", // Required field in schema
            groupId: transaction.groupId,
            amount: transaction.amount,
            reason: transaction.reason ?? null,
            adminId: transaction.adminId,
            createdAt: transaction.createdAt ?? new Date(),
          })
          .returning();

        if (!result) {
          throw new Error(
            "Failed to create coin transaction: no record returned",
          );
        }

        return {
          ...transaction,
          id: result.id,
        } as CoinTransaction;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "create",
          message: "Failed to create coin transaction",
          cause: error,
        }),
    });
  }

  /**
   * Get coin statistics for a group
   */
  getStatistics(
    groupId: string,
  ): Effect.Effect<CoinStatistics, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({
            totalEarned: sql<number>`sum(case when ${coinTransactions.amount} > 0 then ${coinTransactions.amount} else 0 end)::int`,
            totalSpent: sql<number>`sum(case when ${coinTransactions.amount} < 0 then abs(${coinTransactions.amount}) else 0 end)::int`,
          })
          .from(coinTransactions)
          .where(eq(coinTransactions.groupId, groupId));

        const totalEarned = result?.totalEarned ?? 0;
        const totalSpent = result?.totalSpent ?? 0;

        return {
          totalEarned,
          totalSpent,
          netBalance: totalEarned - totalSpent,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getStatistics",
          message: "Failed to get coin statistics",
          cause: error,
        }),
    });
  }

  /**
   * Get most active admins for a trip
   */
  getMostActiveAdmins(
    tripId: string,
    limit: number = 5,
  ): Effect.Effect<MostActiveAdminStat[], DatabaseError, never> {
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
          .orderBy(desc(sql`sum(${coinTransactions.amount})`))
          .limit(limit);

        return results.map((r) => ({
          adminId: r.adminId,
          adminName: r.adminName.trim() || "Unknown",
          transactionCount: r.transactionCount,
          coinsAwarded: r.coinsAwarded,
        }));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getMostActiveAdmins",
          message: "Failed to get most active admins",
          cause: error,
        }),
    });
  }

  /**
   * Get current balance for a group
   */
  getBalance(groupId: string): Effect.Effect<number, DatabaseError, never> {
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
          operation: "getBalance",
          message: "Failed to get group balance",
          cause: error,
        }),
    });
  }
}
