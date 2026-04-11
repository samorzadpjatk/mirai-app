import { Notification, NotificationPriority } from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import type {
  notifications,
  NotificationSelect,
  NotificationInsert,
} from "@mirai-app/frameworks/drizzle";

/**
 * NotificationDrizzleMapper
 *
 * Maps between Drizzle database records and domain Notification entities.
 */
export class NotificationDrizzleMapper implements DrizzleEntityMapper<
  Notification,
  NotificationSelect,
  NotificationInsert
> {
  /**
   * Convert a Drizzle Notification record to a domain Notification entity
   */
  toDomain(
    record: NotificationSelect & { createdById?: string },
  ): Notification {
    const priority = this.mapPriorityFromDrizzle(record.priority ?? "NORMAL");

    const result = Notification.create({
      id: record.id,
      tripId: record.tripId,
      title: record.title,
      body: record.body,
      url: record.url,
      priority,
      createdById: record.createdById ?? "",
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    if (result.kind === "err") {
      throw new Error(
        `Failed to map Notification from Drizzle: ${result.error}`,
      );
    }

    return result.value;
  }

  /**
   * Convert a domain Notification entity to Drizzle insert input
   */
  toDrizzleInsert(notification: Notification): NotificationInsert {
    return {
      id: notification.id,
      tripId: notification.tripId,
      title: notification.title,
      body: notification.body,
      url: notification.url,
      priority: notification.priority,
      createdById: (notification as any).createdById ?? "",
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    } as NotificationInsert;
  }

  /**
   * Convert a domain Notification entity to Drizzle update input
   */
  toDrizzleUpdate(notification: Notification): Partial<NotificationInsert> {
    return {
      title: notification.title,
      body: notification.body,
      url: notification.url,
      priority: notification.priority,
      updatedAt: new Date(),
    };
  }

  private mapPriorityFromDrizzle(priority: string): NotificationPriority {
    return (
      NotificationPriority[priority as keyof typeof NotificationPriority] ??
      NotificationPriority.NORMAL
    );
  }

  /**
   * Singleton instance for reuse
   */
  static readonly instance = new NotificationDrizzleMapper();
}
