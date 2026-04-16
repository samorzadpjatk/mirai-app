import type {
  NotificationDeliveryGateway,
  NotificationDeliveryDTO,
  DeliveryFilters,
  DeliveryStats,
} from "@mirai-app/use-cases";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  notificationDeliveries,
  notifications,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, or, desc, gte, lte, sql } from "drizzle-orm";
import { Effect } from "effect";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { NotificationDeliveryDrizzleMapper } from "../../../notification/mappers/drizzle/delivery-mapper";
import { DatabaseError } from "@mirai-app/domain";

/**
 * DrizzleNotificationDeliveryGateway
 *
 * Implements the NotificationDeliveryGateway port using Drizzle ORM.
 * Uses BaseDrizzleGateway for standard CRUD operations.
 * Returns NotificationDeliveryDTOs instead of domain entities.
 */
export class DrizzleNotificationDeliveryGateway
  extends BaseDrizzleGateway<
    NotificationDeliveryDTO,
    typeof notificationDeliveries.$inferSelect,
    typeof notificationDeliveries.$inferInsert,
    typeof notificationDeliveries,
    Partial<typeof notificationDeliveries.$inferInsert>
  >
  implements NotificationDeliveryGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: notificationDeliveries,
      mapper: NotificationDeliveryDrizzleMapper.instance,
    });
  }

  /**
   * Count deliveries by filters
   */
  count(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const whereClause = this.buildWhereClause(filters);

        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(notificationDeliveries)
          .where(whereClause)
          .limit(1);

        return result?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "count",
          message: "Failed to count notification deliveries",
          cause: error,
        }),
    });
  }

  /**
   * Get delivery statistics
   */
  getStats(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<DeliveryStats, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const whereClause = this.buildWhereClause(filters);

        const [stats] = await this.db
          .select({
            totalCount: sql<number>`count(*)::int`,
            totalRecipients: sql<
              number | null
            >`sum(${notificationDeliveries.totalRecipients})::int`,
            totalSuccess: sql<
              number | null
            >`sum(${notificationDeliveries.successCount})::int`,
            totalFailures: sql<
              number | null
            >`sum(${notificationDeliveries.failureCount})::int`,
            avgSuccess: sql<
              number | null
            >`avg(${notificationDeliveries.successCount})::float`,
            avgFailures: sql<
              number | null
            >`avg(${notificationDeliveries.failureCount})::float`,
          })
          .from(notificationDeliveries)
          .where(whereClause)
          .limit(1);

        const totalRecipients = stats?.totalRecipients ?? 0;
        const successCount = stats?.totalSuccess ?? 0;
        const successRate =
          totalRecipients > 0 ? (successCount / totalRecipients) * 100 : 0;

        const statusBreakdown = await this.db
          .select({
            status: notificationDeliveries.status,
            count: sql<number>`count(*)::int`,
          })
          .from(notificationDeliveries)
          .where(whereClause)
          .groupBy(notificationDeliveries.status);

        return {
          totalDeliveries: stats?.totalCount ?? 0,
          totalRecipients,
          totalSuccess: successCount,
          totalFailures: stats?.totalFailures ?? 0,
          avgSuccessPerDelivery: stats?.avgSuccess ?? 0,
          avgFailuresPerDelivery: stats?.avgFailures ?? 0,
          successRate,
          statusBreakdown: statusBreakdown.reduce(
            (acc, item) => {
              acc[item.status] = item.count;
              return acc;
            },
            {} as Record<string, number>,
          ),
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getStats",
          message: "Failed to get delivery statistics",
          cause: error,
        }),
    });
  }

  /**
   * Count failed deliveries
   */
  countFailed(tripId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(notificationDeliveries)
          .where(
            and(
              eq(notificationDeliveries.tripId, tripId),
              or(
                eq(notificationDeliveries.status, "failure"),
                eq(notificationDeliveries.status, "partial_failure"),
              ),
            ),
          )
          .limit(1);

        return result?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countFailed",
          message: "Failed to count failed deliveries",
          cause: error,
        }),
    });
  }

  /**
   * Build where clause from filters
   */
  private buildWhereClause(
    filters?: Partial<DeliveryFilters>,
  ): ReturnType<typeof and> | undefined {
    const conditions = [];

    if (filters?.tripId) {
      conditions.push(eq(notificationDeliveries.tripId, filters.tripId));
    }

    if (filters?.status) {
      conditions.push(eq(notificationDeliveries.status, filters.status));
    }

    if (filters?.scheduleId) {
      conditions.push(
        eq(notificationDeliveries.scheduleId, filters.scheduleId),
      );
    }

    if (filters?.startDate) {
      conditions.push(
        gte(notificationDeliveries.deliveryStartedAt, filters.startDate),
      );
    }

    if (filters?.endDate) {
      conditions.push(
        lte(notificationDeliveries.deliveryStartedAt, filters.endDate),
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
