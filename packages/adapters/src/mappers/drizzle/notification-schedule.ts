import {
  NotificationSchedule,
  NotificationScheduleType,
} from "@mirai-app/domain";
import type { DrizzleEntityMapper } from "../../gateways/base/repository";
import type { notificationSchedules } from "@mirai-app/frameworks/drizzle/schema/notificationDelivery";

/**
 * NotificationScheduleDrizzleMapper
 *
 * Maps between Drizzle database records and domain NotificationSchedule entities.
 * Implements the DrizzleEntityMapper interface for standard repository operations.
 */
export class NotificationScheduleDrizzleMapper implements DrizzleEntityMapper<
  NotificationSchedule,
  typeof notificationSchedules.$inferSelect,
  Partial<typeof notificationSchedules.$inferInsert>
> {
  /**
   * Convert a Drizzle NotificationSchedule record to a domain entity
   */
  toDomain(
    record: typeof notificationSchedules.$inferSelect,
  ): NotificationSchedule {
    const notificationType = this.mapTypeFromDrizzle(record.notificationType);

    return {
      id: record.id,
      name: record.name,
      tripId: record.tripId,
      notificationType,
      notificationTitle: null, // Field not in current schema
      notificationBody: record.content,
      notificationUrl: null, // Field not in current schema
      startDate: new Date(), // Field not in current schema - using defaults
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
      hour: 9, // Default
      minute: 0, // Default
      isActive: true, // Default
      createdById: record.createdBy,
      lastRun: null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    } as unknown as NotificationSchedule;
  }

  /**
   * Convert a domain NotificationSchedule entity to Drizzle insert input
   */
  toDrizzleInsert(
    entity: NotificationSchedule,
  ): Partial<typeof notificationSchedules.$inferInsert> {
    return {
      id: entity.id,
      tripId: entity.tripId ?? "",
      name: entity.name,
      notificationType: entity.notificationType as string,
      content: entity.notificationBody ?? entity.name,
      scheduledFor: entity.startDate,
      createdBy: entity.createdById,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Convert a domain NotificationSchedule entity to Drizzle update input
   */
  toDrizzleUpdate(
    entity: NotificationSchedule,
  ): Partial<typeof notificationSchedules.$inferInsert> {
    return {
      name: entity.name,
      notificationType: entity.notificationType as string,
      content: entity.notificationBody ?? entity.name,
      updatedAt: new Date(),
    };
  }

  /**
   * Create a partial entity from Drizzle record (for updates)
   */
  fromPartial(
    record: Partial<typeof notificationSchedules.$inferSelect>,
  ): Partial<NotificationSchedule> {
    const partial: Record<string, unknown> = {};
    if (record.id) partial.id = record.id;
    if (record.tripId) partial.tripId = record.tripId;
    if (record.name) partial.name = record.name;
    if (record.notificationType) {
      partial.notificationType = this.mapTypeFromDrizzle(
        record.notificationType,
      );
    }
    return partial as Partial<NotificationSchedule>;
  }

  /**
   * Map Drizzle notificationType string to NotificationScheduleType enum
   */
  private mapTypeFromDrizzle(type: string): NotificationScheduleType {
    switch (type) {
      case "CHALLENGE":
        return NotificationScheduleType.CHALLENGE;
      case "REMINDER":
        return NotificationScheduleType.REMINDER;
      case "ANNOUNCEMENT":
        return NotificationScheduleType.ANNOUNCEMENT;
      case "DAILY_RANKING":
        return NotificationScheduleType.DAILY_RANKING;
      case "INFO":
      default:
        return NotificationScheduleType.INFO;
    }
  }

  static readonly instance = new NotificationScheduleDrizzleMapper();
}
