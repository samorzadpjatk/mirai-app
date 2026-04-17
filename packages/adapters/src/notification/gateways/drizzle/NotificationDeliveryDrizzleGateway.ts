import { Effect } from "effect";
import { eq, and, desc, count, sql, gte, lte } from "drizzle-orm";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  notificationDeliveries,
  type NotificationDeliverySelect,
} from "@mirai-app/frameworks/drizzle";
import type {
  NotificationDelivery,
  NotificationDeliveryStats,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { notificationDeliveryMapper } from "../../mappers/NotificationDeliveryMapper";

/**
 * Notification Delivery Drizzle Gateway
 *
 * Implements NotificationDeliveryPort using Drizzle ORM for database operations.
 * Extends BaseDrizzleGateway for consistent error handling.
 */
export class NotificationDeliveryDrizzleGateway extends BaseDrizzleGateway {
  constructor(db: DrizzleDb) {
    super(db);
  }

  findAll(params: {
    tripId?: string;
    status?: string;
    scheduleId?: string;
    startDate?: Date;
    endDate?: Date;
    limit: number;
    offset: number;
  }) {
    return this.tryPromise(
      "NotificationDeliveryDrizzleGateway.findAll",
      async () => {
        const {
          tripId,
          status,
          scheduleId,
          startDate,
          endDate,
          limit,
          offset,
        } = params;

        // Build where conditions dynamically
        const conditions: (
          | ReturnType<typeof eq>
          | ReturnType<typeof and>
          | ReturnType<typeof gte>
          | ReturnType<typeof lte>
        )[] = [];

        if (tripId) {
          conditions.push(eq(notificationDeliveries.tripId, tripId));
        }

        if (status) {
          conditions.push(
            eq(
              notificationDeliveries.status,
              status as NotificationDeliverySelect["status"],
            ),
          );
        }

        if (scheduleId) {
          conditions.push(eq(notificationDeliveries.scheduleId, scheduleId));
        }

        if (startDate) {
          conditions.push(
            gte(notificationDeliveries.deliveryStartedAt, startDate),
          );
        }

        if (endDate) {
          conditions.push(
            lte(notificationDeliveries.deliveryStartedAt, endDate),
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : sql`true`;

        const [results, totalResult] = await Promise.all([
          this.db.query.notificationDeliveries.findMany({
            where: whereClause,
            orderBy: desc(notificationDeliveries.createdAt),
            limit,
            offset,
          }),
          this.db
            .select({ count: count() })
            .from(notificationDeliveries)
            .where(whereClause),
        ]);

        const total = totalResult[0]?.count ?? 0;

        return {
          deliveries: results.map((r) => notificationDeliveryMapper.toDTO(r)),
          total,
        };
      },
    );
  }

  findByNotificationId(notificationId: string) {
    return this.tryPromise(
      "NotificationDeliveryDrizzleGateway.findByNotificationId",
      async () => {
        const result = await this.db.query.notificationDeliveries.findFirst({
          where: eq(notificationDeliveries.notificationId, notificationId),
        });
        return result ? notificationDeliveryMapper.toDTO(result) : null;
      },
      notificationId,
    );
  }

  findFailed(params: { tripId?: string; limit: number; offset: number }) {
    return this.tryPromise(
      "NotificationDeliveryDrizzleGateway.findFailed",
      async () => {
        const { tripId, limit, offset } = params;

        const conditions: ReturnType<typeof eq>[] = [
          eq(notificationDeliveries.status, "failure"),
        ];

        if (tripId) {
          conditions.push(eq(notificationDeliveries.tripId, tripId));
        }

        const whereClause =
          conditions.length > 1 ? and(...conditions) : conditions[0];

        const [results, totalResult] = await Promise.all([
          this.db.query.notificationDeliveries.findMany({
            where: whereClause,
            orderBy: desc(notificationDeliveries.createdAt),
            limit,
            offset,
          }),
          this.db
            .select({ count: count() })
            .from(notificationDeliveries)
            .where(whereClause),
        ]);

        const total = totalResult[0]?.count ?? 0;

        return {
          deliveries: results.map((r) => notificationDeliveryMapper.toDTO(r)),
          total,
        };
      },
    );
  }

  getStats(params: {
    tripId?: string;
    startDate?: Date;
    endDate?: Date;
    scheduleId?: string;
  }) {
    return this.tryPromise(
      "NotificationDeliveryDrizzleGateway.getStats",
      async () => {
        const { tripId, startDate, endDate, scheduleId } = params;

        // Build where conditions
        const conditions: (
          | ReturnType<typeof eq>
          | ReturnType<typeof and>
          | ReturnType<typeof gte>
          | ReturnType<typeof lte>
        )[] = [];

        if (tripId) {
          conditions.push(eq(notificationDeliveries.tripId, tripId));
        }

        if (scheduleId) {
          conditions.push(eq(notificationDeliveries.scheduleId, scheduleId));
        }

        if (startDate) {
          conditions.push(
            gte(notificationDeliveries.deliveryStartedAt, startDate),
          );
        }

        if (endDate) {
          conditions.push(
            lte(notificationDeliveries.deliveryStartedAt, endDate),
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : sql`true`;

        // Get all deliveries matching criteria
        const deliveries = await this.db.query.notificationDeliveries.findMany({
          where: whereClause,
        });

        // Calculate stats
        const totalDeliveries = deliveries.length;
        const totalRecipients = deliveries.reduce(
          (sum, d) => sum + (d.totalRecipients ?? 0),
          0,
        );
        const totalSuccess = deliveries.reduce(
          (sum, d) => sum + (d.successCount ?? 0),
          0,
        );
        const totalFailures = deliveries.reduce(
          (sum, d) => sum + (d.failureCount ?? 0),
          0,
        );

        // Status breakdown
        const statusBreakdown: Record<string, number> = {};
        for (const delivery of deliveries) {
          const status = delivery.status;
          statusBreakdown[status] = (statusBreakdown[status] ?? 0) + 1;
        }

        // Calculate averages
        const avgSuccessPerDelivery =
          totalDeliveries > 0 ? totalSuccess / totalDeliveries : 0;
        const avgFailuresPerDelivery =
          totalDeliveries > 0 ? totalFailures / totalDeliveries : 0;
        const successRate =
          totalRecipients > 0 ? (totalSuccess / totalRecipients) * 100 : 0;

        return {
          totalDeliveries,
          totalRecipients,
          totalSuccess,
          totalFailures,
          avgSuccessPerDelivery,
          avgFailuresPerDelivery,
          successRate,
          statusBreakdown,
        };
      },
    );
  }

  create(delivery: NotificationDelivery) {
    return this.tryPromise(
      "NotificationDeliveryDrizzleGateway.create",
      async () => {
        const insert = notificationDeliveryMapper.toInsert(delivery);
        const [result] = await this.db
          .insert(notificationDeliveries)
          .values(insert)
          .returning();
        if (!result) throw new Error("Failed to create notification delivery");
        return notificationDeliveryMapper.toDTO(result);
      },
      delivery.id,
    );
  }

  update(delivery: NotificationDelivery) {
    return this.tryPromise(
      "NotificationDeliveryDrizzleGateway.update",
      async () => {
        const update = notificationDeliveryMapper.toUpdate(delivery);
        const [result] = await this.db
          .update(notificationDeliveries)
          .set(update)
          .where(eq(notificationDeliveries.id, delivery.id))
          .returning();
        if (!result)
          throw new Error(`Notification delivery not found: ${delivery.id}`);
        return notificationDeliveryMapper.toDTO(result);
      },
      delivery.id,
    );
  }
}
