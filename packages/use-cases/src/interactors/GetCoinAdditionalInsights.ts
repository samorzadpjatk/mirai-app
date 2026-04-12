import { Effect } from "effect";
import {
  CoinTransactionRepositoryTag,
  type CoinTransaction,
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
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getCoinAdditionalInsightsUseCase(input).pipe(
 *   Effect.provideService(CoinTransactionRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getCoinAdditionalInsightsUseCase(
  input: GetCoinAdditionalInsightsInput,
): Effect.Effect<
  GetCoinAdditionalInsightsOutput | null,
  never,
  CoinTransactionRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* CoinTransactionRepositoryTag;

    const limit = input.recentLimit ?? 5;

    const [recentTransactions, mostActiveAdminStats] = yield* Effect.all([
      repo.findRecent({ tripId: input.tripId }, limit),
      repo.groupByAdmin(input.tripId, 1),
    ]);

    if (
      (!recentTransactions || recentTransactions.length === 0) &&
      (!mostActiveAdminStats || mostActiveAdminStats.length === 0)
    ) {
      return null;
    }

    const topAdmin = mostActiveAdminStats?.[0];
    return {
      mostActiveAdmin: topAdmin
        ? {
            name: topAdmin.adminId, // Name will be resolved by caller
            transactionCount: topAdmin._count.id,
          }
        : null,
      recentTransactions: recentTransactions ?? [],
    };
  });
}
