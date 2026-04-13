import {
  CoinTransactionRepositoryTag,
  type MostActiveAdminStat,
} from "../ports/CoinTransactionRepository";
import { Effect } from "effect";

/**
 * Input for GetMostActiveAdminStats use case
 */
export interface GetMostActiveAdminStatsInput {
  tripId: string;
}

/**
 * Output for GetMostActiveAdminStats use case
 */
export interface GetMostActiveAdminStatsOutput {
  adminId: string;
  totalAmount: number;
  transactionCount: number;
}

/**
 * Error types for GetMostActiveAdminStats use case
 */
export class CoinTransactionRepositoryError extends Error {
  readonly _tag = "CoinTransactionRepositoryError";
  constructor(message: string = "Failed to get most active admin stats") {
    super(message);
  }
}

export type GetMostActiveAdminStatsError = CoinTransactionRepositoryError;

/**
 * GetMostActiveAdminStats Use Case
 *
 * Retrieves the most active admin by coin transaction volume for a trip.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getMostActiveAdminStatsUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(CoinTransactionRepositoryTag, coinRepo)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function getMostActiveAdminStatsUseCase(
  input: GetMostActiveAdminStatsInput,
): Effect.Effect<
  GetMostActiveAdminStatsOutput | null,
  GetMostActiveAdminStatsError,
  CoinTransactionRepositoryTag
> {
  return Effect.gen(function* () {
    const coinRepo = yield* CoinTransactionRepositoryTag;

    const stats = yield* coinRepo
      .getMostActiveAdmin(input.tripId)
      .pipe(
        Effect.mapError(
          (error: unknown) =>
            new CoinTransactionRepositoryError(
              `Failed to get most active admin stats: ${error instanceof Error ? error.message : String(error)}`,
            ),
        ),
      );

    if (!stats || stats.length === 0) {
      return null;
    }

    const topAdmin = stats[0];
    if (!topAdmin) {
      return null;
    }

    return {
      adminId: topAdmin.adminId,
      totalAmount: topAdmin._sum.amount ?? 0,
      transactionCount: topAdmin._count.id,
    };
  });
}
