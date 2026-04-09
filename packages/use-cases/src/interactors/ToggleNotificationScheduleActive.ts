import type { Result } from "@mirai-app/domain";
import { ok, err, NotificationSchedule } from "@mirai-app/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";
import type { NotificationScheduleOutput } from "./GetNotificationSchedules";

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
 * ToggleNotificationScheduleActive Use Case
 *
 * Toggles the isActive status of a notification schedule.
 */
export class ToggleNotificationScheduleActiveUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: ToggleNotificationScheduleActiveInput,
  ): Promise<Result<NotificationScheduleOutput, string>> {
    // Check if schedule exists
    const existing = await this.repository.findById(input.id);

    if (!existing) {
      return err("Notification schedule not found");
    }

    // Toggle active status
    const updated = await this.repository.toggleActive(input.id);

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
