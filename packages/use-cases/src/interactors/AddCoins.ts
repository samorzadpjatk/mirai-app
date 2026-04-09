import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";

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
 */
export class AddCoinsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  async execute(input: AddCoinsInput): Promise<Result<AddCoinsOutput, string>> {
    try {
      // Verify group belongs to trip and is not deleted
      const groupCheck = await this.coinRepo.verifyGroupInTrip(
        input.groupId,
        input.tripId,
      );

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
      await this.coinRepo.incrementGroupCoins(input.groupId, input.amount);

      // Create transaction record
      const transaction = await this.coinRepo.create({
        groupId: input.groupId,
        amount: input.amount,
        ...(input.reason !== undefined && { reason: input.reason }),
        adminId: input.adminId,
      });

      return ok({ transaction });
    } catch (error) {
      return err(
        `Failed to add coins: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
