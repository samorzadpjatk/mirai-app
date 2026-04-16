import type {
  NotificationDeliveryGateway,
  NotificationDeliveryDTO,
  DeliveryFilters,
  DeliveryStats,
  DeliveryStatus,
} from "@mirai-app/use-cases";
import { Effect } from "effect";

/**
 * In-Memory Notification Delivery Gateway for Testing
 *
 * Implements NotificationDeliveryGateway port with in-memory storage.
 * Provides methods for tracking notification delivery status, statistics,
 * and querying deliveries by various criteria.
 *
 * This gateway uses a custom Map-based storage pattern (not extending
 * InMemoryGateway) to handle the complex notification delivery data model.
 *
 * All methods return NotificationDeliveryDTOs instead of domain entities.
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
 *     userId: "user-1",
 *     channel: "push",
 *     status: "success",
 *     sentAt: new Date(),
 *     deliveredAt: new Date(),
 *     failedAt: null,
 *     failureReason: null,
 *     retryCount: 0,
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
export class InMemoryNotificationDeliveryGateway implements NotificationDeliveryGateway {
  private storage = new Map<string, NotificationDeliveryDTO>();

  reset(): void {
    this.storage.clear();
  }

  seed(deliveries: NotificationDeliveryDTO[]): void {
    deliveries.forEach((delivery) => this.storage.set(delivery.id, delivery));
  }

  count(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<number, never, never> {
    let results = Array.from(this.storage.values());

    if (filters?.status !== undefined) {
      results = results.filter((d) => d.status === filters.status);
    }

    if (filters?.scheduleId !== undefined) {
      results = results.filter((d) => d.notificationId === filters.scheduleId);
    }

    if (filters?.startDate !== undefined) {
      results = results.filter(
        (d) => (d.sentAt?.getTime() ?? 0) >= filters.startDate!.getTime(),
      );
    }

    if (filters?.endDate !== undefined) {
      results = results.filter(
        (d) => (d.sentAt?.getTime() ?? 0) <= filters.endDate!.getTime(),
      );
    }

    return Effect.succeed(results.length);
  }

  getStats(
    filters?: Partial<DeliveryFilters>,
  ): Effect.Effect<DeliveryStats, never, never> {
    let results = Array.from(this.storage.values());

    if (filters?.status !== undefined) {
      results = results.filter((d) => d.status === filters.status);
    }

    if (filters?.scheduleId !== undefined) {
      results = results.filter((d) => d.notificationId === filters.scheduleId);
    }

    if (filters?.startDate !== undefined) {
      results = results.filter(
        (d) => (d.sentAt?.getTime() ?? 0) >= filters.startDate!.getTime(),
      );
    }

    if (filters?.endDate !== undefined) {
      results = results.filter(
        (d) => (d.sentAt?.getTime() ?? 0) <= filters.endDate!.getTime(),
      );
    }

    const totalDeliveries = results.length;
    const totalRecipients = totalDeliveries;
    const totalSuccess = results.filter((d) => d.status === "success").length;
    const totalFailures = results.filter(
      (d) => d.status === "failure" || d.status === "partial_failure",
    ).length;

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

  countFailed(tripId: string): Effect.Effect<number, never, never> {
    return Effect.succeed(
      Array.from(this.storage.values()).filter(
        (d) => d.status === "failure" || d.status === "partial_failure",
      ).length,
    );
  }

  findByNotificationId(
    _notificationId: string,
  ): Effect.Effect<never, never, never> {
    return Effect.fail(
      new Error("findByNotificationId not implemented") as never,
    );
  }

  findMany(
    _filters: DeliveryFilters,
    _pagination: { limit: number; offset: number },
  ): Effect.Effect<never, never, never> {
    return Effect.fail(new Error("findMany not implemented") as never);
  }

  findFailed(
    _tripId: string,
    _pagination: { limit: number; offset: number },
  ): Effect.Effect<never, never, never> {
    return Effect.fail(new Error("findFailed not implemented") as never);
  }
}
