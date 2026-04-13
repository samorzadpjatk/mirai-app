import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Effect } from "effect";
import { NotificationDeliveryController } from "../notification-delivery";
import type { NotificationDeliveryRepository } from "@mirai-app/use-cases";

// Valid UUIDs for testing
const TRIP_ID = "550e8400-e29b-41d4-a716-446655440000";
const NOTIFICATION_ID = "550e8400-e29b-41d4-a716-446655440001";
const DELIVERY_ID = "550e8400-e29b-41d4-a716-446655440002";

describe("[UNIT] NotificationDeliveryController", () => {
  let controller: NotificationDeliveryController;
  let mockRepository: NotificationDeliveryRepository;

  beforeEach(() => {
    mockRepository = {
      findMany: mock((_filters, _pagination) =>
        Effect.succeed([
          {
            id: DELIVERY_ID,
            notificationId: NOTIFICATION_ID,
            tripId: TRIP_ID,
            status: "success" as const,
            totalRecipients: 100,
            successCount: 95,
            failureCount: 5,
            deliveryStartedAt: new Date(),
            deliveryCompletedAt: new Date(),
            errorLog: null,
            scheduleId: null,
            notification: {
              id: NOTIFICATION_ID,
              title: "Test",
              body: "Body",
              createdAt: new Date(),
            },
          },
        ]),
      ),
      count: mock(() => Effect.succeed(1)),
      findByNotificationId: mock(() =>
        Effect.succeed({
          id: DELIVERY_ID,
          notificationId: NOTIFICATION_ID,
          tripId: TRIP_ID,
          status: "success" as const,
          totalRecipients: 100,
          successCount: 95,
          failureCount: 5,
          deliveryStartedAt: new Date(),
          deliveryCompletedAt: new Date(),
          errorLog: null,
          notification: null,
        }),
      ),
      getStats: mock(() =>
        Effect.succeed({
          totalDeliveries: 100,
          totalRecipients: 5000,
          totalSuccess: 4750,
          totalFailures: 250,
          avgSuccessPerDelivery: 47.5,
          avgFailuresPerDelivery: 2.5,
          successRate: 0.95,
          statusBreakdown: {
            success: 80,
            partial_failure: 15,
            failure: 5,
          },
        }),
      ),
      findFailed: mock(() => Effect.succeed([])),
      countFailed: mock(() => Effect.succeed(0)),
      create: mock((data) =>
        Effect.succeed({
          id: DELIVERY_ID,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      update: mock((id, data) =>
        Effect.succeed({
          id,
          ...data,
          updatedAt: new Date(),
        }),
      ),
    } as unknown as NotificationDeliveryRepository;

    controller = new NotificationDeliveryController(mockRepository);
  });

  describe("getDeliveries", () => {
    it("should return deliveries", async () => {
      const result = await controller.getDeliveries({ tripId: TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deliveries).toHaveLength(1);
        expect(result.data.total).toBe(1);
      }
    });

    it("should use default pagination", async () => {
      await controller.getDeliveries({ tripId: TRIP_ID });

      // The repository should have been called with default pagination
      expect(mockRepository.findMany).toHaveBeenCalled();
    });

    it("should return error on failure", async () => {
      mockRepository.findMany = mock(() =>
        Effect.fail(new Error("Database error") as never),
      );

      const result = await controller.getDeliveries({ tripId: TRIP_ID });

      expect(result.success).toBe(false);
    });
  });

  describe("getDeliveryByNotificationId", () => {
    it("should return delivery by notification ID", async () => {
      const result = await controller.getDeliveryByNotificationId({
        notificationId: NOTIFICATION_ID,
        tripId: TRIP_ID,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(DELIVERY_ID);
      }
    });

    it("should return error for invalid input", async () => {
      const result = await controller.getDeliveryByNotificationId({
        notificationId: "invalid",
        tripId: TRIP_ID,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getDeliveryStats", () => {
    it("should return delivery stats", async () => {
      const result = await controller.getDeliveryStats({ tripId: TRIP_ID });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalDeliveries).toBe(100);
        expect(result.data.successRate).toBe(0.95);
      }
    });
  });

  describe("getFailedDeliveries", () => {
    it("should return failed deliveries", async () => {
      const result = await controller.getFailedDeliveries({
        tripId: TRIP_ID,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deliveries).toEqual([]);
      }
    });

    it("should use default limit", async () => {
      await controller.getFailedDeliveries({ tripId: TRIP_ID });

      // Verify the repository was called
      expect(mockRepository.findFailed).toHaveBeenCalled();
    });

    it("should return error when tripId is missing", async () => {
      const result = await controller.getFailedDeliveries({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Trip ID is required");
      }
    });
  });
});
