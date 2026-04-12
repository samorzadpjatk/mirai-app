import { Effect } from "effect";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";

/**
 * Input for BulkToggleNotificationScheduleActive use case
 */
export interface BulkToggleNotificationScheduleActiveInput {
  ids: string[];
  isActive: boolean;
}

/**
 * Output for BulkToggleNotificationScheduleActive use case
 */
export interface BulkToggleNotificationScheduleActiveOutput {
  success: boolean;
  updatedCount: number;
}

/**
 * Error types for BulkToggleNotificationScheduleActive use case
 */
export class BulkToggleValidationError extends Error {
  readonly _tag = "BulkToggleValidationError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * BulkToggleNotificationScheduleActive Use Case
 *
 * Updates the isActive status for multiple notification schedules.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = bulkToggleNotificationScheduleActiveUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function bulkToggleNotificationScheduleActiveUseCase(
  input: BulkToggleNotificationScheduleActiveInput,
): Effect.Effect<
  BulkToggleNotificationScheduleActiveOutput,
  BulkToggleValidationError,
  NotificationScheduleRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleRepositoryTag;

    if (input.ids.length === 0) {
      return yield* Effect.fail(
        new BulkToggleValidationError("At least one ID must be provided"),
      );
    }

    const updatedCount = yield* repo.bulkToggleActive(
      input.ids,
      input.isActive,
    );

    return {
      success: true,
      updatedCount,
    };
  });
}
