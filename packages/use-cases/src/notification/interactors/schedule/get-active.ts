import type { NotificationSchedule } from "@mirai-app/domain";
import { Effect } from "effect";
import { NotificationScheduleGatewayTag } from "../../ports/schedule/gateway";
import type { NotificationScheduleOutput } from "./list";

/**
 * Input for GetActiveNotificationSchedules use case
 */
export interface GetActiveNotificationSchedulesInput {
  tripId?: string | null;
}

/**
 * Output type alias for GetActiveNotificationSchedules
 */
export type GetActiveNotificationSchedulesOutput = NotificationScheduleOutput[];

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
 * GetActiveNotificationSchedules Use Case
 *
 * Retrieves currently active notification schedules.
 * A schedule is active if:
 * - isActive flag is true
 * - current time is within the schedule window (startDate <= now <= endDate)
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getActiveNotificationSchedulesUseCase().pipe(
 *   Effect.provideService(NotificationScheduleGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getActiveNotificationSchedulesUseCase(): Effect.Effect<
  GetActiveNotificationSchedulesOutput,
  never,
  NotificationScheduleGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationScheduleGatewayTag;

    const schedules = yield* repo.findActive();

    return schedules.map((schedule) => toOutput(schedule));
  });
}
