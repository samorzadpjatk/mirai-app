import {
  ActivityReaction,
  type ActivityId,
  type ReactionType,
  ValidationError,
} from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { ActivityFeedGatewayTag } from "../ports/gateway";

/**
 * Input for AddReaction use case
 */
export interface AddReactionInput {
  activityId: ActivityId;
  userId: string;
  reactionType: ReactionType;
}

/**
 * Output DTO for AddReaction use case
 */
export interface AddReactionOutput {
  activityId: string;
  reactionType: ReactionType;
  isActive: boolean;
  reactionsSummary: {
    total: number;
    counts: {
      heart: number;
      fire: number;
      clap: number;
      star: number;
    };
    myReactions: ReactionType[];
  };
}

/**
 * Error types for AddReaction use case
 */
export class ActivityNotFoundError extends Data.TaggedError(
  "ActivityNotFoundError",
)<{ message: string }> {}

export class ActivityHiddenError extends Data.TaggedError(
  "ActivityHiddenError",
)<{ message: string }> {}

export class ReactionCreationError extends Data.TaggedError(
  "ReactionCreationError",
)<{ message: string }> {}

export class ReactionRepositoryError extends Data.TaggedError(
  "ReactionRepositoryError",
)<{ message: string }> {}

/**
 * AddReaction Use Case
 *
 * Toggles a reaction on an activity (add if not exists, remove if exists).
 * Returns the updated reaction summary.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* addReactionUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ActivityFeedGatewayTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function addReactionUseCase(
  input: AddReactionInput,
): Effect.Effect<
  AddReactionOutput,
  | ActivityNotFoundError
  | ActivityHiddenError
  | ReactionCreationError
  | ReactionRepositoryError,
  ActivityFeedGatewayTag
> {
  return Effect.gen(function* () {
    const activityRepo = yield* ActivityFeedGatewayTag;

    // Check if activity exists
    const activity = yield* activityRepo.findById(input.activityId).pipe(
      Effect.mapError(
        () =>
          new ReactionRepositoryError({
            message: "Failed to fetch activity",
          }),
      ),
    );

    if (!activity) {
      return yield* Effect.fail(
        new ActivityNotFoundError({ message: "Activity not found" }),
      );
    }

    if (activity.isHidden) {
      return yield* Effect.fail(
        new ActivityHiddenError({ message: "Activity is hidden" }),
      );
    }

    // Check if user already has this reaction
    const existingReactions = yield* activityRepo
      .findUserReactions(input.activityId, input.userId)
      .pipe(
        Effect.mapError(
          () =>
            new ReactionRepositoryError({
              message: "Failed to fetch user reactions",
            }),
        ),
      );

    const hasExistingReaction = existingReactions.some(
      (r) => r.reactionType === input.reactionType,
    );

    let isActive: boolean;

    if (hasExistingReaction) {
      // Remove reaction (toggle off)
      yield* activityRepo
        .removeReaction(input.activityId, input.userId, input.reactionType)
        .pipe(
          Effect.mapError(
            () =>
              new ReactionRepositoryError({
                message: "Failed to remove reaction",
              }),
          ),
        );
      isActive = false;
    } else {
      // Add reaction (toggle on)
      const reaction = yield* ActivityReaction.create({
        activityId: input.activityId,
        userId: input.userId,
        reactionType: input.reactionType,
      }).pipe(
        Effect.mapError(
          (validationError: ValidationError) =>
            new ReactionCreationError({
              message: validationError.message,
            }),
        ),
      );

      yield* activityRepo.addReaction(reaction).pipe(
        Effect.mapError(
          () =>
            new ReactionRepositoryError({
              message: "Failed to add reaction",
            }),
        ),
      );
      isActive = true;
    }

    // Get updated reaction summary in parallel
    const [counts, userReactions] = yield* Effect.all([
      activityRepo.getReactionCounts(input.activityId).pipe(
        Effect.mapError(
          () =>
            new ReactionRepositoryError({
              message: "Failed to get reaction counts",
            }),
        ),
      ),
      activityRepo.findUserReactions(input.activityId, input.userId).pipe(
        Effect.mapError(
          () =>
            new ReactionRepositoryError({
              message: "Failed to fetch user reactions",
            }),
        ),
      ),
    ]);

    return {
      activityId: input.activityId,
      reactionType: input.reactionType,
      isActive,
      reactionsSummary: {
        total: counts.total,
        counts: counts.counts,
        myReactions: userReactions.map((r) => r.reactionType) as ReactionType[],
      },
    };
  });
}
