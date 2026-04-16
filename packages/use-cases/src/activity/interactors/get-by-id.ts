import type { ActivityFeed, ActivityId } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { ActivityFeedGatewayTag } from "../ports/gateway";

/**
 * Input for GetActivityById use case
 */
export interface GetActivityByIdInput {
  activityId: ActivityId;
}

/**
 * Output DTO for GetActivityById use case
 */
export interface GetActivityByIdOutput {
  id: string;
  tripId: string;
  activityType: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
  admin: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

/**
 * Error types for GetActivityById use case
 */
export class ActivityNotFoundError extends Data.TaggedError(
  "ActivityNotFoundError",
)<{ message: string }> {}

export class ActivityRepositoryError extends Data.TaggedError(
  "ActivityRepositoryError",
)<{ message: string }> {}

/**
 * GetActivityById Use Case
 *
 * Retrieves a single activity by ID.
 * Returns error if activity not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getActivityByIdUseCase({ activityId: "123" });
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
export function getActivityByIdUseCase(
  input: GetActivityByIdInput,
): Effect.Effect<
  GetActivityByIdOutput,
  ActivityNotFoundError | ActivityRepositoryError,
  ActivityFeedGatewayTag
> {
  return Effect.gen(function* () {
    const activityRepo = yield* ActivityFeedGatewayTag;

    const activity = yield* activityRepo.findById(input.activityId).pipe(
      Effect.mapError(
        () =>
          new ActivityRepositoryError({
            message: "Failed to fetch activity",
          }),
      ),
    );

    if (!activity) {
      return yield* Effect.fail(
        new ActivityNotFoundError({ message: "Activity not found" }),
      );
    }

    return toOutput(activity);
  });
}

function toOutput(activity: ActivityFeed): GetActivityByIdOutput {
  return {
    id: activity.id,
    tripId: activity.tripId,
    activityType: activity.activityType,
    title: activity.title,
    description: activity.description,
    imageUrl: activity.imageUrl,
    isPinned: activity.isPinned,
    isHidden: activity.isHidden,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    admin: activity.admin,
  };
}
