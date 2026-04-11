import { describe, it, expect, mock, beforeEach } from "bun:test";
import { NotificationDeliveryController } from "../notification-delivery";
import type {
  GetDeliveriesUseCase,
  GetDeliveryByNotificationIdUseCase,
  GetDeliveryStatsUseCase,
  GetFailedDeliveriesUseCase,
} from "@mirai-app/use-cases";

describe("[UNIT] NotificationDeliveryController", () => {
  let controller: NotificationDeliveryController;
  let mockGetDeliveriesUseCase: GetDeliveriesUseCase;
  let mockGetDeliveryByIdUseCase: GetDeliveryByNotificationIdUseCase;
  let mockGetStatsUseCase: GetDeliveryStatsUseCase;
  let mockGetFailedUseCase: GetFailedDeliveriesUseCase;

  beforeEach(() => {
    mockGetDeliveriesUseCase = {
      execute: mock(() =>
        Promise.resolve({
          kind: "ok",
          value: {
            deliveries: [
              {
                id: "delivery-123",
                notificationId: "notif-123",
                tripId: "trip-123",
                status: "success",
                totalRecipients: 100,
                successCount: 95,
                failureCount: 5,
                deliveryStartedAt: new Date(),
                deliveryCompletedAt: new Date(),
                errorLog: null,
                scheduleId: null,
                notification: {
                  id: "notif-123",
                  title: "Test",
                  body: "Body",
                  createdAt: new Date(),
                },
              },
            ],
            total: 1,
            limit: 50,
            offset: 0,
          },
        }),
      ),
    } as unknown as GetDeliveriesUseCase;

    mockGetDeliveryByIdUseCase = {
      execute: mock(() =>
        Promise.resolve({
          kind: "ok",
          value: {
            delivery: {
              id: "delivery-123",
              notificationId: "notif-123",
              tripId: "trip-123",
              status: "success",
              totalRecipients: 100,
              successCount: 95,
              failureCount: 5,
              deliveryStartedAt: new Date(),
              deliveryCompletedAt: new Date(),
              errorLog: null,
              notification: null,
            },
          },
        }),
      ),
    } as unknown as GetDeliveryByNotificationIdUseCase;

    mockGetStatsUseCase = {
      execute: mock(() =>
        Promise.resolve({
          kind: "ok",
          value: {
            total: 100,
            successful: 95,
            failed: 5,
            pending: 0,
            successRate: 0.95,
          },
        }),
      ),
    } as unknown as GetDeliveryStatsUseCase;

    mockGetFailedUseCase = {
      execute: mock(() =>
        Promise.resolve({
          kind: "ok",
          value: {
            deliveries: [],
            total: 0,
            limit: 20,
            offset: 0,
          },
        }),
      ),
    } as unknown as GetFailedDeliveriesUseCase;

    controller = new NotificationDeliveryController(
      mockGetDeliveriesUseCase,
      mockGetDeliveryByIdUseCase,
      mockGetStatsUseCase,
      mockGetFailedUseCase,
    );
  });

  describe("getDeliveries", () => {
    it("should return deliveries", async () => {
      const result = await controller.getDeliveries({ tripId: "trip-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deliveries).toHaveLength(1);
        expect(result.data.total).toBe(1);
      }
    });

    it("should use default pagination", async () => {
      await controller.getDeliveries({});

      const executeCall = mockGetDeliveriesUseCase.execute.mock.calls[0];
      expect(executeCall[0].pagination).toEqual({ limit: 50, offset: 0 });
    });

    it("should return error on failure", async () => {
      mockGetDeliveriesUseCase.execute = mock(() =>
        Promise.resolve({ kind: "err", error: "Database error" }),
      );

      const result = await controller.getDeliveries({});

      expect(result.success).toBe(false);
    });
  });

  describe("getDeliveryByNotificationId", () => {
    it("should return delivery by notification ID", async () => {
      const result = await controller.getDeliveryByNotificationId({
        notificationId: "notif-123",
        tripId: "trip-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.delivery.id).toBe("delivery-123");
      }
    });

    it("should return error for invalid input", async () => {
      const result = await controller.getDeliveryByNotificationId({
        notificationId: "invalid",
        tripId: "trip-123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getDeliveryStats", () => {
    it("should return delivery stats", async () => {
      const result = await controller.getDeliveryStats({ tripId: "trip-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(100);
        expect(result.data.successRate).toBe(0.95);
      }
    });
  });

  describe("getFailedDeliveries", () => {
    it("should return failed deliveries", async () => {
      const result = await controller.getFailedDeliveries({
        tripId: "trip-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deliveries).toEqual([]);
      }
    });

    it("should use default limit", async () => {
      await controller.getFailedDeliveries({});

      const executeCall = mockGetFailedUseCase.execute.mock.calls[0];
      expect(executeCall[0].pagination?.limit).toBe(20);
    });
  });
});
