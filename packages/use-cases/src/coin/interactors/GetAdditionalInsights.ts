import { Effect } from "effect";
import { CoinTransactionPortTag } from "../ports/CoinTransactionPort";
import { GroupPortTag } from "../../group/ports/GroupPort";
import { UserPortTag } from "../../user/ports/UserPort";
import { GroupId, UserId } from "@mirai-app/domain";

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
  execute(input: GetAdditionalInsightsInput) {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPortTag;
      const groupPort = yield* GroupPortTag;
      const userPort = yield* UserPortTag;

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

      // Fetch all groups for recent transactions in parallel
      const groupEffects = recentTransactions.map((t) =>
        groupPort.findById(GroupId.unsafeCreate(t.groupId)),
      );
      const groups = yield* Effect.all(groupEffects, {
        concurrency: "unbounded",
      });

      // Fetch user for most active admin if exists
      let mostActiveAdminUser = null;
      if (mostActiveStats.length > 0 && mostActiveStats[0]) {
        const adminId = mostActiveStats[0].adminId;
        mostActiveAdminUser = yield* userPort.findById(
          UserId.unsafeCreate(adminId),
        );
      }

      // Map transactions with actual group names
      const mappedTransactions: RecentTransactionDTO[] = recentTransactions.map(
        (t, index) => {
          const group = groups[index];
          return {
            id: t.id,
            amount: t.amount,
            reason: t.reason,
            createdAt: t.createdAt,
            groupName: group?.name ?? "Unknown Group",
          };
        },
      );

      // Build most active admin with actual user name
      const mostActiveAdmin =
        mostActiveStats.length > 0 && mostActiveStats[0]
          ? {
              name: mostActiveAdminUser?.getFullName() ?? "Unknown User",
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
