import type { Result } from "@repo/domain";
import { ok, err, type Reward, type RewardId } from "@repo/domain";
import type { RewardRepository } from "../ports/RewardRepository";

/**
 * Input for GetReward use case
 */
export interface GetRewardInput {
  rewardId: RewardId;
}

/**
 * Output DTO for GetReward use case
 */
export interface GetRewardOutput {
  id: string;
  name: string;
  description: string;
  availableQuantity: number;
  coinCostPercentage: number;
  images: string[];
  primaryImage: string | null;
  isHidden: boolean;
  tripId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  isInStock: boolean;
  canBePurchased: boolean;
  purchaseCount: number;
}

/**
 * GetReward Use Case
 *
 * Retrieves a single reward by ID.
 * Returns error if reward not found.
 */
export class GetRewardUseCase {
  constructor(private rewardRepository: RewardRepository) {}

  async execute(
    input: GetRewardInput,
  ): Promise<Result<GetRewardOutput, string>> {
    // Find reward
    const reward = await this.rewardRepository.findById(input.rewardId);

    if (!reward) {
      return err("Reward not found");
    }

    // Get purchase count
    const purchaseCount = await this.rewardRepository.getPurchaseCount(
      input.rewardId,
    );

    return ok(this.toOutput(reward, purchaseCount));
  }

  private toOutput(reward: Reward, purchaseCount: number): GetRewardOutput {
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
      createdById: reward.createdById,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
      isInStock: reward.isInStock(),
      canBePurchased: reward.canBePurchased(),
      purchaseCount,
    };
  }
}
