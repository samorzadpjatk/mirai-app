import { Effect } from "effect";
import { eq, and, desc, count, sql, gte, lte } from "drizzle-orm";
import type { DrizzleDb } from "../../../infrastructure/drizzle";
import {
  notificationDeliveries,
  type NotificationDeliverySelect,
} from "../../../infrastructure/drizzle";
import type {
  INotificationDeliveryPort,
  NotificationDelivery,
  NotificationDeliveryStats,
  NotificationId,
} from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { notificationDeliveryMapper } from "../../mappers/NotificationDeliveryMapper";
import { AuthContextTag } from "../../../infrastructure/effect";

/**
 * Notification Delivery Drizzle Gateway
 *
 * Implements INotificationDeliveryPort using Drizzle ORM for database operations.
 * Extends BaseDrizzleGateway for consistent error handling.
 *
 * This gateway uses the AuthContext pattern for authorization. Protected methods
 * access authentication context via `yield* AuthContextTag` and perform authorization
 * checks using `AuthZPortTag` for trip-scoped resources.
 */
export class NotificationDeliveryDrizzleGateway
  extends BaseDrizzleGateway
  implements INotificationDeliveryPort
{
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
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // If tripId is specified, verify trip read access
      if (authCtx.isAuthenticated && params.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: params.tripId,
          requiredPermission: "read",
        });
      }

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

      const [results, totalResult] = yield* self.tryPromise(
        "NotificationDeliveryDrizzleGateway.findAll",
        async () => {
          return await Promise.all([
            self.db.query.notificationDeliveries.findMany({
              where: whereClause,
              orderBy: desc(notificationDeliveries.createdAt),
              limit,
              offset,
            }),
            self.db
              .select({ count: count() })
              .from(notificationDeliveries)
              .where(whereClause),
          ]);
        },
      );

      const total = totalResult[0]?.count ?? 0;

      return {
        deliveries: results.map((r) => notificationDeliveryMapper.toDTO(r)),
        total,
      };
    });
  }

  findByNotificationId(notificationId: NotificationId) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization (used for logging/auditing)
      yield* AuthContextTag;

      const result = yield* self.tryPromise(
        "NotificationDeliveryDrizzleGateway.findByNotificationId",
        async () => {
          return await self.db.query.notificationDeliveries.findFirst({
            where: eq(notificationDeliveries.notificationId, notificationId),
          });
        },
        notificationId,
      );

      return result ? notificationDeliveryMapper.toDTO(result) : null;
    });
  }

  findFailed(params: { tripId?: string; limit: number; offset: number }) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // If tripId is specified, verify trip read access
      if (authCtx.isAuthenticated && params.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: params.tripId,
          requiredPermission: "read",
        });
      }

      const { tripId, limit, offset } = params;

      const conditions: ReturnType<typeof eq>[] = [
        eq(notificationDeliveries.status, "failure"),
      ];

      if (tripId) {
        conditions.push(eq(notificationDeliveries.tripId, tripId));
      }

      const whereClause =
        conditions.length > 1 ? and(...conditions) : conditions[0];

      const [results, totalResult] = yield* self.tryPromise(
        "NotificationDeliveryDrizzleGateway.findFailed",
        async () => {
          return await Promise.all([
            self.db.query.notificationDeliveries.findMany({
              where: whereClause,
              orderBy: desc(notificationDeliveries.createdAt),
              limit,
              offset,
            }),
            self.db
              .select({ count: count() })
              .from(notificationDeliveries)
              .where(whereClause),
          ]);
        },
      );

      const total = totalResult[0]?.count ?? 0;

      return {
        deliveries: results.map((r) => notificationDeliveryMapper.toDTO(r)),
        total,
      };
    });
  }

  getStats(params: {
    tripId?: string;
    startDate?: Date;
    endDate?: Date;
    scheduleId?: string;
  }) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext for authorization
      const authCtx = yield* AuthContextTag;

      // If tripId is specified, verify trip read access
      if (authCtx.isAuthenticated && params.tripId) {
        const authZPort = yield* AuthZPortTag;
        yield* authZPort.verifyAccess({
          userId: authCtx.userId,
          role: authCtx.role,
          tripRoles: authCtx.tripRoles,
          resourceType: "trip",
          resourceId: params.tripId,
          requiredPermission: "read",
        });
      }

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
      const deliveries = yield* self.tryPromise(
        "NotificationDeliveryDrizzleGateway.getStats",
        async () => {
          return await self.db.query.notificationDeliveries.findMany({
            where: whereClause,
          });
        },
      );

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
    });
  }

  create(delivery: NotificationDelivery) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext (used for logging/auditing - system operations)
      yield* AuthContextTag;

      const result = yield* self.tryPromise(
        "NotificationDeliveryDrizzleGateway.create",
        async () => {
          const insert = notificationDeliveryMapper.toInsert(delivery);
          const [created] = await self.db
            .insert(notificationDeliveries)
            .values(insert)
            .returning();
          if (!created) throw new Error("Failed to create notification delivery");
          return created;
        },
        delivery.id,
      );

      return notificationDeliveryMapper.toDTO(result);
    });
  }

  update(delivery: NotificationDelivery) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext (used for logging/auditing - system operations)
      yield* AuthContextTag;

      const result = yield* self.tryPromise(
        "NotificationDeliveryDrizzleGateway.update",
        async () => {
          const update = notificationDeliveryMapper.toUpdate(delivery);
          const [updated] = await self.db
            .update(notificationDeliveries)
            .set(update)
            .where(eq(notificationDeliveries.id, delivery.id))
            .returning();
          if (!updated)
            throw new Error(`Notification delivery not found: ${delivery.id}`);
          return updated;
        },
        delivery.id,
      );

      return notificationDeliveryMapper.toDTO(result);
    });
  }
}
