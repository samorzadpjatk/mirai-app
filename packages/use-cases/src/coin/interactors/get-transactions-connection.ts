import { Data, Effect } from "effect";
import type { CoinTransactionDTO, Connection } from "@mirai-app/domain";
import {
  CoinTransactionGatewayTag,
  type CoinTransactionConnectionArgs,
  type CoinTransactionFilters,
} from "../ports/gateway";

/**
 * Input for GetCoinTransactionsConnection use case
 */
export interface GetCoinTransactionsConnectionInput {
  tripId: string;
  groupId?: string;
  first?: number;
  after?: { id: string; createdAt: Date } | null;
}

/**
 * Output for GetCoinTransactionsConnection use case
 */
export interface GetCoinTransactionsConnectionOutput {
  items: CoinTransactionDTO[];
  hasMore: boolean;
}

/**
 * Error types for GetCoinTransactionsConnection use case
 */
export class GetTransactionsConnectionError extends Data.TaggedError(
  "GetTransactionsConnectionError",
)<{
  message: string;
}> {}
{
}

/**
 * GetCoinTransactionsConnection Use Case
 *
 * Retrieves paginated list of coin transactions for a trip using cursor-based pagination.
 * Can optionally filter by group.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * // With dependency injection
 * const program = getCoinTransactionsConnectionUseCase(input);
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
export function getCoinTransactionsConnectionUseCase(
  input: GetCoinTransactionsConnectionInput,
): Effect.Effect<
  GetCoinTransactionsConnectionOutput,
  GetTransactionsConnectionError,
  CoinTransactionGatewayTag
> {
  return Effect.gen(function* () {
    const coinRepo = yield* CoinTransactionGatewayTag;

    const first = input.first ?? 20;

    const filters: Partial<CoinTransactionFilters> = {
      tripId: input.tripId,
      ...(input.groupId && { groupId: input.groupId }),
    };

    const args: CoinTransactionConnectionArgs = {
      first,
      after: input.after
        ? {
            id: input.after.id,
            createdAt: input.after.createdAt.toISOString(),
          }
        : null,
    };

    const connectionResult = yield* Effect.either(
      coinRepo.findManyConnection(filters, args),
    );

    if (connectionResult._tag === "Left") {
      return yield* Effect.fail(
        new GetTransactionsConnectionError({
          message: "Failed to get coin transactions",
        }),
      );
    }

    const connection: Connection<CoinTransactionDTO> = connectionResult.right;

    return {
      items: connection.nodes,
      hasMore: connection.pageInfo.hasNextPage,
    };
  });
}
