import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";
import { CoinTransactionRepositoryTag } from "../ports/CoinTransactionRepository";
import { Data, Effect } from "effect";

/**
 * Input for AddCoins use case
 */
export interface AddCoinsInput {
  tripId: string;
  groupId: string;
  amount: number;
  reason?: string;
  adminId: string;
}

/**
 * Output for AddCoins use case
 */
export interface AddCoinsOutput {
  transaction: CoinTransaction;
}

/**
 * Error types for AddCoins use case
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

export class IncrementCoinsError extends Data.TaggedError(
  "IncrementCoinsError",
)<{
  message: string;
}> {}

export class CreateTransactionError extends Data.TaggedError(
  "CreateTransactionError",
)<{
  message: string;
}> {}

/**
 * AddCoins Use Case
 *
 * Adds coins to a group within a trip.
 * Validates that the group exists and belongs to the trip.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * // With dependency injection
 * const program = addCoinsUseCase(input);
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
export function addCoinsUseCase(
  input: AddCoinsInput,
): Effect.Effect<
  AddCoinsOutput,
  | GroupNotFoundError
  | GroupNotInTripError
  | GroupDeletedError
  | IncrementCoinsError
  | CreateTransactionError,
  CoinTransactionRepositoryTag
> {
  return Effect.gen(function* () {
    const coinRepo = yield* CoinTransactionRepositoryTag;

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

    // Increment group coins
    yield* coinRepo.incrementGroupCoins(input.groupId, input.amount);

    // Create transaction record
    const transaction = yield* coinRepo.create({
      groupId: input.groupId,
      amount: input.amount,
      ...(input.reason !== undefined && { reason: input.reason }),
      adminId: input.adminId,
    });

    return { transaction };
  });
}
