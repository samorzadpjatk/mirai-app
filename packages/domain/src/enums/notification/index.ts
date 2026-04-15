/**
 * Notification Enums
 *
 * Enums for notifications, schedules, and delivery tracking.
 *
 * @module enums/notification
 */

/**
 * Notification status workflow
 * DRAFT -> READY -> SENT
 *              -> FAILED
 *              -> CANCELLED
 */
export enum NotificationStatus {
  DRAFT = "DRAFT",
  READY = "READY",
  SENT = "SENT",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

/**
 * Notification schedule types
 */
export enum NotificationScheduleType {
  CHALLENGE = "CHALLENGE",
  INFO = "INFO",
  REMINDER = "REMINDER",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  DAILY_RANKING = "DAILY_RANKING",
}

/**
 * Notification delivery status
 */
export enum NotificationDeliveryStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
}

/**
 * Type guard to check if a string is a valid NotificationStatus
 */
export function isNotificationStatus(
  value: string,
): value is NotificationStatus {
  return Object.values(NotificationStatus).includes(
    value as NotificationStatus,
  );
}

/**
 * Type guard to check if a string is a valid NotificationPriority
 */
export function isNotificationPriority(
  value: string,
): value is NotificationPriority {
  return Object.values(NotificationPriority).includes(
    value as NotificationPriority,
  );
}

/**
 * Type guard to check if a string is a valid NotificationScheduleType
 */
export function isNotificationScheduleType(
  value: string,
): value is NotificationScheduleType {
  return Object.values(NotificationScheduleType).includes(
    value as NotificationScheduleType,
  );
}

/**
 * Type guard to check if a string is a valid NotificationDeliveryStatus
 */
export function isNotificationDeliveryStatus(
  value: string,
): value is NotificationDeliveryStatus {
  return Object.values(NotificationDeliveryStatus).includes(
    value as NotificationDeliveryStatus,
  );
}

/**
 * Check if a notification status is terminal
 */
export function isTerminalNotificationStatus(
  status: NotificationStatus,
): boolean {
  return (
    status === NotificationStatus.SENT ||
    status === NotificationStatus.CANCELLED
  );
}

/**
 * Check if a notification priority is high or urgent
 */
export function isHighPriority(priority: NotificationPriority): boolean {
  return (
    priority === NotificationPriority.HIGH ||
    priority === NotificationPriority.URGENT
  );
}
