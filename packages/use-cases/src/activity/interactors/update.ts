import type { ActivityId } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { ActivityFeedGatewayTag } from "../ports/gateway";
import type { ActivityFeedDTO } from "../dto";

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

    // Validate title if provided
    if (input.title !== undefined && input.title.trim().length === 0) {
      return yield* Effect.fail(
        new UpdateActivityValidationError({ message: "Title cannot be empty" }),
      );
    }

    // Build updated DTO
    const updated: ActivityFeedDTO = {
      ...existing,
      ...(input.title !== undefined && { content: input.title }),
      ...(input.description !== undefined && {
        metadata: { ...existing.metadata, description: input.description },
      }),
      ...(input.isPinned !== undefined && { isPinned: input.isPinned }),
      updatedAt: new Date(),
    };

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

function toOutput(activity: ActivityFeedDTO): UpdateActivityOutput {
  return {
    id: activity.id,
    tripId: activity.tripId,
    activityType: activity.activityType,
    title: activity.content,
    description: (activity.metadata?.description as string | null) ?? null,
    imageUrl: (activity.metadata?.imageUrl as string | null) ?? null,
    isPinned: activity.isPinned,
    isHidden: activity.isHidden,
    updatedAt: activity.updatedAt,
  };
}
