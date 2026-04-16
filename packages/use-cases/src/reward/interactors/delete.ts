import { Data, Effect } from "effect";
import { RewardGatewayTag } from "../ports/gateway";
import type { RewardId } from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";

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
 * Error types for DeleteReward use case
 */
export class RewardNotFoundError extends Data.TaggedError(
  "RewardNotFoundError",
)<{
  message: string;
}> {}

export class RewardHasPurchasesError extends Data.TaggedError(
  "RewardHasPurchasesError",
)<{
  message: string;
}> {}

/**
 * DeleteReward Use Case
 *
 * Deletes a reward. Only allowed if the reward has no purchases.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = deleteRewardUseCase(input).pipe(
 *   Effect.provideService(RewardGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function deleteRewardUseCase(
  input: DeleteRewardInput,
): Effect.Effect<
  DeleteRewardOutput,
  DatabaseError | RewardNotFoundError | RewardHasPurchasesError,
  RewardGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* RewardGatewayTag;

    // Check if reward exists
    const existing = yield* repo.findById(input.rewardId);

    if (!existing) {
      return yield* Effect.fail(
        new RewardNotFoundError({ message: "Reward not found" }),
      );
    }

    // Check if reward has purchases
    const hasPurchases = yield* repo.hasPurchases(input.rewardId);

    if (hasPurchases) {
      return yield* Effect.fail(
        new RewardHasPurchasesError({
          message: "Cannot delete reward with existing purchases",
        }),
      );
    }

    // Delete reward
    yield* repo.delete(input.rewardId);

    return { success: true };
  });
}
