import type { Notification } from "../entities/notification";
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type {
  Connection,
  ForwardPaginationArgs,
} from "../../value-objects/pagination";

/**
 * NotificationGateway Port
 *
 * This interface defines what operations the application needs
 * from any notification gateway implementation.
 */
export interface NotificationGateway {
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
   * Find notifications for a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findByUserIdConnection(
    userId: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<Connection<Notification>, DatabaseError, never>;

  /**
   * Find unread notifications for a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findUnreadByUserIdConnection(
    userId: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<Connection<Notification>, DatabaseError, never>;

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
