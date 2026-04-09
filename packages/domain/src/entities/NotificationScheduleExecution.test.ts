import { describe, it, expect } from "bun:test";
import { NotificationScheduleExecution } from "./NotificationScheduleExecution";

describe("[UNIT] NotificationScheduleExecution Entity", () => {
  describe("NotificationScheduleExecution.create", () => {
    it("should create with valid data", () => {
      const result = NotificationScheduleExecution.create({
        notificationId: "notification-123",
        scheduleId: "schedule-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.notificationId).toBe("notification-123");
        expect(result.value.scheduleId).toBe("schedule-456");
        expect(result.value.executedAt).toBeInstanceOf(Date);
      }
    });

    it("should create with specific execution time", () => {
      const executedAt = new Date("2024-06-01T10:00:00Z");
      const result = NotificationScheduleExecution.create({
        notificationId: "notification-123",
        scheduleId: "schedule-456",
        executedAt,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.executedAt).toBe(executedAt);
      }
    });

    it("should reject empty notificationId", () => {
      const result = NotificationScheduleExecution.create({
        notificationId: "",
        scheduleId: "schedule-456",
      });

      expect(result.kind).toBe("err");
    });

    it("should reject empty scheduleId", () => {
      const result = NotificationScheduleExecution.create({
        notificationId: "notification-123",
        scheduleId: "",
      });

      expect(result.kind).toBe("err");
    });
  });

  describe("NotificationScheduleExecution.matches", () => {
    it("should match correct notification and schedule", () => {
      const result = NotificationScheduleExecution.create({
        notificationId: "notification-123",
        scheduleId: "schedule-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.matches("notification-123", "schedule-456")).toBe(
          true,
        );
        expect(result.value.matches("notification-123", "other-schedule")).toBe(
          false,
        );
        expect(result.value.matches("other-notification", "schedule-456")).toBe(
          false,
        );
      }
    });
  });

  describe("NotificationScheduleExecution.isForNotification / isForSchedule", () => {
    it("should check if for specific notification", () => {
      const result = NotificationScheduleExecution.create({
        notificationId: "notification-123",
        scheduleId: "schedule-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isForNotification("notification-123")).toBe(true);
        expect(result.value.isForNotification("other-notification")).toBe(
          false,
        );
      }
    });

    it("should check if for specific schedule", () => {
      const result = NotificationScheduleExecution.create({
        notificationId: "notification-123",
        scheduleId: "schedule-456",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isForSchedule("schedule-456")).toBe(true);
        expect(result.value.isForSchedule("other-schedule")).toBe(false);
      }
    });
  });

  describe("NotificationScheduleExecution.getAgeMs / isOlderThan", () => {
    it("should calculate age correctly", () => {
      const executedAt = new Date(Date.now() - 60000); // 1 minute ago
      const result = NotificationScheduleExecution.create({
        notificationId: "notification-123",
        scheduleId: "schedule-456",
        executedAt,
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.getAgeMs()).toBeGreaterThan(0);
        expect(result.value.isOlderThan(30000)).toBe(true); // Older than 30 seconds
        expect(result.value.isOlderThan(120000)).toBe(false); // Not older than 2 minutes
      }
    });
  });
});
