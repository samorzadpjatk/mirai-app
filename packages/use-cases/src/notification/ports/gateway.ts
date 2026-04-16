import type { NotificationId } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import type { PaginationOptions } from "../../system/shared/dto";
import type { NotificationDTO, NotificationPaginatedResult } from "../dto";
import type { DatabaseError } from "./errors";

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
}

/**
 * NotificationGateway Context.Tag for Effect dependency injection
 */
export class NotificationGatewayTag extends Context.Tag("NotificationGateway")<
  NotificationGatewayTag,
  NotificationGateway
>() {}
