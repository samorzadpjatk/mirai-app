import { ActivityFeed, type ActivityId } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { ActivityFeedRepositoryTag } from "../ports/ActivityFeedRepository";

/**
 * Input for GetActivityFeed use case
 */
export interface GetActivityFeedInput {
  tripId: string;
  pageSize?: number;
  cursor?: {
    id: string;
    createdAt: Date;
    isPinned: boolean;
  } | null;
}

/**
 * Activity output DTO
 */
export interface ActivityOutput {
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
 * Output DTO for GetActivityFeed use case
 */
export interface GetActivityFeedOutput {
  activities: ActivityOutput[];
  nextCursor: {
    id: string;
    createdAt: Date;
    isPinned: boolean;
  } | null;
  pagination: {
    pageSize: number;
    hasMore: boolean;
  };
}

/**
 * Error types for GetActivityFeed use case
 */
export class ActivityFeedQueryError extends Data.TaggedError(
  "ActivityFeedQueryError",
)<{ message: string }> {}

/**
 * GetActivityFeed Use Case
 *
 * Retrieves activities for a trip with cursor-based pagination.
 * Returns only visible activities (not hidden).
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* getActivityFeedUseCase(input);
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
export function getActivityFeedUseCase(
  input: GetActivityFeedInput,
): Effect.Effect<
  GetActivityFeedOutput,
  ActivityFeedQueryError,
  ActivityFeedRepositoryTag
> {
  return Effect.gen(function* () {
    const activityRepo = yield* ActivityFeedRepositoryTag;

    const pageSize = input.pageSize ?? 30;

    const result = yield* activityRepo
      .findByTripId(input.tripId, {
        limit: pageSize,
        cursor: input.cursor ?? undefined,
        includeHidden: false,
      })
      .pipe(
        Effect.mapError(
          () =>
            new ActivityFeedQueryError({
              message: "Failed to fetch activity feed",
            }),
        ),
      );

    return {
      activities: result.activities.map((activity) => toOutput(activity)),
      nextCursor: result.nextCursor,
      pagination: {
        pageSize,
        hasMore: result.hasMore,
      },
    };
  });
}

function toOutput(activity: ActivityFeed): ActivityOutput {
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
