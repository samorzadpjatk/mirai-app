import { describe, it, expect } from "bun:test";
import {
  NotificationDelivery,
  NotificationDeliveryStatus,
} from "./NotificationDelivery";

describe("[UNIT] NotificationDelivery Entity", () => {
  describe("NotificationDelivery.create", () => {
    it("should create with valid data", () => {
      const result = NotificationDelivery.create({
        notificationId: "notification-123",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.notificationId).toBe("notification-123");
        expect(result.value.totalRecipients).toBe(0);
        expect(result.value.successCount).toBe(0);
        expect(result.value.failureCount).toBe(0);
        expect(result.value.status).toBe(NotificationDeliveryStatus.PENDING);
        expect(result.value.isPending()).toBe(true);
      }
    });

    it("should create with trip and schedule", () => {
      const result = NotificationDelivery.create({
        tripId: "trip-456",
        notificationId: "notification-123",
        scheduleId: "schedule-789",
        totalRecipients: 100,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.tripId).toBe("trip-456");
        expect(result.value.scheduleId).toBe("schedule-789");
        expect(result.value.totalRecipients).toBe(100);
        expect(result.value.isScheduled()).toBe(true);
      }
    });

    it("should create with stats", () => {
      const result = NotificationDelivery.create({
        notificationId: "notification-123",
        totalRecipients: 100,
        successCount: 95,
        failureCount: 5,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.successCount).toBe(95);
        expect(result.value.failureCount).toBe(5);
        expect(result.value.getSuccessRate()).toBe(95);
      }
    });

    it("should reject negative counts", () => {
      const result = NotificationDelivery.create({
        notificationId: "notification-123",
        totalRecipients: -10,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject success + failure exceeding total", () => {
      const result = NotificationDelivery.create({
        notificationId: "notification-123",
        totalRecipients: 100,
        successCount: 60,
        failureCount: 50, // 60 + 50 = 110 > 100
      });

      expect(result.kind).toBe("err");
    });

    it("should reject completedAt before startedAt", () => {
      const startedAt = new Date("2024-06-01T12:00:00Z");
      const completedAt = new Date("2024-06-01T10:00:00Z");

      const result = NotificationDelivery.create({
        notificationId: "notification-123",
        deliveryStartedAt: startedAt,
        deliveryCompletedAt: completedAt,
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("NotificationDelivery.start", () => {
    it("should start delivery", () => {
      const deliveryResult = NotificationDelivery.create({
        notificationId: "notification-123",
      });

      expect(deliveryResult.kind).toBe("ok");
      if (deliveryResult.kind !== "ok") return;

      const updated = deliveryResult.value.start();

      expect(updated.status).toBe(NotificationDeliveryStatus.IN_PROGRESS);
      expect(updated.isInProgress()).toBe(true);
      expect(updated.isPending()).toBe(false);
    });
  });

  describe("NotificationDelivery.complete", () => {
    it("should complete delivery", () => {
      const deliveryResult = NotificationDelivery.create({
        notificationId: "notification-123",
        status: NotificationDeliveryStatus.IN_PROGRESS,
      });

      expect(deliveryResult.kind).toBe("ok");
      if (deliveryResult.kind !== "ok") return;

      const updated = deliveryResult.value.complete();

      expect(updated.status).toBe(NotificationDeliveryStatus.COMPLETED);
      expect(updated.isCompleted()).toBe(true);
      expect(updated.isTerminal()).toBe(true);
      expect(updated.deliveryCompletedAt).toBeInstanceOf(Date);
    });
  });

  describe("NotificationDelivery.markAsFailed", () => {
    it("should mark as failed", () => {
      const deliveryResult = NotificationDelivery.create({
        notificationId: "notification-123",
      });

      expect(deliveryResult.kind).toBe("ok");
      if (deliveryResult.kind !== "ok") return;

      const updated = deliveryResult.value.markAsFailed("Server error");

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.status).toBe(NotificationDeliveryStatus.FAILED);
        expect(updated.value.errors).toBe("Server error");
        expect(updated.value.isFailed()).toBe(true);
      }
    });

    it("should reject empty error message", () => {
      const deliveryResult = NotificationDelivery.create({
        notificationId: "notification-123",
      });

      expect(deliveryResult.kind).toBe("ok");
      if (deliveryResult.kind !== "ok") return;

      const updated = deliveryResult.value.markAsFailed("");
      expect(updated.kind).toBe("err");
    });
  });

  describe("NotificationDelivery.updateStats", () => {
    it("should update stats", () => {
      const deliveryResult = NotificationDelivery.create({
        notificationId: "notification-123",
      });

      expect(deliveryResult.kind).toBe("ok");
      if (deliveryResult.kind !== "ok") return;

      const updated = deliveryResult.value.updateStats({
        totalRecipients: 100,
        successCount: 90,
        failureCount: 10,
      });

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.totalRecipients).toBe(100);
        expect(updated.value.successCount).toBe(90);
        expect(updated.value.failureCount).toBe(10);
      }
    });

    it("should reject invalid stats", () => {
      const deliveryResult = NotificationDelivery.create({
        notificationId: "notification-123",
      });

      expect(deliveryResult.kind).toBe("ok");
      if (deliveryResult.kind !== "ok") return;

      const updated = deliveryResult.value.updateStats({
        totalRecipients: 100,
        successCount: 60,
        failureCount: 50, // 60 + 50 > 100
      });

      expect(updated.kind).toBe("err");
    });
  });

  describe("NotificationDelivery success/failure rates", () => {
    it("should calculate success rate", () => {
      const result = NotificationDelivery.create({
        notificationId: "notification-123",
        totalRecipients: 100,
        successCount: 75,
        failureCount: 25,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getSuccessRate()).toBe(75);
        expect(result.value.getFailureRate()).toBe(25);
      }
    });

    it("should handle zero recipients", () => {
      const result = NotificationDelivery.create({
        notificationId: "notification-123",
        totalRecipients: 0,
        successCount: 0,
        failureCount: 0,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getSuccessRate()).toBe(0);
        expect(result.value.getFailureRate()).toBe(0);
      }
    });
  });

  describe("NotificationDelivery.isForTrip / isForNotification", () => {
    it("should check if for specific trip", () => {
      const result = NotificationDelivery.create({
        tripId: "trip-123",
        notificationId: "notification-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isForTrip("trip-123")).toBe(true);
        expect(result.value.isForTrip("other-trip")).toBe(false);
      }
    });

    it("should check if for specific notification", () => {
      const result = NotificationDelivery.create({
        notificationId: "notification-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isForNotification("notification-456")).toBe(true);
        expect(result.value.isForNotification("other-notification")).toBe(
          false,
        );
      }
    });
  });
});
