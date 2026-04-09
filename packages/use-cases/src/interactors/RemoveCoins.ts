import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";
import { AppError } from "../errors";

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

  async execute(input: RemoveCoinsInput): Promise<RemoveCoinsOutput> {
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
      throw AppError.repository({
        operation: "RemoveCoins.verifyGroupInTrip",
        message: "Failed to verify group",
        cause,
      });
    }

    if (!groupCheck.exists) {
      throw AppError.notFound({
        entity: "Group",
        message: "Group not found",
      });
    }

    if (groupCheck.tripId !== input.tripId) {
      throw AppError.conflict({
        entity: "Group",
        message: "Group does not belong to this trip",
      });
    }

    if (groupCheck.isDeleted) {
      throw AppError.conflict({
        entity: "Group",
        message: "Group has been deleted",
      });
    }

    // Check sufficient balance and decrement
    let decrementResult: { success: boolean };
    try {
      decrementResult = await this.coinRepo.decrementGroupCoins(
        input.groupId,
        input.amount,
      );
    } catch (cause) {
      throw AppError.repository({
        operation: "RemoveCoins.decrementGroupCoins",
        message: "Failed to decrement group coins",
        cause,
      });
    }

    if (!decrementResult.success) {
      throw AppError.conflict({
        entity: "Coins",
        message: "Group does not have enough coins",
      });
    }

    // Create transaction record (negative amount for removal)
    let transaction: CoinTransaction;
    try {
      transaction = await this.coinRepo.create({
        groupId: input.groupId,
        amount: -input.amount,
        ...(input.reason !== undefined && { reason: input.reason }),
        adminId: input.adminId,
      });
    } catch (cause) {
      throw AppError.repository({
        operation: "RemoveCoins.create",
        message: "Failed to create transaction",
        cause,
      });
    }

    return { transaction };
  }
}
