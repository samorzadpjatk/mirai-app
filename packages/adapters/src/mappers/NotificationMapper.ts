import {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "@mirai-app/domain";

/**
 * NotificationMapper
 *
 * Maps between Prisma database records and domain Notification entities.
 */
export class NotificationMapper {
  /**
   * Convert a Prisma Notification record to a domain Notification entity
   */
  static toDomain(record: {
    id: string;
    title: string;
    body: string;
    url: string | null;
    tripId: string | null;
    status: string;
    priority: string;
    scheduledFor: Date | null;
    sentAt: Date | null;
    failureReason: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }): Notification {
    const status = NotificationMapper.mapStatusFromPrisma(record.status);
    const priority = NotificationMapper.mapPriorityFromPrisma(record.priority);

    const result = Notification.create({
      id: record.id,
      title: record.title,
      body: record.body,
      url: record.url,
      createdById: record.createdById,
      tripId: record.tripId,
      status,
      priority,
      scheduledFor: record.scheduledFor,
      sentAt: record.sentAt,
      failureReason: record.failureReason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    if (result.kind === "err") {
      throw new Error(
        `Failed to map Notification from database: ${result.error}`,
      );
    }

    return result.value;
  }

  /**
   * Convert a domain Notification entity to Prisma create input
   */
  static toPrismaCreate(notification: Notification): {
    id: string;
    title: string;
    body: string;
    url: string | null;
    tripId: string | null;
    status: string;
    priority: string;
    scheduledFor: Date | null;
    sentAt: Date | null;
    failureReason: string | null;
    createdById: string;
  } {
    return {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      url: notification.url,
      tripId: notification.tripId,
      status: notification.status,
      priority: notification.priority,
      scheduledFor: notification.scheduledFor,
      sentAt: notification.sentAt,
      failureReason: notification.failureReason,
      createdById: notification.createdById,
    };
  }

  /**
   * Convert a domain Notification entity to Prisma update input
   */
  static toPrismaUpdate(notification: Notification): {
    title: string;
    body: string;
    url: string | null;
    tripId: string | null;
    status: string;
    priority: string;
    scheduledFor: Date | null;
    sentAt: Date | null;
    failureReason: string | null;
    createdById: string;
  } {
    return {
      title: notification.title,
      body: notification.body,
      url: notification.url,
      tripId: notification.tripId,
      status: notification.status,
      priority: notification.priority,
      scheduledFor: notification.scheduledFor,
      sentAt: notification.sentAt,
      failureReason: notification.failureReason,
      createdById: notification.createdById,
    };
  }

  /**
   * Map Prisma status string to NotificationStatus enum
   */
  private static mapStatusFromPrisma(status: string): NotificationStatus {
    switch (status) {
      case "READY":
        return NotificationStatus.READY;
      case "SENT":
        return NotificationStatus.SENT;
      case "FAILED":
        return NotificationStatus.FAILED;
      case "CANCELLED":
        return NotificationStatus.CANCELLED;
      case "DRAFT":
      default:
        return NotificationStatus.DRAFT;
    }
  }

  /**
   * Map Prisma priority string to NotificationPriority enum
   */
  private static mapPriorityFromPrisma(priority: string): NotificationPriority {
    switch (priority) {
      case "HIGH":
        return NotificationPriority.HIGH;
      case "URGENT":
        return NotificationPriority.URGENT;
      case "LOW":
        return NotificationPriority.LOW;
      case "NORMAL":
      default:
        return NotificationPriority.NORMAL;
    }
  }
}
