import type {
  NotificationDeliveryRepository,
  NotificationDelivery,
  DeliveryFilters,
  PaginationOptions,
  DeliveryStats,
  DeliveryStatus,
} from "@mirai-app/domain/ports";
import { Effect } from "effect";

/**
 * In-Memory Notification Delivery Gateway for Testing
 *
 * Implements NotificationDeliveryRepository port with in-memory storage.
 * Provides methods for tracking notification delivery status, statistics,
 * and querying deliveries by various criteria.
 *
 * This gateway uses a custom Map-based storage pattern (not extending
 * InMemoryGateway) to handle the complex notification delivery data model.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryNotificationDeliveryGateway();
 *
 * // Seed with test data
 * gateway.seed([
 *   {
 *     id: "delivery-1",
 *     notificationId: "notif-1",
 *     tripId: "trip-1",
 *     status: "success",
 *     totalRecipients: 10,
 *     successCount: 10,
 *     failureCount: 0,
 *     deliveryStartedAt: new Date(),
 *     deliveryCompletedAt: new Date(),
 *   },
 * ]);
 *
 * // Find deliveries for a trip
 * const deliveries = await Effect.runPromise(gateway.findMany(
 *   { tripId: "trip-1" },
 *   { limit: 10, offset: 0 }
 * ));
 *
 * // Get delivery statistics
 * const stats = await Effect.runPromise(gateway.getStats({ tripId: "trip-1" }));
 *
 * // Find failed deliveries
 * const failed = await Effect.runPromise(gateway.findFailed("trip-1", { limit: 5, offset: 0 }));
 *
 * gateway.reset(); // Clean up for next test
 * ```
 */
export class InMemoryNotificationDeliveryGateway implements NotificationDeliveryRepository {
  private storage = new Map<string, NotificationDelivery>();

  reset(): void {
    this.storage.clear();
  }

  seed(deliveries: NotificationDelivery[]): void {
    deliveries.forEach((delivery) => this.storage.set(delivery.id, delivery));
  }

  findMany(
    filters: Partial<DeliveryFilters>,
    pagination: PaginationOptions,
  ): Effect.Effect<NotificationDelivery[], never, never> {
    let results = Array.from(this.storage.values());

    if (filters.tripId !== undefined) {
      results = results.filter((d) => d.tripId === filters.tripId);
    }

    if (filters.status !== undefined) {
      results = results.filter((d) => d.status === filters.status);
    }

    if (filters.scheduleId !== undefined) {
      results = results.filter((d) => d.scheduleId === filters.scheduleId);
    }

    if (filters.startDate !== undefined) {
      results = results.filter(
        (d) => d.deliveryStartedAt.getTime() >= filters.startDate!.getTime(),
      );
    }

    if (filters.endDate !== undefined) {
      results = results.filter(
        (d) => d.deliveryStartedAt.getTime() <= filters.endDate!.getTime(),
      );
    }

    results.sort(
      (a, b) => b.deliveryStartedAt.getTime() - a.deliveryStartedAt.getTime(),
    );

    const start = pagination.offset ?? 0;
    const limit = pagination.limit ?? 50;
    const end = start + limit;
    return Effect.succeed(results.slice(start, end));
  }

  count(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<number, never, never> {
    let results = Array.from(this.storage.values());

    if (filters?.tripId !== undefined) {
      results = results.filter((d) => d.tripId === filters.tripId);
    }

    if (filters?.status !== undefined) {
      results = results.filter((d) => d.status === filters.status);
    }

    if (filters?.scheduleId !== undefined) {
      results = results.filter((d) => d.scheduleId === filters.scheduleId);
    }

    if (filters?.startDate !== undefined) {
      results = results.filter(
        (d) => d.deliveryStartedAt.getTime() >= filters.startDate!.getTime(),
      );
    }

    if (filters?.endDate !== undefined) {
      results = results.filter(
        (d) => d.deliveryStartedAt.getTime() <= filters.endDate!.getTime(),
      );
    }

    return Effect.succeed(results.length);
  }

  findByNotificationId(
    notificationId: string,
  ): Effect.Effect<NotificationDelivery | null, never, never> {
    const results = Array.from(this.storage.values()).filter(
      (d) => d.notificationId === notificationId,
    );
    return Effect.succeed(results.length > 0 ? results[0]! : null);
  }

  getStats(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<DeliveryStats, never, never> {
    let results = Array.from(this.storage.values());

    if (filters?.tripId !== undefined) {
      results = results.filter((d) => d.tripId === filters.tripId);
    }

    if (filters?.status !== undefined) {
      results = results.filter((d) => d.status === filters.status);
    }

    if (filters?.scheduleId !== undefined) {
      results = results.filter((d) => d.scheduleId === filters.scheduleId);
    }

    if (filters?.startDate !== undefined) {
      results = results.filter(
        (d) => d.deliveryStartedAt.getTime() >= filters.startDate!.getTime(),
      );
    }

    if (filters?.endDate !== undefined) {
      results = results.filter(
        (d) => d.deliveryStartedAt.getTime() <= filters.endDate!.getTime(),
      );
    }

    const totalDeliveries = results.length;
    const totalRecipients = results.reduce(
      (sum, d) => sum + d.totalRecipients,
      0,
    );
    const totalSuccess = results.reduce((sum, d) => sum + d.successCount, 0);
    const totalFailures = results.reduce((sum, d) => sum + d.failureCount, 0);

    const avgSuccessPerDelivery =
      totalDeliveries > 0 ? totalSuccess / totalDeliveries : 0;
    const avgFailuresPerDelivery =
      totalDeliveries > 0 ? totalFailures / totalDeliveries : 0;

    const successRate =
      totalRecipients > 0 ? (totalSuccess / totalRecipients) * 100 : 0;

    const statusBreakdown: Record<string, number> = {};
    const validStatuses: DeliveryStatus[] = [
      "pending",
      "success",
      "partial_failure",
      "failure",
    ];

    validStatuses.forEach((status) => {
      statusBreakdown[status] = 0;
    });

    results.forEach((d) => {
      statusBreakdown[d.status] = (statusBreakdown[d.status] ?? 0) + 1;
    });

    return Effect.succeed({
      totalDeliveries,
      totalRecipients,
      totalSuccess,
      totalFailures,
      avgSuccessPerDelivery,
      avgFailuresPerDelivery,
      successRate,
      statusBreakdown,
    });
  }

  findFailed(
    tripId: string,
    pagination: PaginationOptions,
  ): Effect.Effect<NotificationDelivery[], never, never> {
    let results = Array.from(this.storage.values()).filter(
      (d) =>
        d.tripId === tripId &&
        (d.status === "failure" || d.status === "partial_failure"),
    );

    results.sort(
      (a, b) => b.deliveryStartedAt.getTime() - a.deliveryStartedAt.getTime(),
    );

    const start = pagination.offset ?? 0;
    const limit = pagination.limit ?? 50;
    const end = start + limit;
    return Effect.succeed(results.slice(start, end));
  }

  countFailed(tripId: string): Effect.Effect<number, never, never> {
    return Effect.succeed(
      Array.from(this.storage.values()).filter(
        (d) =>
          d.tripId === tripId &&
          (d.status === "failure" || d.status === "partial_failure"),
      ).length,
    );
  }
}
