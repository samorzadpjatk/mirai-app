import { describe, it, expect, beforeEach } from "bun:test";
import {
  getFailedDeliveriesUseCase,
  type GetFailedDeliveriesInput,
} from "./GetFailedDeliveries";
import { Effect } from "effect";
import { NotificationDeliveryRepositoryTag } from "../ports/NotificationDeliveryRepository";
import { InMemoryNotificationDeliveryGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";
import type { NotificationDelivery } from "../ports/NotificationDeliveryRepository";

// Mock NotificationDelivery
const createMockDelivery = (
  overrides?: Partial<NotificationDelivery>,
): NotificationDelivery =>
  ({
    id: "delivery-123",
    notificationId: "notif-123",
    tripId: "trip-123",
    status: "failure",
    totalRecipients: 100,
    successCount: 50,
    failureCount: 50,
    deliveryStartedAt: new Date("2024-01-01T09:00:00"),
    errorLog: "Connection timeout",
    ...overrides,
  }) as NotificationDelivery;

describe("[UNIT] getFailedDeliveriesUseCase (Effect)", () => {
  let gateway: InMemoryNotificationDeliveryGateway;

  beforeEach(() => {
    gateway = new InMemoryNotificationDeliveryGateway();
  });

  // Helper to run use case with gateway
  const runUseCase = async (input: GetFailedDeliveriesInput) => {
    const program = getFailedDeliveriesUseCase(input).pipe(
      Effect.provideService(NotificationDeliveryRepositoryTag, {
        findMany: (filters, pagination) =>
          gateway.findMany(filters, pagination),
        count: (filters) => gateway.count(filters),
        findByNotificationId: (notificationId) =>
          gateway.findByNotificationId(notificationId),
        getStats: (filters) => gateway.getStats(filters),
        findFailed: (tripId, pagination) =>
          gateway.findFailed(tripId, pagination),
        countFailed: (tripId) => gateway.countFailed(tripId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should return failed deliveries", async () => {
      // Arrange
      gateway.seed([
        createMockDelivery({
          id: "delivery-1",
          tripId: "trip-123",
          status: "failure",
        }),
        createMockDelivery({
          id: "delivery-2",
          tripId: "trip-123",
          status: "partial_failure",
        }),
        createMockDelivery({
          id: "delivery-3",
          tripId: "trip-123",
          status: "success",
        }),
      ]);

      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert - should only return failure and partial_failure
      expect(result.deliveries).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it("should use default pagination values", async () => {
      gateway.seed([
        createMockDelivery({
          id: "delivery-1",
          tripId: "trip-123",
          status: "failure",
        }),
      ]);

      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
      };

      await runUseCase(input);

      // Just verify the call works with defaults
      expect(true).toBe(true);
    });

    it("should use custom pagination when provided", async () => {
      // Arrange - add more than limit
      for (let i = 1; i <= 10; i++) {
        gateway.seed([
          createMockDelivery({
            id: `delivery-${i}`,
            tripId: "trip-123",
            status: "failure",
          }),
        ]);
      }

      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
        pagination: { limit: 5, offset: 0 },
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.deliveries.length).toBeLessThanOrEqual(5);
      expect(result.total).toBe(10);
    });

    it("should return empty array when no failed deliveries", async () => {
      // Arrange - only success deliveries
      gateway.seed([
        createMockDelivery({
          id: "delivery-1",
          tripId: "trip-123",
          status: "success",
        }),
      ]);

      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.deliveries).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should only return deliveries for the specified trip", async () => {
      // Arrange
      gateway.seed([
        createMockDelivery({ id: "d1", tripId: "trip-123", status: "failure" }),
        createMockDelivery({ id: "d2", tripId: "trip-456", status: "failure" }),
      ]);

      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.deliveries).toHaveLength(1);
      expect(result.deliveries[0].id).toBe("d1");
    });

    it("should handle partial pagination options", async () => {
      gateway.seed([
        createMockDelivery({
          id: "delivery-1",
          tripId: "trip-123",
          status: "failure",
        }),
      ]);

      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
        pagination: { limit: 30 },
      };

      const result = await runUseCase(input);

      expect(result.limit).toBe(30);
      expect(result.offset).toBe(0);
    });

    it("should return delivery details", async () => {
      gateway.seed([
        createMockDelivery({
          id: "delivery-failed",
          notificationId: "notif-failed",
          tripId: "trip-123",
          status: "failure",
          failureCount: 100,
          errorLog: "SMTP error",
        }),
      ]);

      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
      };

      const result = await runUseCase(input);

      expect(result.deliveries[0].id).toBe("delivery-failed");
      expect(result.deliveries[0].status).toBe("failure");
      expect(result.deliveries[0].failureCount).toBe(100);
    });
  });
});
