import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";
import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";

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

  async execute(input: AddCoinsInput): Promise<Result<AddCoinsOutput, string>> {
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

    // Increment group coins
    try {
      await this.coinRepo.incrementGroupCoins(input.groupId, input.amount);
    } catch (_cause) {
      return err("Failed to increment group coins");
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
    } catch (_cause) {
      return err("Failed to create transaction");
    }

    return ok({ transaction });
  }
}
