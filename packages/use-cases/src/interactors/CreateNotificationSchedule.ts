import type { Result } from "@repo/domain";
import {
  ok,
  err,
  NotificationSchedule,
  NotificationScheduleType,
} from "@repo/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";
import type { NotificationScheduleOutput } from "./GetNotificationSchedules";

/**
 * Input for CreateNotificationSchedule use case
 */
export interface CreateNotificationScheduleInput {
  name: string;
  tripId?: string | null;
  notificationType: NotificationScheduleType;
  notificationTitle?: string | null;
  notificationBody?: string | null;
  notificationUrl?: string | null;
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
  isActive?: boolean;
  createdById: string;
}

/**
 * Output type alias for CreateNotificationSchedule
 */
export type CreateNotificationScheduleOutput = NotificationScheduleOutput;

/**
 * CreateNotificationSchedule Use Case
 *
 * Creates a new notification schedule with validation.
 */
export class CreateNotificationScheduleUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: CreateNotificationScheduleInput,
  ): Promise<Result<NotificationScheduleOutput, string>> {
    // Check for duplicate name in the same trip
    if (input.tripId) {
      const existing = await this.repository.findByTripIdAndName(
        input.tripId,
        input.name,
      );
      if (existing) {
        return err(
          `A schedule with the name "${input.name}" already exists for this trip`,
        );
      }
    }

    // Create the domain entity (validation happens here)
    const scheduleResult = NotificationSchedule.create({
      name: input.name,
      ...(input.tripId !== undefined && { tripId: input.tripId }),
      notificationType: input.notificationType,
      ...(input.notificationTitle !== undefined && {
        notificationTitle: input.notificationTitle,
      }),
      ...(input.notificationBody !== undefined && {
        notificationBody: input.notificationBody,
      }),
      ...(input.notificationUrl !== undefined && {
        notificationUrl: input.notificationUrl,
      }),
      startDate: input.startDate,
      endDate: input.endDate,
      hour: input.hour,
      minute: input.minute,
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      createdById: input.createdById,
    });

    if (scheduleResult.kind === "err") {
      return err(scheduleResult.error);
    }

    // Save to repository
    const saved = await this.repository.create(scheduleResult.value);

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
