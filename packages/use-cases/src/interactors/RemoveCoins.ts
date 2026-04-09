import type { Result } from "@repo/domain";
import { ok, err } from "@repo/domain";
import type {
  CoinTransactionRepository,
  CoinTransaction,
} from "../ports/CoinTransactionRepository";

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
 */
export class RemoveCoinsUseCase {
  constructor(private coinRepo: CoinTransactionRepository) {}

  async execute(
    input: RemoveCoinsInput,
  ): Promise<Result<RemoveCoinsOutput, string>> {
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

      // Check sufficient balance and decrement
      const decrementResult = await this.coinRepo.decrementGroupCoins(
        input.groupId,
        input.amount,
      );

      if (!decrementResult.success) {
        return err("Group does not have enough coins");
      }

      // Create transaction record (negative amount for removal)
      const transaction = await this.coinRepo.create({
        groupId: input.groupId,
        amount: -input.amount,
        ...(input.reason !== undefined && { reason: input.reason }),
        adminId: input.adminId,
      });

      return ok({ transaction });
    } catch (error) {
      return err(
        `Failed to remove coins: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
