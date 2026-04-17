import type {
  NotificationDeliverySelect,
  NotificationDeliveryInsert,
} from "@mirai-app/frameworks/drizzle";
import type { NotificationDelivery } from "@mirai-app/use-cases/notification/ports/NotificationPort";

/**
 * NotificationDelivery Mapper
 *
 * Maps between Drizzle database records and NotificationDeliveryPort interface types.
 * These are DTOs, not domain entities.
 */
export class NotificationDeliveryMapper {
  /**
   * Convert database record to NotificationDelivery DTO
   */
  toDTO(dbRecord: NotificationDeliverySelect): NotificationDelivery {
    // Map status from schema enum to port interface type
    const status = this.mapDbStatusToPortStatus(dbRecord.status);

    return {
      id: dbRecord.id,
      notificationId: dbRecord.notificationId,
      tripId: dbRecord.tripId ?? null,
      scheduleId: dbRecord.scheduleId ?? null,
      status,
      deliveryStartedAt: dbRecord.deliveryStartedAt ?? new Date(),
      deliveryCompletedAt: dbRecord.deliveryCompletedAt ?? null,
      totalRecipients: dbRecord.totalRecipients ?? null,
      successCount: dbRecord.successCount ?? null,
      failureCount: dbRecord.failureCount ?? null,
      errors: dbRecord.errors ?? null,
    };
  }

  /**
   * Convert NotificationDelivery DTO to database insert format
   */
  toInsert(delivery: NotificationDelivery): NotificationDeliveryInsert {
    // Map status from port interface to schema enum
    const status = this.mapPortStatusToDbStatus(delivery.status);

    return {
      id: delivery.id,
      notificationId: delivery.notificationId,
      tripId: delivery.tripId,
      scheduleId: delivery.scheduleId,
      status,
      deliveryStartedAt: delivery.deliveryStartedAt,
      deliveryCompletedAt: delivery.deliveryCompletedAt,
      totalRecipients: delivery.totalRecipients,
      successCount: delivery.successCount,
      failureCount: delivery.failureCount,
      errors: delivery.errors,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Convert NotificationDelivery DTO to database update format
   */
  toUpdate(
    delivery: NotificationDelivery,
  ): Partial<NotificationDeliveryInsert> {
    const status = this.mapPortStatusToDbStatus(delivery.status);

    return {
      status,
      deliveryCompletedAt: delivery.deliveryCompletedAt,
      totalRecipients: delivery.totalRecipients,
      successCount: delivery.successCount,
      failureCount: delivery.failureCount,
      errors: delivery.errors,
      updatedAt: new Date(),
    };
  }

  /**
   * Map database status enum to port interface status type
   */
  private mapDbStatusToPortStatus(
    dbStatus: "pending" | "success" | "partial_failure" | "failure",
  ): "pending" | "success" | "partial_failure" | "failure" {
    return dbStatus;
  }

  /**
   * Map port interface status type to database status enum
   */
  private mapPortStatusToDbStatus(
    portStatus: "pending" | "success" | "partial_failure" | "failure",
  ): "pending" | "success" | "partial_failure" | "failure" {
    return portStatus;
  }
}

export const notificationDeliveryMapper = new NotificationDeliveryMapper();
