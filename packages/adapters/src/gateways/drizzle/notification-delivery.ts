import type {
  NotificationDeliveryRepository,
  NotificationDelivery,
  DeliveryFilters,
  PaginationOptions,
  DeliveryStats,
} from "@mirai-app/use-cases";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  notificationDeliveries,
  notifications,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq, and, or, desc, gte, lte, sql } from "drizzle-orm";
import { Effect } from "effect";
import { BaseDrizzleRepository } from "../base/repository";
import { NotificationDeliveryDrizzleMapper } from "../../mappers/drizzle/notification-delivery";
import { DatabaseError } from "../../errors/adapter-errors";

/**
 * DrizzleNotificationDeliveryRepository
 *
 * Implements the NotificationDeliveryRepository port using Drizzle ORM.
 * Uses BaseDrizzleRepository for standard CRUD operations.
 */
export class DrizzleNotificationDeliveryRepository
  extends BaseDrizzleRepository<
    NotificationDelivery,
    typeof notificationDeliveries.$inferSelect,
    typeof notificationDeliveries.$inferInsert,
    typeof notificationDeliveries,
    Partial<typeof notificationDeliveries.$inferInsert>
  >
  implements NotificationDeliveryRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: notificationDeliveries,
      mapper: NotificationDeliveryDrizzleMapper.instance,
    });
  }

  /**
   * Find deliveries with pagination and filters
   */
  findMany(
    filters: Partial<DeliveryFilters>,
    pagination: PaginationOptions,
  ): Effect.Effect<NotificationDelivery[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const whereClause = this.buildWhereClause(filters);

        const results = await this.db
          .select({
            id: notificationDeliveries.id,
            notificationId: notificationDeliveries.notificationId,
            tripId: notificationDeliveries.tripId,
            status: notificationDeliveries.status,
            totalRecipients: notificationDeliveries.totalRecipients,
            successCount: notificationDeliveries.successCount,
            failureCount: notificationDeliveries.failureCount,
            deliveryStartedAt: notificationDeliveries.deliveryStartedAt,
            deliveryCompletedAt: notificationDeliveries.deliveryCompletedAt,
            errors: notificationDeliveries.errors,
            scheduleId: notificationDeliveries.scheduleId,
            createdAt: notificationDeliveries.createdAt,
            notificationTitle: notifications.title,
            notificationBody: notifications.body,
          })
          .from(notificationDeliveries)
          .leftJoin(
            notifications,
            eq(notificationDeliveries.notificationId, notifications.id),
          )
          .where(whereClause)
          .orderBy(desc(notificationDeliveries.deliveryStartedAt))
          .limit(pagination.limit ?? 50)
          .offset(pagination.offset ?? 0);

        return results.map((r) =>
          this.mapper.toDomain({
            id: r.id,
            notificationId: r.notificationId,
            tripId: r.tripId,
            status: r.status,
            totalRecipients: r.totalRecipients ?? 0,
            successCount: r.successCount ?? 0,
            failureCount: r.failureCount ?? 0,
            deliveryStartedAt: r.deliveryStartedAt ?? r.createdAt,
            deliveryCompletedAt: r.deliveryCompletedAt,
            errors: r.errors,
            scheduleId: r.scheduleId,
            createdAt: r.createdAt,
            updatedAt: r.createdAt,
            notificationTitle: r.notificationTitle,
            notificationBody: r.notificationBody,
          } as any),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findMany",
          message: "Failed to find notification deliveries",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Count deliveries by filters
   */
  count(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<number, never, never> {
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
    }).pipe(Effect.orDie);
  }

  /**
   * Find delivery by notification ID
   */
  findByNotificationId(
    notificationId: string,
  ): Effect.Effect<NotificationDelivery | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const [result] = await this.db
          .select({
            id: notificationDeliveries.id,
            notificationId: notificationDeliveries.notificationId,
            tripId: notificationDeliveries.tripId,
            status: notificationDeliveries.status,
            totalRecipients: notificationDeliveries.totalRecipients,
            successCount: notificationDeliveries.successCount,
            failureCount: notificationDeliveries.failureCount,
            deliveryStartedAt: notificationDeliveries.deliveryStartedAt,
            deliveryCompletedAt: notificationDeliveries.deliveryCompletedAt,
            errors: notificationDeliveries.errors,
            scheduleId: notificationDeliveries.scheduleId,
            createdAt: notificationDeliveries.createdAt,
            notificationTitle: notifications.title,
            notificationBody: notifications.body,
            notificationCreatedAt: notifications.createdAt,
          })
          .from(notificationDeliveries)
          .leftJoin(
            notifications,
            eq(notificationDeliveries.notificationId, notifications.id),
          )
          .where(eq(notificationDeliveries.notificationId, notificationId))
          .limit(1);

        if (!result) return null;

        return this.mapper.toDomain({
          ...result,
          updatedAt: result.createdAt,
        } as any);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByNotificationId",
          message: "Failed to find notification delivery by notification ID",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Get delivery statistics
   */
  getStats(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<DeliveryStats, never, never> {
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
    }).pipe(Effect.orDie);
  }

  /**
   * Find failed or partially failed deliveries
   */
  findFailed(
    tripId: string,
    pagination: PaginationOptions,
  ): Effect.Effect<NotificationDelivery[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const results = await this.db
          .select({
            id: notificationDeliveries.id,
            notificationId: notificationDeliveries.notificationId,
            tripId: notificationDeliveries.tripId,
            status: notificationDeliveries.status,
            totalRecipients: notificationDeliveries.totalRecipients,
            successCount: notificationDeliveries.successCount,
            failureCount: notificationDeliveries.failureCount,
            deliveryStartedAt: notificationDeliveries.deliveryStartedAt,
            deliveryCompletedAt: notificationDeliveries.deliveryCompletedAt,
            errors: notificationDeliveries.errors,
            scheduleId: notificationDeliveries.scheduleId,
            createdAt: notificationDeliveries.createdAt,
            notificationTitle: notifications.title,
            notificationBody: notifications.body,
          })
          .from(notificationDeliveries)
          .leftJoin(
            notifications,
            eq(notificationDeliveries.notificationId, notifications.id),
          )
          .where(
            and(
              eq(notificationDeliveries.tripId, tripId),
              or(
                eq(notificationDeliveries.status, "failure"),
                eq(notificationDeliveries.status, "partial_failure"),
              ),
            ),
          )
          .orderBy(desc(notificationDeliveries.deliveryStartedAt))
          .limit(pagination.limit ?? 50)
          .offset(pagination.offset ?? 0);

        return results.map((r) =>
          this.mapper.toDomain({
            ...r,
            updatedAt: r.createdAt,
          } as any),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findFailed",
          message: "Failed to find failed deliveries",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Count failed deliveries
   */
  countFailed(tripId: string): Effect.Effect<number, never, never> {
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
    }).pipe(Effect.orDie);
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
