import { Effect } from "effect";
import type {
  RewardId,
  ValidationError} from "@mirai-app/domain";
import { Reward, RewardId as RewardIdFactory } from "@mirai-app/domain";
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
  image?: string | null;
  coinCost?: number;
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

      const rewardId = RewardIdFactory.unsafeCreate(input.rewardId);

      // Find existing reward
      const existingReward = yield* rewardPort.findById(rewardId);

      if (!existingReward) {
        return yield* Effect.fail(
          new RewardNotFoundError({ rewardId: input.rewardId }),
        );
      }

      // Validate inputs if provided
      if (input.name !== undefined && input.name.trim().length === 0) {
        return yield* Effect.fail(
          new RewardValidationError({
            field: "name",
            message: "Reward name cannot be empty",
          }),
        );
      }

      if (
        input.availableQuantity !== undefined &&
        input.availableQuantity < 0
      ) {
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

      // Determine image value
      let image: string | null = existingReward.image;
      if (input.images !== undefined) {
        // Images array takes precedence
        if (input.images.length > 0) {
          image =
            input.images.length === 1
              ? input.images[0]!
              : JSON.stringify(input.images);
        } else {
          image = null;
        }
      } else if (input.image !== undefined) {
        // Single image fallback
        image = input.image ?? null;
      }

      // Create updated reward
      const updatedEffect = Reward.create({
        id: existingReward.id,
        name: input.name?.trim() ?? existingReward.name,
        description:
          input.description !== undefined
            ? input.description.trim()
            : existingReward.description,
        availableQuantity:
          input.availableQuantity ?? existingReward.availableQuantity,
        isHidden: existingReward.isHidden,
        image,
        coinCost: input.coinCost ?? existingReward.coinCost,
        tripId: existingReward.tripId,
        createdById: existingReward.createdById,
        createdAt: existingReward.createdAt,
        updatedAt: new Date(),
      });

      const updatedReward = yield* updatedEffect;

      // Save to repository
      const savedReward = yield* rewardPort.update(updatedReward);

      return {
        id: savedReward.id,
        name: savedReward.name,
        description: savedReward.description,
        availableQuantity: savedReward.availableQuantity,
        coinCost: savedReward.coinCost,
        updatedAt: savedReward.updatedAt,
      };
    });
  }
}
