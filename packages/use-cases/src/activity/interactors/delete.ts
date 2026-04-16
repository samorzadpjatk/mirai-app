import type { ActivityId } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { ActivityFeedGatewayTag } from "../ports/gateway";

/**
 * Input for DeleteActivity use case
 */
export interface DeleteActivityInput {
  activityId: ActivityId;
}

/**
 * Output DTO for DeleteActivity use case
 */
export interface DeleteActivityOutput {
  success: boolean;
  deletedActivityId: string;
}

/**
 * Error types for DeleteActivity use case
 */
export class DeleteActivityNotFoundError extends Data.TaggedError(
  "DeleteActivityNotFoundError",
)<{ message: string }> {}

export class DeleteActivityRepositoryError extends Data.TaggedError(
  "DeleteActivityRepositoryError",
)<{ message: string }> {}

/**
 * DeleteActivity Use Case
 *
 * Deletes an activity by ID.
 * Returns error if activity not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* deleteActivityUseCase({ activityId: "123" });
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
export function deleteActivityUseCase(
  input: DeleteActivityInput,
): Effect.Effect<
  DeleteActivityOutput,
  DeleteActivityNotFoundError | DeleteActivityRepositoryError,
  ActivityFeedGatewayTag
> {
  return Effect.gen(function* () {
    const activityRepo = yield* ActivityFeedGatewayTag;

    // Check if activity exists
    const exists = yield* activityRepo.exists(input.activityId).pipe(
      Effect.mapError(
        () =>
          new DeleteActivityRepositoryError({
            message: "Failed to check activity existence",
          }),
      ),
    );

    if (!exists) {
      return yield* Effect.fail(
        new DeleteActivityNotFoundError({ message: "Activity not found" }),
      );
    }

    // Delete the activity
    yield* activityRepo.delete(input.activityId).pipe(
      Effect.mapError(
        () =>
          new DeleteActivityRepositoryError({
            message: "Failed to delete activity",
          }),
      ),
    );

    return {
      success: true,
      deletedActivityId: input.activityId,
    };
  });
}
