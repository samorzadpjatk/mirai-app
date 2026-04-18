import { Effect } from "effect";
import type { RewardId, TripId } from "@mirai-app/domain";
import { RewardId as RewardIdFactory } from "@mirai-app/domain";
import { RewardPortTag } from "../ports/RewardPort";
import { RewardPurchasePortTag } from "../ports/RewardPurchasePort";
import {
  RewardNotFoundError,
  RewardHasPurchasesError,
} from "../errors/RewardErrors";

/**
 * Input for DeleteRewardUseCase
 */
export interface DeleteRewardInput {
  rewardId: string;
}

/**
 * Delete Reward Use Case
 *
 * Deletes a reward if it has no purchases. Only staff (admin/moderator) can delete rewards.
 */
export class DeleteRewardUseCase {
  execute(input: DeleteRewardInput) {
    return Effect.gen(function* () {
      const rewardPort = yield* RewardPortTag;
      const purchasePort = yield* RewardPurchasePortTag;

      const rewardId = RewardIdFactory.unsafeCreate(input.rewardId);

      // Find existing reward
      const existingReward = yield* rewardPort.findById(rewardId);

      if (!existingReward) {
        return yield* Effect.fail(
          new RewardNotFoundError({ rewardId: input.rewardId }),
        );
      }

      // Check if reward has purchases
      const purchaseCount = yield* purchasePort.countByRewardId(rewardId);

      if (purchaseCount > 0) {
        return yield* Effect.fail(
          new RewardHasPurchasesError({
            rewardId: input.rewardId,
            purchaseCount,
          }),
        );
      }

      // Delete the reward (requires tripId for auth verification)
      yield* rewardPort.delete(rewardId, existingReward.tripId);

      return { success: true };
    });
  }
}
