import { Effect } from "effect";
import { RewardRepositoryTag } from "../ports/RewardRepository";
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
export class RewardNotFoundError extends Error {
  readonly _tag = "RewardNotFoundError";
  constructor() {
    super("Reward not found");
  }
}

/**
 * Error when repository operation fails
 */
export class SetRewardHiddenRepositoryError extends Error {
  readonly _tag = "SetRewardHiddenRepositoryError";
  constructor(
    public readonly operation: string,
    public readonly cause?: unknown,
  ) {
    super(`Failed to ${operation}`);
  }
}

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
 *   Effect.provideService(RewardRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function setRewardHiddenUseCase(
  input: SetRewardHiddenInput,
): Effect.Effect<
  SetRewardHiddenOutput,
  RewardNotFoundError | SetRewardHiddenRepositoryError,
  RewardRepositoryTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardRepositoryTag;

    // Find existing reward
    const existing = yield* rewardRepo
      .findById(input.rewardId)
      .pipe(
        Effect.mapError(
          (cause) => new SetRewardHiddenRepositoryError("find reward", cause),
        ),
      );

    if (!existing) {
      return yield* Effect.fail(new RewardNotFoundError());
    }

    // Apply hide/unhide
    const updated = input.isHidden ? existing.hide() : existing.unhide();

    // Persist
    const saved = yield* rewardRepo
      .update(updated)
      .pipe(
        Effect.mapError(
          (cause) => new SetRewardHiddenRepositoryError("update reward", cause),
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
