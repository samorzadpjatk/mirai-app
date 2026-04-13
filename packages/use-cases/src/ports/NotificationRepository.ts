import type {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "@mirai-app/domain";
import { Context, Effect } from "effect";

/**
 * Repository error type for port interfaces
 * This is a common error type used across all repository implementations
 */
export class DatabaseError extends Error {
  readonly _tag = "DatabaseError" as const;
  readonly code = "DATABASE_ERROR" as const;
  readonly operation: string;
  override readonly message: string;
  override readonly cause?: unknown;

  constructor(props: { operation: string; message: string; cause?: unknown }) {
    super(`Database error in '${props.operation}': ${props.message}`);
    this.operation = props.operation;
    this.message = props.message;
    this.cause = props.cause;
  }
}

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
   * Find notifications by trip ID
   */
  findByTripId(
    tripId: string,
  ): Effect.Effect<Notification[], DatabaseError, never>;

  /**
   * Find notifications by status
   */
  findByStatus(
    status: NotificationStatus,
  ): Effect.Effect<Notification[], DatabaseError, never>;

  /**
   * Find notifications by trip ID and status
   */
  findByTripIdAndStatus(
    tripId: string,
    status: NotificationStatus,
  ): Effect.Effect<Notification[], DatabaseError, never>;

  /**
   * Find notifications by priority
   */
  findByPriority(
    priority: NotificationPriority,
  ): Effect.Effect<Notification[], DatabaseError, never>;

  /**
   * Find notifications ready to be sent
   */
  findReadyToSend(): Effect.Effect<Notification[], DatabaseError, never>;

  /**
   * Find overdue scheduled notifications
   */
  findOverdue(): Effect.Effect<Notification[], DatabaseError, never>;

  /**
   * Find notifications created by a specific admin
   */
  findByCreatedById(
    createdById: string,
  ): Effect.Effect<Notification[], DatabaseError, never>;

  /**
   * Find all notifications with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Notification[], DatabaseError, never>;

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
   * Check if notification exists
   */
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;

  /**
   * Count notifications by status
   */
  countByStatus(
    status: NotificationStatus,
  ): Effect.Effect<number, DatabaseError, never>;

  /**
   * Count pending notifications for a trip
   */
  countPendingByTripId(
    tripId: string,
  ): Effect.Effect<number, DatabaseError, never>;
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
    ) => Effect.Effect<Notification, DatabaseError, never>;
    findById: (
      id: string,
    ) => Effect.Effect<Notification | null, DatabaseError, never>;
    findByTripId: (
      tripId: string,
    ) => Effect.Effect<Notification[], DatabaseError, never>;
    findByStatus: (
      status: NotificationStatus,
    ) => Effect.Effect<Notification[], DatabaseError, never>;
    findByTripIdAndStatus: (
      tripId: string,
      status: NotificationStatus,
    ) => Effect.Effect<Notification[], DatabaseError, never>;
    findByPriority: (
      priority: NotificationPriority,
    ) => Effect.Effect<Notification[], DatabaseError, never>;
    findReadyToSend: () => Effect.Effect<Notification[], DatabaseError, never>;
    findOverdue: () => Effect.Effect<Notification[], DatabaseError, never>;
    findByCreatedById: (
      createdById: string,
    ) => Effect.Effect<Notification[], DatabaseError, never>;
    findAll: (options?: {
      limit?: number;
      offset?: number;
    }) => Effect.Effect<Notification[], DatabaseError, never>;
    update: (
      notification: Notification,
    ) => Effect.Effect<Notification, DatabaseError, never>;
    delete: (id: string) => Effect.Effect<void, DatabaseError, never>;
    exists: (id: string) => Effect.Effect<boolean, DatabaseError, never>;
    countByStatus: (
      status: NotificationStatus,
    ) => Effect.Effect<number, DatabaseError, never>;
    countPendingByTripId: (
      tripId: string,
    ) => Effect.Effect<number, DatabaseError, never>;
  }
>() {}
