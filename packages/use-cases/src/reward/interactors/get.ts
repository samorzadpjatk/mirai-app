import { Reward, ValidationError, type RewardId } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { RewardGatewayTag } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { RewardDTO } from "../dto";

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
 *   Effect.provideService(RewardGatewayTag, repository)
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
  RewardGatewayTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardGatewayTag;

    // Find reward DTO
    const rewardDTO = yield* rewardRepo.findById(input.rewardId);

    if (!rewardDTO) {
      return yield* Effect.fail(
        new RewardNotFoundError({
          message: `Reward not found: ${input.rewardId}`,
          rewardId: input.rewardId,
        }),
      );
    }

    // Convert DTO to domain entity
    const reward = yield* dtoToReward(rewardDTO).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new RewardRepositoryError({
            message: `Invalid reward data: ${validationError.message}`,
          }),
      ),
    );

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

/**
 * Convert RewardDTO to domain Reward entity
 */
function dtoToReward(
  dto: RewardDTO,
): Effect.Effect<Reward, ValidationError, never> {
  return Reward.create({
    id: dto.id,
    name: dto.title,
    description: dto.description ?? "",
    availableQuantity: dto.availableQuantity,
    coinCost: dto.pointsCost,
    image: dto.imageUrl,
    images: dto.images,
    isHidden: dto.isHidden,
    tripId: dto.tripId,
    createdById: dto.createdById,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  });
}
