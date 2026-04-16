import { Data, Effect } from "effect";
import { RewardGatewayTag } from "../ports/gateway";
import type { RewardId } from "@mirai-app/domain";
import type { Reward } from "@mirai-app/domain";

/**
 * Input for SetRewardHidden use case
 */
export interface SetRewardHiddenInput {
  rewardId: RewardId;
  isHidden: boolean;
}

/**
 * Output DTO for SetRewardHidden use case
 */
export interface SetRewardHiddenOutput {
  id: string;
  name: string;
  isHidden: boolean;
  updatedAt: Date;
}

/**
 * Error when reward is not found
 */
export class RewardNotFoundError extends Data.TaggedError(
  "RewardNotFoundError",
)<{
  message: string;
}> {}

/**
 * Error when repository operation fails
 */
export class SetRewardHiddenRepositoryError extends Data.TaggedError(
  "SetRewardHiddenRepositoryError",
)<{
  message: string;
  operation: string;
  cause?: unknown;
}> {}

/**
 * SetRewardHidden Use Case (Effect-based)
 *
 * Sets the hidden status of a reward.
 * Hidden rewards are not visible to users but can still be purchased if known.
 *
 * ## Effect-based Pattern
 *
 * ```typescript
 * const program = setRewardHiddenUseCase(input).pipe(
 *   Effect.provideService(RewardGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function setRewardHiddenUseCase(
  input: SetRewardHiddenInput,
): Effect.Effect<
  SetRewardHiddenOutput,
  RewardNotFoundError | SetRewardHiddenRepositoryError,
  RewardGatewayTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardGatewayTag;

    // Find existing reward
    const existing = yield* rewardRepo.findById(input.rewardId).pipe(
      Effect.mapError(
        (cause) =>
          new SetRewardHiddenRepositoryError({
            message: "Failed to find reward",
            operation: "find reward",
            cause,
          }),
      ),
    );

    if (!existing) {
      return yield* Effect.fail(
        new RewardNotFoundError({ message: "Reward not found" }),
      );
    }

    // Apply hide/unhide
    const updated = input.isHidden ? existing.hide() : existing.unhide();

    // Persist
    const saved = yield* rewardRepo.update(updated).pipe(
      Effect.mapError(
        (cause) =>
          new SetRewardHiddenRepositoryError({
            message: "Failed to update reward",
            operation: "update reward",
            cause,
          }),
      ),
    );

    return {
      id: saved.id,
      name: saved.name,
      isHidden: saved.isHidden,
      updatedAt: saved.updatedAt,
    };
  });
}
