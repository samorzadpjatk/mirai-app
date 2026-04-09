import type { Result } from "@repo/domain";
import { ok, err, NotificationSchedule } from "@repo/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";
import type { NotificationScheduleOutput } from "./GetNotificationSchedules";

/**
 * Input for GetNotificationScheduleById use case
 */
export interface GetNotificationScheduleByIdInput {
  id: string;
}

/**
 * Output type alias for GetNotificationScheduleById
 */
export type GetNotificationScheduleByIdOutput = NotificationScheduleOutput;

/**
 * GetNotificationScheduleById Use Case
 *
 * Retrieves a notification schedule by ID.
 * Returns error if schedule not found.
 */
export class GetNotificationScheduleByIdUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: GetNotificationScheduleByIdInput,
  ): Promise<Result<NotificationScheduleOutput, string>> {
    const schedule = await this.repository.findById(input.id);

    if (!schedule) {
      return err("Notification schedule not found");
    }

    return ok(this.toOutput(schedule));
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
