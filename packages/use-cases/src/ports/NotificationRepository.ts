import type {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "@mirai-app/domain";
import { Context, Effect } from "effect";

/**
 * NotificationRepository Port
 *
 * This interface defines what operations the application needs
 * from any notification repository implementation.
 */
export interface NotificationRepository {
  /**
   * Create a new notification
   */
  create(notification: Notification): Promise<Notification>;

  /**
   * Find notification by ID
   * @returns Notification or null if not found
   */
  findById(id: string): Promise<Notification | null>;

  /**
   * Find notifications by trip ID
   */
  findByTripId(tripId: string): Promise<Notification[]>;

  /**
   * Find notifications by status
   */
  findByStatus(status: NotificationStatus): Promise<Notification[]>;

  /**
   * Find notifications by trip ID and status
   */
  findByTripIdAndStatus(
    tripId: string,
    status: NotificationStatus,
  ): Promise<Notification[]>;

  /**
   * Find notifications by priority
   */
  findByPriority(priority: NotificationPriority): Promise<Notification[]>;

  /**
   * Find notifications ready to be sent
   */
  findReadyToSend(): Promise<Notification[]>;

  /**
   * Find overdue scheduled notifications
   */
  findOverdue(): Promise<Notification[]>;

  /**
   * Find notifications created by a specific admin
   */
  findByCreatedById(createdById: string): Promise<Notification[]>;

  /**
   * Find all notifications with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Notification[]>;

  /**
   * Update notification
   */
  update(notification: Notification): Promise<Notification>;

  /**
   * Delete notification
   */
  delete(id: string): Promise<void>;

  /**
   * Check if notification exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count notifications by status
   */
  countByStatus(status: NotificationStatus): Promise<number>;

  /**
   * Count pending notifications for a trip
   */
  countPendingByTripId(tripId: string): Promise<number>;
}

/**
 * NotificationRepository Context.Tag for Effect dependency injection
 */
export class NotificationRepositoryTag extends Context.Tag(
  "NotificationRepository",
)<
  NotificationRepositoryTag,
  {
    create: (
      notification: Notification,
    ) => Effect.Effect<Notification, never, never>;
    findById: (id: string) => Effect.Effect<Notification | null, never, never>;
    findByTripId: (
      tripId: string,
    ) => Effect.Effect<Notification[], never, never>;
    findByStatus: (
      status: NotificationStatus,
    ) => Effect.Effect<Notification[], never, never>;
    findByTripIdAndStatus: (
      tripId: string,
      status: NotificationStatus,
    ) => Effect.Effect<Notification[], never, never>;
    findByPriority: (
      priority: NotificationPriority,
    ) => Effect.Effect<Notification[], never, never>;
    findReadyToSend: () => Effect.Effect<Notification[], never, never>;
    findOverdue: () => Effect.Effect<Notification[], never, never>;
    findByCreatedById: (
      createdById: string,
    ) => Effect.Effect<Notification[], never, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<Notification[], never, never>;
    update: (
      notification: Notification,
    ) => Effect.Effect<Notification, never, never>;
    delete: (id: string) => Effect.Effect<void, never, never>;
    exists: (id: string) => Effect.Effect<boolean, never, never>;
    countByStatus: (
      status: NotificationStatus,
    ) => Effect.Effect<number, never, never>;
    countPendingByTripId: (
      tripId: string,
    ) => Effect.Effect<number, never, never>;
  }
>() {}
