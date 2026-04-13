import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import {
  NotificationDelivery,
  NotificationDeliveryStatus,
} from "./NotificationDelivery";
import { ValidationError } from "../errors/effect-errors";

describe("[UNIT] NotificationDelivery Entity", () => {
  describe("NotificationDelivery.create", () => {
    it("should create with valid data", () => {
      const effect = NotificationDelivery.create({
        notificationId: "notification-123",
      });

      const entity = Effect.runSync(effect);
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.notificationId).toBe("notification-123");
      expect(entity.totalRecipients).toBe(0);
      expect(entity.successCount).toBe(0);
      expect(entity.failureCount).toBe(0);
      expect(entity.status).toBe(NotificationDeliveryStatus.PENDING);
      expect(entity.isPending()).toBe(true);
    });

    it("should create with trip and schedule", () => {
      const effect = NotificationDelivery.create({
        tripId: "trip-456",
        notificationId: "notification-123",
        scheduleId: "schedule-789",
        totalRecipients: 100,
      });

      const entity = Effect.runSync(effect);
      expect(entity).toBeDefined();
      expect(entity.tripId).toBe("trip-456");
      expect(entity.scheduleId).toBe("schedule-789");
      expect(entity.totalRecipients).toBe(100);
      expect(entity.isScheduled()).toBe(true);
    });

    it("should create with stats", () => {
      const effect = NotificationDelivery.create({
        notificationId: "notification-123",
        totalRecipients: 100,
        successCount: 95,
        failureCount: 5,
      });

      const entity = Effect.runSync(effect);
      expect(entity).toBeDefined();
      expect(entity.successCount).toBe(95);
      expect(entity.failureCount).toBe(5);
      expect(entity.getSuccessRate()).toBe(95);
    });

    it("should reject negative counts", () => {
      const effect = NotificationDelivery.create({
        notificationId: "notification-123",
        totalRecipients: -10,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("totalRecipients");
      }
    });

    it("should reject success + failure exceeding total", () => {
      const effect = NotificationDelivery.create({
        notificationId: "notification-123",
        totalRecipients: 100,
        successCount: 60,
        failureCount: 50, // 60 + 50 = 110 > 100
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("counts");
      }
    });

    it("should reject completedAt before startedAt", () => {
      const startedAt = new Date("2024-06-01T12:00:00Z");
      const completedAt = new Date("2024-06-01T10:00:00Z");

      const effect = NotificationDelivery.create({
        notificationId: "notification-123",
        deliveryStartedAt: startedAt,
        deliveryCompletedAt: completedAt,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("deliveryCompletedAt");
      }
    });

    it("should reject empty notificationId", () => {
      const effect = NotificationDelivery.create({
        notificationId: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("notificationId");
      }
    });
  });

  describe("NotificationDelivery.start", () => {
    it("should start delivery", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          notificationId: "notification-123",
        }),
      );

      const updated = delivery.start();

      expect(updated.status).toBe(NotificationDeliveryStatus.IN_PROGRESS);
      expect(updated.isInProgress()).toBe(true);
      expect(updated.isPending()).toBe(false);
    });
  });

  describe("NotificationDelivery.complete", () => {
    it("should complete delivery", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          notificationId: "notification-123",
          status: NotificationDeliveryStatus.IN_PROGRESS,
        }),
      );

      const updated = delivery.complete();

      expect(updated.status).toBe(NotificationDeliveryStatus.COMPLETED);
      expect(updated.isCompleted()).toBe(true);
      expect(updated.isTerminal()).toBe(true);
      expect(updated.deliveryCompletedAt).toBeInstanceOf(Date);
    });
  });

  describe("NotificationDelivery.markAsFailed", () => {
    it("should mark as failed", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          notificationId: "notification-123",
        }),
      );

      const updated = Effect.runSync(delivery.markAsFailed("Server error"));

      expect(updated.status).toBe(NotificationDeliveryStatus.FAILED);
      expect(updated.errors).toBe("Server error");
      expect(updated.isFailed()).toBe(true);
    });

    it("should reject empty error message", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          notificationId: "notification-123",
        }),
      );

      const effect = delivery.markAsFailed("");

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("errors");
      }
    });
  });

  describe("NotificationDelivery.updateStats", () => {
    it("should update stats", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          notificationId: "notification-123",
        }),
      );

      const updated = Effect.runSync(
        delivery.updateStats({
          totalRecipients: 100,
          successCount: 90,
          failureCount: 10,
        }),
      );

      expect(updated.totalRecipients).toBe(100);
      expect(updated.successCount).toBe(90);
      expect(updated.failureCount).toBe(10);
    });

    it("should reject invalid stats", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          notificationId: "notification-123",
        }),
      );

      const effect = delivery.updateStats({
        totalRecipients: 100,
        successCount: 60,
        failureCount: 50, // 60 + 50 > 100
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("counts");
      }
    });
  });

  describe("NotificationDelivery success/failure rates", () => {
    it("should calculate success rate", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          notificationId: "notification-123",
          totalRecipients: 100,
          successCount: 75,
          failureCount: 25,
        }),
      );

      expect(delivery.getSuccessRate()).toBe(75);
      expect(delivery.getFailureRate()).toBe(25);
    });

    it("should handle zero recipients", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          notificationId: "notification-123",
          totalRecipients: 0,
          successCount: 0,
          failureCount: 0,
        }),
      );

      expect(delivery.getSuccessRate()).toBe(0);
      expect(delivery.getFailureRate()).toBe(0);
    });
  });

  describe("NotificationDelivery.isForTrip / isForNotification", () => {
    it("should check if for specific trip", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          tripId: "trip-123",
          notificationId: "notification-456",
        }),
      );

      expect(delivery.isForTrip("trip-123")).toBe(true);
      expect(delivery.isForTrip("other-trip")).toBe(false);
    });

    it("should check if for specific notification", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          notificationId: "notification-456",
        }),
      );

      expect(delivery.isForNotification("notification-456")).toBe(true);
      expect(delivery.isForNotification("other-notification")).toBe(false);
    });
  });

  describe("NotificationDelivery recordPush", () => {
    it("should record successful push", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          notificationId: "notification-123",
          totalRecipients: 10,
        }),
      );

      const updated = delivery.recordPush("user-1", true);

      expect(updated.successCount).toBe(1);
      expect(updated.failureCount).toBe(0);
      expect(updated.pushes).toHaveLength(1);
      expect(updated.isPushSentToUser("user-1")).toBe(true);
    });

    it("should record failed push", () => {
      const delivery = Effect.runSync(
        NotificationDelivery.create({
          notificationId: "notification-123",
          totalRecipients: 10,
        }),
      );

      const updated = delivery.recordPush("user-1", false, "Token invalid");

      expect(updated.successCount).toBe(0);
      expect(updated.failureCount).toBe(1);
      expect(updated.pushes).toHaveLength(1);
      expect(updated.isPushSentToUser("user-1")).toBe(false);

      const failedPushes = updated.getFailedPushes();
      expect(failedPushes).toHaveLength(1);
      expect(failedPushes[0]!.failureReason).toBe("Token invalid");
    });
  });
});
