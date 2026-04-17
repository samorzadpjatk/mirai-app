import { Effect } from "effect";
import { CoinTransactionPort } from "../ports/CoinTransactionPort";
import type { ApplicationError, UserId } from "@mirai-app/domain";

/**
 * Input for GetMostActiveAdminStatsUseCase
 */
export interface GetMostActiveAdminStatsInput {
  tripId: string;
}

/**
 * Most active admin stats DTO
 */
export interface MostActiveAdminStatsDTO {
  adminId: UserId;
  totalAmount: number;
  transactionCount: number;
}

/**
 * Get Most Active Admin Stats Use Case
 *
 * Retrieves statistics about the most active admin for coin transactions.
 */
export class GetMostActiveAdminStatsUseCase {
  execute(
    input: GetMostActiveAdminStatsInput,
  ): Effect.Effect<
    MostActiveAdminStatsDTO | null,
    ApplicationError,
    CoinTransactionPort
  > {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPort;

      const stats = yield* coinPort.getMostActiveAdminStats(input.tripId);

      if (stats.length === 0 || !stats[0]) {
        return null;
      }

      const topAdmin = stats[0];

      return {
        adminId: topAdmin.adminId as UserId,
        totalAmount: topAdmin.totalAmount,
        transactionCount: topAdmin.transactionCount,
      };
    });
  }
}
