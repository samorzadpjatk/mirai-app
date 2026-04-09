import type { Result } from "@repo/domain";
import { ok } from "@repo/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";
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
 * GetUpcomingNotificationSchedules Use Case
 *
 * Retrieves upcoming notification schedules.
 * A schedule is upcoming if:
 * - isActive flag is true
 * - startDate is in the future (or within the specified days window)
 */
export class GetUpcomingNotificationSchedulesUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: GetUpcomingNotificationSchedulesInput,
  ): Promise<Result<NotificationScheduleOutput[], string>> {
    const schedules = await this.repository.findUpcoming(input.days);

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
