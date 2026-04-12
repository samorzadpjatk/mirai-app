import { describe, it, expect } from "bun:test";
import {
  NotificationSchedule,
  NotificationScheduleType,
  validateDateRange,
  validateFutureDates,
  validateReasonableDateRange,
  validateMinimumDuration,
  validateScheduleTime,
  validateNotificationContent,
} from "./NotificationSchedule";

describe("[UNIT] NotificationSchedule Entity", () => {
  describe("NotificationSchedule.create", () => {
    it("should create schedule with valid data", () => {
      // Use a date 2 days from now at a fixed UTC time to ensure we're past any 5-minute validation
      // Use INFO type which doesn't require notification content
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(9, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const result = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 9,
        minute: 0,
        createdById: "admin-123",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBeDefined();
        expect(result.value.name).toBe("Test Schedule");
        expect(result.value.notificationType).toBe(
          NotificationScheduleType.INFO,
        );
        expect(result.value.isActive).toBe(true);
        expect(result.value.hour).toBe(9);
        expect(result.value.minute).toBe(0);
        expect(result.value.isDailyRanking()).toBe(false);
      }
    });

    it("should create schedule with notification content", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const result = NotificationSchedule.create({
        name: "Challenge Announcement",
        tripId: "trip-456",
        notificationType: NotificationScheduleType.CHALLENGE,
        notificationTitle: "New Challenge Available!",
        notificationBody: "Check out the latest challenge and earn points!",
        notificationUrl: "/challenges/123",
        startDate,
        endDate,
        hour: 14,
        minute: 30,
        isActive: true,
        createdById: "admin-123",
      });

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("Challenge Announcement");
        expect(result.value.tripId).toBe("trip-456");
        expect(result.value.notificationTitle).toBe("New Challenge Available!");
        expect(result.value.notificationBody).toBe(
          "Check out the latest challenge and earn points!",
        );
        expect(result.value.notificationUrl).toBe("/challenges/123");
        expect(result.value.isTripSpecific()).toBe(true);
        expect(result.value.hasContent()).toBe(true);
        expect(result.value.hasUrl()).toBe(true);
      }
    });

    it("should reject empty name", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const result = NotificationSchedule.create({
        name: "",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 9,
        minute: 0,
        createdById: "admin-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("name is required");
      }
    });

    it("should reject past start date", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // Yesterday

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const result = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 9,
        minute: 0,
        createdById: "admin-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("future");
      }
    });

    it("should reject invalid time range", () => {
      // Use a date well in the future to avoid the 5-minute validation
      const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      startDate.setHours(12, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const result = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 25, // Invalid hour
        minute: 0,
        createdById: "admin-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("hour");
      }
    });

    it("should reject missing notification content for non-INFO types", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const result = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.CHALLENGE,
        // Missing notificationTitle and notificationBody
        startDate,
        endDate,
        hour: 9,
        minute: 0,
        createdById: "admin-123",
      });

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("notificationTitle is required");
      }
    });
  });

  describe("NotificationSchedule.update", () => {
    it("should update schedule name", () => {
      const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Original Name",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 10,
        minute: 0,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind !== "ok") return;

      const schedule = createResult.value;
      const updateResult = schedule.update({ name: "Updated Name" });

      expect(updateResult.kind).toBe("ok");
      if (updateResult.kind === "ok") {
        expect(updateResult.value.name).toBe("Updated Name");
        expect(updateResult.value.id).toBe(schedule.id);
      }
    });

    it("should reject empty name in update", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Original Name",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 9,
        minute: 0,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind !== "ok") return;

      const schedule = createResult.value;
      const updateResult = schedule.update({ name: "" });

      expect(updateResult.kind).toBe("err");
      if (updateResult.kind === "err") {
        expect(updateResult.error).toBe("name is required");
      }
    });
  });

  describe("NotificationSchedule.toggleActive", () => {
    it("should toggle active status", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 9,
        minute: 0,
        isActive: true,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind !== "ok") return;

      const schedule = createResult.value;
      expect(schedule.isActive).toBe(true);

      const toggled = schedule.toggleActive();
      expect(toggled.isActive).toBe(false);
    });
  });

  describe("NotificationSchedule.updateLastRun", () => {
    it("should update last run timestamp", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 9,
        minute: 0,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind !== "ok") return;

      const schedule = createResult.value;
      expect(schedule.lastRun).toBeNull();

      const lastRun = new Date();
      const updated = schedule.updateLastRun(lastRun);
      expect(updated.lastRun).toBe(lastRun);
    });
  });

  describe("NotificationSchedule.duplicate", () => {
    it("should duplicate schedule", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Original Schedule",
        notificationType: NotificationScheduleType.CHALLENGE,
        notificationTitle: "Title",
        notificationBody: "Body",
        startDate,
        endDate,
        hour: 9,
        minute: 0,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind !== "ok") return;

      const schedule = createResult.value;
      const duplicateResult = schedule.duplicate({
        newCreatedById: "admin-456",
      });

      expect(duplicateResult.kind).toBe("ok");
      if (duplicateResult.kind === "ok") {
        expect(duplicateResult.value.name).toBe("Original Schedule (Copy)");
        expect(duplicateResult.value.isActive).toBe(false);
        expect(duplicateResult.value.createdById).toBe("admin-456");
        expect(duplicateResult.value.id).not.toBe(schedule.id);
      }
    });
  });

  describe("NotificationSchedule status checks", () => {
    it("should check if currently active", () => {
      // Create a schedule that starts in 2 hours and ends tomorrow
      // Then test if it's "active" by checking the time range
      const startDate = new Date();
      startDate.setHours(startDate.getHours() + 2); // 2 hours from now
      startDate.setMinutes(0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const createResult = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: startDate.getHours(),
        minute: 0,
        isActive: true,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        // Schedule is active (isActive flag is true) but not "currently active"
        // because startDate is in the future
        expect(createResult.value.isActive).toBe(true);
        // Before start time, so not currently active yet
        expect(createResult.value.isCurrentlyActive()).toBe(false);
        // After start time (simulated), it would be active
        const afterStart = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour after start
        expect(createResult.value.isCurrentlyActive(afterStart)).toBe(true);
      }
    });

    it("should check if expired", () => {
      // Create an upcoming schedule and verify it's NOT expired, then test with past dates
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(12, 0, 0, 0);

      const nextWeek = new Date(tomorrow);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate: tomorrow,
        endDate: nextWeek,
        hour: tomorrow.getUTCHours(),
        minute: tomorrow.getUTCMinutes(),
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        // An upcoming schedule is not expired
        expect(createResult.value.isExpired(new Date())).toBe(false);
        // But if we check from a date far in the future, it would be expired
        const farFuture = new Date();
        farFuture.setDate(farFuture.getDate() + 30);
        expect(createResult.value.isExpired(farFuture)).toBe(true);
      }
    });

    it("should check if upcoming", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 9,
        minute: 0,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        expect(createResult.value.isUpcoming()).toBe(true);
        expect(createResult.value.isExpired()).toBe(false);
      }
    });
  });

  describe("NotificationSchedule time functions", () => {
    it("should check if should run at specific time", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 14,
        minute: 30,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const schedule = createResult.value;

        const runTime = new Date();
        runTime.setUTCHours(14, 30, 0, 0);
        expect(schedule.shouldRunAt(runTime)).toBe(true);

        const noRunTime = new Date();
        noRunTime.setUTCHours(10, 0, 0, 0);
        expect(schedule.shouldRunAt(noRunTime)).toBe(false);
      }
    });

    it("should get formatted time", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 9,
        minute: 5,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        expect(createResult.value.getFormattedTime()).toBe("09:05");
      }
    });

    it("should get next run time", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 14,
        minute: 0,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const schedule = createResult.value;
        const nextRun = schedule.getNextRunTime();
        expect(nextRun).toBeDefined();
        if (nextRun) {
          expect(nextRun.getUTCHours()).toBe(14);
          expect(nextRun.getUTCMinutes()).toBe(0);
        }
      }
    });

    it("should get duration", () => {
      // Use future dates for the test
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 12,
        minute: 0,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        expect(createResult.value.getDurationDays()).toBe(7);
      }
    });
  });

  describe("NotificationSchedule.getSummary", () => {
    it("should return summary", () => {
      // Use a fixed future UTC time (2 days from now) to ensure we're past the 5-minute validation window
      // Use INFO type which doesn't require notification content
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(14, 30, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const createResult = NotificationSchedule.create({
        name: "Test Schedule",
        notificationType: NotificationScheduleType.INFO,
        startDate,
        endDate,
        hour: 14,
        minute: 30,
        isActive: true,
        createdById: "admin-123",
      });

      expect(createResult.kind).toBe("ok");
      if (createResult.kind === "ok") {
        const summary = createResult.value.getSummary();
        expect(summary).toContain("Test Schedule");
        expect(summary).toContain("INFO");
        expect(summary).toContain("14:30");
        expect(summary).toContain("active");
      }
    });
  });

  describe("Validation functions", () => {
    it("should validate date range", () => {
      const start = new Date("2024-06-01T00:00:00Z");
      const end = new Date("2024-06-08T00:00:00Z");

      const valid = validateDateRange(start, end);
      expect(valid.kind).toBe("ok");

      const invalid = validateDateRange(end, start);
      expect(invalid.kind).toBe("err");
      if (invalid.kind === "err") {
        expect(invalid.error).toContain("startDate must be before endDate");
      }
    });

    it("should validate future dates", () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);

      const past = new Date();
      past.setDate(past.getDate() - 1);

      const valid = validateFutureDates(future, future);
      expect(valid.kind).toBe("ok");

      const invalid = validateFutureDates(past, future);
      expect(invalid.kind).toBe("err");
      if (invalid.kind === "err") {
        expect(invalid.error).toContain("startDate must be in the future");
      }
    });

    it("should validate reasonable date range", () => {
      const start = new Date();
      start.setDate(start.getDate() + 1);

      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const valid = validateReasonableDateRange(start, end);
      expect(valid.kind).toBe("ok");
    });

    it("should validate minimum duration", () => {
      const start = new Date("2024-06-01T00:00:00Z");
      const end = new Date("2024-06-01T12:00:00Z"); // 12 hours, less than 1 day

      const invalid = validateMinimumDuration(start, end);
      expect(invalid.kind).toBe("err");
      if (invalid.kind === "err") {
        expect(invalid.error).toContain("Duration must be at least 1 day");
      }
    });

    it("should validate schedule time", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);

      const valid = validateScheduleTime(startDate, 12, 30);
      expect(valid.kind).toBe("ok");

      const invalidHour = validateScheduleTime(startDate, 25, 0);
      expect(invalidHour.kind).toBe("err");
      if (invalidHour.kind === "err") {
        expect(invalidHour.error).toContain("hour");
      }

      const invalidMinute = validateScheduleTime(startDate, 12, 60);
      expect(invalidMinute.kind).toBe("err");
      if (invalidMinute.kind === "err") {
        expect(invalidMinute.error).toContain("minute");
      }
    });

    it("should validate notification content", () => {
      const validContent = validateNotificationContent(
        NotificationScheduleType.CHALLENGE,
        "Title",
        "Body",
        null,
      );
      expect(validContent.kind).toBe("ok");

      const infoType = validateNotificationContent(
        NotificationScheduleType.INFO,
        null,
        null,
        null,
      );
      expect(infoType.kind).toBe("ok"); // INFO type doesn't require content

      const missingTitle = validateNotificationContent(
        NotificationScheduleType.CHALLENGE,
        null,
        "Body",
        null,
      );
      expect(missingTitle.kind).toBe("err");
      if (missingTitle.kind === "err") {
        expect(missingTitle.error).toContain("notificationTitle is required");
      }

      const missingBody = validateNotificationContent(
        NotificationScheduleType.CHALLENGE,
        "Title",
        null,
        null,
      );
      expect(missingBody.kind).toBe("err");
      if (missingBody.kind === "err") {
        expect(missingBody.error).toContain("notificationBody is required");
      }
    });
  });
});
