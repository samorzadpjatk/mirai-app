import type {
  NotificationScheduleFilter,
  PaginatedResult,
  PaginationOptions,
  NotificationSchedule,
} from "@mirai-app/domain";
import type { DatabaseError } from "../errors";
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
 * NotificationScheduleGateway Port
 *
 * This interface defines what operations the application needs
 * from any notification schedule gateway implementation.
 *
 * All methods return domain entities to enable business logic in use cases.
 *
 * Implementations (in adapters layer):
 * - DrizzleNotificationScheduleGateway: Uses Drizzle ORM
 * - InMemoryNotificationScheduleGateway: For testing
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
   * Find all notification schedules with pagination and optional filtering
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
   * Find active notification schedules (currently within their time window)
   */
  findActive(): Effect.Effect<NotificationSchedule[], DatabaseError, never>;

  /**
   * Find upcoming notification schedules
   */
  findUpcoming(
    days?: number,
  ): Effect.Effect<NotificationSchedule[], DatabaseError, never>;

  /**
   * Get execution history for a schedule
   */
  getExecutionHistory(
    scheduleId: string,
    limit: number,
  ): Effect.Effect<NotificationScheduleExecutionRecord[], DatabaseError, never>;
}

/**
 * NotificationScheduleGateway Context.Tag for Effect dependency injection
 */
export class NotificationScheduleGatewayTag extends Context.Tag(
  "NotificationScheduleGateway",
)<NotificationScheduleGatewayTag, NotificationScheduleGateway>() {}
