import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";
import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";

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

  async execute(input: RemoveCoinsInput): Promise<Result<RemoveCoinsOutput, string>> {
    // Verify group belongs to trip and is not deleted
    let groupCheck: {
      exists: boolean;
      tripId?: string;
      isDeleted?: boolean;
      coins?: number;
    };
    try {
      groupCheck = await this.coinRepo.verifyGroupInTrip(
        input.groupId,
        input.tripId,
      );
    } catch (_cause) {
      return err("Failed to verify group");
    }

    if (!groupCheck.exists) {
      return err("Group not found");
    }

    if (groupCheck.tripId !== input.tripId) {
      return err("Group does not belong to this trip");
    }

    if (groupCheck.isDeleted) {
      return err("Group has been deleted");
    }

    // Check sufficient balance and decrement
    let decrementResult: { success: boolean };
    try {
      decrementResult = await this.coinRepo.decrementGroupCoins(
        input.groupId,
        input.amount,
      );
    } catch (_cause) {
      return err("Failed to decrement group coins");
    }

    if (!decrementResult.success) {
      return err("Group does not have enough coins");
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
    } catch (_cause) {
      return err("Failed to create transaction");
    }

    return ok({ transaction });
  }
}
