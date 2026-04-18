import type {
  NotificationSelect,
  NotificationInsert,
} from "../../infrastructure/drizzle";
import type {
  Notification,
  NotificationPush,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";

/**
 * Notification Mapper
 *
 * Maps between Drizzle database records and NotificationPort interface types.
 * These are DTOs, not domain entities.
 */
export class NotificationMapper {
  /**
   * Convert database record to Notification DTO
   */
  toDTO(dbRecord: NotificationSelect): Notification {
    return {
      id: dbRecord.id,
      tripId: dbRecord.tripId ?? null,
      title: dbRecord.title,
      body: dbRecord.body,
      url: dbRecord.url ?? null,
      createdById: dbRecord.createdById,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
    };
  }

  /**
   * Convert Notification DTO to database insert format
   */
  toInsert(notification: Notification): NotificationInsert {
    return {
      id: notification.id,
      tripId: notification.tripId,
      title: notification.title,
      body: notification.body,
      url: notification.url,
      createdById: notification.createdById,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      // Default values for fields not in the port interface
      status: "DRAFT",
      priority: "NORMAL",
    };
  }

  /**
   * Convert Notification DTO to database update format
   */
  toUpdate(notification: Notification): Partial<NotificationInsert> {
    return {
      tripId: notification.tripId,
      title: notification.title,
      body: notification.body,
      url: notification.url,
      updatedAt: new Date(),
    };
  }

  /**
   * Convert database record to NotificationPush DTO
   * Note: NotificationPush records are stored separately or inferred from delivery status
   */
  toPushDTO(
    dbRecord: NotificationSelect,
    targetUserId: string,
    pushId: string,
  ): NotificationPush {
    return {
      id: pushId,
      notificationId: dbRecord.id,
      targetUserId: targetUserId,
      status: this.mapStatusToPushStatus(dbRecord.status),
      sentAt: dbRecord.sentAt ?? null,
      failureReason: dbRecord.failureReason ?? null,
    };
  }

  /**
   * Map notification status to push status
   */
  private mapStatusToPushStatus(
    status: string | null,
  ): "pending" | "sent" | "failed" {
    switch (status) {
      case "SENT":
        return "sent";
      case "FAILED":
        return "failed";
      case "DRAFT":
      case "READY":
      case "CANCELLED":
      default:
        return "pending";
    }
  }
}

export const notificationMapper = new NotificationMapper();
