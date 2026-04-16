import { describe, it, expect, beforeEach } from "bun:test";
import { getDeliveriesUseCase, type GetDeliveriesInput } from "./list";
import { Effect } from "effect";
import { NotificationDeliveryGatewayTag } from "../../ports/delivery/gateway";
import { InMemoryNotificationDeliveryGateway } from "@mirai-app/adapters";
import type { NotificationDelivery } from "../../ports/delivery/gateway";

describe("[UNIT] getDeliveriesUseCase (Effect)", () => {
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
  const runUseCase = async (input: GetDeliveriesInput) => {
    const program = getDeliveriesUseCase(input).pipe(
      Effect.provideService(NotificationDeliveryGatewayTag, {
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
    it("should return deliveries with pagination", async () => {
      // Arrange
      repo.seed([
        createMockDelivery({ id: "delivery-1", tripId: "trip-1" }),
        createMockDelivery({ id: "delivery-2", tripId: "trip-1" }),
      ]);

      const input: GetDeliveriesInput = {
        filters: { tripId: "trip-1" },
        pagination: { limit: 10, offset: 0 },
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.deliveries).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("should use default pagination", async () => {
      // Arrange
      repo.seed([createMockDelivery({ tripId: "trip-1" })]);

      const input: GetDeliveriesInput = { filters: { tripId: "trip-1" } };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it("should filter by status", async () => {
      // Arrange
      repo.seed([
        createMockDelivery({ id: "d1", tripId: "trip-1", status: "success" }),
        createMockDelivery({ id: "d2", tripId: "trip-1", status: "failure" }),
      ]);

      const input: GetDeliveriesInput = {
        filters: { tripId: "trip-1", status: "success" },
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.deliveries).toHaveLength(1);
      expect(result.deliveries[0].status).toBe("success");
    });

    it("should return empty list when no deliveries match", async () => {
      const input: GetDeliveriesInput = { filters: { tripId: "nonexistent" } };

      const result = await runUseCase(input);

      expect(result.deliveries).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
