import { Reward, ValidationError, type RewardId } from "@mirai-app/domain";
import { Effect } from "effect";
import { RewardRepositoryTag } from "../ports/RewardRepository";

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
 * Error types for UpdateReward use case
 */
export class RewardNotFoundError extends Error {
  readonly _tag = "RewardNotFoundError";
  constructor(rewardId: string) {
    super(`Reward not found: ${rewardId}`);
  }
}

export class UpdateRewardError extends Error {
  readonly _tag = "UpdateRewardError";
  constructor(message: string) {
    super(message);
  }
}

export class RewardRepositoryError extends Error {
  readonly _tag = "RewardRepositoryError";
  constructor(message: string = "Failed to update reward") {
    super(message);
  }
}

/**
 * UpdateReward Use Case
 *
 * Updates an existing reward.
 * Returns error if reward not found or validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* updateRewardUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(RewardRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function updateRewardUseCase(
  input: UpdateRewardInput,
): Effect.Effect<
  UpdateRewardOutput,
  RewardNotFoundError | UpdateRewardError | RewardRepositoryError,
  RewardRepositoryTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardRepositoryTag;

    // Find existing reward
    const existing = yield* rewardRepo.findById(input.rewardId);

    if (!existing) {
      return yield* Effect.fail(new RewardNotFoundError(input.rewardId));
    }

    // Apply updates to domain entity
    const updated = yield* existing
      .update({
        name: input.name,
        description: input.description,
        availableQuantity: input.availableQuantity,
        images: input.images,
        coinCostPercentage: input.coinCostPercentage,
      })
      .pipe(
        Effect.mapError(
          (validationError: ValidationError) =>
            new UpdateRewardError(validationError.message),
        ),
      );

    // Persist updated reward
    const saved = yield* rewardRepo
      .update(updated)
      .pipe(
        Effect.mapError(
          () => new RewardRepositoryError("Failed to update reward"),
        ),
      );

    return toOutput(saved);
  });
}

function toOutput(reward: Reward): UpdateRewardOutput {
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
