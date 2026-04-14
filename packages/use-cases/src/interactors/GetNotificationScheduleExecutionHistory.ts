import { Effect, Data } from "effect";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";

/**
 * Input for GetNotificationScheduleExecutionHistory use case
 */
export interface GetNotificationScheduleExecutionHistoryInput {
  scheduleId: string;
  limit?: number;
}

/**
 * Execution record output
 */
export interface ExecutionHistoryItem {
  id: string;
  executedAt: Date;
  notification: {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
  } | null;
}

/**
 * Output for GetNotificationScheduleExecutionHistory use case
 */
export interface GetNotificationScheduleExecutionHistoryOutput {
  executions: ExecutionHistoryItem[];
}

/**
 * Error types for GetNotificationScheduleExecutionHistory use case
 */
export class ScheduleNotFoundError extends Data.TaggedError(
  "ScheduleNotFoundError",
)<{ scheduleId: string }> {}

/**
 * GetNotificationScheduleExecutionHistory Use Case
 *
 * Retrieves the execution history for a notification schedule.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getNotificationScheduleExecutionHistoryUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getNotificationScheduleExecutionHistoryUseCase(
  input: GetNotificationScheduleExecutionHistoryInput,
): Effect.Effect<
  GetNotificationScheduleExecutionHistoryOutput,
  ScheduleNotFoundError,
  NotificationScheduleRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleRepositoryTag;

    // Check if schedule exists
    const exists = yield* repo.exists(input.scheduleId);

    if (!exists) {
      return yield* Effect.fail(
        new ScheduleNotFoundError({ scheduleId: input.scheduleId }),
      );
    }

    const executions = yield* repo.getExecutionHistory(
      input.scheduleId,
      input.limit ?? 20,
    );

    return {
      executions,
    };
  });
}
