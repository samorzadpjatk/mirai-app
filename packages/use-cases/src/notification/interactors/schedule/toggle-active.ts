import { Effect, Data } from "effect";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import type { NotificationSchedule } from "@mirai-app/domain";
import type { NotificationScheduleOutput } from "./list";

/**
 * Input for ToggleNotificationScheduleActive use case
 */
export interface ToggleNotificationScheduleActiveInput {
  id: string;
}

/**
 * Output type alias for ToggleNotificationScheduleActive
 */
export type ToggleNotificationScheduleActiveOutput = NotificationScheduleOutput;

/**
 * Error types for ToggleNotificationScheduleActive use case
 */
export class ToggleScheduleNotFoundError extends Data.TaggedError(
  "ToggleScheduleNotFoundError",
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
 * ToggleNotificationScheduleActive Use Case
 *
 * Toggles the isActive status of a notification schedule.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = toggleNotificationScheduleActiveUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function toggleNotificationScheduleActiveUseCase(
  input: ToggleNotificationScheduleActiveInput,
): Effect.Effect<
  ToggleNotificationScheduleActiveOutput,
  ToggleScheduleNotFoundError,
  NotificationScheduleGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleGatewayTag;

    // Check if schedule exists
    const existing = yield* repo.findById(input.id);

    if (!existing) {
      return yield* Effect.fail(
        new ToggleScheduleNotFoundError({ id: input.id }),
      );
    }

    // Toggle active status
    const updated = yield* repo.toggleActive(input.id);

    return toOutput(updated);
  });
}
