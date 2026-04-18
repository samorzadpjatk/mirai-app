import type {
  NotificationScheduleSelect,
  NotificationScheduleExecutionSelect,
} from "@mirai-app/frameworks/drizzle";
import type {
  NotificationSchedule,
  NotificationScheduleExecution,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";

/**
 * Notification Schedule Mapper
 *
 * Maps between database schema and domain DTOs.
 */
export class NotificationScheduleMapper {
  /**
   * Convert database record to schedule DTO
   */
  toDTO(record: NotificationScheduleSelect): NotificationSchedule {
    return {
      id: record.id,
      tripId: record.tripId,
      name: record.name,
      description: record.description ?? undefined,
      scheduleType: record.scheduleType,
      scheduledFor: record.scheduledFor,
      isRecurring: record.isRecurring,
      recurrencePattern: (record.recurrencePattern as Record<string, unknown>) ?? undefined,
      isActive: record.isActive,
      isTemplate: record.isTemplate,
      lastRunAt: record.lastRunAt ?? undefined,
      lastRunStatus: record.lastRunStatus ?? undefined,
      runCount: record.runCount ?? 0,
      notificationTitle: record.notificationTitle,
      notificationBody: record.notificationBody,
      notificationUrl: record.notificationUrl ?? undefined,
      createdById: record.createdById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Convert schedule DTO to insert format
   */
  toInsert(dto: NotificationSchedule): NotificationScheduleSelect {
    return {
      id: dto.id,
      tripId: dto.tripId,
      name: dto.name,
      description: dto.description ?? null,
      scheduleType: dto.scheduleType,
      scheduledFor: dto.scheduledFor,
      isRecurring: dto.isRecurring,
      recurrencePattern: dto.recurrencePattern ?? null,
      isActive: dto.isActive,
      isTemplate: dto.isTemplate,
      lastRunAt: dto.lastRunAt ?? null,
      lastRunStatus: dto.lastRunStatus ?? null,
      runCount: dto.runCount ?? 0,
      notificationTitle: dto.notificationTitle,
      notificationBody: dto.notificationBody,
      notificationUrl: dto.notificationUrl ?? null,
      createdById: dto.createdById,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  /**
   * Convert schedule DTO to update format
   */
  toUpdate(dto: NotificationSchedule): Partial<NotificationScheduleSelect> {
    return {
      name: dto.name,
      description: dto.description ?? null,
      scheduleType: dto.scheduleType,
      scheduledFor: dto.scheduledFor,
      isRecurring: dto.isRecurring,
      recurrencePattern: dto.recurrencePattern ?? null,
      isActive: dto.isActive,
      isTemplate: dto.isTemplate,
      lastRunAt: dto.lastRunAt ?? null,
      lastRunStatus: dto.lastRunStatus ?? null,
      runCount: dto.runCount ?? 0,
      notificationTitle: dto.notificationTitle,
      notificationBody: dto.notificationBody,
      notificationUrl: dto.notificationUrl ?? null,
      updatedAt: new Date(),
    };
  }

  /**
   * Convert database record to execution DTO
   */
  toExecutionDTO(record: NotificationScheduleExecutionSelect): NotificationScheduleExecution {
    return {
      id: record.id,
      scheduleId: record.scheduleId,
      executedAt: record.executedAt,
      status: record.status,
      notificationId: record.notificationId ?? undefined,
      errorMessage: record.errorMessage ?? undefined,
      createdAt: record.createdAt,
    };
  }

  /**
   * Convert execution DTO to insert format
   */
  toExecutionInsert(dto: NotificationScheduleExecution): NotificationScheduleExecutionSelect {
    return {
      id: dto.id,
      scheduleId: dto.scheduleId,
      executedAt: dto.executedAt,
      status: dto.status,
      notificationId: dto.notificationId ?? null,
      errorMessage: dto.errorMessage ?? null,
      createdAt: dto.createdAt,
    };
  }
}

/**
 * Singleton instance of the mapper
 */
export const notificationScheduleMapper = new NotificationScheduleMapper();
