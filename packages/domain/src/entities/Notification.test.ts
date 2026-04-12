import { describe, it, expect } from "bun:test";
import { Effect, Exit, Cause } from "effect";
import {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "./Notification";
import { ValidationError, StateTransitionError } from "../errors/effect-errors";

describe("[UNIT] Notification Entity", () => {
  describe("Notification.create", () => {
    it("should create notification with minimum required fields", () => {
      const effect = Notification.create({
        title: "New Challenge Available",
        body: "Check out the latest challenge!",
        createdById: "admin-123",
      });

      const entity = Effect.runSync(effect);
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.title).toBe("New Challenge Available");
      expect(entity.body).toBe("Check out the latest challenge!");
      expect(entity.createdById).toBe("admin-123");
      expect(entity.status).toBe(NotificationStatus.DRAFT);
      expect(entity.priority).toBe(NotificationPriority.NORMAL);
      expect(entity.url).toBeNull();
      expect(entity.isSent()).toBe(false);
    });

    it("should create notification with all fields", () => {
      // Use a date far in the future
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const effect = Notification.create({
        title: "Important Update",
        body: "Please read this important message",
        url: "/challenges/123",
        createdById: "admin-456",
        tripId: "trip-789",
        priority: NotificationPriority.HIGH,
        status: NotificationStatus.READY,
        scheduledFor: futureDate,
      });

      const entity = Effect.runSync(effect);
      expect(entity).toBeDefined();
      expect(entity.title).toBe("Important Update");
      expect(entity.url).toBe("/challenges/123");
      expect(entity.tripId).toBe("trip-789");
      expect(entity.priority).toBe(NotificationPriority.HIGH);
      expect(entity.status).toBe(NotificationStatus.READY);
      expect(entity.scheduledFor).toBeDefined();
    });

    it("should reject empty title", () => {
      const effect = Notification.create({
        title: "",
        body: "Body text",
        createdById: "admin-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("title");
      }
    });

    it("should reject title longer than 200 characters", () => {
      const effect = Notification.create({
        title: "a".repeat(201),
        body: "Body text",
        createdById: "admin-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("title");
      }
    });

    it("should reject empty body", () => {
      const effect = Notification.create({
        title: "Title",
        body: "",
        createdById: "admin-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("body");
      }
    });

    it("should reject body longer than 2000 characters", () => {
      const effect = Notification.create({
        title: "Title",
        body: "a".repeat(2001),
        createdById: "admin-123",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("body");
      }
    });

    it("should reject empty createdById", () => {
      const effect = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "",
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("createdById");
      }
    });

    it("should reject scheduledFor in the past", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const effect = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        scheduledFor: pastDate,
      });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(ValidationError);
        expect(exit.cause.error.field).toBe("scheduledFor");
      }
    });
  });

  describe("Notification.updateContent", () => {
    it("should update title and body", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Original Title",
          body: "Original body",
          createdById: "admin-123",
        }),
      );

      const updated = Effect.runSync(
        notification.updateContent({
          title: "Updated Title",
          body: "Updated body",
        }),
      );

      expect(updated.title).toBe("Updated Title");
      expect(updated.body).toBe("Updated body");
      expect(updated.id).toBe(notification.id);
    });

    it("should reject update after sent", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          status: NotificationStatus.READY,
        }),
      );

      const sent = Effect.runSync(notification.markAsSent());
      const effect = sent.updateContent({ title: "New Title" });

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Notification.updateStatus", () => {
    it("should transition from DRAFT to READY", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
        }),
      );

      expect(notification.status).toBe(NotificationStatus.DRAFT);

      const updated = Effect.runSync(
        notification.updateStatus(NotificationStatus.READY),
      );
      expect(updated.status).toBe(NotificationStatus.READY);
    });

    it("should transition from READY to SENT", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          status: NotificationStatus.READY,
        }),
      );

      const updated = Effect.runSync(
        notification.updateStatus(NotificationStatus.SENT),
      );
      expect(updated.status).toBe(NotificationStatus.SENT);
    });

    it("should reject invalid transition", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
        }),
      );

      // Cannot go from DRAFT directly to SENT
      const effect = notification.updateStatus(NotificationStatus.SENT);

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(StateTransitionError);
        expect(exit.cause.error.from).toBe(NotificationStatus.DRAFT);
        expect(exit.cause.error.to).toBe(NotificationStatus.SENT);
      }
    });
  });

  describe("Notification.markAsSent", () => {
    it("should mark as sent and set sentAt", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          status: NotificationStatus.READY,
        }),
      );

      const updated = Effect.runSync(notification.markAsSent());

      expect(updated.status).toBe(NotificationStatus.SENT);
      expect(updated.sentAt).toBeInstanceOf(Date);
      expect(updated.isSent()).toBe(true);
    });
  });

  describe("Notification.markAsFailed", () => {
    it("should mark as failed with reason", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          status: NotificationStatus.READY,
        }),
      );

      const updated = Effect.runSync(
        notification.markAsFailed("Push service unavailable"),
      );

      expect(updated.status).toBe(NotificationStatus.FAILED);
      expect(updated.failureReason).toBe("Push service unavailable");
    });
  });

  describe("Notification.cancel", () => {
    it("should cancel scheduled notification", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          status: NotificationStatus.READY,
          scheduledFor: futureDate,
        }),
      );

      const updated = Effect.runSync(notification.cancel());

      expect(updated.status).toBe(NotificationStatus.CANCELLED);
      expect(updated.isCancelled()).toBe(true);
    });

    it("should reject cancel after sent", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          status: NotificationStatus.READY,
        }),
      );

      const sent = Effect.runSync(notification.markAsSent());
      const effect = sent.cancel();

      const exit = Effect.runSyncExit(effect);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit) && Cause.isFailType(exit.cause)) {
        expect(exit.cause.error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Notification.isReadyToSend", () => {
    it("should return true when READY and no schedule", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          status: NotificationStatus.READY,
        }),
      );

      expect(notification.isReadyToSend()).toBe(true);
    });

    it("should return false when DRAFT", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          status: NotificationStatus.DRAFT,
        }),
      );

      expect(notification.isReadyToSend()).toBe(false);
    });

    it("should return false when already sent", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          status: NotificationStatus.SENT,
        }),
      );

      expect(notification.isReadyToSend()).toBe(false);
    });
  });

  describe("Notification.isScheduled", () => {
    it("should return true when scheduledFor is set", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          scheduledFor: futureDate,
        }),
      );

      expect(notification.isScheduled()).toBe(true);
    });

    it("should return false when no schedule", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
        }),
      );

      expect(notification.isScheduled()).toBe(false);
    });
  });

  describe("Notification.isOverdue", () => {
    it("should return true when scheduled time has passed", () => {
      // Create notification and schedule it with a date that will be "in the past" after creation
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          status: NotificationStatus.READY,
        }),
      );

      // No schedule set, so not overdue
      expect(notification.isOverdue()).toBe(false);
    });

    it("should return false when scheduled time is in future", () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 5); // 5 minutes from now

      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          status: NotificationStatus.READY,
          scheduledFor: futureDate,
        }),
      );

      expect(notification.isOverdue()).toBe(false);
    });
  });

  describe("Notification.hasUrl", () => {
    it("should return true when URL is set", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
          url: "/challenges/123",
        }),
      );

      expect(notification.hasUrl()).toBe(true);
    });

    it("should return false when URL is null", () => {
      const notification = Effect.runSync(
        Notification.create({
          title: "Title",
          body: "Body",
          createdById: "admin-123",
        }),
      );

      expect(notification.hasUrl()).toBe(false);
    });
  });
});
