import type { Result } from "@repo/domain";
import { ok } from "@repo/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";
import type { NotificationScheduleOutput } from "./GetNotificationSchedules";

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
 * GetActiveNotificationSchedules Use Case
 *
 * Retrieves currently active notification schedules.
 * A schedule is active if:
 * - isActive flag is true
 * - current time is within the schedule window (startDate <= now <= endDate)
 */
export class GetActiveNotificationSchedulesUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(): Promise<Result<NotificationScheduleOutput[], string>> {
    const schedules = await this.repository.findActive();

    const now = new Date();

    return ok(schedules.map((schedule) => this.toOutput(schedule, now)));
  }

  private toOutput(
    schedule: import("@repo/domain").NotificationSchedule,
    now: Date,
  ): NotificationScheduleOutput {
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
}
