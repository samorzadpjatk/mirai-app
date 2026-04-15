import { describe, it, expect, beforeEach } from "bun:test";
import {
  getDeliveryStatsUseCase,
  type GetDeliveryStatsInput,
} from "./GetDeliveryStats";
import { Effect } from "effect";
import { NotificationDeliveryRepositoryTag } from "../ports/NotificationDeliveryRepository";
import { InMemoryNotificationDeliveryGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";
import type { NotificationDelivery } from "../ports/NotificationDeliveryRepository";

describe("[UNIT] getDeliveryStatsUseCase (Effect)", () => {
  let repo: InMemoryNotificationDeliveryGateway;

  const createMockDelivery = (
    overrides?: Partial<NotificationDelivery>,
  ): NotificationDelivery =>
    ({
      id: overrides?.id ?? "delivery-123",
      notificationId: overrides?.notificationId ?? "notif-123",
      tripId: overrides?.tripId ?? "trip-123",
      status: overrides?.status ?? "success",
      totalRecipients: overrides?.totalRecipients ?? 100,
      successCount: overrides?.successCount ?? 95,
      failureCount: overrides?.failureCount ?? 5,
      deliveryStartedAt:
        overrides?.deliveryStartedAt ?? new Date("2024-01-01T09:00:00"),
      deliveryCompletedAt: overrides?.deliveryCompletedAt ?? null,
      errorLog: overrides?.errorLog ?? null,
      scheduleId: overrides?.scheduleId ?? null,
      notification: overrides?.notification ?? null,
    }) as NotificationDelivery;

  beforeEach(() => {
    repo = new InMemoryNotificationDeliveryGateway();
  });

  // Helper to run use case with repository
  const runUseCase = async (input: GetDeliveryStatsInput) => {
    const program = getDeliveryStatsUseCase(input).pipe(
      Effect.provideService(NotificationDeliveryRepositoryTag, {
        findMany: (filters, pagination) => repo.findMany(filters, pagination),
        count: (filters) => repo.count(filters),
        findByNotificationId: (notificationId) =>
          repo.findByNotificationId(notificationId),
        getStats: (filters) => repo.getStats(filters),
        findFailed: (tripId, pagination) => repo.findFailed(tripId, pagination),
        countFailed: (tripId) => repo.countFailed(tripId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return delivery stats", async () => {
      // Arrange
      repo.seed([
        createMockDelivery({
          id: "d1",
          status: "success",
          totalRecipients: 100,
          successCount: 100,
          failureCount: 0,
        }),
        createMockDelivery({
          id: "d2",
          status: "failure",
          totalRecipients: 100,
          successCount: 0,
          failureCount: 100,
        }),
      ]);

      const input: GetDeliveryStatsInput = {};

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.totalDeliveries).toBe(2);
      expect(result.totalRecipients).toBe(200);
      expect(result.totalSuccess).toBe(100);
      expect(result.totalFailures).toBe(100);
      expect(result.successRate).toBe(50);
    });

    it("should pass filters to repository", async () => {
      // Arrange
      repo.seed([
        createMockDelivery({ id: "d1", tripId: "trip-123", status: "success" }),
        createMockDelivery({ id: "d2", tripId: "trip-456", status: "failure" }),
      ]);

      const filters = { tripId: "trip-123", status: "success" };
      const input: GetDeliveryStatsInput = { filters };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.totalDeliveries).toBe(1);
    });

    it("should handle undefined filters", async () => {
      const input: GetDeliveryStatsInput = {};

      const result = await runUseCase(input);

      expect(result.totalDeliveries).toBe(0);
    });

    it("should handle zero deliveries", async () => {
      const input: GetDeliveryStatsInput = {};

      const result = await runUseCase(input);

      expect(result.totalDeliveries).toBe(0);
      expect(result.totalRecipients).toBe(0);
      expect(result.totalSuccess).toBe(0);
      expect(result.totalFailures).toBe(0);
      expect(result.successRate).toBe(0);
    });
  });
});
