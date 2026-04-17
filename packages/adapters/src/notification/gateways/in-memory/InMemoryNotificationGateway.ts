import { Effect } from "effect";
import {
  type INotificationPort,
  type Notification,
  type NotificationPush,
} from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";

/**
 * In-Memory Notification Gateway
 *
 * Implements INotificationPort using in-memory Map storage for testing.
 */
export class InMemoryNotificationGateway implements INotificationPort {
  private notifications: Map<string, Notification> = new Map();
  private notificationPushes: Map<string, NotificationPush[]> = new Map();

  findById(
    id: string,
  ): Effect.Effect<Notification | null, DatabaseError, never> {
    return Effect.sync(() => {
      const notification = this.notifications.get(id);
      return notification ?? null;
    });
  }

  findByUserId(
    userId: string,
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.notifications.values())
        .filter((n) => n.createdById === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findPaginatedByUserId(
    userId: string,
    params: { page: number; pageSize: number },
  ): Effect.Effect<
    { notifications: Notification[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  > {
    return Effect.sync(() => {
      const { page, pageSize } = params;
      const offset = (page - 1) * pageSize;

      const userNotifications = Array.from(this.notifications.values())
        .filter((n) => n.createdById === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = userNotifications.length;
      const paginatedNotifications = userNotifications.slice(
        offset,
        offset + pageSize,
      );
      const hasMore = offset + paginatedNotifications.length < total;

      return {
        notifications: paginatedNotifications,
        total,
        hasMore,
      };
    });
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.sync(() => {
      return Array.from(this.notifications.values())
        .filter((n) => n.tripId === tripId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  findPaginated(params: {
    tripId?: string;
    limit: number;
    offset: number;
  }): Effect.Effect<
    { notifications: Notification[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  > {
    return Effect.sync(() => {
      const { tripId, limit, offset } = params;

      let filteredNotifications = Array.from(this.notifications.values());
      if (tripId) {
        filteredNotifications = filteredNotifications.filter(
          (n) => n.tripId === tripId,
        );
      }

      const sortedNotifications = filteredNotifications.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const total = sortedNotifications.length;
      const paginatedNotifications = sortedNotifications.slice(
        offset,
        offset + limit,
      );
      const hasMore = offset + paginatedNotifications.length < total;

      return {
        notifications: paginatedNotifications,
        total,
        hasMore,
      };
    });
  }

  create(
    notification: Notification,
  ): Effect.Effect<Notification, DatabaseError, never> {
    return Effect.sync(() => {
      this.notifications.set(notification.id, notification);
      return notification;
    });
  }

  update(
    notification: Notification,
  ): Effect.Effect<Notification, DatabaseError, never> {
    return Effect.sync(() => {
      const existing = this.notifications.get(notification.id);
      if (!existing) {
        throw new Error(`Notification not found: ${notification.id}`);
      }

      const updatedNotification: Notification = {
        ...notification,
        updatedAt: new Date(),
      };

      this.notifications.set(notification.id, updatedNotification);
      return updatedNotification;
    });
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.notifications.delete(id);
      this.notificationPushes.delete(id);
    });
  }

  markAsSent(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      const notification = this.notifications.get(id);
      if (notification) {
        this.notifications.set(id, {
          ...notification,
          updatedAt: new Date(),
        });
      }
    });
  }

  markAsFailed(
    id: string,
    reason: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      const notification = this.notifications.get(id);
      if (notification) {
        this.notifications.set(id, {
          ...notification,
          updatedAt: new Date(),
        });
      }
    });
  }

  findWithPushes(
    notificationId: string,
  ): Effect.Effect<
    { notification: Notification; pushes: NotificationPush[] } | null,
    DatabaseError,
    never
  > {
    return Effect.sync(() => {
      const notification = this.notifications.get(notificationId);
      if (!notification) {
        return null;
      }

      const pushes = this.notificationPushes.get(notificationId) ?? [];
      return { notification, pushes };
    });
  }

  getFailedPushes(
    notificationId: string,
  ): Effect.Effect<NotificationPush[], DatabaseError, never> {
    return Effect.sync(() => {
      const pushes = this.notificationPushes.get(notificationId) ?? [];
      return pushes.filter((p) => p.status === "failed");
    });
  }

  resetFailedPushes(
    notificationId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      const pushes = this.notificationPushes.get(notificationId) ?? [];
      const resetPushes = pushes.map((p) =>
        p.status === "failed"
          ? { ...p, status: "pending" as const, failureReason: null }
          : p,
      );
      this.notificationPushes.set(notificationId, resetPushes);
    });
  }

  // Test helper methods
  clear(): void {
    this.notifications.clear();
    this.notificationPushes.clear();
  }

  setPushes(notificationId: string, pushes: NotificationPush[]): void {
    this.notificationPushes.set(notificationId, pushes);
  }
}
