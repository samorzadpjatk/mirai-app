import { Effect } from "effect";
import { eq, and, desc, count, sql } from "drizzle-orm";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  notifications,
  type NotificationSelect,
} from "@mirai-app/frameworks/drizzle";
import {
  type INotificationPort,
  type Notification,
  type NotificationPush,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { notificationMapper } from "../../mappers/NotificationMapper";

/**
 * Notification Drizzle Gateway
 *
 * Implements INotificationPort using Drizzle ORM for database operations.
 * Extends BaseDrizzleGateway for consistent error handling.
 */
export class NotificationDrizzleGateway
  extends BaseDrizzleGateway
  implements INotificationPort
{
  constructor(db: DrizzleDb) {
    super(db);
  }

  findById(id: string) {
    return this.tryPromise(
      "NotificationDrizzleGateway.findById",
      async () => {
        const result = await this.db.query.notifications.findFirst({
          where: eq(notifications.id, id),
        });
        return result ? notificationMapper.toDTO(result) : null;
      },
      id,
    );
  }

  findByUserId(userId: string) {
    return this.tryPromise(
      "NotificationDrizzleGateway.findByUserId",
      async () => {
        const results = await this.db.query.notifications.findMany({
          where: eq(notifications.createdById, userId),
          orderBy: desc(notifications.createdAt),
        });
        return results.map((r) => notificationMapper.toDTO(r));
      },
    );
  }

  findPaginatedByUserId(
    userId: string,
    params: { page: number; pageSize: number },
  ) {
    return this.tryPromise(
      "NotificationDrizzleGateway.findPaginatedByUserId",
      async () => {
        const { page, pageSize } = params;
        const offset = (page - 1) * pageSize;

        const [results, totalResult] = await Promise.all([
          this.db.query.notifications.findMany({
            where: eq(notifications.createdById, userId),
            orderBy: desc(notifications.createdAt),
            limit: pageSize,
            offset,
          }),
          this.db
            .select({ count: count() })
            .from(notifications)
            .where(eq(notifications.createdById, userId)),
        ]);

        const total = totalResult[0]?.count ?? 0;
        const hasMore = offset + results.length < total;

        return {
          notifications: results.map((r) => notificationMapper.toDTO(r)),
          total,
          hasMore,
        };
      },
    );
  }

  findByTripId(tripId: string) {
    return this.tryPromise(
      "NotificationDrizzleGateway.findByTripId",
      async () => {
        const results = await this.db.query.notifications.findMany({
          where: eq(notifications.tripId, tripId),
          orderBy: desc(notifications.createdAt),
        });
        return results.map((r) => notificationMapper.toDTO(r));
      },
    );
  }

  findPaginated(params: { tripId?: string; limit: number; offset: number }) {
    return this.tryPromise(
      "NotificationDrizzleGateway.findPaginated",
      async () => {
        const { tripId, limit, offset } = params;

        const whereClause = tripId
          ? eq(notifications.tripId, tripId)
          : sql`true`;

        const [results, totalResult] = await Promise.all([
          this.db.query.notifications.findMany({
            where: whereClause,
            orderBy: desc(notifications.createdAt),
            limit,
            offset,
          }),
          this.db
            .select({ count: count() })
            .from(notifications)
            .where(whereClause),
        ]);

        const total = totalResult[0]?.count ?? 0;
        const hasMore = offset + results.length < total;

        return {
          notifications: results.map((r) => notificationMapper.toDTO(r)),
          total,
          hasMore,
        };
      },
    );
  }

  create(notification: Notification) {
    return this.tryPromise(
      "NotificationDrizzleGateway.create",
      async () => {
        const insert = notificationMapper.toInsert(notification);
        const [result] = await this.db
          .insert(notifications)
          .values(insert)
          .returning();
        if (!result) throw new Error("Failed to create notification");
        return notificationMapper.toDTO(result);
      },
      notification.id,
    );
  }

  update(notification: Notification) {
    return this.tryPromise(
      "NotificationDrizzleGateway.update",
      async () => {
        const update = notificationMapper.toUpdate(notification);
        const [result] = await this.db
          .update(notifications)
          .set(update)
          .where(eq(notifications.id, notification.id))
          .returning();
        if (!result)
          throw new Error(`Notification not found: ${notification.id}`);
        return notificationMapper.toDTO(result);
      },
      notification.id,
    );
  }

  delete(id: string) {
    return this.tryPromise(
      "NotificationDrizzleGateway.delete",
      async () => {
        await this.db.delete(notifications).where(eq(notifications.id, id));
      },
      id,
    );
  }

  markAsSent(id: string) {
    return this.tryPromise(
      "NotificationDrizzleGateway.markAsSent",
      async () => {
        await this.db
          .update(notifications)
          .set({
            status: "SENT",
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(notifications.id, id));
      },
      id,
    );
  }

  markAsFailed(id: string, reason: string) {
    return this.tryPromise(
      "NotificationDrizzleGateway.markAsFailed",
      async () => {
        await this.db
          .update(notifications)
          .set({
            status: "FAILED",
            failureReason: reason,
            updatedAt: new Date(),
          })
          .where(eq(notifications.id, id));
      },
      id,
    );
  }

  findWithPushes(notificationId: string) {
    return this.tryPromise(
      "NotificationDrizzleGateway.findWithPushes",
      async () => {
        const result = await this.db.query.notifications.findFirst({
          where: eq(notifications.id, notificationId),
        });

        if (!result) {
          return null;
        }

        // Since NotificationPush records aren't stored in a separate table,
        // we return an empty array. In a real implementation, this might
        // come from a separate push notifications table or be inferred from
        // delivery records.
        const pushes: NotificationPush[] = [];

        return {
          notification: notificationMapper.toDTO(result),
          pushes,
        };
      },
      notificationId,
    );
  }

  getFailedPushes(notificationId: string) {
    return this.tryPromise(
      "NotificationDrizzleGateway.getFailedPushes",
      async () => {
        // Since NotificationPush records aren't in a separate table,
        // we check the notification's failure status and return a synthetic
        // push record if it failed.
        const notification = await this.db.query.notifications.findFirst({
          where: eq(notifications.id, notificationId),
        });

        if (!notification || notification.status !== "FAILED") {
          return [];
        }

        // Return a synthetic failed push record
        return [
          notificationMapper.toPushDTO(
            notification,
            notification.createdById,
            `${notificationId}-push-1`,
          ),
        ];
      },
      notificationId,
    );
  }

  resetFailedPushes(notificationId: string) {
    return this.tryPromise(
      "NotificationDrizzleGateway.resetFailedPushes",
      async () => {
        // Reset the notification status back to READY to allow retry
        await this.db
          .update(notifications)
          .set({
            status: "READY",
            failureReason: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(notifications.id, notificationId),
              eq(notifications.status, "FAILED"),
            ),
          );
      },
      notificationId,
    );
  }
}
