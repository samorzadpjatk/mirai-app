import { Effect } from "effect";
import type {
  CoinTransactionRepository,
  CoinTransaction,
  PaginationOptions,
} from "../ports/CoinTransactionRepository";
import { CoinTransactionRepositoryTag } from "../ports/CoinTransactionRepository";

/**
 * Input for GetCoinTransactions use case
 */
export interface GetCoinTransactionsInput {
  tripId: string;
  groupId?: string;
  pagination?: Partial<PaginationOptions>;
}

/**
 * Output for GetCoinTransactions use case
 */
export interface GetCoinTransactionsOutput {
  transactions: CoinTransaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Error types for GetCoinTransactions use case
 */
export class GetTransactionsError extends Error {
  readonly _tag = "GetTransactionsError";
  constructor(message: string) {
    super(`Failed to get coin transactions: ${message}`);
  }
}

/**
 * GetCoinTransactions Use Case
 *
 * Retrieves paginated list of coin transactions for a trip.
 * Can optionally filter by group.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * // With dependency injection
 * const program = getCoinTransactionsUseCase(input);
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
export function getCoinTransactionsUseCase(
  input: GetCoinTransactionsInput,
): Effect.Effect<
  GetCoinTransactionsOutput,
  GetTransactionsError,
  CoinTransactionRepositoryTag
> {
  return Effect.gen(function* () {
    const coinRepo = yield* CoinTransactionRepositoryTag;

    const limit = input.pagination?.limit ?? 50;
    const offset = input.pagination?.offset ?? 0;

    const filters = {
      tripId: input.tripId,
      ...(input.groupId && { groupId: input.groupId }),
    };

    const [transactions, total] = yield* Effect.all([
      coinRepo.findMany(filters, { limit, offset }),
      coinRepo.count(filters),
    ]);

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }).pipe(
    Effect.catchAll((error) =>
      Effect.fail(
        new GetTransactionsError(
          error instanceof Error ? error.message : String(error),
        ),
      ),
    ),
  );
}
