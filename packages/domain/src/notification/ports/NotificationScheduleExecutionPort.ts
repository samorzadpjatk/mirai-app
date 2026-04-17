import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";
import type { NotificationScheduleExecution } from "../entities/NotificationScheduleExecution";
import type { NotificationId } from "../value-objects/NotificationId";
import type { NotificationScheduleExecutionId } from "../value-objects/NotificationId";
import type { NotificationScheduleId } from "../value-objects/NotificationId";

/**
 * NotificationScheduleExecution Port
 * Defines repository operations for notification schedule executions
 */
export interface INotificationScheduleExecutionPort {
  findByScheduleId(
    scheduleId: NotificationScheduleId,
    limit: number,
  ): Effect.Effect<NotificationScheduleExecution[], IPortError, never>;
  findByNotificationId(
    notificationId: NotificationId,
  ): Effect.Effect<NotificationScheduleExecution | null, IPortError, never>;
  create(
    execution: NotificationScheduleExecution,
  ): Effect.Effect<NotificationScheduleExecution, IPortError, never>;
}
