import { Effect } from "effect";
import { CoinTransactionPort } from "../ports/CoinTransactionPort";
import type { ApplicationError, UserId } from "@mirai-app/domain";
import { CoinTransactionId, GroupId } from "@mirai-app/domain";

/**
 * Input for GetAdditionalInsightsUseCase
 */
export interface GetAdditionalInsightsInput {
  tripId: string;
}

/**
 * Recent transaction DTO
 */
export interface RecentTransactionDTO {
  id: string;
  amount: number;
  reason: string | null;
  createdAt: Date;
  groupName: string;
}

/**
 * Additional insights result DTO
 */
export interface AdditionalInsightsDTO {
  mostActiveAdmin: {
    name: string;
    transactionCount: number;
  } | null;
  recentTransactions: RecentTransactionDTO[];
}

/**
 * Get Additional Insights Use Case
 *
 * Retrieves additional insights about coin transactions.
 */
export class GetAdditionalInsightsUseCase {
  execute(
    input: GetAdditionalInsightsInput,
  ): Effect.Effect<
    AdditionalInsightsDTO | null,
    ApplicationError,
    CoinTransactionPort
  > {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPort;

      const recentTransactions = yield* coinPort.findRecentByTripId(
        input.tripId,
        5,
      );

      if (recentTransactions.length === 0) {
        return null;
      }

      const mostActiveStats = yield* coinPort.getMostActiveAdminStats(
        input.tripId,
      );

      const mappedTransactions: RecentTransactionDTO[] = recentTransactions.map(
        (t) => ({
          id: t.id,
          amount: t.amount,
          reason: t.reason,
          createdAt: t.createdAt,
          groupName: "", // Will be hydrated by adapter
        }),
      );

      const mostActiveAdmin =
        mostActiveStats.length > 0 && mostActiveStats[0]
          ? {
              name: "", // Will be hydrated by adapter
              transactionCount: mostActiveStats[0].transactionCount,
            }
          : null;

      return {
        mostActiveAdmin,
        recentTransactions: mappedTransactions,
      };
    });
  }
}
