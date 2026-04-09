import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";
import {
  UseCaseNotFoundError,
  UseCaseConflictError,
  UseCaseRepositoryError,
} from "../errors";

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
 * AddCoins Use Case
 *
 * Adds coins to a group within a trip.
 * Validates that the group exists and belongs to the trip.
 *
 * ## Constructor Injection Pattern
 *
 * This use case supports both manual instantiation and DI container injection:
 *
 * ```typescript
 * // Manual instantiation (backward compatible)
 * const useCase = new AddCoinsUseCase(coinRepo);
 *
 * // DI container injection (awilix-modular)
 * const useCase = container.resolve("addCoinsUseCase");
 * ```
 */
export class AddCoinsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  async execute(input: AddCoinsInput): Promise<AddCoinsOutput> {
    // Verify group belongs to trip and is not deleted
    let groupCheck: {
      exists: boolean;
      tripId: string | null;
      isDeleted: boolean;
    };
    try {
      groupCheck = await this.coinRepo.verifyGroupInTrip(
        input.groupId,
        input.tripId,
      );
    } catch (cause) {
      throw new UseCaseRepositoryError({
        operation: "AddCoins.verifyGroupInTrip",
        message: "Failed to verify group",
        cause,
      });
    }

    if (!groupCheck.exists) {
      throw new UseCaseNotFoundError({
        entity: "Group",
        message: "Group not found",
      });
    }

    if (groupCheck.tripId !== input.tripId) {
      throw new UseCaseConflictError({
        entity: "Group",
        message: "Group does not belong to this trip",
      });
    }

    if (groupCheck.isDeleted) {
      throw new UseCaseConflictError({
        entity: "Group",
        message: "Group has been deleted",
      });
    }

    // Increment group coins
    try {
      await this.coinRepo.incrementGroupCoins(input.groupId, input.amount);
    } catch (cause) {
      throw new UseCaseRepositoryError({
        operation: "AddCoins.incrementGroupCoins",
        message: "Failed to increment group coins",
        cause,
      });
    }

    // Create transaction record
    let transaction: CoinTransaction;
    try {
      transaction = await this.coinRepo.create({
        groupId: input.groupId,
        amount: input.amount,
        ...(input.reason !== undefined && { reason: input.reason }),
        adminId: input.adminId,
      });
    } catch (cause) {
      throw new UseCaseRepositoryError({
        operation: "AddCoins.create",
        message: "Failed to create transaction",
        cause,
      });
    }

    return { transaction };
  }
}
