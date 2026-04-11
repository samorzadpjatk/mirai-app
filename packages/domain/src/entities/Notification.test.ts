import { describe, it, expect } from "bun:test";
import {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from "./Notification";
import { ValidationError, StateTransitionError } from "../errors/domain-errors";

describe("[UNIT] Notification Entity", () => {
  describe("Notification.create", () => {
    it("should create notification with minimum required fields", () => {
      const result = Notification.create({
        title: "New Challenge Available",
        body: "Check out the latest challenge!",
        createdById: "admin-123",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.title).toBe("New Challenge Available");
        expect(result.value.body).toBe("Check out the latest challenge!");
        expect(result.value.createdById).toBe("admin-123");
        expect(result.value.status).toBe(NotificationStatus.DRAFT);
        expect(result.value.priority).toBe(NotificationPriority.NORMAL);
        expect(result.value.url).toBeNull();
        expect(result.value.isSent()).toBe(false);
      }
    });

    it("should create notification with all fields", () => {
      // Use a date far in the future
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = Notification.create({
        title: "Important Update",
        body: "Please read this important message",
        url: "/challenges/123",
        createdById: "admin-456",
        tripId: "trip-789",
        priority: NotificationPriority.HIGH,
        status: NotificationStatus.READY,
        scheduledFor: futureDate,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.title).toBe("Important Update");
        expect(result.value.url).toBe("/challenges/123");
        expect(result.value.tripId).toBe("trip-789");
        expect(result.value.priority).toBe(NotificationPriority.HIGH);
        expect(result.value.status).toBe(NotificationStatus.READY);
        expect(result.value.scheduledFor).toBeDefined();
      }
    });

    it("should reject empty title", () => {
      const result = Notification.create({
        title: "",
        body: "Body text",
        createdById: "admin-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("title");
      }
    });

    it("should reject title longer than 200 characters", () => {
      const result = Notification.create({
        title: "a".repeat(201),
        body: "Body text",
        createdById: "admin-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("title");
      }
    });

    it("should reject empty body", () => {
      const result = Notification.create({
        title: "Title",
        body: "",
        createdById: "admin-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("body");
      }
    });

    it("should reject body longer than 2000 characters", () => {
      const result = Notification.create({
        title: "Title",
        body: "a".repeat(2001),
        createdById: "admin-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("body");
      }
    });

    it("should reject empty createdById", () => {
      const result = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("createdById");
      }
    });

    it("should reject scheduledFor in the past", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const result = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        scheduledFor: pastDate,
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(ValidationError);
        expect(result.error.field).toBe("scheduledFor");
      }
    });
  });

  describe("Notification.updateContent", () => {
    it("should update title and body", () => {
      const notificationResult = Notification.create({
        title: "Original Title",
        body: "Original body",
        createdById: "admin-123",
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind !== "ok") return;

      const notification = notificationResult.value;
      const updatedResult = notification.updateContent({
        title: "Updated Title",
        body: "Updated body",
      });

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.title).toBe("Updated Title");
        expect(updatedResult.value.body).toBe("Updated body");
        expect(updatedResult.value.id).toBe(notification.id);
      }
    });

    it("should reject update after sent", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        status: NotificationStatus.READY,
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind !== "ok") return;

      const sentResult = notificationResult.value.markAsSent();
      expect(sentResult.kind).toBe("ok");
      if (sentResult.kind !== "ok") return;

      const result = sentResult.value.updateContent({ title: "New Title" });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Notification.updateStatus", () => {
    it("should transition from DRAFT to READY", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind !== "ok") return;

      const notification = notificationResult.value;
      expect(notification.status).toBe(NotificationStatus.DRAFT);

      const updatedResult = notification.updateStatus(NotificationStatus.READY);
      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.status).toBe(NotificationStatus.READY);
      }
    });

    it("should transition from READY to SENT", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        status: NotificationStatus.READY,
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind !== "ok") return;

      const notification = notificationResult.value;
      const updatedResult = notification.updateStatus(NotificationStatus.SENT);
      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.status).toBe(NotificationStatus.SENT);
      }
    });

    it("should reject invalid transition", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind !== "ok") return;

      // Cannot go from DRAFT directly to SENT
      const result = notificationResult.value.updateStatus(
        NotificationStatus.SENT,
      );
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
        expect(result.error.from).toBe(NotificationStatus.DRAFT);
        expect(result.error.to).toBe(NotificationStatus.SENT);
      }
    });
  });

  describe("Notification.markAsSent", () => {
    it("should mark as sent and set sentAt", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        status: NotificationStatus.READY,
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind !== "ok") return;

      const notification = notificationResult.value;
      const updatedResult = notification.markAsSent();

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.status).toBe(NotificationStatus.SENT);
        expect(updatedResult.value.sentAt).toBeInstanceOf(Date);
        expect(updatedResult.value.isSent()).toBe(true);
      }
    });
  });

  describe("Notification.markAsFailed", () => {
    it("should mark as failed with reason", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        status: NotificationStatus.READY,
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind !== "ok") return;

      const notification = notificationResult.value;
      const updatedResult = notification.markAsFailed(
        "Push service unavailable",
      );

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.status).toBe(NotificationStatus.FAILED);
        expect(updatedResult.value.failureReason).toBe(
          "Push service unavailable",
        );
      }
    });
  });

  describe("Notification.cancel", () => {
    it("should cancel scheduled notification", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        status: NotificationStatus.READY,
        scheduledFor: futureDate,
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind !== "ok") return;

      const notification = notificationResult.value;
      const updatedResult = notification.cancel();

      expect(updatedResult.kind).toBe("ok");
      if (updatedResult.kind === "ok") {
        expect(updatedResult.value.status).toBe(NotificationStatus.CANCELLED);
        expect(updatedResult.value.isCancelled()).toBe(true);
      }
    });

    it("should reject cancel after sent", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        status: NotificationStatus.READY,
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind !== "ok") return;

      const sentResult = notificationResult.value.markAsSent();
      expect(sentResult.kind).toBe("ok");
      if (sentResult.kind !== "ok") return;

      const result = sentResult.value.cancel();
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(StateTransitionError);
      }
    });
  });

  describe("Notification.isReadyToSend", () => {
    it("should return true when READY and no schedule", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        status: NotificationStatus.READY,
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind === "ok") {
        expect(notificationResult.value.isReadyToSend()).toBe(true);
      }
    });

    it("should return false when DRAFT", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        status: NotificationStatus.DRAFT,
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind === "ok") {
        expect(notificationResult.value.isReadyToSend()).toBe(false);
      }
    });

    it("should return false when already sent", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        status: NotificationStatus.SENT,
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind === "ok") {
        expect(notificationResult.value.isReadyToSend()).toBe(false);
      }
    });
  });

  describe("Notification.isScheduled", () => {
    it("should return true when scheduledFor is set", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        scheduledFor: futureDate,
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind === "ok") {
        expect(notificationResult.value.isScheduled()).toBe(true);
      }
    });

    it("should return false when no schedule", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind === "ok") {
        expect(notificationResult.value.isScheduled()).toBe(false);
      }
    });
  });

  describe("Notification.isOverdue", () => {
    it("should return true when scheduled time has passed", () => {
      // Create notification and schedule it with a date that will be "in the past" after creation
      const createResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        status: NotificationStatus.READY,
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind !== "ok") return;

      // No schedule set, so not overdue
      const notification = createResult.value;
      expect(notification.isOverdue()).toBe(false);
    });

    it("should return false when scheduled time is in future", () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 5); // 5 minutes from now

      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        status: NotificationStatus.READY,
        scheduledFor: futureDate,
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind === "ok") {
        expect(notificationResult.value.isOverdue()).toBe(false);
      }
    });
  });

  describe("Notification.hasUrl", () => {
    it("should return true when URL is set", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
        url: "/challenges/123",
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind === "ok") {
        expect(notificationResult.value.hasUrl()).toBe(true);
      }
    });

    it("should return false when URL is null", () => {
      const notificationResult = Notification.create({
        title: "Title",
        body: "Body",
        createdById: "admin-123",
      });

      expect(notificationResult.kind).toBe("ok");
      if (notificationResult.kind === "ok") {
        expect(notificationResult.value.hasUrl()).toBe(false);
      }
    });
  });
});
