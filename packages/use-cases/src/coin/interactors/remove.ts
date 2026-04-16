import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/gateway";
import { CoinTransactionGatewayTag } from "../ports/gateway";
import { Data, Effect } from "effect";

/**
 * Input for RemoveCoins use case
 */
export interface RemoveCoinsInput {
  tripId: string;
  groupId: string;
  amount: number;
  reason?: string;
  adminId: string;
}

/**
 * Output for RemoveCoins use case
 */
export interface RemoveCoinsOutput {
  transaction: CoinTransaction;
}

/**
 * Error types for RemoveCoins use case
 */
export class GroupNotFoundError extends Data.TaggedError("GroupNotFoundError")<{
  message: string;
}> {}

export class GroupNotInTripError extends Data.TaggedError(
  "GroupNotInTripError",
)<{
  message: string;
}> {}

export class GroupDeletedError extends Data.TaggedError("GroupDeletedError")<{
  message: string;
}> {}

export class DecrementCoinsError extends Data.TaggedError(
  "DecrementCoinsError",
)<{
  message: string;
}> {}

export class InsufficientCoinsError extends Data.TaggedError(
  "InsufficientCoinsError",
)<{
  message: string;
}> {}

export class CreateTransactionError extends Data.TaggedError(
  "CreateTransactionError",
)<{
  message: string;
}> {}

/**
 * RemoveCoins Use Case
 *
 * Removes coins from a group within a trip.
 * Validates that the group exists, belongs to the trip, and has sufficient balance.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * // With dependency injection
 * const program = removeCoinsUseCase(input);
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
export function removeCoinsUseCase(
  input: RemoveCoinsInput,
): Effect.Effect<
  RemoveCoinsOutput,
  | GroupNotFoundError
  | GroupNotInTripError
  | GroupDeletedError
  | InsufficientCoinsError
  | DecrementCoinsError
  | CreateTransactionError,
  CoinTransactionGatewayTag
> {
  return Effect.gen(function* () {
    const coinRepo = yield* CoinTransactionGatewayTag;

    // Verify group belongs to trip and is not deleted
    const groupCheck = yield* coinRepo.verifyGroupInTrip(
      input.groupId,
      input.tripId,
    );

    if (!groupCheck.exists) {
      return yield* Effect.fail(
        new GroupNotFoundError({ message: "Group not found" }),
      );
    }

    if (groupCheck.tripId !== input.tripId) {
      return yield* Effect.fail(
        new GroupNotInTripError({
          message: "Group does not belong to this trip",
        }),
      );
    }

    if (groupCheck.isDeleted) {
      return yield* Effect.fail(
        new GroupDeletedError({ message: "Group has been deleted" }),
      );
    }

    // Check sufficient balance and decrement
    const decrementResult = yield* coinRepo.decrementGroupCoins(
      input.groupId,
      input.amount,
    );

    if (!decrementResult.success) {
      return yield* Effect.fail(
        new InsufficientCoinsError({
          message: "Group does not have enough coins",
        }),
      );
    }

    // Create transaction record (negative amount for removal)
    const transaction = yield* coinRepo.create({
      groupId: input.groupId,
      amount: -input.amount,
      ...(input.reason !== undefined && { reason: input.reason }),
      adminId: input.adminId,
    });

    return { transaction };
  });
}
