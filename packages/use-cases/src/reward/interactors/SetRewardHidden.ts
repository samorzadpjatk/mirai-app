import { Effect } from "effect";
import type { ApplicationError, RewardId } from "@mirai-app/domain";
import { RewardId as RewardIdFactory } from "@mirai-app/domain";
import { RewardPort } from "../ports/RewardPort";
import type { RewardDTO } from "../dto/RewardDTOs";
import { RewardNotFoundError } from "../errors/RewardErrors";

/**
 * Input for SetRewardHiddenUseCase
 */
export interface SetRewardHiddenInput {
  rewardId: string;
  isHidden: boolean;
}

/**
 * Set Reward Hidden Use Case
 *
 * Sets the hidden status of a reward. Only staff (admin/moderator) can do this.
 */
export class SetRewardHiddenUseCase {
  execute(
    input: SetRewardHiddenInput,
  ): Effect.Effect<RewardDTO, ApplicationError | RewardNotFoundError, RewardPort> {
    return Effect.gen(function* () {
      const rewardPort = yield* RewardPort;

      const rewardId = RewardIdFactory.unsafeCreate(input.rewardId);

      // Find existing reward
      const existingReward = yield* rewardPort.findById(rewardId);

      if (!existingReward) {
        return yield* Effect.fail(
          new RewardNotFoundError({ rewardId: input.rewardId }),
        );
      }

      // Update hidden status
      const updatedReward = input.isHidden
        ? existingReward.hide()
        : existingReward.show();

      // Save to repository
      const savedReward = yield* rewardPort.update(updatedReward);

      return {
        id: savedReward.id,
        name: savedReward.name,
        description: savedReward.description,
        availableQuantity: savedReward.availableQuantity,
        isHidden: savedReward.isHidden,
        image: savedReward.image,
        coinCost: savedReward.coinCost,
        tripId: savedReward.tripId,
        createdById: savedReward.createdById,
        createdAt: savedReward.createdAt,
        updatedAt: savedReward.updatedAt,
      };
    });
  }
}
