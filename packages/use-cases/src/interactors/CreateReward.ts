import type { Result } from "@repo/domain";
import { ok, err, Reward, UserRole, type RewardId } from "@repo/domain";
import type {
  RewardRepository,
  TripAccessChecker,
} from "../ports/RewardRepository";

/**
 * Input for CreateReward use case
 */
export interface CreateRewardInput {
  name: string;
  description: string;
  availableQuantity: number;
  coinCostPercentage: number;
  images?: string[];
  isHidden?: boolean;
  tripId: string;
  createdById: string;
  creatorRole: UserRole;
}

/**
 * Output DTO for CreateReward use case
 */
export interface CreateRewardOutput {
  id: string;
  name: string;
  description: string;
  availableQuantity: number;
  coinCostPercentage: number;
  images: string[];
  isHidden: boolean;
  tripId: string;
  createdById: string;
  createdAt: Date;
  isInStock: boolean;
  canBePurchased: boolean;
}

/**
 * CreateReward Use Case
 *
 * Creates a new reward in a trip.
 * Only moderators and admins can create rewards.
 */
export class CreateRewardUseCase {
  constructor(
    private rewardRepository: RewardRepository,
    private accessChecker: TripAccessChecker,
  ) {}

  async execute(
    input: CreateRewardInput,
  ): Promise<Result<CreateRewardOutput, string>> {
    // Verify user is staff (moderator or admin)
    const isStaff = await this.accessChecker.isStaff(input.createdById);
    if (
      !isStaff &&
      input.creatorRole !== UserRole.ADMIN &&
      input.creatorRole !== UserRole.MODERATOR
    ) {
      return err("Only moderators and admins can create rewards");
    }

    // Check if trip has ended
    const hasEnded = await this.accessChecker.hasTripEnded(input.tripId);
    if (hasEnded) {
      return err("Cannot create rewards for ended trips");
    }

    // Create domain entity
    const rewardResult = Reward.create({
      name: input.name,
      description: input.description,
      availableQuantity: input.availableQuantity,
      coinCostPercentage: input.coinCostPercentage,
      ...(input.images !== undefined && { images: input.images }),
      ...(input.isHidden !== undefined && { isHidden: input.isHidden }),
      tripId: input.tripId,
      createdById: input.createdById,
    });

    if (rewardResult.kind === "err") {
      return err(rewardResult.error);
    }

    // Persist reward
    const saved = await this.rewardRepository.create(rewardResult.value);

    return ok(this.toOutput(saved));
  }

  private toOutput(reward: Reward): CreateRewardOutput {
    return {
      id: reward.id,
      name: reward.name,
      description: reward.description,
      availableQuantity: reward.availableQuantity,
      coinCostPercentage: reward.coinCostPercentage.toNumber(),
      images: reward.images,
      isHidden: reward.isHidden,
      tripId: reward.tripId,
      createdById: reward.createdById,
      createdAt: reward.createdAt,
      isInStock: reward.isInStock(),
      canBePurchased: reward.canBePurchased(),
    };
  }
}
