import type {
  NotificationDeliveryRepository,
  NotificationDelivery,
  DeliveryFilters,
  PaginationOptions,
  DeliveryStats,
  DeliveryStatus,
} from "@mirai-app/use-cases";

/**
 * In-Memory Notification Delivery Repository for Testing
 *
 * Implements NotificationDeliveryRepository port with in-memory storage.
 * Provides methods for tracking notification delivery status, statistics,
 * and querying deliveries by various criteria.
 *
 * This repository uses a custom Map-based storage pattern (not extending
 * InMemoryRepository) to handle the complex notification delivery data model.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryNotificationDeliveryRepository();
 *
 * // Seed with test data
 * repo.seed([
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
 * const deliveries = await repo.findMany(
 *   { tripId: "trip-1" },
 *   { limit: 10, offset: 0 }
 * );
 *
 * // Get delivery statistics
 * const stats = await repo.getStats({ tripId: "trip-1" });
 *
 * // Find failed deliveries
 * const failed = await repo.findFailed("trip-1", { limit: 5, offset: 0 });
 *
 * repo.reset(); // Clean up for next test
 * ```
 */
export class InMemoryNotificationDeliveryRepository implements NotificationDeliveryRepository {
  private storage = new Map<string, NotificationDelivery>();

  /**
   * Reset the repository - clears all stored data.
   * Call this in beforeEach for test isolation.
   */
  reset(): void {
    this.storage.clear();
  }

  /**
   * Seed the repository with initial delivery data.
   * Useful for setting up test scenarios.
   *
   * @param deliveries - Array of deliveries to seed
   */
  seed(deliveries: NotificationDelivery[]): void {
    deliveries.forEach((delivery) => this.storage.set(delivery.id, delivery));
  }

  /**
   * Find deliveries with pagination and filters.
   * Results are sorted by deliveryStartedAt in descending order.
   *
   * @param filters - Optional filters (tripId, status, scheduleId, date range)
   * @param pagination - Pagination options (limit, offset)
   * @returns Array of matching deliveries
   */
  async findMany(
    filters: Partial<DeliveryFilters>,
    pagination: PaginationOptions,
  ): Promise<NotificationDelivery[]> {
    let results = Array.from(this.storage.values());

    // Apply filters
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

    // Sort by deliveryStartedAt desc
    results.sort(
      (a, b) => b.deliveryStartedAt.getTime() - a.deliveryStartedAt.getTime(),
    );

    // Apply pagination
    const start = pagination.offset ?? 0;
    const limit = pagination.limit ?? 50;
    const end = start + limit;
    return results.slice(start, end);
  }

  /**
   * Count deliveries matching the given filters.
   *
   * @param filters - Optional filters (tripId, status, scheduleId, date range)
   * @returns The count of matching deliveries
   */
  async count(filters?: Partial<DeliveryFilters>): Promise<number> {
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

    return results.length;
  }

  /**
   * Find a delivery by its associated notification ID.
   *
   * @param notificationId - The notification ID to search for
   * @returns The delivery or null if not found
   */
  async findByNotificationId(
    notificationId: string,
  ): Promise<NotificationDelivery | null> {
    const results = Array.from(this.storage.values()).filter(
      (d) => d.notificationId === notificationId,
    );
    return results.length > 0 ? results[0]! : null;
  }

  /**
   * Get delivery statistics for the given filters.
   * Calculates aggregated metrics including success rates and status breakdown.
   *
   * @param filters - Optional filters (tripId, status, scheduleId, date range)
   * @returns Delivery statistics
   */
  async getStats(filters?: Partial<DeliveryFilters>): Promise<DeliveryStats> {
    let results = Array.from(this.storage.values());

    // Apply filters
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

    // Calculate stats
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

    // Calculate status breakdown
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
  }

  /**
   * Find failed or partially failed deliveries for a specific trip.
   * Results are sorted by deliveryStartedAt in descending order.
   *
   * @param tripId - The trip ID to search for
   * @param pagination - Pagination options (limit, offset)
   * @returns Array of failed/partially failed deliveries
   */
  async findFailed(
    tripId: string,
    pagination: PaginationOptions,
  ): Promise<NotificationDelivery[]> {
    let results = Array.from(this.storage.values()).filter(
      (d) =>
        d.tripId === tripId &&
        (d.status === "failure" || d.status === "partial_failure"),
    );

    // Sort by deliveryStartedAt desc
    results.sort(
      (a, b) => b.deliveryStartedAt.getTime() - a.deliveryStartedAt.getTime(),
    );

    // Apply pagination
    const start = pagination.offset ?? 0;
    const limit = pagination.limit ?? 50;
    const end = start + limit;
    return results.slice(start, end);
  }

  /**
   * Count failed or partially failed deliveries for a specific trip.
   *
   * @param tripId - The trip ID to count failures for
   * @returns The count of failed/partially failed deliveries
   */
  async countFailed(tripId: string): Promise<number> {
    return Array.from(this.storage.values()).filter(
      (d) =>
        d.tripId === tripId &&
        (d.status === "failure" || d.status === "partial_failure"),
    ).length;
  }
}
