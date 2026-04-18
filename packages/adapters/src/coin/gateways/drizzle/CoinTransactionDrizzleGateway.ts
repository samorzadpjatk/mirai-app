import { Effect } from "effect";
import { eq, and, desc, sql, count, sum, gte, lte } from "drizzle-orm";
import { coinTransactions } from "../../../infrastructure/drizzle";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import { GroupId, DatabaseError } from "@mirai-app/domain";
import type {
  ICoinTransactionPort,
  CoinTransactionDTO,
} from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { coinTransactionMapper } from "../../mappers/CoinTransactionMapper";

/**
 * CoinTransaction Drizzle Gateway
 *
 * Implements ICoinTransactionPort using Drizzle ORM for PostgreSQL.
 *
 * Authorization Pattern:
 * This gateway uses the AuthContext pattern for authorization. All methods
 * access authentication context via `yield* AuthContextTag` and perform strict
 * authorization checks via `yield* AuthZPortTag.verifyAccess()` before executing
 * database operations.
 *
 * Financial data requires strict auth - verify for all operations:
 * - All queries use "read" permission
 * - All mutations use "write" permission
 * - Uses userId, role, and tripRoles from AuthContext
 */
export class CoinTransactionDrizzleGateway
  extends BaseDrizzleGateway
  implements ICoinTransactionPort
{
  findById(id: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch the transaction first to get tripId for auth check
      const result = yield* Effect.tryPromise({
        try: async () => {
          return await self.db.query.coinTransactions.findFirst({
            where: eq(coinTransactions.id, id),
          });
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findById",
            id,
            cause: error,
          }),
      });

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated && result) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: result.tripId,
          requiredPermission: "read",
        });
      }

      return result ? coinTransactionMapper.toDTO(result) : null;
    });
  }

  findByGroupId(groupId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: groupId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db.query.coinTransactions.findMany({
            where: eq(coinTransactions.groupId, groupId),
            orderBy: desc(coinTransactions.createdAt),
          });
          return coinTransactionMapper.toDTOs(results);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findByGroupId",
            id: groupId,
            cause: error,
          }),
      });
    });
  }

  findByTripId(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db.query.coinTransactions.findMany({
            where: eq(coinTransactions.tripId, tripId),
            orderBy: desc(coinTransactions.createdAt),
          });
          return coinTransactionMapper.toDTOs(results);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findByTripId",
            id: tripId,
            cause: error,
          }),
      });
    });
  }

  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
  ) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const [results, totalResult] = await Promise.all([
            self.db.query.coinTransactions.findMany({
              where: eq(coinTransactions.tripId, tripId),
              orderBy: desc(coinTransactions.createdAt),
              limit: params.limit,
              offset: params.offset,
            }),
            self.db
              .select({ count: count() })
              .from(coinTransactions)
              .where(eq(coinTransactions.tripId, tripId))
              .then((r) => r[0]?.count ?? 0),
          ]);

          return {
            transactions: coinTransactionMapper.toDTOs(results),
            total: totalResult,
          };
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findByTripIdPaginated",
            id: tripId,
            cause: error,
          }),
      });
    });
  }

  findByTripIdAndGroupId(tripId: string, groupId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db.query.coinTransactions.findMany({
            where: and(
              eq(coinTransactions.tripId, tripId),
              eq(coinTransactions.groupId, groupId),
            ),
            orderBy: desc(coinTransactions.createdAt),
          });
          return coinTransactionMapper.toDTOs(results);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findByTripIdAndGroupId",
            id: `${tripId}_${groupId}`,
            cause: error,
          }),
      });
    });
  }

  create(transaction: CoinTransactionDTO) {
    const self = this;
    const insertData = coinTransactionMapper.toInsert(transaction);

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification for writes
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: transaction.tripId,
          requiredPermission: "write",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          await self.db.insert(coinTransactions).values(insertData);
          return transaction;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "create",
            id: transaction.id,
            cause: error,
          }),
      });
    });
  }

  delete(id: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Fetch transaction first to get tripId for auth check
      const transaction = yield* Effect.tryPromise({
        try: async () => {
          return await self.db.query.coinTransactions.findFirst({
            where: eq(coinTransactions.id, id),
          });
        },
        catch: (error) =>
          new DatabaseError({
            operation: "delete",
            id,
            cause: error,
          }),
      });

      // Financial data requires strict auth verification for deletes
      if (authCtx.isAuthenticated && transaction) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: transaction.tripId,
          requiredPermission: "admin",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          await self.db
            .delete(coinTransactions)
            .where(eq(coinTransactions.id, id));
        },
        catch: (error) =>
          new DatabaseError({
            operation: "delete",
            id,
            cause: error,
          }),
      });
    });
  }

  sumByGroupId(groupId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: groupId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .select({ total: sum(coinTransactions.amount) })
            .from(coinTransactions)
            .where(eq(coinTransactions.groupId, groupId));
          const total = result[0]?.total;
          if (total === null || total === undefined) return 0;
          return typeof total === "string" ? Number(total) : total;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "sumByGroupId",
            id: groupId,
            cause: error,
          }),
      });
    });
  }

  countByTripId(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .select({ count: count() })
            .from(coinTransactions)
            .where(eq(coinTransactions.tripId, tripId));
          return result[0]?.count ?? 0;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "countByTripId",
            id: tripId,
            cause: error,
          }),
      });
    });
  }

  sumPositiveByTripId(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .select({ total: sum(coinTransactions.amount) })
            .from(coinTransactions)
            .where(
              and(
                eq(coinTransactions.tripId, tripId),
                gte(coinTransactions.amount, 0),
              ),
            );
          const total = result[0]?.total;
          if (total === null || total === undefined) return 0;
          return typeof total === "string" ? Number(total) : total;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "sumPositiveByTripId",
            id: tripId,
            cause: error,
          }),
      });
    });
  }

  sumNegativeByTripId(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .select({ total: sum(coinTransactions.amount) })
            .from(coinTransactions)
            .where(
              and(
                eq(coinTransactions.tripId, tripId),
                lte(coinTransactions.amount, 0),
              ),
            );
          const total = result[0]?.total;
          if (total === null || total === undefined) return 0;
          return typeof total === "string" ? Number(total) : total;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "sumNegativeByTripId",
            id: tripId,
            cause: error,
          }),
      });
    });
  }

  getMostActiveAdminStats(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db
            .select({
              adminId: coinTransactions.adminId,
              totalAmount: sum(coinTransactions.amount),
              transactionCount: count(),
            })
            .from(coinTransactions)
            .where(eq(coinTransactions.tripId, tripId))
            .groupBy(coinTransactions.adminId)
            .orderBy(desc(sql`ABS(${sum(coinTransactions.amount)})`));

          return results.map((r) => {
            const total = r.totalAmount;
            const totalAmount =
              total === null || total === undefined
                ? 0
                : typeof total === "string"
                  ? Number(total)
                  : total;
            return {
              adminId: r.adminId,
              totalAmount,
              transactionCount: r.transactionCount,
            };
          });
        },
        catch: (error) =>
          new DatabaseError({
            operation: "getMostActiveAdminStats",
            id: tripId,
            cause: error,
          }),
      });
    });
  }

  getRichestGroup(tripId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .select({
              groupId: coinTransactions.groupId,
              totalCoins: sum(coinTransactions.amount),
            })
            .from(coinTransactions)
            .where(eq(coinTransactions.tripId, tripId))
            .groupBy(coinTransactions.groupId)
            .orderBy(desc(sum(coinTransactions.amount)))
            .limit(1);

          if (!result[0]) {
            return null;
          }

          const total = result[0].totalCoins;
          const totalCoins =
            total === null || total === undefined
              ? 0
              : typeof total === "string"
                ? Number(total)
                : total;

          return {
            groupId: GroupId.unsafeCreate(result[0].groupId),
            totalCoins,
          };
        },
        catch: (error) =>
          new DatabaseError({
            operation: "getRichestGroup",
            id: tripId,
            cause: error,
          }),
      });
    });
  }

  findRecentByTripId(tripId: string, limit: number) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Financial data requires strict auth verification
      if (authCtx.isAuthenticated) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: tripId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db.query.coinTransactions.findMany({
            where: eq(coinTransactions.tripId, tripId),
            orderBy: desc(coinTransactions.createdAt),
            limit,
          });
          return coinTransactionMapper.toDTOs(results);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findRecentByTripId",
            id: tripId,
            cause: error,
          }),
      });
    });
  }

  // ============================================================================
  // USER-SPECIFIC QUERIES (for ownership verification at use-case level)
  // ============================================================================

  /**
   * Find transactions by user ID
   * Note: Ownership verification uses AuthContext pattern
   */
  findByUserId(userId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify user can only access their own transactions
      if (authCtx.isAuthenticated && authCtx.userId !== userId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: userId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db.query.coinTransactions.findMany({
            where: eq(coinTransactions.adminId, userId),
            orderBy: desc(coinTransactions.createdAt),
          });
          return coinTransactionMapper.toDTOs(results);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findByUserId",
            id: userId,
            cause: error,
          }),
      });
    });
  }

  /**
   * Get user balance
   * Note: Ownership verification uses AuthContext pattern
   */
  getUserBalance(userId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify user can only access their own balance
      if (authCtx.isAuthenticated && authCtx.userId !== userId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: userId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const result = await self.db
            .select({ total: sum(coinTransactions.amount) })
            .from(coinTransactions)
            .where(eq(coinTransactions.adminId, userId));

          const total = result[0]?.total;
          if (total === null || total === undefined) return 0;
          return typeof total === "string" ? Number(total) : total;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "getUserBalance",
            id: userId,
            cause: error,
          }),
      });
    });
  }

  /**
   * Get user transactions
   * Note: Ownership verification uses AuthContext pattern
   */
  getUserTransactions(userId: string) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // Verify user can only access their own transactions
      if (authCtx.isAuthenticated && authCtx.userId !== userId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "coin",
          resourceId: userId,
          requiredPermission: "read",
        });
      }

      return yield* Effect.tryPromise({
        try: async () => {
          const results = await self.db.query.coinTransactions.findMany({
            where: eq(coinTransactions.adminId, userId),
            orderBy: desc(coinTransactions.createdAt),
          });
          return coinTransactionMapper.toDTOs(results);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "getUserTransactions",
            id: userId,
            cause: error,
          }),
      });
    });
  }
}
