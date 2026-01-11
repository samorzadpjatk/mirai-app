import { describe, it, expect, beforeEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  validateDateRange,
  validateFutureDates,
  validateScheduleTime,
  validateMinimumDuration,
  validateNotificationContent,
  validateReasonableDateRange,
} from "../validation";

describe("Notification Schedule Validation", () => {
  let mockNow: Date;

  beforeEach(() => {
    // Set a consistent "now" for all tests
    mockNow = new Date("2026-01-10T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  describe("validateDateRange", () => {
    it("should pass when end date is after start date", () => {
      const startDate = new Date("2026-01-15T10:00:00.000Z");
      const endDate = new Date("2026-01-20T10:00:00.000Z");

      expect(() => validateDateRange(startDate, endDate)).not.toThrow();
    });

    it("should throw when end date equals start date", () => {
      const startDate = new Date("2026-01-15T10:00:00.000Z");
      const endDate = new Date("2026-01-15T10:00:00.000Z");

      expect(() => validateDateRange(startDate, endDate)).toThrow(TRPCError);
      expect(() => validateDateRange(startDate, endDate)).toThrow(
        /End date .* must be after start date/,
      );
    });

    it("should throw when end date is before start date", () => {
      const startDate = new Date("2026-01-20T10:00:00.000Z");
      const endDate = new Date("2026-01-15T10:00:00.000Z");

      expect(() => validateDateRange(startDate, endDate)).toThrow(TRPCError);
    });
  });

  describe("validateFutureDates", () => {
    it("should pass when both dates are in the future", () => {
      const startDate = new Date("2026-01-15T10:00:00.000Z");
      const endDate = new Date("2026-01-20T10:00:00.000Z");

      expect(() => validateFutureDates(startDate, endDate)).not.toThrow();
    });

    it("should throw when start date is in the past", () => {
      const startDate = new Date("2026-01-05T10:00:00.000Z");
      const endDate = new Date("2026-01-20T10:00:00.000Z");

      expect(() => validateFutureDates(startDate, endDate)).toThrow(TRPCError);
      expect(() => validateFutureDates(startDate, endDate)).toThrow(
        /Start date .* cannot be in the past/,
      );
    });

    it("should allow past start date when allowPastStart is true", () => {
      const startDate = new Date("2026-01-05T10:00:00.000Z");
      const endDate = new Date("2026-01-20T10:00:00.000Z");

      expect(() => validateFutureDates(startDate, endDate, true)).not.toThrow();
    });

    it("should throw when end date is in the past", () => {
      const startDate = new Date("2026-01-15T10:00:00.000Z");
      const endDate = new Date("2026-01-05T10:00:00.000Z");

      expect(() => validateFutureDates(startDate, endDate)).toThrow(TRPCError);
      expect(() => validateFutureDates(startDate, endDate)).toThrow(
        /End date .* cannot be in the past/,
      );
    });

    it("should throw when end date is in the past even with allowPastStart", () => {
      const startDate = new Date("2026-01-05T10:00:00.000Z");
      const endDate = new Date("2026-01-08T10:00:00.000Z");

      expect(() => validateFutureDates(startDate, endDate, true)).toThrow(
        TRPCError,
      );
    });
  });

  describe("validateScheduleTime", () => {
    it("should pass when schedule time is more than 5 minutes in the future", () => {
      const startDate = new Date("2026-01-11T12:10:00.000Z"); // Next day
      const hour = 12;
      const minute = 10;

      expect(() => validateScheduleTime(startDate, hour, minute)).not.toThrow();
    });

    it("should throw when schedule time is less than 5 minutes in the future", () => {
      const startDate = new Date("2026-01-10T12:02:00.000Z");
      const hour = 12;
      const minute = 2;

      expect(() => validateScheduleTime(startDate, hour, minute)).toThrow(
        TRPCError,
      );
      expect(() => validateScheduleTime(startDate, hour, minute)).toThrow(
        /Schedule time .* must be at least 5 minutes in the future/,
      );
    });

    it("should throw when schedule time is in the past", () => {
      const startDate = new Date("2026-01-10T11:00:00.000Z");
      const hour = 11;
      const minute = 0;

      expect(() => validateScheduleTime(startDate, hour, minute)).toThrow(
        TRPCError,
      );
    });

    it("should pass when schedule is far in the future", () => {
      const startDate = new Date("2026-02-10T14:30:00.000Z");
      const hour = 14;
      const minute = 30;

      expect(() => validateScheduleTime(startDate, hour, minute)).not.toThrow();
    });
  });

  describe("validateMinimumDuration", () => {
    it("should pass when duration is exactly 24 hours", () => {
      const startDate = new Date("2026-01-15T10:00:00.000Z");
      const endDate = new Date("2026-01-16T10:00:00.000Z");

      expect(() => validateMinimumDuration(startDate, endDate)).not.toThrow();
    });

    it("should pass when duration is more than 24 hours", () => {
      const startDate = new Date("2026-01-15T10:00:00.000Z");
      const endDate = new Date("2026-01-20T10:00:00.000Z");

      expect(() => validateMinimumDuration(startDate, endDate)).not.toThrow();
    });

    it("should throw when duration is less than 24 hours", () => {
      const startDate = new Date("2026-01-15T10:00:00.000Z");
      const endDate = new Date("2026-01-15T20:00:00.000Z"); // Only 10 hours

      expect(() => validateMinimumDuration(startDate, endDate)).toThrow(
        TRPCError,
      );
      expect(() => validateMinimumDuration(startDate, endDate)).toThrow(
        /Schedule must run for at least 24 hours/,
      );
    });

    it("should throw when duration is just under 24 hours", () => {
      const startDate = new Date("2026-01-15T10:00:00.000Z");
      const endDate = new Date("2026-01-16T09:59:00.000Z");

      expect(() => validateMinimumDuration(startDate, endDate)).toThrow(
        TRPCError,
      );
    });
  });

  describe("validateNotificationContent", () => {
    describe("for custom notifications", () => {
      it("should pass when all required fields are provided", () => {
        expect(() =>
          validateNotificationContent(
            "custom",
            "Test Title",
            "Test Body",
            "/test",
          ),
        ).not.toThrow();
      });

      it("should throw when title is missing", () => {
        expect(() =>
          validateNotificationContent(
            "custom",
            undefined,
            "Test Body",
            "/test",
          ),
        ).toThrow(TRPCError);
        expect(() =>
          validateNotificationContent(
            "custom",
            undefined,
            "Test Body",
            "/test",
          ),
        ).toThrow(/Notification title is required/);
      });

      it("should throw when title is empty string", () => {
        expect(() =>
          validateNotificationContent("custom", "", "Test Body", "/test"),
        ).toThrow(TRPCError);
      });

      it("should throw when title is only whitespace", () => {
        expect(() =>
          validateNotificationContent("custom", "   ", "Test Body", "/test"),
        ).toThrow(TRPCError);
      });

      it("should throw when body is missing", () => {
        expect(() =>
          validateNotificationContent(
            "custom",
            "Test Title",
            undefined,
            "/test",
          ),
        ).toThrow(TRPCError);
        expect(() =>
          validateNotificationContent(
            "custom",
            "Test Title",
            undefined,
            "/test",
          ),
        ).toThrow(/Notification body is required/);
      });

      it("should throw when body is empty string", () => {
        expect(() =>
          validateNotificationContent("custom", "Test Title", "", "/test"),
        ).toThrow(TRPCError);
      });

      it("should throw when body is only whitespace", () => {
        expect(() =>
          validateNotificationContent("custom", "Test Title", "   ", "/test"),
        ).toThrow(TRPCError);
      });

      it("should pass when URL is not provided", () => {
        expect(() =>
          validateNotificationContent(
            "custom",
            "Test Title",
            "Test Body",
            undefined,
          ),
        ).not.toThrow();
      });

      it("should pass when URL is empty string", () => {
        expect(() =>
          validateNotificationContent("custom", "Test Title", "Test Body", ""),
        ).not.toThrow();
      });

      it("should pass with valid relative path URL", () => {
        expect(() =>
          validateNotificationContent(
            "custom",
            "Test Title",
            "Test Body",
            "/notifications",
          ),
        ).not.toThrow();
      });

      it("should pass with valid absolute URL", () => {
        expect(() =>
          validateNotificationContent(
            "custom",
            "Test Title",
            "Test Body",
            "https://example.com/path",
          ),
        ).not.toThrow();
      });

      it("should throw when URL is invalid format", () => {
        expect(() =>
          validateNotificationContent(
            "custom",
            "Test Title",
            "Test Body",
            "not-a-valid-url",
          ),
        ).toThrow(TRPCError);
        expect(() =>
          validateNotificationContent(
            "custom",
            "Test Title",
            "Test Body",
            "not-a-valid-url",
          ),
        ).toThrow(/must be a valid URL/);
      });

      it("should throw when all required fields are missing", () => {
        expect(() =>
          validateNotificationContent(
            "custom",
            undefined,
            undefined,
            undefined,
          ),
        ).toThrow(TRPCError);
      });
    });

    describe("for ranking notifications", () => {
      it("should pass without requiring custom fields", () => {
        expect(() =>
          validateNotificationContent(
            "ranking",
            undefined,
            undefined,
            undefined,
          ),
        ).not.toThrow();
      });

      it("should pass even with empty strings", () => {
        expect(() =>
          validateNotificationContent("ranking", "", "", ""),
        ).not.toThrow();
      });
    });

    describe("for other notification types", () => {
      it("should pass without validation", () => {
        expect(() =>
          validateNotificationContent("other", undefined, undefined, undefined),
        ).not.toThrow();
      });
    });
  });

  describe("validateReasonableDateRange", () => {
    it("should pass when dates are in reasonable range", () => {
      const startDate = new Date("2026-01-15T10:00:00.000Z");
      const endDate = new Date("2026-06-15T10:00:00.000Z");

      expect(() =>
        validateReasonableDateRange(startDate, endDate),
      ).not.toThrow();
    });

    it("should throw when start date is in the past", () => {
      const startDate = new Date("2026-01-05T10:00:00.000Z");
      const endDate = new Date("2026-06-15T10:00:00.000Z");

      expect(() => validateReasonableDateRange(startDate, endDate)).toThrow(
        TRPCError,
      );
      expect(() => validateReasonableDateRange(startDate, endDate)).toThrow(
        /Start date cannot be in the past/,
      );
    });

    it("should throw when end date is more than 1 year in the future", () => {
      const startDate = new Date("2026-01-15T10:00:00.000Z");
      const endDate = new Date("2027-02-15T10:00:00.000Z");

      expect(() => validateReasonableDateRange(startDate, endDate)).toThrow(
        TRPCError,
      );
      expect(() => validateReasonableDateRange(startDate, endDate)).toThrow(
        /End date cannot be more than 1 year in the future/,
      );
    });

    it("should pass when end date is exactly 1 year from now", () => {
      const startDate = new Date("2026-01-15T10:00:00.000Z");
      const endDate = new Date("2027-01-10T11:59:59.000Z");

      expect(() =>
        validateReasonableDateRange(startDate, endDate),
      ).not.toThrow();
    });

    it("should pass when both dates are just in the future", () => {
      const startDate = new Date("2026-01-10T12:10:00.000Z");
      const endDate = new Date("2026-01-11T12:10:00.000Z");

      expect(() =>
        validateReasonableDateRange(startDate, endDate),
      ).not.toThrow();
    });
  });
});
