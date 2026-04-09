import type {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "@mirai-app/domain";

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
