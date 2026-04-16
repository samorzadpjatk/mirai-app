import { Effect, Data } from "effect";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";

/**
 * Input for BulkDeleteNotificationSchedules use case
 */
export interface BulkDeleteNotificationSchedulesInput {
  ids: string[];
}

/**
 * Output for BulkDeleteNotificationSchedules use case
 */
export interface BulkDeleteNotificationSchedulesOutput {
  success: boolean;
  deletedCount: number;
  requestedCount: number;
  notFoundIds?: string[];
}

/**
 * Error types for BulkDeleteNotificationSchedules use case
 */
export class BulkDeleteValidationError extends Data.TaggedError(
  "BulkDeleteValidationError",
)<{ message: string }> {}

/**
 * BulkDeleteNotificationSchedules Use Case
 *
 * Deletes multiple notification schedules by ID.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = bulkDeleteNotificationSchedulesUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function bulkDeleteNotificationSchedulesUseCase(
  input: BulkDeleteNotificationSchedulesInput,
): Effect.Effect<
  BulkDeleteNotificationSchedulesOutput,
  BulkDeleteValidationError,
  NotificationScheduleGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleGatewayTag;

    if (input.ids.length === 0) {
      return yield* Effect.fail(
        new BulkDeleteValidationError({
          message: "At least one ID must be provided",
        }),
      );
    }

    // Check which IDs exist
    const existingIds: string[] = [];
    const notFoundIds: string[] = [];

    for (const id of input.ids) {
      const exists = yield* repo.exists(id);
      if (exists) {
        existingIds.push(id);
      } else {
        notFoundIds.push(id);
      }
    }

    // Delete the existing ones
    let deletedCount = 0;
    if (existingIds.length > 0) {
      deletedCount = yield* repo.deleteMany(existingIds);
    }

    const output: BulkDeleteNotificationSchedulesOutput = {
      success: true,
      deletedCount,
      requestedCount: input.ids.length,
    };

    if (notFoundIds.length > 0) {
      output.notFoundIds = notFoundIds;
    }

    return output;
  });
}
