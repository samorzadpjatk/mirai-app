import { Effect, Data } from "effect";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import type { NotificationSchedule } from "@mirai-app/domain";
import type { NotificationScheduleOutput } from "./list";

/**
 * Input for UpdateNotificationScheduleLastRun use case
 */
export interface UpdateNotificationScheduleLastRunInput {
  id: string;
  lastRun: Date;
}

/**
 * Output type alias for UpdateNotificationScheduleLastRun
 */
export type UpdateNotificationScheduleLastRunOutput =
  NotificationScheduleOutput;

/**
 * Error types for UpdateNotificationScheduleLastRun use case
 */
export class UpdateLastRunNotFoundError extends Data.TaggedError(
  "UpdateLastRunNotFoundError",
)<{ id: string }> {}

/**
 * Helper function to convert NotificationSchedule to output DTO
 */
function toOutput(schedule: NotificationSchedule): NotificationScheduleOutput {
  const now = new Date();
  return {
    id: schedule.id,
    name: schedule.name,
    tripId: schedule.tripId,
    notificationType: schedule.notificationType,
    notificationTitle: schedule.notificationTitle,
    notificationBody: schedule.notificationBody,
    notificationUrl: schedule.notificationUrl,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    hour: schedule.hour,
    minute: schedule.minute,
    isActive: schedule.isActive,
    createdById: schedule.createdById,
    lastRun: schedule.lastRun,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    isCurrentlyActive: schedule.isCurrentlyActive(now),
    isExpired: schedule.isExpired(now),
    isUpcoming: schedule.isUpcoming(now),
    formattedTime: schedule.getFormattedTime(),
  };
}

/**
 * UpdateNotificationScheduleLastRun Use Case
 *
 * Updates the lastRun timestamp of a notification schedule.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = updateNotificationScheduleLastRunUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function updateNotificationScheduleLastRunUseCase(
  input: UpdateNotificationScheduleLastRunInput,
): Effect.Effect<
  UpdateNotificationScheduleLastRunOutput,
  UpdateLastRunNotFoundError,
  NotificationScheduleGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleGatewayTag;

    // Check if schedule exists
    const existing = yield* repo.findById(input.id);

    if (!existing) {
      return yield* Effect.fail(
        new UpdateLastRunNotFoundError({ id: input.id }),
      );
    }

    // Update lastRun
    const updated = yield* repo.updateLastRun(input.id, input.lastRun);

    return toOutput(updated);
  });
}
