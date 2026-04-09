import type { Result } from "@repo/domain";
import { ok, err, NotificationSchedule } from "@repo/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";
import type { NotificationScheduleOutput } from "./GetNotificationSchedules";

/**
 * Input for UpdateNotificationSchedule use case
 */
export interface UpdateNotificationScheduleInput {
  id: string;
  name?: string;
  notificationTitle?: string | null;
  notificationBody?: string | null;
  notificationUrl?: string | null;
  startDate?: Date;
  endDate?: Date;
  hour?: number;
  minute?: number;
  isActive?: boolean;
}

/**
 * Output type alias for UpdateNotificationSchedule
 */
export type UpdateNotificationScheduleOutput = NotificationScheduleOutput;

/**
 * UpdateNotificationSchedule Use Case
 *
 * Updates an existing notification schedule.
 * Returns error if schedule not found.
 */
export class UpdateNotificationScheduleUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: UpdateNotificationScheduleInput,
  ): Promise<Result<NotificationScheduleOutput, string>> {
    // Find the existing schedule
    const existing = await this.repository.findById(input.id);

    if (!existing) {
      return err("Notification schedule not found");
    }

    // Apply updates using domain entity method (validation happens here)
    const updateResult = existing.update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.notificationTitle !== undefined && {
        notificationTitle: input.notificationTitle,
      }),
      ...(input.notificationBody !== undefined && {
        notificationBody: input.notificationBody,
      }),
      ...(input.notificationUrl !== undefined && {
        notificationUrl: input.notificationUrl,
      }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.hour !== undefined && { hour: input.hour }),
      ...(input.minute !== undefined && { minute: input.minute }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    });

    if (updateResult.kind === "err") {
      return err(updateResult.error);
    }

    // Save to repository
    const saved = await this.repository.update(updateResult.value);

    return ok(this.toOutput(saved));
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
