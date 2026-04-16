import { Data, Effect } from "effect";
import { RewardGatewayTag } from "../ports/gateway";
import type { RewardId } from "@mirai-app/domain";
import { Reward, ValidationError } from "@mirai-app/domain";
import type { RewardDTO } from "../dto";

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

    // Find existing reward DTO
    const existingDTO = yield* rewardRepo.findById(input.rewardId).pipe(
      Effect.mapError(
        (cause) =>
          new SetRewardHiddenRepositoryError({
            message: "Failed to find reward",
            operation: "find reward",
            cause,
          }),
      ),
    );

    if (!existingDTO) {
      return yield* Effect.fail(
        new RewardNotFoundError({ message: "Reward not found" }),
      );
    }

    // Convert DTO to domain entity
    const existing = yield* dtoToReward(existingDTO).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new SetRewardHiddenRepositoryError({
            message: `Invalid reward data: ${validationError.message}`,
            operation: "convert DTO",
          }),
      ),
    );

    // Apply hide/unhide
    const updated = input.isHidden ? existing.hide() : existing.unhide();

    // Persist - convert domain entity to DTO
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

    const savedDTO = yield* rewardRepo.update(updatedDTO).pipe(
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
      id: savedDTO.id,
      name: savedDTO.title,
      isHidden: savedDTO.isHidden,
      updatedAt: savedDTO.updatedAt,
    };
  });
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
