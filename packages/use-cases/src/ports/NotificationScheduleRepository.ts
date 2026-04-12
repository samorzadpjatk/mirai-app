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
  create(schedule: NotificationSchedule): Promise<NotificationSchedule>;

  /**
   * Find notification schedule by ID
   * @returns NotificationSchedule or null if not found
   */
  findById(id: string): Promise<NotificationSchedule | null>;

  /**
   * Find notification schedules by trip ID
   */
  findByTripId(tripId: string): Promise<NotificationSchedule[]>;

  /**
   * Find notification schedules by name (exact match)
   */
  findByName(name: string): Promise<NotificationSchedule | null>;

  /**
   * Find notification schedule by trip ID and name
   */
  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Promise<NotificationSchedule | null>;

  /**
   * Find notification schedules by type
   */
  findByType(type: NotificationScheduleType): Promise<NotificationSchedule[]>;

  /**
   * Find all notification schedules with filtering and pagination
   */
  findAll(options?: {
    filter?: NotificationScheduleFilter;
    pagination?: PaginationOptions;
  }): Promise<PaginatedResult<NotificationSchedule>>;

  /**
   * Find currently active schedules
   * (isActive=true and current time is within the schedule window)
   */
  findActive(now?: Date): Promise<NotificationSchedule[]>;

  /**
   * Find upcoming schedules
   * (startDate is in the future)
   */
  findUpcoming(days?: number, now?: Date): Promise<NotificationSchedule[]>;

  /**
   * Update notification schedule
   */
  update(schedule: NotificationSchedule): Promise<NotificationSchedule>;

  /**
   * Delete notification schedule
   */
  delete(id: string): Promise<void>;

  /**
   * Delete multiple notification schedules
   * @returns count of deleted schedules
   */
  deleteMany(ids: string[]): Promise<number>;

  /**
   * Check if notification schedule exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count notification schedules by filter
   */
  count(filter?: NotificationScheduleFilter): Promise<number>;

  /**
   * Update the lastRun timestamp
   */
  updateLastRun(id: string, lastRun: Date): Promise<NotificationSchedule>;

  /**
   * Toggle isActive status for a schedule
   */
  toggleActive(id: string): Promise<NotificationSchedule>;

  /**
   * Update isActive status for multiple schedules
   * @returns count of updated schedules
   */
  bulkToggleActive(ids: string[], isActive: boolean): Promise<number>;

  /**
   * Get execution history for a schedule
   */
  getExecutionHistory(
    scheduleId: string,
    limit: number,
  ): Promise<NotificationScheduleExecutionRecord[]>;

  /**
   * Count executions for a schedule
   */
  countExecutions(scheduleId: string): Promise<number>;
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
