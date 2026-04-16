import type { NotificationId } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type {
  NotificationDTO,
  NotificationPaginatedResult,
  NotificationScheduleDTO,
  NotificationDeliveryDTO,
} from "../dto";
import type { DatabaseError } from "./errors";
import type { Connection } from "@mirai-app/domain";

/**
 * Cursor data for notification pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface NotificationCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for notification connection pagination
 */
export interface NotificationConnectionArgs {
  first?: number;
  after?: NotificationCursorData | null;
}

/**
 * Cursor data for notification schedule pagination
 * Uses scheduledAt as the primary sort field with id as tiebreaker
 */
export interface NotificationScheduleCursorData {
  id: string;
  scheduledAt: string;
}

/**
 * Arguments for notification schedule connection pagination
 */
export interface NotificationScheduleConnectionArgs {
  first?: number;
  after?: NotificationScheduleCursorData | null;
}

/**
 * Cursor data for notification delivery pagination
 * Uses createdAt as the primary sort field with id as tiebreaker
 */
export interface NotificationDeliveryCursorData {
  id: string;
  createdAt: string;
}

/**
 * Arguments for notification delivery connection pagination
 */
export interface NotificationDeliveryConnectionArgs {
  first?: number;
  after?: NotificationDeliveryCursorData | null;
}

/**
 * NotificationGateway Port
 *
 * This interface defines what operations the application needs
 * from any notification gateway implementation.
 *
 * All methods return DTOs instead of domain entities.
 *
 * Implementations (in adapters layer):
 * - DrizzleNotificationGateway: Uses Drizzle ORM
 * - InMemoryNotificationGateway: For testing
 */
export interface NotificationGateway {
  /**
   * Create a new notification
   */
  create(
    notification: NotificationDTO,
  ): Effect.Effect<NotificationDTO, DatabaseError, never>;

  /**
   * Find notification by ID
   * @returns NotificationDTO or null if not found
   */
  findById(
    id: NotificationId,
  ): Effect.Effect<NotificationDTO | null, DatabaseError, never>;

  /**
   * Find notifications by trip ID
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never>;

  /**
   * Find notifications by status
   */
  findByStatus(
    status: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never>;

  /**
   * Find notifications by trip ID and status
   */
  findByTripIdAndStatus(
    tripId: string,
    status: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never>;

  /**
   * Find notifications by priority
   */
  findByPriority(
    priority: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never>;

  /**
   * Find notifications ready to be sent
   */
  findReadyToSend(): Effect.Effect<NotificationDTO[], DatabaseError, never>;

  /**
   * Find overdue scheduled notifications
   */
  findOverdue(): Effect.Effect<NotificationDTO[], DatabaseError, never>;

  /**
   * Find notifications created by a specific admin
   */
  findByCreatedById(
    createdById: string,
  ): Effect.Effect<NotificationDTO[], DatabaseError, never>;

  /**
   * Find all notifications with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<NotificationPaginatedResult, DatabaseError, never>;

  /**
   * Update notification
   */
  update(
    notification: NotificationDTO,
  ): Effect.Effect<NotificationDTO, DatabaseError, never>;

  /**
   * Delete notification
   */
  delete(id: NotificationId): Effect.Effect<void, DatabaseError, never>;

  /**
   * Check if notification exists
   */
  exists(id: NotificationId): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count notifications by status
   */
  countByStatus(status: string): Effect.Effect<number, DatabaseError, never>;

  /**
   * Count pending notifications for a trip
   */
  countPendingByTripId(
    tripId: string,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Find notifications for a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByUserIdConnection(
    userId: string,
    args: NotificationConnectionArgs,
  ): Effect.Effect<Connection<NotificationDTO>, DatabaseError, never>;

  /**
   * Find unread notifications for a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findUnreadByUserIdConnection(
    userId: string,
    args: NotificationConnectionArgs,
  ): Effect.Effect<Connection<NotificationDTO>, DatabaseError, never>;

  /**
   * Find all notification schedules with cursor-based pagination
   * Uses (scheduledAt, id) sort order for stable pagination
   */
  findManyConnection(
    args: NotificationScheduleConnectionArgs,
  ): Effect.Effect<Connection<NotificationScheduleDTO>, DatabaseError, never>;

  /**
   * Find active notification schedules with cursor-based pagination
   * Uses (scheduledAt, id) sort order for stable pagination
   */
  findActiveConnection(
    args: NotificationScheduleConnectionArgs,
  ): Effect.Effect<Connection<NotificationScheduleDTO>, DatabaseError, never>;

  /**
   * Find notification schedules by trip ID with cursor-based pagination
   * Uses (scheduledAt, id) sort order for stable pagination
   */
  findByTripIdConnection(
    tripId: string,
    args: NotificationScheduleConnectionArgs,
  ): Effect.Effect<Connection<NotificationScheduleDTO>, DatabaseError, never>;

  /**
   * Find notification schedules by notification ID with cursor-based pagination
   * Uses (scheduledAt, id) sort order for stable pagination
   */
  findByNotificationIdConnection(
    notificationId: NotificationId,
    args: NotificationScheduleConnectionArgs,
  ): Effect.Effect<Connection<NotificationScheduleDTO>, DatabaseError, never>;

  /**
   * Find notification schedule executions with cursor-based pagination
   * Uses (scheduledAt, id) sort order for stable pagination
   */
  findExecutionsConnection(
    args: NotificationScheduleConnectionArgs,
  ): Effect.Effect<Connection<NotificationScheduleDTO>, DatabaseError, never>;

  /**
   * Find notification deliveries by notification ID with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findDeliveriesByNotificationIdConnection(
    notificationId: NotificationId,
    args: NotificationDeliveryConnectionArgs,
  ): Effect.Effect<Connection<NotificationDeliveryDTO>, DatabaseError, never>;

  /**
   * Find notification deliveries by user ID with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findDeliveriesByUserIdConnection(
    userId: string,
    args: NotificationDeliveryConnectionArgs,
  ): Effect.Effect<Connection<NotificationDeliveryDTO>, DatabaseError, never>;
}

/**
 * NotificationGateway Context.Tag for Effect dependency injection
 */
export class NotificationGatewayTag extends Context.Tag("NotificationGateway")<
  NotificationGatewayTag,
  NotificationGateway
>() {}
