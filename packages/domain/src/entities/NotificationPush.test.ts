import { describe, it, expect } from "bun:test";
import { NotificationPush, NotificationPushStatus } from "./NotificationPush";

describe("[UNIT] NotificationPush Entity", () => {
  describe("NotificationPush.create", () => {
    it("should create with sent status", () => {
      const sentAt = new Date();
      const result = NotificationPush.create({
        targetUserId: "user-123",
        notificationId: "notification-456",
        status: NotificationPushStatus.SENT,
        sentAt,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.targetUserId).toBe("user-123");
        expect(result.value.notificationId).toBe("notification-456");
        expect(result.value.status).toBe(NotificationPushStatus.SENT);
        expect(result.value.sentAt).toBe(sentAt);
        expect(result.value.isSent()).toBe(true);
        expect(result.value.isFailed()).toBe(false);
      }
    });

    it("should create with failed status", () => {
      const result = NotificationPush.create({
        targetUserId: "user-123",
        notificationId: "notification-456",
        status: NotificationPushStatus.FAILED,
        failureReason: "Device token expired",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe(NotificationPushStatus.FAILED);
        expect(result.value.failureReason).toBe("Device token expired");
        expect(result.value.isFailed()).toBe(true);
        expect(result.value.isSent()).toBe(false);
      }
    });

    it("should default to sent status with current time", () => {
      const result = NotificationPush.create({
        targetUserId: "user-123",
        notificationId: "notification-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.status).toBe(NotificationPushStatus.SENT);
        expect(result.value.sentAt).toBeInstanceOf(Date);
      }
    });

    it("should auto-populate sentAt for sent status", () => {
      const result = NotificationPush.create({
        targetUserId: "user-123",
        notificationId: "notification-456",
        status: NotificationPushStatus.SENT,
        sentAt: null,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.sentAt).toBeInstanceOf(Date);
        expect(result.value.isSent()).toBe(true);
      }
    });

    it("should reject failed status without failure reason", () => {
      const result = NotificationPush.create({
        targetUserId: "user-123",
        notificationId: "notification-456",
        status: NotificationPushStatus.FAILED,
        failureReason: null,
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty targetUserId", () => {
      const result = NotificationPush.create({
        targetUserId: "",
        notificationId: "notification-456",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty notificationId", () => {
      const result = NotificationPush.create({
        targetUserId: "user-123",
        notificationId: "",
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("NotificationPush.markAsSent", () => {
    it("should mark as sent", () => {
      const pushResult = NotificationPush.create({
        targetUserId: "user-123",
        notificationId: "notification-456",
        status: NotificationPushStatus.FAILED,
        failureReason: "Temporary error",
      });

      expect(pushResult.kind).toBe("ok");
      if (pushResult.kind !== "ok") return;

      const sentAt = new Date();
      const updated = pushResult.value.markAsSent(sentAt);

      expect(updated.isSent()).toBe(true);
      expect(updated.isFailed()).toBe(false);
      expect(updated.sentAt).toBe(sentAt);
      expect(updated.failureReason).toBeNull();
    });
  });

  describe("NotificationPush.markAsFailed", () => {
    it("should mark as failed with reason", () => {
      const pushResult = NotificationPush.create({
        targetUserId: "user-123",
        notificationId: "notification-456",
      });

      expect(pushResult.kind).toBe("ok");
      if (pushResult.kind !== "ok") return;

      const updated = pushResult.value.markAsFailed("Token invalid");

      expect(updated.kind).toBe("ok");
      if (updated.kind === "ok") {
        expect(updated.value.isFailed()).toBe(true);
        expect(updated.value.failureReason).toBe("Token invalid");
      }
    });

    it("should reject empty failure reason", () => {
      const pushResult = NotificationPush.create({
        targetUserId: "user-123",
        notificationId: "notification-456",
      });

      expect(pushResult.kind).toBe("ok");
      if (pushResult.kind !== "ok") return;

      const updated = pushResult.value.markAsFailed("");
      expect(updated.kind).toBe("err");
    });
  });

  describe("NotificationPush.isForUser / isForNotification / matches", () => {
    it("should check if for specific user", () => {
      const result = NotificationPush.create({
        targetUserId: "user-123",
        notificationId: "notification-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isForUser("user-123")).toBe(true);
        expect(result.value.isForUser("other-user")).toBe(false);
      }
    });

    it("should check if for specific notification", () => {
      const result = NotificationPush.create({
        targetUserId: "user-123",
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

    it("should match both user and notification", () => {
      const result = NotificationPush.create({
        targetUserId: "user-123",
        notificationId: "notification-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.matches("user-123", "notification-456")).toBe(true);
        expect(result.value.matches("other-user", "notification-456")).toBe(
          false,
        );
        expect(result.value.matches("user-123", "other-notification")).toBe(
          false,
        );
      }
    });
  });
});
