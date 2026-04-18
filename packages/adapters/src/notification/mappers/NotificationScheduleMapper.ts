import type {
  NotificationScheduleSelect,
  NotificationScheduleExecutionSelect,
} from "../../infrastructure/drizzle";
import type {
  NotificationSchedule,
  NotificationScheduleExecution,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";
import {
  NotificationScheduleId,
  TripId,
  UserId,
  NotificationId,
  NotificationScheduleExecutionId,
} from "@mirai-app/domain";

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
      id: NotificationScheduleId.unsafeCreate(record.id),
      tripId: TripId.unsafeCreate(record.tripId),
      name: record.name,
      notificationType: record.notificationType,
      notificationTitle: record.name, // Using name as title
      notificationBody: record.content, // Using content as body
      notificationUrl: null,
      startDate: record.scheduledFor,
      endDate: record.scheduledFor,
      hour: 0,
      minute: 0,
      isActive: !record.isDraft,
      lastRun: record.isSent ? record.scheduledFor : null,
      createdById: UserId.unsafeCreate(record.createdBy),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Convert schedule DTO to insert format
   */
  toInsert(dto: NotificationSchedule): NotificationScheduleSelect {
    // tripId is required in database but nullable in domain - use placeholder if null
    const tripIdStr = dto.tripId
      ? TripId.toString(dto.tripId)
      : "00000000-0000-0000-0000-000000000000";
    return {
      id: NotificationScheduleId.toString(dto.id),
      tripId: tripIdStr,
      name: dto.name,
      notificationType: dto.notificationType,
      content: dto.notificationBody,
      scheduledFor: dto.startDate,
      sendToAll: false,
      targetGroupIds: null,
      isSent: dto.lastRun !== null,
      isDraft: !dto.isActive,
      createdBy: UserId.toString(dto.createdById),
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
      notificationType: dto.notificationType,
      content: dto.notificationBody,
      scheduledFor: dto.startDate,
      isSent: dto.lastRun !== null,
      isDraft: !dto.isActive,
      updatedAt: new Date(),
    };
  }

  /**
   * Convert database record to execution DTO
   */
  toExecutionDTO(record: NotificationScheduleExecutionSelect): NotificationScheduleExecution {
    return {
      id: NotificationScheduleExecutionId.unsafeCreate(record.id),
      scheduleId: NotificationScheduleId.unsafeCreate(record.scheduleId),
      notificationId: NotificationId.unsafeCreate(record.notificationId),
      executedAt: record.executedAt,
    };
  }

  /**
   * Convert execution DTO to insert format
   */
  toExecutionInsert(dto: NotificationScheduleExecution): NotificationScheduleExecutionSelect {
    return {
      id: NotificationScheduleExecutionId.toString(dto.id),
      scheduleId: NotificationScheduleId.toString(dto.scheduleId),
      notificationId: NotificationId.toString(dto.notificationId),
      executedAt: dto.executedAt,
      status: "completed", // Default status
    };
  }
}

/**
 * Singleton instance of the mapper
 */
export const notificationScheduleMapper = new NotificationScheduleMapper();
