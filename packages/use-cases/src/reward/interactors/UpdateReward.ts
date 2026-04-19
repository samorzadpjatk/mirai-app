import { Effect } from "effect";
import { Reward, RewardId } from "@mirai-app/domain";
import { RewardPortTag } from "../ports/RewardPort";
import type { UpdateRewardResultDTO } from "../dto/RewardDTOs";
import {
  RewardNotFoundError,
  RewardValidationError,
} from "../errors/RewardErrors";

/**
 * Input for UpdateRewardUseCase
 */
export interface UpdateRewardInput {
  rewardId: string;
  name?: string;
  description?: string;
  availableQuantity?: number;
  images?: string[];
  coinCost?: number;
  isHidden?: boolean;
}

/**
 * Update Reward Use Case
 *
 * Updates an existing reward. Only staff (admin/moderator) can update rewards.
 */
export class UpdateRewardUseCase {
  execute(input: UpdateRewardInput) {
    return Effect.gen(function* () {
      const rewardPort = yield* RewardPortTag;

      // Find the reward
      const rewardId = RewardId.create(input.rewardId);
      const existingReward = yield* rewardPort.findById(rewardId);

      if (!existingReward) {
        return yield* Effect.fail(
          new RewardNotFoundError({ rewardId: input.rewardId }),
        );
      }

      // Validate inputs if provided
      if (input.name !== undefined) {
        const trimmedName = input.name.trim();
        if (trimmedName.length === 0) {
          return yield* Effect.fail(
            new RewardValidationError({
              field: "name",
              message: "Reward name is required",
            }),
          );
        }
        if (trimmedName.length > 100) {
          return yield* Effect.fail(
            new RewardValidationError({
              field: "name",
              message: "Reward name must be at most 100 characters",
            }),
          );
        }
      }

      if (input.description !== undefined) {
        const trimmedDescription = input.description.trim();
        if (trimmedDescription.length === 0) {
          return yield* Effect.fail(
            new RewardValidationError({
              field: "description",
              message: "Reward description is required",
            }),
          );
        }
      }

      if (input.availableQuantity !== undefined && input.availableQuantity < 0) {
        return yield* Effect.fail(
          new RewardValidationError({
            field: "availableQuantity",
            message: "Available quantity cannot be negative",
          }),
        );
      }

      if (input.coinCost !== undefined && input.coinCost < 1) {
        return yield* Effect.fail(
          new RewardValidationError({
            field: "coinCost",
            message: "Coin cost must be at least 1",
          }),
        );
      }

      // Serialize images if provided
      let image: string | null = existingReward.image;
      if (input.images !== undefined && input.images !== null) {
        image =
          input.images.length > 0
            ? input.images.length === 1
              ? (input.images[0] ?? null)
              : JSON.stringify(input.images)
            : null;
      }

      // Create updated reward entity using factory
      const updatedRewardEffect = Reward.create({
        id: existingReward.id,
        tripId: existingReward.tripId,
        name: input.name?.trim() ?? existingReward.name,
        description: input.description?.trim() ?? existingReward.description,
        availableQuantity: input.availableQuantity ?? existingReward.availableQuantity,
        isHidden: input.isHidden ?? existingReward.isHidden,
        image,
        coinCost: input.coinCost ?? existingReward.coinCost,
        createdById: existingReward.createdById,
        createdAt: existingReward.createdAt,
        updatedAt: new Date(),
      });

      const updatedReward = yield* updatedRewardEffect;

      // Save to repository
      const savedReward = yield* rewardPort.update(updatedReward);

      return {
        id: savedReward.id,
        tripId: savedReward.tripId,
        name: savedReward.name,
        description: savedReward.description,
        availableQuantity: savedReward.availableQuantity,
        isHidden: savedReward.isHidden,
        coinCost: savedReward.coinCost,
        updatedAt: savedReward.updatedAt,
      } satisfies UpdateRewardResultDTO;
    });
  }
}
