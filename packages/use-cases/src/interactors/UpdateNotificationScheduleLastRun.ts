import type { Result } from "@repo/domain";
import { ok, err, NotificationSchedule } from "@repo/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";
import type { NotificationScheduleOutput } from "./GetNotificationSchedules";

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
 * UpdateNotificationScheduleLastRun Use Case
 *
 * Updates the lastRun timestamp of a notification schedule.
 */
export class UpdateNotificationScheduleLastRunUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: UpdateNotificationScheduleLastRunInput,
  ): Promise<Result<NotificationScheduleOutput, string>> {
    // Check if schedule exists
    const existing = await this.repository.findById(input.id);

    if (!existing) {
      return err("Notification schedule not found");
    }

    // Update lastRun
    const updated = await this.repository.updateLastRun(
      input.id,
      input.lastRun,
    );

    return ok(this.toOutput(updated));
  }

  private toOutput(schedule: NotificationSchedule): NotificationScheduleOutput {
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
}
