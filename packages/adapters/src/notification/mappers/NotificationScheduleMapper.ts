import type {
  NotificationScheduleSelect,
  NotificationScheduleInsert,
} from "@mirai-app/frameworks/drizzle";
import type { NotificationSchedule } from "@mirai-app/use-cases/notification/ports/NotificationPort";

/**
 * NotificationSchedule Mapper
 *
 * Maps between Drizzle database records and NotificationSchedulePort interface types.
 * These are DTOs, not domain entities.
 *
 * Note: Schema has content field that needs to be split into title/body.
 * Schema uses isSent for tracking instead of lastRun.
 */
export class NotificationScheduleMapper {
  /**
   * Convert database record to NotificationSchedule DTO
   *
   * Maps schema fields to port interface:
   * - content -> notificationTitle (first 100 chars), notificationBody (full content)
   * - scheduledFor -> startDate (endDate defaults to same)
   * - sendToAll/isDraft -> isActive (active if sendToAll true and not draft)
   * - isSent/scheduledFor -> lastRun (if isSent, use scheduledFor as last run)
   * - createdBy -> createdById
   */
  toDTO(dbRecord: NotificationScheduleSelect): NotificationSchedule {
    const content = dbRecord.content;
    const title = content.slice(0, 100);
    const body = content.length > 100 ? content.slice(100) : "";

    // Determine if schedule is active
    const isActive = dbRecord.sendToAll && !dbRecord.isDraft;

    // Determine last run from isSent flag
    const lastRun = dbRecord.isSent ? dbRecord.scheduledFor : null;

    // Default hour and minute from scheduledFor if available
    const hour = dbRecord.scheduledFor.getHours();
    const minute = dbRecord.scheduledFor.getMinutes();

    return {
      id: dbRecord.id,
      name: dbRecord.name,
      tripId: dbRecord.tripId || null, // Convert empty string to null for port interface
      notificationType: dbRecord.notificationType,
      notificationTitle: title,
      notificationBody: body,
      notificationUrl: null, // Schema doesn't have URL field
      startDate: dbRecord.scheduledFor,
      endDate: dbRecord.scheduledFor, // Default to same as startDate
      hour,
      minute,
      isActive,
      lastRun,
      createdById: dbRecord.createdBy,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
    };
  }

  /**
   * Convert NotificationSchedule DTO to database insert format
   *
   * Maps port interface back to schema:
   * - notificationTitle + notificationBody -> content
   * - startDate -> scheduledFor (using startDate as primary)
   * - isActive -> sendToAll (true if active)
   * - isActive + lastRun null -> isDraft (true if active but no last run)
   */
  toInsert(schedule: NotificationSchedule): NotificationScheduleInsert {
    const content = `${schedule.notificationTitle}${schedule.notificationBody}`;

    // Map isActive to sendToAll
    const sendToAll = schedule.isActive;

    // Map to isDraft: if active but never run, it's a draft
    const isDraft = schedule.isActive && schedule.lastRun === null;

    return {
      id: schedule.id,
      tripId: schedule.tripId ?? "", // Schema requires non-null tripId
      name: schedule.name,
      notificationType: schedule.notificationType,
      content,
      scheduledFor: schedule.startDate,
      sendToAll,
      targetGroupIds: [], // Default empty array
      isSent: schedule.lastRun !== null,
      isDraft,
      createdBy: schedule.createdById,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
  }

  /**
   * Convert NotificationSchedule DTO to database update format
   */
  toUpdate(
    schedule: NotificationSchedule,
  ): Partial<NotificationScheduleInsert> {
    const content = `${schedule.notificationTitle}${schedule.notificationBody}`;
    const sendToAll = schedule.isActive;
    const isDraft = schedule.isActive && schedule.lastRun === null;

    return {
      tripId: schedule.tripId ?? "", // Schema requires non-null tripId
      name: schedule.name,
      notificationType: schedule.notificationType,
      content,
      scheduledFor: schedule.startDate,
      sendToAll,
      isSent: schedule.lastRun !== null,
      isDraft,
      updatedAt: new Date(),
    };
  }
}

export const notificationScheduleMapper = new NotificationScheduleMapper();
