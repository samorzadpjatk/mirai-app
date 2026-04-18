import { Effect } from "effect";
import type {
  INotificationDeliveryPort,
  NotificationDelivery,
  NotificationDeliveryStats,
  NotificationId,
} from "@mirai-app/domain";
import { DatabaseError } from "@mirai-app/domain";
import { AuthZPortTag } from "@mirai-app/use-cases";
import { AuthContextTag } from "../../../infrastructure/effect";

/**
 * In-Memory Notification Delivery Gateway
 *
 * Implements INotificationDeliveryPort using in-memory Map storage for testing.
 *
 * Auth verification uses AuthContextTag and AuthZPortTag from Effect context.
 * Notification deliveries are trip-scoped - users need trip-level access for read operations.
 */
export class InMemoryNotificationDeliveryGateway
  implements INotificationDeliveryPort
{
  private deliveries: Map<string, NotificationDelivery> = new Map();

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

      const { tripId, status, scheduleId, startDate, endDate, limit, offset } =
        params;

      let filteredDeliveries = Array.from(self.deliveries.values());

      // Apply filters
      if (tripId) {
        filteredDeliveries = filteredDeliveries.filter(
          (d) => d.tripId === tripId,
        );
      }

      if (status) {
        filteredDeliveries = filteredDeliveries.filter(
          (d) => d.status === status,
        );
      }

      if (scheduleId) {
        filteredDeliveries = filteredDeliveries.filter(
          (d) => d.scheduleId === scheduleId,
        );
      }

      if (startDate) {
        filteredDeliveries = filteredDeliveries.filter(
          (d) => d.deliveryStartedAt >= startDate,
        );
      }

      if (endDate) {
        filteredDeliveries = filteredDeliveries.filter(
          (d) => d.deliveryStartedAt <= endDate,
        );
      }

      // Sort by deliveryStartedAt desc
      const sortedDeliveries = filteredDeliveries.sort(
        (a, b) =>
          b.deliveryStartedAt.getTime() - a.deliveryStartedAt.getTime(),
      );

      const total = sortedDeliveries.length;
      const paginatedDeliveries = sortedDeliveries.slice(
        offset,
        offset + limit,
      );

      return {
        deliveries: paginatedDeliveries,
        total,
      };
    });
  }

  findByNotificationId(notificationId: NotificationId) {
    const self = this;
    const notificationIdStr = notificationId.toString();

    return Effect.gen(function* () {
      // Get AuthContext for authorization (used for logging/auditing)
      yield* AuthContextTag;

      const delivery = Array.from(self.deliveries.values()).find(
        (d) => d.notificationId === notificationIdStr,
      );
      return delivery ?? null;
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

      let filteredDeliveries = Array.from(self.deliveries.values()).filter(
        (d) => d.status === "failure",
      );

      if (tripId) {
        filteredDeliveries = filteredDeliveries.filter(
          (d) => d.tripId === tripId,
        );
      }

      // Sort by deliveryStartedAt desc
      const sortedDeliveries = filteredDeliveries.sort(
        (a, b) =>
          b.deliveryStartedAt.getTime() - a.deliveryStartedAt.getTime(),
      );

      const total = sortedDeliveries.length;
      const paginatedDeliveries = sortedDeliveries.slice(
        offset,
        offset + limit,
      );

      return {
        deliveries: paginatedDeliveries,
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

      let filteredDeliveries = Array.from(self.deliveries.values());

      // Apply filters
      if (tripId) {
        filteredDeliveries = filteredDeliveries.filter(
          (d) => d.tripId === tripId,
        );
      }

      if (scheduleId) {
        filteredDeliveries = filteredDeliveries.filter(
          (d) => d.scheduleId === scheduleId,
        );
      }

      if (startDate) {
        filteredDeliveries = filteredDeliveries.filter(
          (d) => d.deliveryStartedAt >= startDate,
        );
      }

      if (endDate) {
        filteredDeliveries = filteredDeliveries.filter(
          (d) => d.deliveryStartedAt <= endDate,
        );
      }

      // Calculate stats
      const totalDeliveries = filteredDeliveries.length;
      const totalRecipients = filteredDeliveries.reduce(
        (sum, d) => sum + (d.totalRecipients ?? 0),
        0,
      );
      const totalSuccess = filteredDeliveries.reduce(
        (sum, d) => sum + (d.successCount ?? 0),
        0,
      );
      const totalFailures = filteredDeliveries.reduce(
        (sum, d) => sum + (d.failureCount ?? 0),
        0,
      );

      // Status breakdown
      const statusBreakdown: Record<string, number> = {};
      for (const delivery of filteredDeliveries) {
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

      self.deliveries.set(delivery.id, delivery);
      return delivery;
    });
  }

  update(delivery: NotificationDelivery) {
    const self = this;

    return Effect.gen(function* () {
      // Get AuthContext (used for logging/auditing - system operations)
      yield* AuthContextTag;

      const existing = self.deliveries.get(delivery.id);
      if (!existing) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "update",
            id: delivery.id,
            cause: new Error(`Notification delivery not found: ${delivery.id}`),
          }),
        );
      }

      const updatedDelivery: NotificationDelivery = {
        ...delivery,
      };

      self.deliveries.set(delivery.id, updatedDelivery);
      return updatedDelivery;
    });
  }

  // Test helper methods
  clear(): void {
    this.deliveries.clear();
  }

  seed(deliveries: NotificationDelivery[]): void {
    for (const delivery of deliveries) {
      this.deliveries.set(delivery.id, delivery);
    }
  }
}
