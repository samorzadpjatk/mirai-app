import { Effect } from "effect";
import { eq, and, desc, sql, count, sum, gte, lte } from "drizzle-orm";
import { coinTransactions } from "@mirai-app/frameworks/drizzle";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import { GroupId } from "@mirai-app/domain";
import type {
  ICoinTransactionPort,
  CoinTransactionDTO,
} from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { coinTransactionMapper } from "../../mappers/CoinTransactionMapper";

/**
 * CoinTransaction Drizzle Gateway
 *
 * Implements ICoinTransactionPort using Drizzle ORM for PostgreSQL.
 * Includes optional authentication token parameter for financial data protection.
 */
export class CoinTransactionDrizzleGateway
  extends BaseDrizzleGateway
  implements ICoinTransactionPort
{
  findById(id: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.findById",
      async () => {
        const result = await this.db.query.coinTransactions.findFirst({
          where: eq(coinTransactions.id, id),
        });
        return result ? coinTransactionMapper.toDTO(result) : null;
      },
      id,
    );
  }

  findByGroupId(groupId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.findByGroupId",
      async () => {
        const results = await this.db.query.coinTransactions.findMany({
          where: eq(coinTransactions.groupId, groupId),
          orderBy: desc(coinTransactions.createdAt),
        });
        return coinTransactionMapper.toDTOs(results);
      },
      groupId,
    );
  }

  findByTripId(tripId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.findByTripId",
      async () => {
        const results = await this.db.query.coinTransactions.findMany({
          where: eq(coinTransactions.tripId, tripId),
          orderBy: desc(coinTransactions.createdAt),
        });
        return coinTransactionMapper.toDTOs(results);
      },
      tripId,
    );
  }

  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
    _authToken?: string,
  ) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.findByTripIdPaginated",
      async () => {
        const [results, totalResult] = await Promise.all([
          this.db.query.coinTransactions.findMany({
            where: eq(coinTransactions.tripId, tripId),
            orderBy: desc(coinTransactions.createdAt),
            limit: params.limit,
            offset: params.offset,
          }),
          this.db
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
      tripId,
    );
  }

  findByTripIdAndGroupId(tripId: string, groupId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.findByTripIdAndGroupId",
      async () => {
        const results = await this.db.query.coinTransactions.findMany({
          where: and(
            eq(coinTransactions.tripId, tripId),
            eq(coinTransactions.groupId, groupId),
          ),
          orderBy: desc(coinTransactions.createdAt),
        });
        return coinTransactionMapper.toDTOs(results);
      },
      `${tripId}_${groupId}`,
    );
  }

  create(transaction: CoinTransactionDTO, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.create",
      async () => {
        const insertData = coinTransactionMapper.toInsert(transaction);
        await this.db.insert(coinTransactions).values(insertData);
        return transaction;
      },
      transaction.id,
    );
  }

  delete(id: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.delete",
      async () => {
        await this.db
          .delete(coinTransactions)
          .where(eq(coinTransactions.id, id));
      },
      id,
    );
  }

  sumByGroupId(groupId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.sumByGroupId",
      async () => {
        const result = await this.db
          .select({ total: sum(coinTransactions.amount) })
          .from(coinTransactions)
          .where(eq(coinTransactions.groupId, groupId));
        const total = result[0]?.total;
        if (total === null || total === undefined) return 0;
        return typeof total === "string" ? Number(total) : total;
      },
      groupId,
    );
  }

  countByTripId(tripId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.countByTripId",
      async () => {
        const result = await this.db
          .select({ count: count() })
          .from(coinTransactions)
          .where(eq(coinTransactions.tripId, tripId));
        return result[0]?.count ?? 0;
      },
      tripId,
    );
  }

  sumPositiveByTripId(tripId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.sumPositiveByTripId",
      async () => {
        const result = await this.db
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
      tripId,
    );
  }

  sumNegativeByTripId(tripId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.sumNegativeByTripId",
      async () => {
        const result = await this.db
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
      tripId,
    );
  }

  getMostActiveAdminStats(tripId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.getMostActiveAdminStats",
      async () => {
        const results = await this.db
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
      tripId,
    );
  }

  getRichestGroup(tripId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.getRichestGroup",
      async () => {
        const result = await this.db
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
      tripId,
    );
  }

  findRecentByTripId(tripId: string, limit: number, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.findRecentByTripId",
      async () => {
        const results = await this.db.query.coinTransactions.findMany({
          where: eq(coinTransactions.tripId, tripId),
          orderBy: desc(coinTransactions.createdAt),
          limit,
        });
        return coinTransactionMapper.toDTOs(results);
      },
      tripId,
    );
  }

  // ============================================================================
  // USER-SPECIFIC QUERIES (for ownership verification at use-case level)
  // ============================================================================

  /**
   * Find transactions by user ID
   * Note: Ownership verification should be done at the use-case level
   */
  findByUserId(userId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.findByUserId",
      async () => {
        // Query transactions where user is admin (creator)
        const results = await this.db.query.coinTransactions.findMany({
          where: eq(coinTransactions.adminId, userId),
          orderBy: desc(coinTransactions.createdAt),
        });
        return coinTransactionMapper.toDTOs(results);
      },
      userId,
    );
  }

  /**
   * Get user balance
   * Note: Ownership verification should be done at the use-case level
   */
  getUserBalance(userId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.getUserBalance",
      async () => {
        // Query transactions where user is admin (creator)
        const result = await this.db
          .select({ total: sum(coinTransactions.amount) })
          .from(coinTransactions)
          .where(eq(coinTransactions.adminId, userId));

        const total = result[0]?.total;
        if (total === null || total === undefined) return 0;
        return typeof total === "string" ? Number(total) : total;
      },
      userId,
    );
  }

  /**
   * Get user transactions
   * Note: Ownership verification should be done at the use-case level
   */
  getUserTransactions(userId: string, _authToken?: string) {
    return this.tryPromise(
      "CoinTransactionDrizzleGateway.getUserTransactions",
      async () => {
        const results = await this.db.query.coinTransactions.findMany({
          where: eq(coinTransactions.adminId, userId),
          orderBy: desc(coinTransactions.createdAt),
        });
        return coinTransactionMapper.toDTOs(results);
      },
      userId,
    );
  }
}