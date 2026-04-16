import type {
  NotificationScheduleType,
  NotificationScheduleFilter,
  PaginationOptions,
} from "@mirai-app/domain";
import type { NotificationScheduleDTO } from "../../dto";
import type { PaginatedResult } from "../../../system/shared/dto";
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
 * All methods return DTOs instead of domain entities.
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
    schedule: NotificationScheduleDTO,
  ): Effect.Effect<NotificationScheduleDTO, DatabaseError, never>;

  /**
   * Find notification schedule by ID
   * @returns NotificationScheduleDTO or null if not found
   */
  findById(
    id: string,
  ): Effect.Effect<NotificationScheduleDTO | null, DatabaseError, never>;

  /**
   * Find notification schedules by trip ID
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<NotificationScheduleDTO[], DatabaseError, never>;

  /**
   * Find notification schedules by name (exact match)
   */
  findByName(
    name: string,
  ): Effect.Effect<NotificationScheduleDTO | null, DatabaseError, never>;

  /**
   * Find notification schedule by trip ID and name
   */
  findByTripIdAndName(
    tripId: string,
    name: string,
  ): Effect.Effect<NotificationScheduleDTO | null, DatabaseError, never>;

  /**
   * Find notification schedules by type
   */
  findByType(
    type: NotificationScheduleType,
  ): Effect.Effect<NotificationScheduleDTO[], DatabaseError, never>;

  /**
   * Find all notification schedules with filtering and pagination
   * Note: Renamed from findAll to avoid collision with BaseDrizzleGateway.findAll
   */
  findAllPaginated(options?: {
    filter?: NotificationScheduleFilter;
    pagination?: PaginationOptions;
  }): Effect.Effect<
    PaginatedResult<NotificationScheduleDTO>,
    DatabaseError,
    never
  >;

  /**
   * Find currently active schedules
   * (isActive=true and current time is within the schedule window)
   */
  findActive(
    now?: Date,
  ): Effect.Effect<NotificationScheduleDTO[], DatabaseError, never>;

  /**
   * Find upcoming schedules
   * (startDate is in the future)
   */
  findUpcoming(
    days?: number,
    now?: Date,
  ): Effect.Effect<NotificationScheduleDTO[], DatabaseError, never>;

  /**
   * Update notification schedule
   */
  update(
    schedule: NotificationScheduleDTO,
  ): Effect.Effect<NotificationScheduleDTO, DatabaseError, never>;

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
  ): Effect.Effect<NotificationScheduleDTO, DatabaseError, never>;

  /**
   * Toggle isActive status for a schedule
   */
  toggleActive(
    id: string,
  ): Effect.Effect<NotificationScheduleDTO, DatabaseError, never>;

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

/**
 * NotificationScheduleGateway Context.Tag for Effect dependency injection
 */
export class NotificationScheduleGatewayTag extends Context.Tag(
  "NotificationScheduleGateway",
)<NotificationScheduleGatewayTag, NotificationScheduleGateway>() {}
