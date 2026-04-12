import { Effect } from "effect";
import type {
  CoinTransactionRepository,
  CoinStatistics,
} from "../ports/CoinTransactionRepository";
import { CoinTransactionRepositoryTag } from "../ports/CoinTransactionRepository";

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
 * Error types for GetCoinStatistics use case
 */
export class GetStatisticsError extends Error {
  readonly _tag = "GetStatisticsError";
  constructor(message: string) {
    super(`Failed to get coin statistics: ${message}`);
  }
}

/**
 * GetCoinStatistics Use Case
 *
 * Retrieves comprehensive statistics about coin transactions for a trip.
 * Includes transaction count, added coins, removed coins, and net balance.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * // With dependency injection
 * const program = getCoinStatisticsUseCase(input);
 *
 * // Provide repository implementation
 * const runnable = program.pipe(
 *   Effect.provideService(CoinTransactionRepositoryTag, repository)
 * );
 *
 * // Run the effect
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getCoinStatisticsUseCase(
  input: GetCoinStatisticsInput,
): Effect.Effect<
  GetCoinStatisticsOutput,
  GetStatisticsError,
  CoinTransactionRepositoryTag
> {
  return Effect.gen(function* () {
    const coinRepo = yield* CoinTransactionRepositoryTag;

    const [transactionCount, addedCoins, removedCoins] = yield* Effect.all([
      coinRepo.count({ tripId: input.tripId }),
      coinRepo.sumAddedCoins(input.tripId),
      coinRepo.sumRemovedCoins(input.tripId),
    ]);

    const added = addedCoins ?? 0;
    const removed = removedCoins ?? 0;

    return {
      transactionCount,
      addedCoins: added,
      removedCoins: removed,
      netBalance: added + removed,
      time: new Date(),
    };
  }).pipe(
    Effect.catchAll((error) =>
      Effect.fail(
        new GetStatisticsError(
          error instanceof Error ? error.message : String(error),
        ),
      ),
    ),
  );
}
