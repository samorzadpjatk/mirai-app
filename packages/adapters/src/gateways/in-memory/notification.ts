import type { Notification } from "@mirai-app/domain";
import { NotificationStatus, NotificationPriority } from "@mirai-app/domain";
import type { NotificationRepository } from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/use-cases/ports/NotificationRepository";
import { Effect } from "effect";
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
 * const tripNotifications = await Effect.runPromise(repo.findByTripId("trip-123"));
 *
 * // Find ready to send
 * const ready = await Effect.runPromise(repo.findReadyToSend());
 *
 * // Count by status
 * const pendingCount = await Effect.runPromise(repo.countByStatus(NotificationStatus.DRAFT));
 *
 * repo.reset();
 * ```
 */
export class InMemoryNotificationRepository
  extends InMemoryRepository<Notification>
  implements NotificationRepository
{
  create(
    notification: Notification,
  ): Effect.Effect<Notification, DatabaseError, never> {
    return this.createGeneric(notification);
  }

  findById(
    id: string,
  ): Effect.Effect<Notification | null, DatabaseError, never> {
    return this.findByIdGeneric(id);
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Notification[], DatabaseError, never> {
    return this.findAllGeneric(options);
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => n.tripId === tripId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByStatus(
    status: NotificationStatus,
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => n.status === status)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByTripIdAndStatus(
    tripId: string,
    status: NotificationStatus,
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => n.tripId === tripId && n.status === status)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findByPriority(
    priority: NotificationPriority,
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => n.priority === priority)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  findReadyToSend(): Effect.Effect<Notification[], DatabaseError, never> {
    const now = Date.now();
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => {
          if (n.status !== NotificationStatus.READY) return false;
          if (!n.scheduledFor) return true;
          return n.scheduledFor.getTime() <= now;
        })
        .sort((a, b) => {
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
        }),
    );
  }

  findOverdue(): Effect.Effect<Notification[], DatabaseError, never> {
    const now = Date.now();
    return Effect.succeed(
      this.getAllItems()
        .filter(
          (n) =>
            n.status === NotificationStatus.DRAFT &&
            n.scheduledFor !== null &&
            n.scheduledFor.getTime() < now,
        )
        .sort((a, b) => {
          const aTime = a.scheduledFor?.getTime() ?? 0;
          const bTime = b.scheduledFor?.getTime() ?? 0;
          return aTime - bTime;
        }),
    );
  }

  findByCreatedById(
    createdById: string,
  ): Effect.Effect<Notification[], DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems()
        .filter((n) => n.createdById === createdById)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  update(
    notification: Notification,
  ): Effect.Effect<Notification, DatabaseError, never> {
    return this.updateGeneric(notification);
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return this.deleteGeneric(id);
  }

  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return this.existsGeneric(id);
  }

  countByStatus(
    status: NotificationStatus,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter((n) => n.status === status).length,
    );
  }

  countPendingByTripId(
    tripId: string,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (n) =>
          n.tripId === tripId &&
          (n.status === NotificationStatus.DRAFT ||
            n.status === NotificationStatus.READY),
      ).length,
    );
  }
}
