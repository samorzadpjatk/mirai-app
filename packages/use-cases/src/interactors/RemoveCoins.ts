import { Effect } from "effect";
import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";
import {
  UseCaseNotFoundError,
  UseCaseConflictError,
  UseCaseRepositoryError,
  type UseCaseError,
} from "../errors";

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
 * RemoveCoins Use Case
 *
 * Removes coins from a group within a trip.
 * Validates that the group exists, belongs to the trip, and has sufficient balance.
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new RemoveCoinsUseCase(coinRepo);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("removeCoinsUseCase");
 * ```
 */
export class RemoveCoinsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  execute(
    input: RemoveCoinsInput,
  ): Effect.Effect<RemoveCoinsOutput, UseCaseError> {
    const coinRepo = this.coinRepo;

    return Effect.gen(function* () {
      // Verify group belongs to trip and is not deleted
      const groupCheck = yield* Effect.tryPromise({
        try: () => coinRepo.verifyGroupInTrip(input.groupId, input.tripId),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "RemoveCoins.verifyGroupInTrip",
            message: "Failed to verify group",
            cause,
          }),
      });

      if (!groupCheck.exists) {
        return yield* Effect.fail(
          new UseCaseNotFoundError({
            entity: "Group",
            message: "Group not found",
          }),
        );
      }

      if (groupCheck.tripId !== input.tripId) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Group",
            message: "Group does not belong to this trip",
          }),
        );
      }

      if (groupCheck.isDeleted) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Group",
            message: "Group has been deleted",
          }),
        );
      }

      // Check sufficient balance and decrement
      const decrementResult = yield* Effect.tryPromise({
        try: () => coinRepo.decrementGroupCoins(input.groupId, input.amount),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "RemoveCoins.decrementGroupCoins",
            message: "Failed to decrement group coins",
            cause,
          }),
      });

      if (!decrementResult.success) {
        return yield* Effect.fail(
          new UseCaseConflictError({
            entity: "Coins",
            message: "Group does not have enough coins",
          }),
        );
      }

      // Create transaction record (negative amount for removal)
      const transaction = yield* Effect.tryPromise({
        try: () =>
          coinRepo.create({
            groupId: input.groupId,
            amount: -input.amount,
            ...(input.reason !== undefined && { reason: input.reason }),
            adminId: input.adminId,
          }),
        catch: (cause) =>
          new UseCaseRepositoryError({
            operation: "RemoveCoins.create",
            message: "Failed to create transaction",
            cause,
          }),
      });

      return { transaction };
    });
  }
}
