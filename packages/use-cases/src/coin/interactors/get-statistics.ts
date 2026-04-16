import { Data, Effect } from "effect";
import type {
  CoinTransactionRepository,
  CoinStatistics,
} from "../ports/gateway";
import { CoinTransactionGatewayTag } from "../ports/gateway";

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
export class GetStatisticsError extends Data.TaggedError("GetStatisticsError")<{
  message: string;
}> {}

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
 *   Effect.provideService(CoinTransactionGatewayTag, repository)
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
  CoinTransactionGatewayTag
> {
  return Effect.gen(function* () {
    const coinRepo = yield* CoinTransactionGatewayTag;

    const countResult = yield* Effect.either(
      coinRepo.count({ tripId: input.tripId }),
    );
    const addedResult = yield* Effect.either(
      coinRepo.sumAddedCoins(input.tripId),
    );
    const removedResult = yield* Effect.either(
      coinRepo.sumRemovedCoins(input.tripId),
    );

    if (countResult._tag === "Left") {
      return yield* Effect.fail(
        new GetStatisticsError({ message: "Failed to get coin statistics" }),
      );
    }

    if (addedResult._tag === "Left") {
      return yield* Effect.fail(
        new GetStatisticsError({ message: "Failed to get coin statistics" }),
      );
    }

    if (removedResult._tag === "Left") {
      return yield* Effect.fail(
        new GetStatisticsError({ message: "Failed to get coin statistics" }),
      );
    }

    const transactionCount = countResult.right;
    const addedCoins = addedResult.right;
    const removedCoins = removedResult.right;

    const added = addedCoins ?? 0;
    const removed = removedCoins ?? 0;

    return {
      transactionCount,
      addedCoins: added,
      removedCoins: removed,
      netBalance: added + removed,
      time: new Date(),
    };
  });
}
