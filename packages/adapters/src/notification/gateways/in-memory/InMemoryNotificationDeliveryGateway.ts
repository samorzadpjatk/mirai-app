import { Effect } from "effect";
import {
  type NotificationDelivery,
  type NotificationDeliveryStats,
} from "@mirai-app/use-cases/notification/ports/NotificationPort";
import { DatabaseError } from "@mirai-app/domain";

/**
 * In-Memory Notification Delivery Gateway
 *
 * Implements NotificationDeliveryPort using in-memory Map storage for testing.
 *
 * Note: This implements all methods from NotificationDeliveryPort interface
 * but does not formally implement it due to Context.Tag properties.
 */
export class InMemoryNotificationDeliveryGateway {
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
    return Effect.sync(() => {
      const { tripId, status, scheduleId, startDate, endDate, limit, offset } =
        params;

      let filteredDeliveries = Array.from(this.deliveries.values());

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
        (a, b) => b.deliveryStartedAt.getTime() - a.deliveryStartedAt.getTime(),
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

  findByNotificationId(notificationId: string) {
    return Effect.sync(() => {
      const delivery = Array.from(this.deliveries.values()).find(
        (d) => d.notificationId === notificationId,
      );
      return delivery ?? null;
    });
  }

  findFailed(params: { tripId?: string; limit: number; offset: number }) {
    return Effect.sync(() => {
      const { tripId, limit, offset } = params;

      let filteredDeliveries = Array.from(this.deliveries.values()).filter(
        (d) => d.status === "failure",
      );

      if (tripId) {
        filteredDeliveries = filteredDeliveries.filter(
          (d) => d.tripId === tripId,
        );
      }

      // Sort by deliveryStartedAt desc
      const sortedDeliveries = filteredDeliveries.sort(
        (a, b) => b.deliveryStartedAt.getTime() - a.deliveryStartedAt.getTime(),
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
    return Effect.sync(() => {
      const { tripId, startDate, endDate, scheduleId } = params;

      let filteredDeliveries = Array.from(this.deliveries.values());

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
    return Effect.sync(() => {
      this.deliveries.set(delivery.id, delivery);
      return delivery;
    });
  }

  update(delivery: NotificationDelivery) {
    return Effect.sync(() => {
      const existing = this.deliveries.get(delivery.id);
      if (!existing) {
        throw new Error(`Notification delivery not found: ${delivery.id}`);
      }

      const updatedDelivery: NotificationDelivery = {
        ...delivery,
      };

      this.deliveries.set(delivery.id, updatedDelivery);
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
