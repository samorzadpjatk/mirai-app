import type { NotificationSchedule } from "../entities/notification-schedule";
import type { NotificationScheduleType } from "../../notification/enums";
import type {
  NotificationScheduleFilter,
  PaginationOptions,
  PaginatedResult,
} from "../entities/notification-schedule";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";

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
   * Find notification schedules by trip ID
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<NotificationSchedule[], DatabaseError, never>;

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
   * Find notification schedules by type
   */
  findByType(
    type: NotificationScheduleType,
  ): Effect.Effect<NotificationSchedule[], DatabaseError, never>;

  /**
   * Find all notification schedules with filtering and pagination
   */
  findAllPaginated(options?: {
    filter?: NotificationScheduleFilter;
    pagination?: PaginationOptions;
  }): Effect.Effect<
    PaginatedResult<NotificationSchedule>,
    DatabaseError,
    never
  >;

  /**
   * Find currently active schedules
   * (isActive=true and current time is within the schedule window)
   */
  findActive(
    now?: Date,
  ): Effect.Effect<NotificationSchedule[], DatabaseError, never>;

  /**
   * Find upcoming schedules
   * (startDate is in the future)
   */
  findUpcoming(
    days?: number,
    now?: Date,
  ): Effect.Effect<NotificationSchedule[], DatabaseError, never>;

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
   * Get execution history for a schedule
   */
  getExecutionHistory(
    scheduleId: string,
    limit: number,
  ): Effect.Effect<NotificationScheduleExecutionRecord[], DatabaseError, never>;

  /**
   * Count executions for a schedule
   */
  countExecutions(
    scheduleId: string,
  ): Effect.Effect<number, DatabaseError, never>;
}
