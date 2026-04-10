import type { Notification } from "@mirai-app/domain";
import { NotificationStatus, NotificationPriority } from "@mirai-app/domain";
import type { NotificationRepository } from "@mirai-app/use-cases";
import { InMemoryRepository } from "./base";

/**
 * In-Memory Notification Repository for Testing
 *
 * Implements NotificationRepository port with in-memory storage.
 * Provides methods for managing notifications including status tracking,
 * scheduling, priority management, and querying by various criteria.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryNotificationRepository();
 * repo.seed([mockNotification]);
 *
 * // Find by trip
 * const tripNotifications = await repo.findByTripId("trip-123");
 *
 * // Find ready to send
 * const ready = await repo.findReadyToSend();
 *
 * // Count by status
 * const pendingCount = await repo.countByStatus(NotificationStatus.DRAFT);
 *
 * repo.reset();
 * ```
 */
export class InMemoryNotificationRepository
  extends InMemoryRepository<Notification>
  implements NotificationRepository
{
  /**
   * Create a new notification
   * @param notification - The notification to create
   * @returns The created notification
   */
  async create(notification: Notification): Promise<Notification> {
    return this.createGeneric(notification);
  }

  /**
   * Find notification by ID
   * @param id - The notification ID
   * @returns The notification or null if not found
   */
  async findById(id: string): Promise<Notification | null> {
    return this.findByIdGeneric(id);
  }

  /**
   * Find all notifications with optional pagination
   * @param options - Pagination options (limit, offset)
   * @returns Array of notifications
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    return this.findAllGeneric(options);
  }

  /**
   * Find notifications by trip ID
   * @param tripId - The trip ID to search for
   * @returns Array of notifications for the trip, sorted by creation date descending
   */
  async findByTripId(tripId: string): Promise<Notification[]> {
    return this.getAllItems()
      .filter((n) => n.tripId === tripId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Find notifications by status
   * @param status - The notification status to filter by
   * @returns Array of notifications with the given status, sorted by creation date descending
   */
  async findByStatus(status: NotificationStatus): Promise<Notification[]> {
    return this.getAllItems()
      .filter((n) => n.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Find notifications by trip ID and status
   * @param tripId - The trip ID to search for
   * @param status - The notification status to filter by
   * @returns Array of matching notifications, sorted by creation date descending
   */
  async findByTripIdAndStatus(
    tripId: string,
    status: NotificationStatus,
  ): Promise<Notification[]> {
    return this.getAllItems()
      .filter((n) => n.tripId === tripId && n.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Find notifications by priority level
   * @param priority - The priority level to filter by
   * @returns Array of notifications with the given priority, sorted by creation date descending
   */
  async findByPriority(
    priority: NotificationPriority,
  ): Promise<Notification[]> {
    return this.getAllItems()
      .filter((n) => n.priority === priority)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Find notifications ready to be sent
   * Returns notifications with READY status that are either:
   * - Not scheduled (scheduledFor is null), or
   * - Scheduled for a time that has already passed
   *
   * Results are sorted by priority (high first) then by creation date (oldest first)
   * @returns Array of notifications ready to send
   */
  async findReadyToSend(): Promise<Notification[]> {
    const now = Date.now();
    return this.getAllItems()
      .filter((n) => {
        if (n.status !== NotificationStatus.READY) return false;
        if (!n.scheduledFor) return true;
        return n.scheduledFor.getTime() <= now;
      })
      .sort((a, b) => {
        // Sort by priority (high to low), then by creation date (old to new)
        const priorityOrder: Record<NotificationPriority, number> = {
          [NotificationPriority.URGENT]: 4,
          [NotificationPriority.HIGH]: 3,
          [NotificationPriority.NORMAL]: 2,
          [NotificationPriority.LOW]: 1,
        };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  /**
   * Find overdue scheduled notifications
   * Returns notifications with DRAFT status and a scheduledFor time in the past
   * Results are sorted by scheduledFor date (oldest first)
   * @returns Array of overdue notifications
   */
  async findOverdue(): Promise<Notification[]> {
    const now = Date.now();
    return this.getAllItems()
      .filter(
        (n) =>
          n.status === NotificationStatus.DRAFT &&
          n.scheduledFor !== null &&
          n.scheduledFor.getTime() < now,
      )
      .sort((a, b) => {
        // Sort by scheduledFor (earliest first)
        const aTime = a.scheduledFor?.getTime() ?? 0;
        const bTime = b.scheduledFor?.getTime() ?? 0;
        return aTime - bTime;
      });
  }

  /**
   * Find notifications created by a specific admin user
   * @param createdById - The user ID who created the notifications
   * @returns Array of notifications created by the user, sorted by creation date descending
   */
  async findByCreatedById(createdById: string): Promise<Notification[]> {
    return this.getAllItems()
      .filter((n) => n.createdById === createdById)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update a notification
   * @param notification - The notification to update
   * @returns The updated notification
   * @throws Error if notification not found
   */
  async update(notification: Notification): Promise<Notification> {
    return this.updateGeneric(notification);
  }

  /**
   * Delete a notification by ID
   * @param id - The notification ID to delete
   */
  async delete(id: string): Promise<void> {
    return this.deleteGeneric(id);
  }

  /**
   * Check if a notification exists
   * @param id - The notification ID to check
   * @returns True if the notification exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    return this.existsGeneric(id);
  }

  /**
   * Count notifications by status
   * @param status - The status to count
   * @returns The number of notifications with the given status
   */
  async countByStatus(status: NotificationStatus): Promise<number> {
    return this.getAllItems().filter((n) => n.status === status).length;
  }

  /**
   * Count pending notifications by trip ID
   * Pending means status is either DRAFT or READY
   * @param tripId - The trip ID to count pending notifications for
   * @returns The number of pending notifications for the trip
   */
  async countPendingByTripId(tripId: string): Promise<number> {
    return this.getAllItems().filter(
      (n) =>
        n.tripId === tripId &&
        (n.status === NotificationStatus.DRAFT ||
          n.status === NotificationStatus.READY),
    ).length;
  }
}
