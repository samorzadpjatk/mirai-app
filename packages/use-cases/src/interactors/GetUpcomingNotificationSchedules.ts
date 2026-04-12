import type { NotificationSchedule } from "@mirai-app/domain";
import { Effect } from "effect";
import { NotificationScheduleRepositoryTag } from "../ports/NotificationScheduleRepository";
import type { NotificationScheduleOutput } from "./GetNotificationSchedules";

/**
 * Input for GetUpcomingNotificationSchedules use case
 */
export interface GetUpcomingNotificationSchedulesInput {
  days?: number;
}

/**
 * Output type alias for GetUpcomingNotificationSchedules
 */
export type GetUpcomingNotificationSchedulesOutput =
  NotificationScheduleOutput[];

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
 * GetUpcomingNotificationSchedules Use Case
 *
 * Retrieves upcoming notification schedules.
 * A schedule is upcoming if:
 * - isActive flag is true
 * - startDate is in the future (or within the specified days window)
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getUpcomingNotificationSchedulesUseCase(input).pipe(
 *   Effect.provideService(NotificationScheduleRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getUpcomingNotificationSchedulesUseCase(
  input: GetUpcomingNotificationSchedulesInput,
): Effect.Effect<
  GetUpcomingNotificationSchedulesOutput,
  never,
  NotificationScheduleRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleRepositoryTag;

    const schedules = yield* repo.findUpcoming(input.days);

    return schedules.map((schedule) => toOutput(schedule));
  });
}
