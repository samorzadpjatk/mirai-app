import type { Result } from "@repo/domain";
import { ok, err, type RewardId } from "@repo/domain";
import type { RewardRepository } from "../ports/RewardRepository";

/**
 * Input for DeleteReward use case
 */
export interface DeleteRewardInput {
  rewardId: RewardId;
}

/**
 * Output DTO for DeleteReward use case
 */
export interface DeleteRewardOutput {
  success: boolean;
}

/**
 * DeleteReward Use Case
 *
 * Deletes a reward. Only allowed if the reward has no purchases.
 */
export class DeleteRewardUseCase {
  constructor(private rewardRepository: RewardRepository) {}

  async execute(
    input: DeleteRewardInput,
  ): Promise<Result<DeleteRewardOutput, string>> {
    // Check if reward exists
    const existing = await this.rewardRepository.findById(input.rewardId);

    if (!existing) {
      return err("Reward not found");
    }

    // Check if reward has purchases
    const hasPurchases = await this.rewardRepository.hasPurchases(
      input.rewardId,
    );

    if (hasPurchases) {
      return err("Cannot delete reward with existing purchases");
    }

    // Delete reward
    await this.rewardRepository.delete(input.rewardId);

    return ok({ success: true });
  }
}
