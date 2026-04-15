import type { Notification } from "../../entities/notification/Notification";
import type { Effect } from "effect";
import type { DatabaseError } from "../database-error";

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
  create(
    notification: Notification,
  ): Effect.Effect<Notification, DatabaseError, never>;

  /**
   * Find notification by ID
   * @returns Notification or null if not found
   */
  findById(
    id: string,
  ): Effect.Effect<Notification | null, DatabaseError, never>;

  /**
   * Find all notifications for a user
   */
  findByUserId(
    userId: string,
  ): Effect.Effect<Notification[], DatabaseError, never>;

  /**
   * Find unread notifications for a user
   */
  findUnreadByUserId(
    userId: string,
  ): Effect.Effect<Notification[], DatabaseError, never>;

  /**
   * Mark notification as read
   */
  markAsRead(id: string): Effect.Effect<Notification, DatabaseError, never>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Update notification
   */
  update(
    notification: Notification,
  ): Effect.Effect<Notification, DatabaseError, never>;

  /**
   * Delete notification
   */
  delete(id: string): Effect.Effect<void, DatabaseError, never>;

  /**
   * Count unread notifications for a user
   */
  countUnread(userId: string): Effect.Effect<number, DatabaseError, never>;
}
