import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";

/**
 * Input for GetCoinAdditionalInsights use case
 */
export interface GetCoinAdditionalInsightsInput {
  tripId: string;
  recentLimit?: number;
}

export interface FormattedUser {
  name: string;
  transactionCount: number;
}

/**
 * Output for GetCoinAdditionalInsights use case
 */
export interface GetCoinAdditionalInsightsOutput {
  mostActiveAdmin: FormattedUser | null;
  recentTransactions: CoinTransaction[];
}

/**
 * GetCoinAdditionalInsights Use Case
 *
 * Retrieves additional insights about coin transactions.
 * Includes most active admin and recent transactions.
 */
export class GetCoinAdditionalInsightsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  async execute(
    input: GetCoinAdditionalInsightsInput,
  ): Promise<Result<GetCoinAdditionalInsightsOutput | null, string>> {
    try {
      const limit = input.recentLimit ?? 5;

      const [recentTransactions, mostActiveAdminStats] = await Promise.all([
        this.coinRepo.findRecent({ tripId: input.tripId }, limit),
        this.coinRepo.groupByAdmin(input.tripId, 1),
      ]);

      if (
        (!recentTransactions || recentTransactions.length === 0) &&
        (!mostActiveAdminStats || mostActiveAdminStats.length === 0)
      ) {
        return ok(null);
      }

      const topAdmin = mostActiveAdminStats?.[0];
      return ok({
        mostActiveAdmin: topAdmin
          ? {
              name: topAdmin.adminId, // Name will be resolved by caller
              transactionCount: topAdmin._count.id,
            }
          : null,
        recentTransactions: recentTransactions ?? [],
      });
    } catch (error) {
      return err(
        `Failed to get additional insights: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
