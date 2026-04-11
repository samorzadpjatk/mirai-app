import { describe, it, expect, mock, beforeEach } from "bun:test";
import {
  GetDeliveryByNotificationIdUseCase,
  type GetDeliveryByNotificationIdInput,
} from "./GetDeliveryByNotificationId";
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
    status: "completed",
    totalRecipients: 100,
    successCount: 95,
    failureCount: 5,
    deliveryStartedAt: new Date("2024-01-01T09:00:00"),
    deliveryCompletedAt: new Date("2024-01-01T09:05:00"),
    errorLog: null,
    notification: {
      id: "notif-123",
      title: "Test Notification",
      body: "Test Body",
      url: "https://example.com",
      createdAt: new Date("2024-01-01T09:00:00"),
      tripId: "trip-123",
      createdBy: {
        id: "user-123",
        firstName: "John",
        lastName: "Doe",
        authUserId: "auth-123",
      },
    },
    ...overrides,
  }) as NotificationDelivery;

describe("[UNIT] GetDeliveryByNotificationIdUseCase", () => {
  let useCase: GetDeliveryByNotificationIdUseCase;
  let mockDeliveryRepo: NotificationDeliveryRepository;

  beforeEach(() => {
    mockDeliveryRepo = {
      findByNotificationId: mock(() => Promise.resolve(createMockDelivery())),
    } as unknown as NotificationDeliveryRepository;

    useCase = new GetDeliveryByNotificationIdUseCase(mockDeliveryRepo);
  });

  describe("execute", () => {
    it("should return delivery by notification ID", async () => {
      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-123",
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.delivery.id).toBe("delivery-123");
        expect(result.value.delivery.notificationId).toBe("notif-123");
        expect(result.value.delivery.status).toBe("completed");
      }
    });

    it("should return error when delivery not found", async () => {
      mockDeliveryRepo.findByNotificationId = mock(() => Promise.resolve(null));

      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "nonexistent",
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Notification delivery not found");
      }
    });

    it("should return error when delivery belongs to different trip", async () => {
      mockDeliveryRepo.findByNotificationId = mock(() =>
        Promise.resolve(createMockDelivery({ tripId: "different-trip" })),
      );

      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-123",
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Notification delivery not found");
      }
    });

    it("should include notification details in output", async () => {
      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-123",
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.delivery.notification).not.toBeNull();
        expect(result.value.delivery.notification?.title).toBe(
          "Test Notification",
        );
        expect(result.value.delivery.notification?.body).toBe("Test Body");
        expect(result.value.delivery.notification?.createdBy?.firstName).toBe(
          "John",
        );
      }
    });

    it("should handle delivery without optional fields", async () => {
      mockDeliveryRepo.findByNotificationId = mock(() =>
        Promise.resolve(
          createMockDelivery({
            deliveryCompletedAt: undefined,
            errorLog: undefined,
            notification: null,
          }),
        ),
      );

      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-123",
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.delivery.notification).toBeNull();
      }
    });

    it("should call repository with notificationId", async () => {
      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-456",
        tripId: "trip-123",
      };

      await useCase.execute(input);

      expect(mockDeliveryRepo.findByNotificationId).toHaveBeenCalledWith(
        "notif-456",
      );
    });

    it("should handle repository error", async () => {
      mockDeliveryRepo.findByNotificationId = mock(() =>
        Promise.reject(new Error("Database error")),
      );

      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-123",
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("Failed to get delivery");
        expect(result.error).toContain("Database error");
      }
    });

    it("should return delivery stats correctly", async () => {
      const input: GetDeliveryByNotificationIdInput = {
        notificationId: "notif-123",
        tripId: "trip-123",
      };

      const result = await useCase.execute(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.delivery.totalRecipients).toBe(100);
        expect(result.value.delivery.successCount).toBe(95);
        expect(result.value.delivery.failureCount).toBe(5);
      }
    });
  });
});
