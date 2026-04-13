import type {
  NotificationSchedule,
  NotificationScheduleType,
  NotificationScheduleFilter,
  PaginationOptions,
  PaginatedResult,
} from "@mirai-app/domain";
import { Context, Effect } from "effect";

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
 * NotificationScheduleRepository Port
 *
 * This interface defines what operations the application needs
 * from any notification schedule repository implementation.
 */
export interface NotificationScheduleRepository {
  /**
   * Create a new notification schedule
   */
  create(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, never, never>;

  /**
   * Find notification schedule by ID
   * @returns NotificationSchedule or null if not found
   */
  findById(
    id: string,
  ): Effect.Effect<NotificationSchedule | null, never, never>;

  /**
   * Find notification schedules by trip ID
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<NotificationSchedule[], never, never>;

  /**
   * Find notification schedules by name (exact match)
   */
  findByName(
    name: string,
  ): Effect.Effect<NotificationSchedule | null, never, never>;

  /**
   * Find notification schedule by trip ID and name
   */
  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Effect.Effect<NotificationSchedule | null, never, never>;

  /**
   * Find notification schedules by type
   */
  findByType(
    type: NotificationScheduleType,
  ): Effect.Effect<NotificationSchedule[], never, never>;

  /**
   * Find all notification schedules with filtering and pagination
   */
  findAll(options?: {
    filter?: NotificationScheduleFilter;
    pagination?: PaginationOptions;
  }): Effect.Effect<PaginatedResult<NotificationSchedule>, never, never>;

  /**
   * Find currently active schedules
   * (isActive=true and current time is within the schedule window)
   */
  findActive(now?: Date): Effect.Effect<NotificationSchedule[], never, never>;

  /**
   * Find upcoming schedules
   * (startDate is in the future)
   */
  findUpcoming(
    days?: number,
    now?: Date,
  ): Effect.Effect<NotificationSchedule[], never, never>;

  /**
   * Update notification schedule
   */
  update(
    schedule: NotificationSchedule,
  ): Effect.Effect<NotificationSchedule, never, never>;

  /**
   * Delete notification schedule
   */
  delete(id: string): Effect.Effect<void, never, never>;

  /**
   * Delete multiple notification schedules
   * @returns count of deleted schedules
   */
  deleteMany(ids: string[]): Effect.Effect<number, never, never>;

  /**
   * Check if notification schedule exists
   */
  exists(id: string): Effect.Effect<boolean, never, never>;

  /**
   * Count notification schedules by filter
   */
  count(
    filter?: NotificationScheduleFilter,
  ): Effect.Effect<number, never, never>;

  /**
   * Update the lastRun timestamp
   */
  updateLastRun(
    id: string,
    lastRun: Date,
  ): Effect.Effect<NotificationSchedule, never, never>;

  /**
   * Toggle isActive status for a schedule
   */
  toggleActive(id: string): Effect.Effect<NotificationSchedule, never, never>;

  /**
   * Update isActive status for multiple schedules
   * @returns count of updated schedules
   */
  bulkToggleActive(
    ids: string[],
    isActive: boolean,
  ): Effect.Effect<number, never, never>;

  /**
   * Get execution history for a schedule
   */
  getExecutionHistory(
    scheduleId: string,
    limit: number,
  ): Effect.Effect<NotificationScheduleExecutionRecord[], never, never>;

  /**
   * Count executions for a schedule
   */
  countExecutions(scheduleId: string): Effect.Effect<number, never, never>;
}

/**
 * NotificationScheduleRepository Context.Tag for Effect dependency injection
 */
export class NotificationScheduleRepositoryTag extends Context.Tag(
  "NotificationScheduleRepository",
)<
  NotificationScheduleRepositoryTag,
  {
    create: (
      schedule: NotificationSchedule,
    ) => Effect.Effect<NotificationSchedule, never, never>;
    findById: (
      id: string,
    ) => Effect.Effect<NotificationSchedule | null, never, never>;
    findByTripId: (
      tripId: string,
    ) => Effect.Effect<NotificationSchedule[], never, never>;
    findByName: (
      name: string,
    ) => Effect.Effect<NotificationSchedule | null, never, never>;
    findByTripIdAndName: (
      tripId: string,
      name: string,
    ) => Effect.Effect<NotificationSchedule | null, never, never>;
    findByType: (
      type: NotificationScheduleType,
    ) => Effect.Effect<NotificationSchedule[], never, never>;
    findAll: (options?: {
      filter?: NotificationScheduleFilter;
      pagination?: PaginationOptions;
    }) => Effect.Effect<PaginatedResult<NotificationSchedule>, never, never>;
    findActive: (
      now?: Date,
    ) => Effect.Effect<NotificationSchedule[], never, never>;
    findUpcoming: (
      days?: number,
      now?: Date,
    ) => Effect.Effect<NotificationSchedule[], never, never>;
    update: (
      schedule: NotificationSchedule,
    ) => Effect.Effect<NotificationSchedule, never, never>;
    delete: (id: string) => Effect.Effect<void, never, never>;
    deleteMany: (ids: string[]) => Effect.Effect<number, never, never>;
    exists: (id: string) => Effect.Effect<boolean, never, never>;
    count: (
      filter?: NotificationScheduleFilter,
    ) => Effect.Effect<number, never, never>;
    updateLastRun: (
      id: string,
      lastRun: Date,
    ) => Effect.Effect<NotificationSchedule, never, never>;
    toggleActive: (
      id: string,
    ) => Effect.Effect<NotificationSchedule, never, never>;
    bulkToggleActive: (
      ids: string[],
      isActive: boolean,
    ) => Effect.Effect<number, never, never>;
    getExecutionHistory: (
      scheduleId: string,
      limit: number,
    ) => Effect.Effect<NotificationScheduleExecutionRecord[], never, never>;
    countExecutions: (
      scheduleId: string,
    ) => Effect.Effect<number, never, never>;
  }
>() {}
