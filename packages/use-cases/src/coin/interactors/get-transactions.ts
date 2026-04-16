import { Data, Effect } from "effect";
import type {
  CoinTransactionRepository,
  CoinTransaction,
  PaginationOptions,
} from "../ports/gateway";
import { CoinTransactionGatewayTag } from "../ports/gateway";

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
export class GetTransactionsError extends Data.TaggedError(
  "GetTransactionsError",
)<{
  message: string;
}> {}

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
 *   Effect.provideService(CoinTransactionGatewayTag, repository)
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
  CoinTransactionGatewayTag
> {
  return Effect.gen(function* () {
    const coinRepo = yield* CoinTransactionGatewayTag;

    const limit = input.pagination?.limit ?? 50;
    const offset = input.pagination?.offset ?? 0;

    const filters = {
      tripId: input.tripId,
      ...(input.groupId && { groupId: input.groupId }),
    };

    const transactionsResult = yield* Effect.either(
      coinRepo.findMany(filters, { limit, offset }),
    );
    const totalResult = yield* Effect.either(coinRepo.count(filters));

    if (transactionsResult._tag === "Left") {
      return yield* Effect.fail(
        new GetTransactionsError({
          message: "Failed to get coin transactions",
        }),
      );
    }

    if (totalResult._tag === "Left") {
      return yield* Effect.fail(
        new GetTransactionsError({
          message: "Failed to get coin transactions",
        }),
      );
    }

    const transactions = transactionsResult.right;
    const total = totalResult.right;

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  });
}
