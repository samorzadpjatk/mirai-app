import { NotificationSchedule, NotificationScheduleType } from "@repo/domain";

/**
 * NotificationScheduleMapper
 *
 * Maps between Prisma database records and domain NotificationSchedule entities.
 */
export class NotificationScheduleMapper {
  /**
   * Convert a Prisma NotificationSchedule record to a domain NotificationSchedule entity
   */
  static toDomain(record: {
    id: string;
    name: string;
    tripId: string | null;
    notificationType: string;
    notificationTitle: string | null;
    notificationBody: string | null;
    notificationUrl: string | null;
    startDate: Date;
    endDate: Date;
    hour: number;
    minute: number;
    isActive: boolean;
    createdById: string;
    lastRun: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): NotificationSchedule {
    const notificationType = this.mapTypeFromPrisma(record.notificationType);

    const result = NotificationSchedule.create({
      id: record.id,
      name: record.name,
      tripId: record.tripId,
      notificationType,
      notificationTitle: record.notificationTitle,
      notificationBody: record.notificationBody,
      notificationUrl: record.notificationUrl,
      startDate: record.startDate,
      endDate: record.endDate,
      hour: record.hour,
      minute: record.minute,
      isActive: record.isActive,
      createdById: record.createdById,
      lastRun: record.lastRun,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    if (result.kind === "err") {
      throw new Error(
        `Failed to map NotificationSchedule from database: ${result.error}`,
      );
    }

    return result.value;
  }

  /**
   * Convert a domain NotificationSchedule entity to Prisma create input
   */
  static toPrismaCreate(schedule: NotificationSchedule): {
    id: string;
    name: string;
    tripId: string | null;
    notificationType: string;
    notificationTitle: string | null;
    notificationBody: string | null;
    notificationUrl: string | null;
    startDate: Date;
    endDate: Date;
    hour: number;
    minute: number;
    isActive: boolean;
    createdById: string;
  } {
    return {
      id: schedule.id,
      name: schedule.name,
      tripId: schedule.tripId,
      notificationType: schedule.notificationType.toString(),
      notificationTitle: schedule.notificationTitle,
      notificationBody: schedule.notificationBody,
      notificationUrl: schedule.notificationUrl,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      hour: schedule.hour,
      minute: schedule.minute,
      isActive: schedule.isActive,
      createdById: schedule.createdById,
    };
  }

  /**
   * Convert a domain NotificationSchedule entity to Prisma update input
   */
  static toPrismaUpdate(schedule: NotificationSchedule): {
    name: string;
    tripId: string | null;
    notificationType: string;
    notificationTitle: string | null;
    notificationBody: string | null;
    notificationUrl: string | null;
    startDate: Date;
    endDate: Date;
    hour: number;
    minute: number;
    isActive: boolean;
    createdById: string;
  } {
    return {
      name: schedule.name,
      tripId: schedule.tripId,
      notificationType: schedule.notificationType.toString(),
      notificationTitle: schedule.notificationTitle,
      notificationBody: schedule.notificationBody,
      notificationUrl: schedule.notificationUrl,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      hour: schedule.hour,
      minute: schedule.minute,
      isActive: schedule.isActive,
      createdById: schedule.createdById,
    };
  }

  /**
   * Map Prisma notificationType string to NotificationScheduleType enum
   */
  private static mapTypeFromPrisma(type: string): NotificationScheduleType {
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
}
