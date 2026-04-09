import type {
  Result,
  NotificationScheduleFilter,
  PaginationOptions,
} from "@repo/domain";
import { ok, err, NotificationSchedule } from "@repo/domain";
import type { NotificationScheduleRepository } from "../ports/NotificationScheduleRepository";

/**
 * Input for GetNotificationSchedules use case
 */
export interface GetNotificationSchedulesInput {
  filter?: NotificationScheduleFilter;
  pagination?: PaginationOptions;
}

/**
 * Schedule output DTO
 */
export interface NotificationScheduleOutput {
  id: string;
  name: string;
  tripId: string | null;
  notificationType: string;
  notificationTitle: string | null;
  notificationBody: string | null;
  notificationUrl: string | null;
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
  isActive: boolean;
  createdById: string;
  lastRun: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isCurrentlyActive: boolean;
  isExpired: boolean;
  isUpcoming: boolean;
  formattedTime: string;
}

/**
 * Output for GetNotificationSchedules use case
 */
export interface GetNotificationSchedulesOutput {
  schedules: NotificationScheduleOutput[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * GetNotificationSchedules Use Case
 *
 * Retrieves a list of notification schedules with optional filtering and pagination.
 */
export class GetNotificationSchedulesUseCase {
  constructor(private repository: NotificationScheduleRepository) {}

  async execute(
    input: GetNotificationSchedulesInput,
  ): Promise<Result<GetNotificationSchedulesOutput, string>> {
    const result = await this.repository.findAll({
      ...(input.filter !== undefined && { filter: input.filter }),
      ...(input.pagination !== undefined && { pagination: input.pagination }),
    });

    const now = new Date();

    return ok({
      schedules: result.items.map((schedule) => this.toOutput(schedule, now)),
      pagination: result.pagination,
    });
  }

  private toOutput(
    schedule: NotificationSchedule,
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
