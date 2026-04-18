import type { NotificationDeliverySelect } from "../../infrastructure/drizzle";
import type { NotificationDelivery } from "@mirai-app/use-cases/notification/ports/NotificationPort";
import {
  NotificationDeliveryId,
  NotificationId,
  NotificationScheduleId,
  TripId,
} from "@mirai-app/domain";

/**
 * Notification Delivery Mapper
 *
 * Maps between database schema and domain DTOs.
 */
export class NotificationDeliveryMapper {
  /**
   * Convert database record to DTO
   */
  toDTO(record: NotificationDeliverySelect): NotificationDelivery {
    return {
      id: NotificationDeliveryId.unsafeCreate(record.id),
      notificationId: NotificationId.unsafeCreate(record.notificationId),
      tripId: record.tripId ? TripId.unsafeCreate(record.tripId) : null,
      scheduleId: record.scheduleId
        ? NotificationScheduleId.unsafeCreate(record.scheduleId)
        : null,
      status: record.status,
      totalRecipients: record.totalRecipients ?? 0,
      successCount: record.successCount ?? 0,
      failureCount: record.failureCount ?? 0,
      deliveryStartedAt: record.deliveryStartedAt ?? new Date(),
      deliveryCompletedAt: record.deliveryCompletedAt ?? null,
      errors: record.errors,
    };
  }

  /**
   * Convert DTO to insert format
   */
  toInsert(dto: NotificationDelivery): NotificationDeliverySelect {
    return {
      id: NotificationDeliveryId.toString(dto.id),
      notificationId: NotificationId.toString(dto.notificationId),
      tripId: dto.tripId ? TripId.toString(dto.tripId) : null,
      scheduleId: dto.scheduleId
        ? NotificationScheduleId.toString(dto.scheduleId)
        : null,
      status: dto.status,
      totalRecipients: dto.totalRecipients ?? 0,
      successCount: dto.successCount ?? 0,
      failureCount: dto.failureCount ?? 0,
      deliveryStartedAt: dto.deliveryStartedAt,
      deliveryCompletedAt: dto.deliveryCompletedAt ?? null,
      errors: dto.errors,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert DTO to update format
   */
  toUpdate(dto: NotificationDelivery): Partial<NotificationDeliverySelect> {
    return {
      status: dto.status,
      totalRecipients: dto.totalRecipients ?? 0,
      successCount: dto.successCount ?? 0,
      failureCount: dto.failureCount ?? 0,
      deliveryStartedAt: dto.deliveryStartedAt,
      deliveryCompletedAt: dto.deliveryCompletedAt ?? null,
      errors: dto.errors,
      updatedAt: new Date(),
    };
  }
}

/**
 * Singleton instance of the mapper
 */
export const notificationDeliveryMapper = new NotificationDeliveryMapper();
