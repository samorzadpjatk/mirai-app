import { Effect } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { NotificationScheduleDTO } from "../../dto/NotificationDTOs";

/**
 * Input for GetUpcomingSchedulesUseCase
 */
export interface GetUpcomingSchedulesInput {
  days: number;
}

/**
 * Get Upcoming Schedules Use Case
 *
 * Retrieves upcoming notification schedules within specified days.
 */
export class GetUpcomingSchedulesUseCase {
  execute(
    input: GetUpcomingSchedulesInput,
  ): Effect.Effect<
    NotificationScheduleDTO[],
    ApplicationError,
    NotificationSchedulePortTag
  > {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      const schedules = yield* schedulePort.findUpcoming(input.days);

      return schedules.map((s) => ({
        id: s.id,
        name: s.name,
        tripId: s.tripId,
        notificationType: s.notificationType,
        notificationTitle: s.notificationTitle,
        notificationBody: s.notificationBody,
        notificationUrl: s.notificationUrl,
        startDate: s.startDate,
        endDate: s.endDate,
        hour: s.hour,
        minute: s.minute,
        isActive: s.isActive,
        lastRun: s.lastRun,
        createdById: s.createdById,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
    });
  }
}
