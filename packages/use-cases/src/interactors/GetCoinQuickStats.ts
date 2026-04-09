import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type { CoinTransactionRepository } from "../ports/CoinTransactionRepository";

/**
 * Input for GetCoinQuickStats use case
 */
export interface GetCoinQuickStatsInput {
  tripId: string;
}

/**
 * Output for GetCoinQuickStats use case
 */
export interface GetCoinQuickStatsOutput {
  totalCoins: number;
  totalGroups: number;
  averageCoinsPerGroup: number;
  richestGroupId?: string;
  richestGroupName?: string;
  time: Date;
}

/**
 * GetCoinQuickStats Use Case
 *
 * Retrieves quick statistics about coin distribution for a trip.
 * Includes total coins, total groups, average, and richest group.
 */
export class GetCoinQuickStatsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  async execute(
    input: GetCoinQuickStatsInput,
  ): Promise<Result<GetCoinQuickStatsOutput | null, string>> {
    try {
      const totalSum = await this.coinRepo.sumAmount({ tripId: input.tripId });

      if (!totalSum) {
        return ok(null);
      }

      const totalCoins = totalSum;
      const transactionCount = await this.coinRepo.count({
        tripId: input.tripId,
      });
      const totalGroups = transactionCount;

      const averageCoinsPerGroup =
        totalGroups > 0 ? Math.round(totalCoins / totalGroups) : 0;

      const groupsByCoins = await this.coinRepo.getTotalCoinsByGroup(
        input.tripId,
      );

      if (!groupsByCoins || groupsByCoins.length === 0) {
        return ok({
          totalCoins,
          totalGroups,
          averageCoinsPerGroup,
          time: new Date(),
        });
      }

      // Find richest group
      const richest = groupsByCoins.reduce((max, current) => {
        const currentAmount = current._sum.amount ?? 0;
        const maxAmount = max?._sum.amount ?? 0;
        return currentAmount > maxAmount ? current : max;
      }, groupsByCoins[0]);

      return ok({
        totalCoins,
        totalGroups,
        averageCoinsPerGroup,
        richestGroupId: richest?.groupId ?? null,
        time: new Date(),
      });
    } catch (error) {
      return err(
        `Failed to get quick stats: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
