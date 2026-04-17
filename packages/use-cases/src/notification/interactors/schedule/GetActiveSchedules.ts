import { Effect } from "effect";
import { NotificationSchedulePortTag } from "../../ports/NotificationPort";

/**
 * Get Active Schedules Use Case
 *
 * Retrieves all currently active notification schedules.
 */
export class GetActiveSchedulesUseCase {
  execute() {
    return Effect.gen(function* () {
      const schedulePort = yield* NotificationSchedulePortTag;

      const schedules = yield* schedulePort.findActive();

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
