import { getZonedParts, zonedWallClockToUtc } from "@mirai-app/common/notifications";
import { ORPCError } from "@orpc/server";
import { describe, expect, it } from "vitest";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

import {
  filterSchema,
  notificationScheduleCreateSchema,
  notificationScheduleUpdateSchema,
  paginationSchema,
  validateDateRange,
  validateFutureDates,
  validateMinimumDuration,
  validateNotificationContent,
  validateReasonableDateRange,
  validateScheduleTime,
} from "../notificactionSchedule-validation";

describe("notificactionSchedule-validation", () => {
  describe("validateDateRange", () => {
    it("should not throw when end date is after start date", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-02");
      expect(() => validateDateRange(startDate, endDate)).not.toThrow();
    });

    it("should throw when end date equals start date", () => {
      const date = new Date("2024-01-01");
      expect(() => validateDateRange(date, date)).toThrow(ORPCError);
      expect(() => validateDateRange(date, date)).toThrow(
        "End date (2024-01-01T00:00:00.000Z) must be after start date (2024-01-01T00:00:00.000Z)",
      );
    });

    it("should throw when end date is before start date", () => {
      const startDate = new Date("2024-01-02");
      const endDate = new Date("2024-01-01");
      expect(() => validateDateRange(startDate, endDate)).toThrow(ORPCError);
      expect(() => validateDateRange(startDate, endDate)).toThrow(
        "End date (2024-01-01T00:00:00.000Z) must be after start date (2024-01-02T00:00:00.000Z)",
      );
    });
  });

  describe("validateFutureDates", () => {
    it("should not throw for future dates", () => {
      const now = new Date();
      const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const endDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      expect(() => validateFutureDates(startDate, endDate)).not.toThrow();
    });

    it("should throw when start date is in the past", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - MILLISECONDS_PER_DAY);
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      expect(() => validateFutureDates(pastDate, futureDate)).toThrow(ORPCError);
      expect(() => validateFutureDates(pastDate, futureDate)).toThrow("cannot be in the past");
    });

    it("should not throw for past start date when allowPastStart is true", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - MILLISECONDS_PER_DAY);
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      expect(() => validateFutureDates(pastDate, futureDate, true)).not.toThrow();
    });

    it("should throw when end date is in the past", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - MILLISECONDS_PER_DAY);
      expect(() => validateFutureDates(pastDate, pastDate)).toThrow(ORPCError);
      expect(() => validateFutureDates(pastDate, pastDate)).toThrow("cannot be in the past");
    });

    it("should throw when end date is in the past even with allowPastStart", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - MILLISECONDS_PER_DAY);
      expect(() => validateFutureDates(pastDate, pastDate, true)).toThrow(ORPCError);
    });
  });

  describe("validateScheduleTime", () => {
    // `hour`/`minute` are wall-clock values in the app's time zone, which is
    // what the phone's time picker produces. Reading them as UTC (the old
    // behaviour) shifted the check by the whole UTC offset.
    const wallClock = (date: Date) => getZonedParts(date);

    it("should not throw for time at least 5 minutes in the future", () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000);
      const { hour, minute } = wallClock(futureDate);
      expect(() => validateScheduleTime(futureDate, hour, minute)).not.toThrow();
    });

    it("should throw for time less than 5 minutes in the future", () => {
      const nearFuture = new Date(Date.now() + 2 * 60 * 1000);
      const { hour, minute } = wallClock(nearFuture);
      expect(() => validateScheduleTime(nearFuture, hour, minute)).toThrow(ORPCError);
      expect(() => validateScheduleTime(nearFuture, hour, minute)).toThrow(
        "at least 5 minutes in the future",
      );
    });

    it("should throw for past time", () => {
      const pastDate = new Date(Date.now() - 10 * 60 * 1000);
      const { hour, minute } = wallClock(pastDate);
      expect(() => validateScheduleTime(pastDate, hour, minute)).toThrow(ORPCError);
    });

    it("accepts an early-morning wall-clock time that UTC parsing would reject", () => {
      // 00:30 in Warsaw is 23:30 UTC the previous day. Stamping the hour onto
      // UTC moved the schedule back a whole day, so it always looked past.
      const target = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const { year, month, day } = getZonedParts(target);
      const startDate = zonedWallClockToUtc({ year, month, day, hour: 0, minute: 30 });
      expect(() => validateScheduleTime(startDate, 0, 30)).not.toThrow();
    });
  });

  describe("validateMinimumDuration", () => {
    it("should not throw for duration of at least 1 minute", () => {
      const startDate = new Date("2024-01-01T00:00:00");
      const endDate = new Date("2024-01-01T00:01:00");
      expect(() => validateMinimumDuration(startDate, endDate)).not.toThrow();
    });

    it("should not throw for duration longer than 1 minute", () => {
      const startDate = new Date("2024-01-01T00:00:00");
      const endDate = new Date("2024-01-01T00:05:00");
      expect(() => validateMinimumDuration(startDate, endDate)).not.toThrow();
    });

    it("should throw for duration less than 1 minute", () => {
      const startDate = new Date("2024-01-01T00:00:00");
      const endDate = new Date("2024-01-01T00:00:30");
      expect(() => validateMinimumDuration(startDate, endDate)).toThrow(ORPCError);
      expect(() => validateMinimumDuration(startDate, endDate)).toThrow("at least 1 minute");
    });

    it("should throw for zero duration", () => {
      const date = new Date("2024-01-01T00:00:00");
      expect(() => validateMinimumDuration(date, date)).toThrow(ORPCError);
    });
  });

  describe("validateNotificationContent", () => {
    it("should not throw for non-custom notification type", () => {
      expect(() => validateNotificationContent("ranking", "", "", "")).not.toThrow();
    });

    it("should not throw for custom notification with title and body", () => {
      expect(() => validateNotificationContent("custom", "Title", "Body", undefined)).not.toThrow();
    });

    it("should throw when custom notification has no title", () => {
      expect(() => validateNotificationContent("custom", "", "Body", undefined)).toThrow(ORPCError);
      expect(() => validateNotificationContent("custom", "", "Body", undefined)).toThrow(
        "Notification title is required",
      );
    });

    it("should throw when custom notification has whitespace-only title", () => {
      expect(() => validateNotificationContent("custom", "   ", "Body", undefined)).toThrow(
        ORPCError,
      );
    });

    it("should throw when custom notification has no body", () => {
      expect(() => validateNotificationContent("custom", "Title", "", undefined)).toThrow(
        ORPCError,
      );
      expect(() => validateNotificationContent("custom", "Title", "", undefined)).toThrow(
        "Notification body is required",
      );
    });

    it("should throw when custom notification has whitespace-only body", () => {
      expect(() => validateNotificationContent("custom", "Title", "   ", undefined)).toThrow(
        ORPCError,
      );
    });

    it("should not throw when URL is undefined", () => {
      expect(() => validateNotificationContent("custom", "Title", "Body", undefined)).not.toThrow();
    });

    it("should not throw when URL is null", () => {
      expect(() => validateNotificationContent("custom", "Title", "Body", undefined)).not.toThrow();
    });

    it("should not throw for valid absolute URL", () => {
      expect(() =>
        validateNotificationContent("custom", "Title", "Body", "https://example.com"),
      ).not.toThrow();
    });

    it("should not throw for valid path URL", () => {
      expect(() =>
        validateNotificationContent("custom", "Title", "Body", "/ranking"),
      ).not.toThrow();
    });

    it("should not throw for empty URL string", () => {
      expect(() => validateNotificationContent("custom", "Title", "Body", "")).not.toThrow();
    });

    it("should not throw for whitespace-only URL", () => {
      expect(() => validateNotificationContent("custom", "Title", "Body", "   ")).not.toThrow();
    });

    it("should throw for invalid URL", () => {
      expect(() =>
        validateNotificationContent("custom", "Title", "Body", "not-a-valid-url"),
      ).toThrow(ORPCError);
      expect(() =>
        validateNotificationContent("custom", "Title", "Body", "not-a-valid-url"),
      ).toThrow("valid URL or path");
    });

    it("should throw for URL with invalid protocol", () => {
      expect(() =>
        validateNotificationContent("custom", "Title", "Body", "ftp://example.com"),
      ).toThrow(ORPCError);
    });
  });

  describe("validateReasonableDateRange", () => {
    it("should not throw for reasonable future dates", () => {
      const now = new Date();
      const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(() => validateReasonableDateRange(startDate, endDate)).not.toThrow();
    });

    it("should throw when start date is in the past", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - MILLISECONDS_PER_DAY);
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      expect(() => validateReasonableDateRange(pastDate, futureDate)).toThrow(ORPCError);
      expect(() => validateReasonableDateRange(pastDate, futureDate)).toThrow(
        "Start date cannot be in the past",
      );
    });

    it("should not throw for past start date when allowPastStart is true", () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - MILLISECONDS_PER_DAY);
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      expect(() => validateReasonableDateRange(pastDate, futureDate, true)).not.toThrow();
    });

    it("should throw when end date is more than 1 year in the future", () => {
      const now = new Date();
      const startDate = new Date(now.getTime() + MILLISECONDS_PER_DAY);
      const endDate = new Date(now.getTime() + 366 * MILLISECONDS_PER_DAY);
      expect(() => validateReasonableDateRange(startDate, endDate)).toThrow(ORPCError);
      expect(() => validateReasonableDateRange(startDate, endDate)).toThrow(
        "cannot be more than 1 year",
      );
    });

    it("should not throw for end date exactly 1 year in the future", () => {
      const now = new Date();
      const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const oneYearFromNow = new Date(now);
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      expect(() => validateReasonableDateRange(startDate, oneYearFromNow)).not.toThrow();
    });
  });

  describe("notificationScheduleCreateSchema", () => {
    it("should validate valid create input", () => {
      const input = {
        name: "Test Schedule",
        tripId: "trip-123",
        notificationType: "custom" as const,
        notificationTitle: "Title",
        notificationBody: "Body",
        notificationUrl: "/path",
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        hour: 12,
        minute: 30,
        isActive: true,
      };
      expect(() => notificationScheduleCreateSchema.parse(input)).not.toThrow();
    });

    it("should validate with minimal required fields", () => {
      const input = {
        name: "Test",
        notificationType: "ranking" as const,
        notificationTitle: "",
        notificationBody: "",
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        hour: 0,
      };
      const result = notificationScheduleCreateSchema.parse(input);
      expect(result.minute).toBe(0);
      expect(result.isActive).toBe(true);
    });

    it("should reject name shorter than 3 characters", () => {
      const input = {
        name: "Te",
        notificationType: "custom" as const,
        startDate: new Date(),
        endDate: new Date(),
        hour: 12,
      };
      expect(() => notificationScheduleCreateSchema.parse(input)).toThrow();
    });

    it("should reject name longer than 100 characters", () => {
      const input = {
        name: "a".repeat(101),
        notificationType: "custom" as const,
        startDate: new Date(),
        endDate: new Date(),
        hour: 12,
      };
      expect(() => notificationScheduleCreateSchema.parse(input)).toThrow();
    });

    it("should reject invalid notification type", () => {
      const input = {
        name: "Test",
        notificationType: "invalid",
        startDate: new Date(),
        endDate: new Date(),
        hour: 12,
      };
      expect(() => notificationScheduleCreateSchema.parse(input)).toThrow();
    });

    it("should reject hour less than 0", () => {
      const input = {
        name: "Test",
        notificationType: "custom" as const,
        startDate: new Date(),
        endDate: new Date(),
        hour: -1,
      };
      expect(() => notificationScheduleCreateSchema.parse(input)).toThrow();
    });

    it("should reject hour greater than 23", () => {
      const input = {
        name: "Test",
        notificationType: "custom" as const,
        startDate: new Date(),
        endDate: new Date(),
        hour: 24,
      };
      expect(() => notificationScheduleCreateSchema.parse(input)).toThrow();
    });

    it("should reject minute less than 0", () => {
      const input = {
        name: "Test",
        notificationType: "custom" as const,
        startDate: new Date(),
        endDate: new Date(),
        hour: 12,
        minute: -1,
      };
      expect(() => notificationScheduleCreateSchema.parse(input)).toThrow();
    });

    it("should reject minute greater than 59", () => {
      const input = {
        name: "Test",
        notificationType: "custom" as const,
        startDate: new Date(),
        endDate: new Date(),
        hour: 12,
        minute: 60,
      };
      expect(() => notificationScheduleCreateSchema.parse(input)).toThrow();
    });
  });

  describe("notificationScheduleUpdateSchema", () => {
    it("should validate valid update input", () => {
      const input = {
        id: "schedule-123",
        name: "Updated Schedule",
        isActive: false,
      };
      expect(() => notificationScheduleUpdateSchema.parse(input)).not.toThrow();
    });

    it("should validate partial update", () => {
      const input = {
        id: "schedule-123",
        notificationTitle: "New Title",
      };
      expect(() => notificationScheduleUpdateSchema.parse(input)).not.toThrow();
    });

    it("should require id field", () => {
      const input = {
        name: "Updated Schedule",
      };
      expect(() => notificationScheduleUpdateSchema.parse(input)).toThrow();
    });
  });

  describe("paginationSchema", () => {
    it("should use default values", () => {
      const input = {};
      const result = paginationSchema.parse(input);
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    it("should accept custom values", () => {
      const input = { limit: 25, offset: 10 };
      const result = paginationSchema.parse(input);
      expect(result.limit).toBe(25);
      expect(result.offset).toBe(10);
    });

    it("should reject limit less than 1", () => {
      const input = { limit: 0 };
      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject limit greater than 100", () => {
      const input = { limit: 101 };
      expect(() => paginationSchema.parse(input)).toThrow();
    });

    it("should reject negative offset", () => {
      const input = { offset: -1 };
      expect(() => paginationSchema.parse(input)).toThrow();
    });
  });

  describe("filterSchema", () => {
    it("should validate empty filter", () => {
      const input = {};
      expect(() => filterSchema.parse(input)).not.toThrow();
    });

    it("should validate complete filter", () => {
      const input = {
        tripId: "trip-123",
        notificationType: "custom" as const,
        isActive: true,
        startDateFrom: new Date(),
        startDateTo: new Date(),
        search: "test query",
      };
      expect(() => filterSchema.parse(input)).not.toThrow();
    });

    it("should validate partial filter", () => {
      const input = {
        tripId: "trip-123",
      };
      expect(() => filterSchema.parse(input)).not.toThrow();
    });

    it("should reject invalid notification type", () => {
      const input = {
        notificationType: "invalid",
      };
      expect(() => filterSchema.parse(input)).toThrow();
    });
  });
});
