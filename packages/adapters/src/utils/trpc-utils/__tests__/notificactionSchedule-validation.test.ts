import { describe, expect, test } from "bun:test";
import {
  validateDateRange,
  validateFutureDates,
  validateScheduleTime,
  validateMinimumDuration,
  validateNotificationContent,
  validateReasonableDateRange,
  notificationScheduleCreateSchema,
  notificationScheduleUpdateSchema,
  paginationSchema,
  filterSchema,
} from "../notificactionSchedule-validation";

describe("[UNIT] notificactionSchedule-validation", () => {
  describe("validateDateRange", () => {
    test("does not throw for valid date range", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-02");
      expect(() => validateDateRange(startDate, endDate)).not.toThrow();
    });

    test("throws when end date equals start date", () => {
      const date = new Date("2024-01-01");
      expect(() => validateDateRange(date, date)).toThrow();
    });

    test("throws when end date is before start date", () => {
      const startDate = new Date("2024-01-02");
      const endDate = new Date("2024-01-01");
      expect(() => validateDateRange(startDate, endDate)).toThrow();
    });
  });

  describe("validateFutureDates", () => {
    test("does not throw for future dates", () => {
      const startDate = new Date(Date.now() + 86400000);
      const endDate = new Date(Date.now() + 172800000);
      expect(() => validateFutureDates(startDate, endDate)).not.toThrow();
    });

    test("throws when start date is in past", () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date(Date.now() + 86400000);
      expect(() => validateFutureDates(startDate, endDate)).toThrow();
    });

    test("throws when end date is in past", () => {
      const startDate = new Date(Date.now() - 172800000);
      const endDate = new Date(Date.now() - 86400000);
      expect(() => validateFutureDates(startDate, endDate)).toThrow();
    });

    test("allows past start when allowPastStart is true", () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date(Date.now() + 86400000);
      expect(() => validateFutureDates(startDate, endDate, true)).not.toThrow();
    });
  });

  describe("validateScheduleTime", () => {
    test("does not throw for schedule time more than 5 minutes in future", () => {
      const startDate = new Date(Date.now() + 600000);
      const hour = 23;
      const minute = 59;
      expect(() => validateScheduleTime(startDate, hour, minute)).not.toThrow();
    });
  });

  describe("validateMinimumDuration", () => {
    test("does not throw for duration of 1 minute or more", () => {
      const startDate = new Date("2024-01-01T00:00:00Z");
      const endDate = new Date("2024-01-01T00:01:00Z");
      expect(() => validateMinimumDuration(startDate, endDate)).not.toThrow();
    });

    test("throws for duration less than 1 minute", () => {
      const startDate = new Date("2024-01-01T00:00:00Z");
      const endDate = new Date("2024-01-01T00:00:30Z");
      expect(() => validateMinimumDuration(startDate, endDate)).toThrow();
    });
  });

  describe("validateNotificationContent", () => {
    test("does not throw for valid custom notification", () => {
      expect(() =>
        validateNotificationContent("custom", "Title", "Body", "/path"),
      ).not.toThrow();
    });

    test("throws for custom notification without title", () => {
      expect(() => validateNotificationContent("custom", "", "Body")).toThrow();
    });

    test("throws for custom notification without body", () => {
      expect(() =>
        validateNotificationContent("custom", "Title", ""),
      ).toThrow();
    });

    test("throws for whitespace-only title", () => {
      expect(() =>
        validateNotificationContent("custom", "   ", "Body"),
      ).toThrow();
    });

    test("does not throw for non-custom notification without content", () => {
      expect(() => validateNotificationContent("ranking")).not.toThrow();
    });

    test("accepts null URL for custom notification", () => {
      expect(() =>
        validateNotificationContent("custom", "Title", "Body", null),
      ).not.toThrow();
    });

    test("accepts empty URL for custom notification", () => {
      expect(() =>
        validateNotificationContent("custom", "Title", "Body", ""),
      ).not.toThrow();
    });

    test("accepts relative path URL", () => {
      expect(() =>
        validateNotificationContent("custom", "Title", "Body", "/ranking"),
      ).not.toThrow();
    });

    test("accepts valid absolute URL", () => {
      expect(() =>
        validateNotificationContent(
          "custom",
          "Title",
          "Body",
          "https://example.com/path",
        ),
      ).not.toThrow();
    });

    test("throws for invalid URL format", () => {
      expect(() =>
        validateNotificationContent(
          "custom",
          "Title",
          "Body",
          "not-a-valid-url",
        ),
      ).toThrow();
    });
  });

  describe("validateReasonableDateRange", () => {
    test("does not throw for dates within 1 year range", () => {
      const startDate = new Date(Date.now() + 60000);
      const endDate = new Date(Date.now() + 86400000 * 180);
      expect(() =>
        validateReasonableDateRange(startDate, endDate),
      ).not.toThrow();
    });

    test("throws when start date is in past", () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date(Date.now() + 86400000);
      expect(() => validateReasonableDateRange(startDate, endDate)).toThrow();
    });

    test("throws when end date is more than 1 year in future", () => {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 86400000 * 400);
      expect(() => validateReasonableDateRange(startDate, endDate)).toThrow();
    });

    test("allows past start when allowPastStart is true", () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date(Date.now() + 86400000 * 100);
      expect(() =>
        validateReasonableDateRange(startDate, endDate, true),
      ).not.toThrow();
    });
  });

  describe("notificationScheduleCreateSchema", () => {
    test("parses valid create schema", () => {
      const data = {
        name: "Test Schedule",
        notificationType: "custom",
        notificationTitle: "Title",
        notificationBody: "Body",
        notificationUrl: "/path",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        hour: 12,
        minute: 30,
        isActive: true,
      };

      const result = notificationScheduleCreateSchema.parse(data);
      expect(result.name).toBe("Test Schedule");
      expect(result.hour).toBe(12);
      expect(result.minute).toBe(30);
    });

    test("uses default values for minute and isActive", () => {
      const data = {
        name: "Test Schedule",
        notificationType: "custom",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        hour: 12,
      };

      const result = notificationScheduleCreateSchema.parse(data);
      expect(result.minute).toBe(0);
      expect(result.isActive).toBe(true);
    });

    test("throws for name too short", () => {
      const data = {
        name: "ab",
        notificationType: "custom",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        hour: 12,
      };

      expect(() => notificationScheduleCreateSchema.parse(data)).toThrow();
    });

    test("throws for name too long", () => {
      const data = {
        name: "a".repeat(101),
        notificationType: "custom",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        hour: 12,
      };

      expect(() => notificationScheduleCreateSchema.parse(data)).toThrow();
    });

    test("throws for invalid notificationType", () => {
      const data = {
        name: "Test Schedule",
        notificationType: "invalid",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        hour: 12,
      };

      expect(() => notificationScheduleCreateSchema.parse(data)).toThrow();
    });

    test("throws for hour out of range", () => {
      const data = {
        name: "Test Schedule",
        notificationType: "custom",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        hour: 25,
      };

      expect(() => notificationScheduleCreateSchema.parse(data)).toThrow();
    });

    test("throws for minute out of range", () => {
      const data = {
        name: "Test Schedule",
        notificationType: "custom",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        hour: 12,
        minute: 60,
      };

      expect(() => notificationScheduleCreateSchema.parse(data)).toThrow();
    });
  });

  describe("notificationScheduleUpdateSchema", () => {
    test("parses valid update schema with id", () => {
      const data = {
        id: "schedule-123",
        name: "Updated Name",
        notificationTitle: "New Title",
      };

      const result = notificationScheduleUpdateSchema.parse(data);
      expect(result.id).toBe("schedule-123");
      expect(result.name).toBe("Updated Name");
    });

    test("allows partial updates", () => {
      const data = { id: "schedule-123" };
      const result = notificationScheduleUpdateSchema.parse(data);
      expect(result.id).toBe("schedule-123");
      expect(result.name).toBeUndefined();
    });

    test("throws when id is missing", () => {
      const data = { name: "Updated Name" };
      expect(() => notificationScheduleUpdateSchema.parse(data)).toThrow();
    });
  });

  describe("paginationSchema", () => {
    test("uses default values", () => {
      const result = paginationSchema.parse({});
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });

    test("accepts valid pagination params", () => {
      const result = paginationSchema.parse({ limit: 20, offset: 10 });
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(10);
    });

    test("throws for limit below 1", () => {
      expect(() => paginationSchema.parse({ limit: 0 })).toThrow();
    });

    test("throws for limit above 100", () => {
      expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
    });

    test("throws for negative offset", () => {
      expect(() => paginationSchema.parse({ offset: -1 })).toThrow();
    });
  });

  describe("filterSchema", () => {
    test("accepts all optional filter fields", () => {
      const data = {
        tripId: "trip-123",
        notificationType: "custom" as const,
        isActive: true,
        startDateFrom: new Date(),
        startDateTo: new Date(),
        search: "test",
      };

      const result = filterSchema.parse(data);
      expect(result.tripId).toBe("trip-123");
      expect(result.notificationType).toBe("custom");
      expect(result.isActive).toBe(true);
    });

    test("accepts empty object", () => {
      const result = filterSchema.parse({});
      expect(result.tripId).toBeUndefined();
    });

    test("throws for invalid notificationType", () => {
      expect(() =>
        filterSchema.parse({ notificationType: "invalid" as any }),
      ).toThrow();
    });
  });
});
