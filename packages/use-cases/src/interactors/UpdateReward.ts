import type { Result } from "@mirai-app/domain";
import { ok, err, type RewardId } from "@mirai-app/domain";
import type { RewardRepository } from "../ports/RewardRepository";

/**
 * Input for UpdateReward use case
 */
export interface UpdateRewardInput {
  rewardId: RewardId;
  name?: string;
  description?: string;
  availableQuantity?: number;
  images?: string[];
  coinCostPercentage?: number;
}

/**
 * Output DTO for UpdateReward use case
 */
export interface UpdateRewardOutput {
  id: string;
  name: string;
  description: string;
  availableQuantity: number;
  coinCostPercentage: number;
  images: string[];
  primaryImage: string | null;
  isHidden: boolean;
  tripId: string;
  updatedAt: Date;
  isInStock: boolean;
  canBePurchased: boolean;
}

/**
 * UpdateReward Use Case
 *
 * Updates an existing reward.
 * Returns error if reward not found or validation fails.
 */
export class UpdateRewardUseCase {
  constructor(private rewardRepository: RewardRepository) {}

  async execute(
    input: UpdateRewardInput,
  ): Promise<Result<UpdateRewardOutput, string>> {
    // Find existing reward
    const existing = await this.rewardRepository.findById(input.rewardId);

    if (!existing) {
      return err("Reward not found");
    }

    // Apply updates to domain entity
    const updatedResult = existing.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.availableQuantity !== undefined && {
        availableQuantity: input.availableQuantity,
      }),
      ...(input.images !== undefined && { images: input.images }),
      ...(input.coinCostPercentage !== undefined && {
        coinCostPercentage: input.coinCostPercentage,
      }),
    });

    if (updatedResult.kind === "err") {
      return err(updatedResult.error);
    }

    // Persist updated reward
    const saved = await this.rewardRepository.update(updatedResult.value);

    return ok(this.toOutput(saved));
  }

  private toOutput(reward: import("@mirai-app/domain").Reward): UpdateRewardOutput {
    return {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      availableQuantity: reward.availableQuantity,
      coinCostPercentage: reward.coinCostPercentage.toNumber(),
      images: reward.images,
      primaryImage: reward.getPrimaryImage(),
      isHidden: reward.isHidden,
      tripId: reward.tripId,
      updatedAt: reward.updatedAt,
      isInStock: reward.isInStock(),
      canBePurchased: reward.canBePurchased(),
    };
  }
}
