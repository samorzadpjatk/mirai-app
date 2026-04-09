import type { Result } from "@repo/domain";
import { ok, err, NotificationSchedule } from "@repo/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";
import type { NotificationScheduleOutput } from "./GetNotificationSchedules";

/**
 * Input for DuplicateNotificationSchedule use case
 */
export interface DuplicateNotificationScheduleInput {
  id: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  newCreatedById: string;
}

/**
 * Output for DuplicateNotificationSchedule use case
 */
export interface DuplicateNotificationScheduleOutput {
  schedule: NotificationScheduleOutput;
}

/**
 * DuplicateNotificationSchedule Use Case
 *
 * Creates a copy of an existing notification schedule.
 */
export class DuplicateNotificationScheduleUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: DuplicateNotificationScheduleInput,
  ): Promise<Result<DuplicateNotificationScheduleOutput, string>> {
    // Find the original schedule
    const original = await this.repository.findById(input.id);

    if (!original) {
      return err("Notification schedule not found");
    }

    // Create duplicate using domain method
    const duplicateResult = original.duplicate({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      newCreatedById: input.newCreatedById,
    });

    if (duplicateResult.kind === "err") {
      return err(duplicateResult.error);
    }

    // Save to repository
    const saved = await this.repository.create(duplicateResult.value);

    return ok({
      schedule: this.toOutput(saved),
    });
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
