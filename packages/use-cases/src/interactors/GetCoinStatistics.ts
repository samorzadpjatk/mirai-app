import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
import type {
  CoinTransactionRepository,
  CoinStatistics,
} from "../ports/CoinTransactionRepository";

/**
 * Input for GetCoinStatistics use case
 */
export interface GetCoinStatisticsInput {
  tripId: string;
}

/**
 * Output for GetCoinStatistics use case
 */
export interface GetCoinStatisticsOutput extends CoinStatistics {
  time: Date;
}

/**
 * GetCoinStatistics Use Case
 *
 * Retrieves comprehensive statistics about coin transactions for a trip.
 * Includes transaction count, added coins, removed coins, and net balance.
 */
export class GetCoinStatisticsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  async execute(
    input: GetCoinStatisticsInput,
  ): Promise<Result<GetCoinStatisticsOutput, string>> {
    try {
      const [transactionCount, addedCoins, removedCoins] = await Promise.all([
        this.coinRepo.count({ tripId: input.tripId }),
        this.coinRepo.sumAddedCoins(input.tripId),
        this.coinRepo.sumRemovedCoins(input.tripId),
      ]);

      const added = addedCoins ?? 0;
      const removed = removedCoins ?? 0;

      return ok({
        transactionCount,
        addedCoins: added,
        removedCoins: removed,
        netBalance: added + removed,
        time: new Date(),
      });
    } catch (error) {
      return err(
        `Failed to get coin statistics: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
