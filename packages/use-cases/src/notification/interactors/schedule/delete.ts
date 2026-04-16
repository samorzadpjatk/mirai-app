import { Effect, Data } from "effect";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";

/**
 * Input for DeleteNotificationSchedule use case
 */
export interface DeleteNotificationScheduleInput {
  id: string;
}

/**
 * Output for DeleteNotificationSchedule use case
 */
export interface DeleteNotificationScheduleOutput {
  success: boolean;
  message: string;
  deletedExecutionCount?: number;
}

/**
 * Error types for DeleteNotificationSchedule use case
 */
export class DeleteScheduleNotFoundError extends Data.TaggedError(
  "DeleteScheduleNotFoundError",
)<{ id: string }> {}

/**
 * DeleteNotificationSchedule Use Case
 *
 * Deletes a notification schedule by ID.
 * Returns error if schedule not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = deleteNotificationScheduleUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function deleteNotificationScheduleUseCase(
  input: DeleteNotificationScheduleInput,
): Effect.Effect<
  DeleteNotificationScheduleOutput,
  DeleteScheduleNotFoundError,
  NotificationScheduleGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleGatewayTag;

    // Check if schedule exists
    const existing = yield* repo.findById(input.id);

    if (!existing) {
      return yield* Effect.fail(
        new DeleteScheduleNotFoundError({ id: input.id }),
      );
    }

    // Count executions before deletion
    const executionCount = yield* repo.countExecutions(input.id);

    // Delete the schedule
    yield* repo.delete(input.id);

    return {
      success: true,
      message: `Schedule "${existing.name}" deleted successfully. ${executionCount} execution records were also removed.`,
      deletedExecutionCount: executionCount,
    };
  });
}
