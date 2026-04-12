import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";
import { CoinTransactionRepositoryTag } from "../ports/CoinTransactionRepository";
import { Effect } from "effect";

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

export class IncrementCoinsError extends Error {
  readonly _tag = "IncrementCoinsError";
  constructor() {
    super("Failed to increment group coins");
  }
}

export class CreateTransactionError extends Error {
  readonly _tag = "CreateTransactionError";
  constructor() {
    super("Failed to create transaction");
  }
}

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
      return yield* Effect.fail(new GroupNotFoundError());
    }

    if (groupCheck.tripId !== input.tripId) {
      return yield* Effect.fail(new GroupNotInTripError());
    }

    if (groupCheck.isDeleted) {
      return yield* Effect.fail(new GroupDeletedError());
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
