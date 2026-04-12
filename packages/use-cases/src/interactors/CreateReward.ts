import { Reward, UserRole, ValidationError } from "@mirai-app/domain";
import { Effect } from "effect";
import {
  RewardRepositoryTag,
  TripAccessCheckerTag,
} from "../ports/RewardRepository";

/**
 * Input for CreateReward use case
 */
export interface CreateRewardInput {
  name: string;
  description: string;
  availableQuantity: number;
  coinCostPercentage: number;
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
export class CreateRewardError extends Error {
  readonly _tag = "CreateRewardError";
  constructor(message: string) {
    super(message);
  }
}

export class RewardRepositoryError extends Error {
  readonly _tag = "RewardRepositoryError";
  constructor(message: string = "Failed to create reward") {
    super(message);
  }
}

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
 *   Effect.provideService(RewardRepositoryTag, repository),
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
  RewardRepositoryTag | TripAccessCheckerTag
> {
  return Effect.gen(function* () {
    const rewardRepo = yield* RewardRepositoryTag;
    const accessChecker = yield* TripAccessCheckerTag;

    // Verify user is staff (moderator or admin)
    const isStaff = yield* accessChecker.isStaff(input.createdById);
    if (
      !isStaff &&
      input.creatorRole !== UserRole.ADMIN &&
      input.creatorRole !== UserRole.MODERATOR
    ) {
      return yield* Effect.fail(
        new CreateRewardError("Only moderators and admins can create rewards"),
      );
    }

    // Check if trip has ended
    const hasEnded = yield* accessChecker.hasTripEnded(input.tripId);
    if (hasEnded) {
      return yield* Effect.fail(
        new CreateRewardError("Cannot create rewards for ended trips"),
      );
    }

    // Create domain entity using Effect-based static create method
    const reward = yield* Reward.create({
      name: input.name,
      description: input.description,
      availableQuantity: input.availableQuantity,
      coinCostPercentage: input.coinCostPercentage,
      images: input.images,
      isHidden: input.isHidden,
      tripId: input.tripId,
      createdById: input.createdById,
    }).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new CreateRewardError(validationError.message),
      ),
    );

    // Persist reward
    const saved = yield* rewardRepo
      .create(reward)
      .pipe(
        Effect.mapError(
          () => new RewardRepositoryError("Failed to create reward"),
        ),
      );

    return toOutput(saved);
  });
}

function toOutput(reward: Reward): CreateRewardOutput {
  return {
    id: reward.id,
    name: reward.name,
    description: reward.description,
    availableQuantity: reward.availableQuantity,
    coinCostPercentage: reward.coinCostPercentage.toNumber(),
    images: reward.images,
    isHidden: reward.isHidden,
    tripId: reward.tripId,
    createdById: reward.createdById,
    createdAt: reward.createdAt,
    isInStock: reward.isInStock(),
    canBePurchased: reward.canBePurchased(),
  };
}
