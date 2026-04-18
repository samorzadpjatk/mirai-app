import type { NotificationDeliverySelect } from "../../infrastructure/drizzle";
import type { NotificationDelivery } from "@mirai-app/use-cases/notification/ports/NotificationPort";

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
      id: record.id,
      notificationId: record.notificationId,
      tripId: record.tripId,
      scheduleId: record.scheduleId ?? undefined,
      status: record.status,
      totalRecipients: record.totalRecipients ?? 0,
      successCount: record.successCount ?? 0,
      failureCount: record.failureCount ?? 0,
      deliveryStartedAt: record.deliveryStartedAt ?? undefined,
      deliveryCompletedAt: record.deliveryCompletedAt ?? undefined,
      errorMessage: record.errorMessage ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Convert DTO to insert format
   */
  toInsert(dto: NotificationDelivery): NotificationDeliverySelect {
    return {
      id: dto.id,
      notificationId: dto.notificationId,
      tripId: dto.tripId,
      scheduleId: dto.scheduleId ?? null,
      status: dto.status,
      totalRecipients: dto.totalRecipients ?? 0,
      successCount: dto.successCount ?? 0,
      failureCount: dto.failureCount ?? 0,
      deliveryStartedAt: dto.deliveryStartedAt ?? null,
      deliveryCompletedAt: dto.deliveryCompletedAt ?? null,
      errorMessage: dto.errorMessage ?? null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
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
      deliveryStartedAt: dto.deliveryStartedAt ?? null,
      deliveryCompletedAt: dto.deliveryCompletedAt ?? null,
      errorMessage: dto.errorMessage ?? null,
      updatedAt: new Date(),
    };
  }
}

/**
 * Singleton instance of the mapper
 */
export const notificationDeliveryMapper = new NotificationDeliveryMapper();
