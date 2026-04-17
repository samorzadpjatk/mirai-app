import { Effect } from "effect";
import { CoinTransactionPort } from "../ports/CoinTransactionPort";
import type { ApplicationError } from "@mirai-app/domain";

/**
 * Input for GetStatisticsUseCase
 */
export interface GetStatisticsInput {
  tripId: string;
}

/**
 * Statistics result DTO
 */
export interface TransactionStatisticsDTO {
  transactionCount: number;
  addedCoins: number;
  removedCoins: number;
  netBalance: number;
  time: Date;
}

/**
 * Get Transaction Statistics Use Case
 *
 * Retrieves statistics about coin transactions for a trip.
 */
export class GetStatisticsUseCase {
  execute(
    input: GetStatisticsInput,
  ): Effect.Effect<
    TransactionStatisticsDTO,
    ApplicationError,
    CoinTransactionPort
  > {
    return Effect.gen(function* () {
      const coinPort = yield* CoinTransactionPort;

      const [transactionCount, addedCoins, removedCoins] = yield* Effect.all([
        coinPort.countByTripId(input.tripId),
        coinPort.sumPositiveByTripId(input.tripId),
        coinPort.sumNegativeByTripId(input.tripId),
      ]);

      return {
        transactionCount,
        addedCoins,
        removedCoins,
        netBalance: addedCoins + removedCoins,
        time: new Date(),
      };
    });
  }
}
