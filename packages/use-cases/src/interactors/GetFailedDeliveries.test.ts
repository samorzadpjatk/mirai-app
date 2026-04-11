import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetFailedDeliveriesUseCase,
  type GetFailedDeliveriesInput,
} from "./GetFailedDeliveries";
import type {
  NotificationDeliveryRepository,
  NotificationDelivery,
} from "../ports/NotificationDeliveryRepository";

// Mock NotificationDelivery
const createMockDelivery = (
  overrides?: Partial<NotificationDelivery>,
): NotificationDelivery =>
  ({
    id: "delivery-123",
    notificationId: "notif-123",
    tripId: "trip-123",
    status: "failed",
    totalRecipients: 100,
    successCount: 50,
    failureCount: 50,
    deliveryStartedAt: new Date("2024-01-01T09:00:00"),
    errorLog: "Connection timeout",
    ...overrides,
  }) as NotificationDelivery;

describe("[UNIT] GetFailedDeliveriesUseCase", () => {
  let useCase: GetFailedDeliveriesUseCase;
  let mockDeliveryRepo: NotificationDeliveryRepository;

  beforeEach(() => {
    mockDeliveryRepo = {
      findFailed: mock(() =>
        Promise.resolve([
          createMockDelivery({ id: "delivery-1" }),
          createMockDelivery({ id: "delivery-2" }),
        ]),
      ),
      countFailed: mock(() => Promise.resolve(10)),
    } as unknown as NotificationDeliveryRepository;

    useCase = new GetFailedDeliveriesUseCase(mockDeliveryRepo);
  });

  describe("execute", () => {
    it("should return failed deliveries", async () => {
      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.deliveries).toHaveLength(2);
        expect(result.value.total).toBe(10);
        expect(result.value.limit).toBe(20);
        expect(result.value.offset).toBe(0);
      }
    });

    it("should use default pagination values", async () => {
      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
      };

      await useCase.execute(input);

      expect(mockDeliveryRepo.findFailed).toHaveBeenCalledWith("trip-123", {
        limit: 20,
        offset: 0,
      });
    });

    it("should use custom pagination when provided", async () => {
      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
        pagination: { limit: 50, offset: 100 },
      };

      await useCase.execute(input);

      expect(mockDeliveryRepo.findFailed).toHaveBeenCalledWith("trip-123", {
        limit: 50,
        offset: 100,
      });
    });

    it("should call countFailed with tripId", async () => {
      const input: GetFailedDeliveriesInput = {
        tripId: "trip-456",
      };

      await useCase.execute(input);

      expect(mockDeliveryRepo.countFailed).toHaveBeenCalledWith("trip-456");
    });

    it("should handle empty failed deliveries", async () => {
      mockDeliveryRepo.findFailed = mock(() => Promise.resolve([]));
      mockDeliveryRepo.countFailed = mock(() => Promise.resolve(0));

      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.deliveries).toEqual([]);
        expect(result.value.total).toBe(0);
      }
    });

    it("should handle repository error", async () => {
      mockDeliveryRepo.findFailed = mock(() =>
        Promise.reject(new Error("Database error")),
      );

      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Failed to get failed deliveries");
      }
    });

    it("should handle partial pagination options", async () => {
      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
        pagination: { limit: 30 },
      };

      await useCase.execute(input);

      expect(mockDeliveryRepo.findFailed).toHaveBeenCalledWith("trip-123", {
        limit: 30,
        offset: 0,
      });
    });

    it("should return delivery details", async () => {
      mockDeliveryRepo.findFailed = mock(() =>
        Promise.resolve([
          createMockDelivery({
            id: "delivery-failed",
            notificationId: "notif-failed",
            failureCount: 100,
            errorLog: "SMTP error",
          }),
        ]),
      );

      const input: GetFailedDeliveriesInput = {
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        const delivery = result.value.deliveries[0];
        expect(delivery.id).toBe("delivery-failed");
        expect(delivery.status).toBe("failed");
        expect(delivery.failureCount).toBe(100);
      }
    });
  });
});
