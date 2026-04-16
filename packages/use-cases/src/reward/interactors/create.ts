import {
  Reward,
  UserRole,
  ValidationError,
  RewardStatus,
} from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { RewardGatewayTag } from "../ports/gateway";
import { TripAccessCheckerTag } from "../../trip/ports/gateway";
import type { RewardDTO } from "../dto";

/**
 * Input for CreateReward use case
 */
export interface CreateRewardInput {
  name: string;
  description: string;
  availableQuantity: number;
  coinCostPercentage: number;
  image?: string | null;
  images?: string[];
  isHidden?: boolean;
  tripId: string;
  createdById: string;
  creatorRole: UserRole;
}

/**
 * Output DTO for CreateReward use case
 */
export interface CreateRewardOutput {
  id: string;
  name: string;
  description: string;
  availableQuantity: number;
  coinCostPercentage: number;
  images: string[];
  isHidden: boolean;
  tripId: string;
  createdById: string;
  createdAt: Date;
  isInStock: boolean;
  canBePurchased: boolean;
}

/**
 * Error types for CreateReward use case
 */
export class CreateRewardError extends Data.TaggedError("CreateRewardError")<{
  message: string;
}> {}

export class RewardRepositoryError extends Data.TaggedError(
  "RewardRepositoryError",
)<{
  message: string;
}> {}

/**
 * CreateReward Use Case
 *
 * Creates a new reward in a trip.
 * Only moderators and admins can create rewards.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* createRewardUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(RewardGatewayTag, repository),
 *   Effect.provideService(TripAccessCheckerTag, accessChecker)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function createRewardUseCase(
  input: CreateRewardInput,
): Effect.Effect<
  CreateRewardOutput,
  CreateRewardError | RewardRepositoryError,
  RewardGatewayTag | TripAccessCheckerTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardGatewayTag;
    const accessChecker = yield* TripAccessCheckerTag;

    // Verify user is staff (moderator or admin)
    const isStaff = yield* accessChecker.isStaff(input.createdById).pipe(
      Effect.mapError(
        (error) =>
          new CreateRewardError({
            message: `Failed to check staff status: ${error.message}`,
          }),
      ),
    );
    if (
      !isStaff &&
      input.creatorRole !== UserRole.ADMIN &&
      input.creatorRole !== UserRole.MODERATOR
    ) {
      return yield* Effect.fail(
        new CreateRewardError({
          message: "Only moderators and admins can create rewards",
        }),
      );
    }

    // Check if trip has ended
    const hasEnded = yield* accessChecker.hasTripEnded(input.tripId).pipe(
      Effect.mapError(
        (error) =>
          new CreateRewardError({
            message: `Failed to check trip status: ${error.message}`,
          }),
      ),
    );
    if (hasEnded) {
      return yield* Effect.fail(
        new CreateRewardError({
          message: "Cannot create rewards for ended trips",
        }),
      );
    }

    // Create domain entity using Effect-based static create method
    const reward = yield* Reward.create({
      name: input.name,
      description: input.description,
      availableQuantity: input.availableQuantity,
      coinCost: input.coinCostPercentage,
      image: input.image,
      images: input.images,
      isHidden: input.isHidden,
      tripId: input.tripId,
      createdById: input.createdById,
    }).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new CreateRewardError({
            message: validationError.message,
          }),
      ),
    );

    // Convert domain entity to DTO for gateway
    const rewardDTO: RewardDTO = {
      id: reward.id,
      tripId: reward.tripId,
      title: reward.name,
      description: reward.description,
      imageUrl: reward.image,
      images: reward.images,
      pointsCost: reward.coinCost,
      quantity: reward.availableQuantity,
      availableQuantity: reward.availableQuantity,
      status: RewardStatus.AVAILABLE, // Default status for new rewards
      isHidden: reward.isHidden,
      createdById: reward.createdById,
      createdAt: reward.createdAt,
      updatedAt: reward.updatedAt,
    };

    // Persist reward
    const savedDTO = yield* rewardRepo.create(rewardDTO).pipe(
      Effect.mapError(
        () =>
          new RewardRepositoryError({
            message: "Failed to create reward",
          }),
      ),
    );

    // Convert saved DTO back to domain entity to call methods
    const savedReward = yield* dtoToReward(savedDTO).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new RewardRepositoryError({
            message: `Failed to reconstruct reward: ${validationError.message}`,
          }),
      ),
    );

    return toOutput(savedReward);
  });
}

function toOutput(reward: Reward): CreateRewardOutput {
  return {
    id: reward.id,
    name: reward.name,
    description: reward.description,
    availableQuantity: reward.availableQuantity,
    coinCostPercentage: reward.coinCost,
    images: reward.images,
    isHidden: reward.isHidden,
    tripId: reward.tripId,
    createdById: reward.createdById,
    createdAt: reward.createdAt,
    isInStock: reward.isInStock(),
    canBePurchased: reward.isInStock() && reward.isVisible(),
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
