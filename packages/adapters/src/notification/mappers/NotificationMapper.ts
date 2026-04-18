import type {
  NotificationSelect,
  NotificationInsert,
} from "../../infrastructure/drizzle";
import type {
  Notification,
  NotificationPush,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";
import {
  NotificationId,
  NotificationPushId,
  UserId,
  TripId,
} from "@mirai-app/domain";

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
      id: NotificationId.unsafeCreate(dbRecord.id),
      tripId: dbRecord.tripId ? TripId.unsafeCreate(dbRecord.tripId) : null,
      title: dbRecord.title,
      body: dbRecord.body,
      url: dbRecord.url ?? "",
      createdById: UserId.unsafeCreate(dbRecord.createdById),
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
    };
  }

  /**
   * Convert Notification DTO to database insert format
   */
  toInsert(notification: Notification): NotificationInsert {
    return {
      id: NotificationId.toString(notification.id),
      tripId: notification.tripId ? TripId.toString(notification.tripId) : null,
      title: notification.title,
      body: notification.body,
      url: notification.url,
      createdById: UserId.toString(notification.createdById),
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
      tripId: notification.tripId ? TripId.toString(notification.tripId) : null,
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
      id: NotificationPushId.unsafeCreate(pushId),
      notificationId: NotificationId.unsafeCreate(dbRecord.id),
      targetUserId: UserId.unsafeCreate(targetUserId),
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
