import type { ActivityFeed, ActivityId } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { ActivityFeedGatewayTag } from "../ports/gateway";

/**
 * Input for UpdateActivity use case
 */
export interface UpdateActivityInput {
  activityId: ActivityId;
  title?: string;
  description?: string | null;
  isPinned?: boolean;
}

/**
 * Output DTO for UpdateActivity use case
 */
export interface UpdateActivityOutput {
  id: string;
  tripId: string;
  activityType: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isHidden: boolean;
  updatedAt: Date;
}

/**
 * Error types for UpdateActivity use case
 */
export class UpdateActivityNotFoundError extends Data.TaggedError(
  "UpdateActivityNotFoundError",
)<{ message: string }> {}

export class UpdateActivityValidationError extends Data.TaggedError(
  "UpdateActivityValidationError",
)<{ message: string }> {}

export class UpdateActivityRepositoryError extends Data.TaggedError(
  "UpdateActivityRepositoryError",
)<{ message: string }> {}

/**
 * UpdateActivity Use Case
 *
 * Updates an activity's content (title, description, pinned status).
 * Returns error if activity not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* updateActivityUseCase({ activityId: "123", title: "New Title" });
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
export function updateActivityUseCase(
  input: UpdateActivityInput,
): Effect.Effect<
  UpdateActivityOutput,
  | UpdateActivityNotFoundError
  | UpdateActivityValidationError
  | UpdateActivityRepositoryError,
  ActivityFeedGatewayTag
> {
  return Effect.gen(function* () {
    const activityRepo = yield* ActivityFeedGatewayTag;

    // Find existing activity
    const existing = yield* activityRepo.findById(input.activityId).pipe(
      Effect.mapError(
        () =>
          new UpdateActivityRepositoryError({
            message: "Failed to fetch activity",
          }),
      ),
    );

    if (!existing) {
      return yield* Effect.fail(
        new UpdateActivityNotFoundError({ message: "Activity not found" }),
      );
    }

    // Apply updates
    let updated = existing;

    if (input.title !== undefined || input.description !== undefined) {
      updated = yield* updated
        .updateContent({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
        })
        .pipe(
          Effect.mapError((error) => {
            return new UpdateActivityValidationError({
              message: error.message,
            });
          }),
        );
    }

    if (input.isPinned !== undefined) {
      updated = input.isPinned ? updated.pin() : updated.unpin();
    }

    // Persist changes
    const saved = yield* activityRepo.update(updated).pipe(
      Effect.mapError(
        () =>
          new UpdateActivityRepositoryError({
            message: "Failed to update activity",
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(activity: ActivityFeed): UpdateActivityOutput {
  return {
    id: activity.id,
    tripId: activity.tripId,
    activityType: activity.activityType,
    title: activity.title,
    description: activity.description,
    imageUrl: activity.imageUrl,
    isPinned: activity.isPinned,
    isHidden: activity.isHidden,
    updatedAt: activity.updatedAt,
  };
}
