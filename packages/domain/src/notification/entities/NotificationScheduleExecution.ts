import type { NotificationId, NotificationScheduleId, NotificationScheduleExecutionId } from "../value-objects/NotificationId";

/**
 * NotificationScheduleExecution entity interface
 * Represents an execution record of a scheduled notification
 */
export interface NotificationScheduleExecution {
  id: NotificationScheduleExecutionId;
  scheduleId: NotificationScheduleId;
  notificationId: NotificationId;
  executedAt: Date;
}
