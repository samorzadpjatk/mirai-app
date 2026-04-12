import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";
import { CoinTransactionRepositoryTag } from "../ports/CoinTransactionRepository";
import { Effect } from "effect";

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
export class GroupNotFoundError extends Error {
  readonly _tag = "GroupNotFoundError";
  constructor() {
    super("Group not found");
  }
}

export class GroupNotInTripError extends Error {
  readonly _tag = "GroupNotInTripError";
  constructor() {
    super("Group does not belong to this trip");
  }
}

export class GroupDeletedError extends Error {
  readonly _tag = "GroupDeletedError";
  constructor() {
    super("Group has been deleted");
  }
}

export class DecrementCoinsError extends Error {
  readonly _tag = "DecrementCoinsError";
  constructor() {
    super("Failed to decrement group coins");
  }
}

export class InsufficientCoinsError extends Error {
  readonly _tag = "InsufficientCoinsError";
  constructor() {
    super("Group does not have enough coins");
  }
}

export class CreateTransactionError extends Error {
  readonly _tag = "CreateTransactionError";
  constructor() {
    super("Failed to create transaction");
  }
}

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
 *   Effect.provideService(CoinTransactionRepositoryTag, repository)
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
      return yield* Effect.fail(new GroupNotFoundError());
    }

    if (groupCheck.tripId !== input.tripId) {
      return yield* Effect.fail(new GroupNotInTripError());
    }

    if (groupCheck.isDeleted) {
      return yield* Effect.fail(new GroupDeletedError());
    }

    // Check sufficient balance and decrement
    const decrementResult = yield* coinRepo.decrementGroupCoins(
      input.groupId,
      input.amount,
    );

    if (!decrementResult.success) {
      return yield* Effect.fail(new InsufficientCoinsError());
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
