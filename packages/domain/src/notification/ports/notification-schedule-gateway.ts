import type { NotificationSchedule } from "../entities/notification-schedule";
import type { NotificationScheduleType } from "../../notification/enums";
import type {
  NotificationScheduleFilter,
  PaginationOptions,
  PaginatedResult,
} from "../entities/notification-schedule";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Connection } from "../../value-objects/pagination";

/**
 * Cursor data for notification schedule pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface NotificationScheduleCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for notification schedule connection pagination
 */
export interface NotificationScheduleConnectionArgs {
  first?: number;
  after?: NotificationScheduleCursorData | null;
}

/**
 * Record of a notification schedule execution
 */
export interface NotificationScheduleExecutionRecord {
  id: string;
  executedAt: Date;
  notification: {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
  } | null;
}

/**
 * NotificationScheduleGateway Port
 *
 * This interface defines what operations the application needs
 * from any notification schedule gateway implementation.
 */
export interface NotificationScheduleGateway {
  /**
   * Create a new notification schedule
   */
  create(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never>;

  /**
   * Find notification schedule by ID
   * @returns NotificationSchedule or null if not found
   */
  findById(
    id: string,
  ): Effect.Effect<NotificationSchedule | null, DatabaseError, never>;

  /**
   * Find notification schedules by name (exact match)
   */
  findByName(
    name: string,
  ): Effect.Effect<NotificationSchedule | null, DatabaseError, never>;

  /**
   * Find notification schedule by trip ID and name
   */
  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Effect.Effect<NotificationSchedule | null, DatabaseError, never>;

  /**
   * Find upcoming schedules with cursor-based pagination
   * (startDate is in the future)
   */
  findUpcomingConnection(
    args: NotificationScheduleConnectionArgs,
    days?: number,
    now?: Date,
  ): Effect.Effect<Connection<NotificationSchedule>, DatabaseError, never>;

  /**
   * Update notification schedule
   */
  update(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never>;

  /**
   * Delete notification schedule
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Delete multiple notification schedules
   * @returns count of deleted schedules
   */
  deleteMany(ids: string[]): Effect.Effect<number, DatabaseError, never>;

  /**
   * Check if notification schedule exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count notification schedules by filter
   */
  count(
    filter?: NotificationScheduleFilter,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Update the lastRun timestamp
   */
  updateLastRun(
    id: string,
    lastRun: Date,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never>;

  /**
   * Toggle isActive status for a schedule
   */
  toggleActive(
    id: string,
  ): Effect.Effect<NotificationSchedule, DatabaseError, never>;

  /**
   * Update isActive status for multiple schedules
   * @returns count of updated schedules
   */
  bulkToggleActive(
    ids: string[],
    isActive: boolean,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Count executions for a schedule
   */
  countExecutions(
    scheduleId: string,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Find notification schedules with cursor-based pagination
   * Returns a Connection result per Relay Cursor Connections Specification
   */
  findManyConnection(
    args: NotificationScheduleConnectionArgs,
  ): Effect.Effect<Connection<NotificationSchedule>, DatabaseError, never>;

  /**
   * Find currently active schedules with cursor-based pagination
   * (isActive=true and current time is within the schedule window)
   */
  findActiveConnection(
    args: NotificationScheduleConnectionArgs,
  ): Effect.Effect<Connection<NotificationSchedule>, DatabaseError, never>;

  /**
   * Find notification schedules by trip ID with cursor-based pagination
   */
  findByTripIdConnection(
    tripId: string,
    args: NotificationScheduleConnectionArgs,
  ): Effect.Effect<Connection<NotificationSchedule>, DatabaseError, never>;

  /**
   * Find notification schedule by notification ID with cursor-based pagination
   */
  findByNotificationIdConnection(
    notificationId: string,
    args: NotificationScheduleConnectionArgs,
  ): Effect.Effect<Connection<NotificationSchedule>, DatabaseError, never>;

  /**
   * Get execution history for a schedule with cursor-based pagination
   */
  findExecutionsConnection(
    scheduleId: string,
    args: NotificationScheduleConnectionArgs,
  ): Effect.Effect<
    Connection<NotificationScheduleExecutionRecord>,
    DatabaseError,
    never
  >;
}
