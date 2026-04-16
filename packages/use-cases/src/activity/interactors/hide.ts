import type { ActivityFeed, ActivityId } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { ActivityFeedGatewayTag } from "../ports/gateway";

/**
 * Input for HideActivity use case
 */
export interface HideActivityInput {
  activityId: ActivityId;
  hiddenByAdmin: string;
  reason?: string | null;
}

/**
 * Output DTO for HideActivity use case
 */
export interface HideActivityOutput {
  id: string;
  tripId: string;
  activityType: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isHidden: boolean;
  hiddenAt: Date;
  hiddenReason: string | null;
  updatedAt: Date;
}

/**
 * Error types for HideActivity use case
 */
export class HideActivityNotFoundError extends Data.TaggedError(
  "HideActivityNotFoundError",
)<{ message: string }> {}

export class HideActivityRepositoryError extends Data.TaggedError(
  "HideActivityRepositoryError",
)<{ message: string }> {}

/**
 * HideActivity Use Case
 *
 * Hides an activity (marks as hidden by admin).
 * Returns error if activity not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* hideActivityUseCase({ activityId: "123", hiddenByAdmin: "admin-1" });
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
export function hideActivityUseCase(
  input: HideActivityInput,
): Effect.Effect<
  HideActivityOutput,
  HideActivityNotFoundError | HideActivityRepositoryError,
  ActivityFeedGatewayTag
> {
  return Effect.gen(function* () {
    const activityRepo = yield* ActivityFeedGatewayTag;

    // Find existing activity
    const existing = yield* activityRepo.findById(input.activityId).pipe(
      Effect.mapError(
        () =>
          new HideActivityRepositoryError({
            message: "Failed to fetch activity",
          }),
      ),
    );

    if (!existing) {
      return yield* Effect.fail(
        new HideActivityNotFoundError({ message: "Activity not found" }),
      );
    }

    // Apply hide
    const updated = existing.hide(input.hiddenByAdmin, input.reason ?? null);

    // Persist changes
    const saved = yield* activityRepo.update(updated).pipe(
      Effect.mapError(
        () =>
          new HideActivityRepositoryError({
            message: "Failed to hide activity",
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
      hiddenAt: saved.hiddenAt!,
      hiddenReason: saved.hiddenReason,
      updatedAt: saved.updatedAt,
    };
  });
}
