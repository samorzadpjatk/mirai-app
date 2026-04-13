import type { ActivityFeed, ActivityId } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { ActivityFeedRepositoryTag } from "../ports/ActivityFeedRepository";

/**
 * Input for UnhideActivity use case
 */
export interface UnhideActivityInput {
  activityId: ActivityId;
}

/**
 * Output DTO for UnhideActivity use case
 */
export interface UnhideActivityOutput {
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
 * Error types for UnhideActivity use case
 */
export class UnhideActivityNotFoundError extends Data.TaggedError(
  "UnhideActivityNotFoundError",
)<{ message: string }> {}

export class UnhideActivityRepositoryError extends Data.TaggedError(
  "UnhideActivityRepositoryError",
)<{ message: string }> {}

/**
 * UnhideActivity Use Case
 *
 * Unhides a previously hidden activity.
 * Returns error if activity not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* unhideActivityUseCase({ activityId: "123" });
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(ActivityFeedRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function unhideActivityUseCase(
  input: UnhideActivityInput,
): Effect.Effect<
  UnhideActivityOutput,
  UnhideActivityNotFoundError | UnhideActivityRepositoryError,
  ActivityFeedRepositoryTag
> {
  return Effect.gen(function* () {
    const activityRepo = yield* ActivityFeedRepositoryTag;

    // Find existing activity
    const existing = yield* activityRepo.findById(input.activityId).pipe(
      Effect.mapError(
        () =>
          new UnhideActivityRepositoryError({
            message: "Failed to fetch activity",
          }),
      ),
    );

    if (!existing) {
      return yield* Effect.fail(
        new UnhideActivityNotFoundError({ message: "Activity not found" }),
      );
    }

    // Apply unhide
    const updated = existing.unhide();

    // Persist changes
    const saved = yield* activityRepo.update(updated).pipe(
      Effect.mapError(
        () =>
          new UnhideActivityRepositoryError({
            message: "Failed to unhide activity",
          }),
      ),
    );

    return {
      id: saved.id,
      tripId: saved.tripId,
      activityType: saved.activityType,
      title: saved.title,
      description: saved.description,
      imageUrl: saved.imageUrl,
      isPinned: saved.isPinned,
      isHidden: saved.isHidden,
      updatedAt: saved.updatedAt,
    };
  });
}
