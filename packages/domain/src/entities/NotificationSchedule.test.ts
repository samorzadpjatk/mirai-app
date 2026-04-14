import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import {
  NotificationSchedule,
  NotificationScheduleType,
} from "./NotificationSchedule";
import { ValidationError } from "../errors";

describe("[UNIT] NotificationSchedule Entity", () => {
  describe("[UNIT] NotificationSchedule.create", () => {
    it("should create schedule with valid data", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(9, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const result = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Test Schedule",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: 9,
          minute: 0,
          createdById: "admin-123",
        }),
      );

      expect(result.id).toBeDefined();
      expect(result.name).toBe("Test Schedule");
      expect(result.notificationType).toBe(NotificationScheduleType.INFO);
      expect(result.isActive).toBe(true);
      expect(result.hour).toBe(9);
      expect(result.minute).toBe(0);
      expect(result.isDailyRanking()).toBe(false);
    });

    it("should create schedule with notification content", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const result = await Effect.runPromise(
        NotificationSchedule.create({
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
        }),
      );

      expect(result.name).toBe("Challenge Announcement");
      expect(result.tripId).toBe("trip-456");
      expect(result.notificationTitle).toBe("New Challenge Available!");
      expect(result.notificationBody).toBe(
        "Check out the latest challenge and earn points!",
      );
      expect(result.notificationUrl).toBe("/challenges/123");
      expect(result.isTripSpecific()).toBe(true);
      expect(result.hasContent()).toBe(true);
      expect(result.hasUrl()).toBe(true);
    });

    it("should reject empty name", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      let error: ValidationError | undefined;
      try {
        await Effect.runPromise(
          NotificationSchedule.create({
            name: "",
            notificationType: NotificationScheduleType.INFO,
            startDate,
            endDate,
            hour: 9,
            minute: 0,
            createdById: "admin-123",
          }),
        );
      } catch (e) {
        error = e as ValidationError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toBe("name is required");
    });

    it("should reject past start date", async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      let error: ValidationError | undefined;
      try {
        await Effect.runPromise(
          NotificationSchedule.create({
            name: "Test Schedule",
            notificationType: NotificationScheduleType.INFO,
            startDate,
            endDate,
            hour: 9,
            minute: 0,
            createdById: "admin-123",
          }),
        );
      } catch (e) {
        error = e as ValidationError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain("future");
    });

    it("should reject invalid time range", async () => {
      const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      startDate.setHours(12, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      let error: ValidationError | undefined;
      try {
        await Effect.runPromise(
          NotificationSchedule.create({
            name: "Test Schedule",
            notificationType: NotificationScheduleType.INFO,
            startDate,
            endDate,
            hour: 25,
            minute: 0,
            createdById: "admin-123",
          }),
        );
      } catch (e) {
        error = e as ValidationError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain("hour");
    });

    it("should reject missing notification content for non-INFO types", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      let error: ValidationError | undefined;
      try {
        await Effect.runPromise(
          NotificationSchedule.create({
            name: "Test Schedule",
            notificationType: NotificationScheduleType.CHALLENGE,
            startDate,
            endDate,
            hour: 9,
            minute: 0,
            createdById: "admin-123",
          }),
        );
      } catch (e) {
        error = e as ValidationError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain("notificationTitle is required");
    });
  });

  describe("[UNIT] NotificationSchedule.update", () => {
    it("should update schedule name", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Original Name",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: 10,
          minute: 0,
          createdById: "admin-123",
        }),
      );

      const updated = await Effect.runPromise(
        schedule.update({ name: "Updated Name" }),
      );

      expect(updated.name).toBe("Updated Name");
      expect(updated.id).toBe(schedule.id);
    });

    it("should reject empty name in update", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Original Name",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: 9,
          minute: 0,
          createdById: "admin-123",
        }),
      );

      let error: ValidationError | undefined;
      try {
        await Effect.runPromise(schedule.update({ name: "" }));
      } catch (e) {
        error = e as ValidationError;
      }

      expect(error).toBeDefined();
      expect(error?.message).toBe("name is required");
    });
  });

  describe("[UNIT] NotificationSchedule.toggleActive", () => {
    it("should toggle active status", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Test Schedule",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: 9,
          minute: 0,
          isActive: true,
          createdById: "admin-123",
        }),
      );

      expect(schedule.isActive).toBe(true);

      const toggled = schedule.toggleActive();
      expect(toggled.isActive).toBe(false);
    });
  });

  describe("[UNIT] NotificationSchedule.updateLastRun", () => {
    it("should update last run timestamp", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Test Schedule",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: 9,
          minute: 0,
          createdById: "admin-123",
        }),
      );

      expect(schedule.lastRun).toBeNull();

      const lastRun = new Date();
      const updated = schedule.updateLastRun(lastRun);
      expect(updated.lastRun).toBe(lastRun);
    });
  });

  describe("[UNIT] NotificationSchedule.duplicate", () => {
    it("should duplicate schedule", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Original Schedule",
          notificationType: NotificationScheduleType.CHALLENGE,
          notificationTitle: "Title",
          notificationBody: "Body",
          startDate,
          endDate,
          hour: 9,
          minute: 0,
          createdById: "admin-123",
        }),
      );

      const duplicate = await Effect.runPromise(
        schedule.duplicate({ newCreatedById: "admin-456" }),
      );

      expect(duplicate.name).toBe("Original Schedule (Copy)");
      expect(duplicate.isActive).toBe(false);
      expect(duplicate.createdById).toBe("admin-456");
      expect(duplicate.id).not.toBe(schedule.id);
    });
  });

  describe("[UNIT] NotificationSchedule status checks", () => {
    it("should check if currently active", async () => {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() + 2);
      startDate.setMinutes(0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Test Schedule",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: startDate.getHours(),
          minute: 0,
          isActive: true,
          createdById: "admin-123",
        }),
      );

      expect(schedule.isActive).toBe(true);
      expect(schedule.isCurrentlyActive()).toBe(false);

      const afterStart = new Date(startDate.getTime() + 60 * 60 * 1000);
      expect(schedule.isCurrentlyActive(afterStart)).toBe(true);
    });

    it("should check if expired", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setUTCHours(12, 0, 0, 0);

      const nextWeek = new Date(tomorrow);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Test Schedule",
          notificationType: NotificationScheduleType.INFO,
          startDate: tomorrow,
          endDate: nextWeek,
          hour: tomorrow.getUTCHours(),
          minute: tomorrow.getUTCMinutes(),
          createdById: "admin-123",
        }),
      );

      expect(schedule.isExpired(new Date())).toBe(false);

      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 30);
      expect(schedule.isExpired(farFuture)).toBe(true);
    });

    it("should check if upcoming", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Test Schedule",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: 9,
          minute: 0,
          createdById: "admin-123",
        }),
      );

      expect(schedule.isUpcoming()).toBe(true);
      expect(schedule.isExpired()).toBe(false);
    });
  });

  describe("[UNIT] NotificationSchedule time functions", () => {
    it("should check if should run at specific time", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Test Schedule",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: 14,
          minute: 30,
          createdById: "admin-123",
        }),
      );

      const runTime = new Date();
      runTime.setUTCHours(14, 30, 0, 0);
      expect(schedule.shouldRunAt(runTime)).toBe(true);

      const noRunTime = new Date();
      noRunTime.setUTCHours(10, 0, 0, 0);
      expect(schedule.shouldRunAt(noRunTime)).toBe(false);
    });

    it("should get formatted time", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Test Schedule",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: 9,
          minute: 5,
          createdById: "admin-123",
        }),
      );

      expect(schedule.getFormattedTime()).toBe("09:05");
    });

    it("should get next run time", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(10, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Test Schedule",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: 14,
          minute: 0,
          createdById: "admin-123",
        }),
      );

      const nextRun = schedule.getNextRunTime();
      expect(nextRun).toBeDefined();
      if (nextRun) {
        expect(nextRun.getUTCHours()).toBe(14);
        expect(nextRun.getUTCMinutes()).toBe(0);
      }
    });

    it("should get duration", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Test Schedule",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: 12,
          minute: 0,
          createdById: "admin-123",
        }),
      );

      expect(schedule.getDurationDays()).toBe(7);
    });
  });

  describe("[UNIT] NotificationSchedule.getSummary", () => {
    it("should return summary", async () => {
      const startDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      startDate.setUTCHours(14, 30, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      const schedule = await Effect.runPromise(
        NotificationSchedule.create({
          name: "Test Schedule",
          notificationType: NotificationScheduleType.INFO,
          startDate,
          endDate,
          hour: 14,
          minute: 30,
          isActive: true,
          createdById: "admin-123",
        }),
      );

      const summary = schedule.getSummary();
      expect(summary).toContain("Test Schedule");
      expect(summary).toContain("INFO");
      expect(summary).toContain("14:30");
      expect(summary).toContain("active");
    });
  });
});
