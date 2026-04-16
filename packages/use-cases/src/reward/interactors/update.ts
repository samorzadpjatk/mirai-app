import { Reward, ValidationError, type RewardId } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { RewardGatewayTag } from "../ports/gateway";
import { DatabaseError } from "@mirai-app/domain";
import type { RewardDTO } from "../dto";

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
export class RewardNotFoundError extends Data.TaggedError(
  "RewardNotFoundError",
)<{
  message: string;
  rewardId: string;
}> {}

export class UpdateRewardError extends Data.TaggedError("UpdateRewardError")<{
  message: string;
}> {}

export class RewardRepositoryError extends Data.TaggedError(
  "RewardRepositoryError",
)<{
  message: string;
}> {}

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
 *   Effect.provideService(RewardGatewayTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function updateRewardUseCase(
  input: UpdateRewardInput,
): Effect.Effect<
  UpdateRewardOutput,
  | DatabaseError
  | RewardNotFoundError
  | UpdateRewardError
  | RewardRepositoryError,
  RewardGatewayTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardGatewayTag;

    // Find existing reward DTO
    const existingDTO = yield* rewardRepo.findById(input.rewardId);

    if (!existingDTO) {
      return yield* Effect.fail(
        new RewardNotFoundError({
          message: `Reward not found: ${input.rewardId}`,
          rewardId: input.rewardId,
        }),
      );
    }

    // Convert DTO to domain entity
    const existing = yield* dtoToReward(existingDTO).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new RewardRepositoryError({
            message: `Invalid reward data: ${validationError.message}`,
          }),
      ),
    );

    // Apply updates to domain entity
    const updated = yield* existing
      .update({
        name: input.name,
        description: input.description,
        availableQuantity: input.availableQuantity,
        images: input.images,
        coinCost: input.coinCostPercentage,
      })
      .pipe(
        Effect.mapError(
          (validationError: ValidationError) =>
            new UpdateRewardError({ message: validationError.message }),
        ),
      );

    // Persist updated reward - convert domain entity to DTO
    const updatedDTO: RewardDTO = {
      id: updated.id,
      tripId: updated.tripId,
      title: updated.name,
      description: updated.description,
      imageUrl: updated.image,
      images: updated.images,
      pointsCost: updated.coinCost,
      quantity: updated.availableQuantity,
      availableQuantity: updated.availableQuantity,
      status: existingDTO.status, // Preserve original status
      isHidden: updated.isHidden,
      createdById: updated.createdById,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    const persistedDTO = yield* rewardRepo.update(updatedDTO).pipe(
      Effect.mapError(
        () =>
          new RewardRepositoryError({
            message: "Failed to update reward",
          }),
      ),
    );

    // Convert persisted DTO back to domain for output
    const persisted = yield* dtoToReward(persistedDTO).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new RewardRepositoryError({
            message: `Failed to reconstruct reward: ${validationError.message}`,
          }),
      ),
    );

    return toOutput(persisted);
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
