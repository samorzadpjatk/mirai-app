import { Reward, type RewardId } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { RewardRepositoryTag } from "../ports/RewardRepository";
import { DatabaseError } from "@mirai-app/domain/ports";

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
 * Error types for GetReward use case
 */
export class RewardNotFoundError extends Data.TaggedError(
  "RewardNotFoundError",
)<{
  message: string;
  rewardId: string;
}> {}

export class RewardRepositoryError extends Data.TaggedError(
  "RewardRepositoryError",
)<{
  message: string;
}> {}

/**
 * GetReward Use Case
 *
 * Retrieves a single reward by ID.
 * Returns error if reward not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getRewardUseCase(input);
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
export function getRewardUseCase(
  input: GetRewardInput,
): Effect.Effect<
  GetRewardOutput,
  DatabaseError | RewardNotFoundError | RewardRepositoryError,
  RewardRepositoryTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardRepositoryTag;

    // Find reward
    const reward = yield* rewardRepo.findById(input.rewardId);

    if (!reward) {
      return yield* Effect.fail(
        new RewardNotFoundError({
          message: `Reward not found: ${input.rewardId}`,
          rewardId: input.rewardId,
        }),
      );
    }

    // Get purchase count
    const purchaseCount = yield* rewardRepo
      .getPurchaseCount(input.rewardId)
      .pipe(
        Effect.mapError(
          () =>
            new RewardRepositoryError({
              message: "Failed to get purchase count",
            }),
        ),
      );

    return toOutput(reward, purchaseCount);
  });
}

function toOutput(reward: Reward, purchaseCount: number): GetRewardOutput {
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
