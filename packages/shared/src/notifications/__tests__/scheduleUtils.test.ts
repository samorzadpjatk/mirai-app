import { describe, it, expect } from "vitest";
import { toOptionalString, attachCreatedByEmail, getNextScheduledStartDate, getTemplateScheduleDates, normalizeScheduleWindow } from "../scheduleUtils";

describe("toOptionalString", () => {
  it("returns undefined for null", () => {
    expect(toOptionalString(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(toOptionalString(undefined)).toBeUndefined();
  });

  it("returns the string for valid input", () => {
    expect(toOptionalString("hello")).toBe("hello");
  });

  it("returns undefined for empty string", () => {
    expect(toOptionalString("")).toBe("");
  });

  it("returns undefined for non-string values", () => {
    expect(toOptionalString(123)).toBeUndefined();
    expect(toOptionalString({})).toBeUndefined();
  });
});

describe("attachCreatedByEmail", () => {
  it("attaches email to createdBy when authUserId exists", () => {
    const schedule = {
      id: "1",
      createdBy: {
        id: "user-1",
        firstName: "Test",
        authUserId: "auth-123",
      },
    };
    const emailMap = new Map([["auth-123", "test@example.com"]]);
    const result = attachCreatedByEmail(schedule, emailMap);
    expect(result.createdBy).toEqual({
      id: "user-1",
      firstName: "Test",
      email: "test@example.com",
    });
  });

  it("returns schedule as-is when createdBy is null", () => {
    const schedule = { id: "1", createdBy: null };
    const emailMap = new Map();
    const result = attachCreatedByEmail(schedule, emailMap);
    expect(result).toEqual(schedule);
  });

  it("returns schedule as-is when createdBy is undefined", () => {
    const schedule = { id: "1" };
    const emailMap = new Map();
    const result = attachCreatedByEmail(schedule as any, emailMap);
    expect(result).toEqual(schedule);
  });

  it("returns null email when authUserId is null", () => {
    const schedule = {
      id: "1",
      createdBy: {
        id: "user-1",
        authUserId: null,
      },
    };
    const emailMap = new Map();
    const result = attachCreatedByEmail(schedule, emailMap);
    expect(result.createdBy).toEqual({
      id: "user-1",
      email: null,
    });
  });

  it("returns null email when authUserId not in map", () => {
    const schedule = {
      id: "1",
      createdBy: {
        id: "user-1",
        authUserId: "auth-456",
      },
    };
    const emailMap = new Map([["auth-123", "test@example.com"]]);
    const result = attachCreatedByEmail(schedule, emailMap);
    expect(result.createdBy).toEqual({
      id: "user-1",
      email: null,
    });
  });
});

describe("getNextScheduledStartDate", () => {
  it("returns the same day if time is in the future", () => {
    const now = new Date("2024-01-15T08:00:00Z");
    const result = getNextScheduledStartDate(10, 0, now);
    expect(result.getDate()).toBe(now.getDate());
    expect(result.getHours()).toBe(10);
    expect(result.getMinutes()).toBe(0);
  });

  it("returns next day if time is in the past", () => {
    const now = new Date("2024-01-15T12:00:00Z");
    const result = getNextScheduledStartDate(10, 0, now);
    expect(result.getDate()).toBe(now.getDate() + 1);
    expect(result.getHours()).toBe(10);
  });

  it("returns next day if time is within 5 minutes", () => {
    const now = new Date("2024-01-15T09:58:00Z");
    const result = getNextScheduledStartDate(10, 0, now);
    expect(result.getDate()).toBe(now.getDate() + 1);
  });
});

describe("getTemplateScheduleDates", () => {
  it("returns start date from getNextScheduledStartDate and end date one year later", () => {
    const now = new Date("2024-01-15T08:00:00Z");
    const template = {
      key: "daily_morning" as const,
      name: "Daily",
      hour: 9,
      minute: 0,
      notificationType: "custom" as const,
      notificationTitle: "Test",
      notificationBody: "Test",
      notificationUrl: "/test",
    };
    const result = getTemplateScheduleDates(template, now);
    expect(result.startDate.getHours()).toBe(9);
    expect(result.endDate.getFullYear()).toBe(now.getFullYear() + 1);
  });
});

describe("normalizeScheduleWindow", () => {
  it("normalizes start date to UTC with given hour/minute", () => {
    const startDate = new Date("2024-01-15T12:00:00Z");
    const endDate = new Date("2024-01-20T12:00:00Z");
    const result = normalizeScheduleWindow({
      startDate,
      endDate,
      hour: 9,
      minute: 30,
    });
    expect(result.startDate.getUTCHours()).toBe(9);
    expect(result.startDate.getUTCMinutes()).toBe(30);
  });

  it("preserves duration between start and end", () => {
    const startDate = new Date("2024-01-15T00:00:00Z");
    const endDate = new Date("2024-01-20T00:00:00Z");
    const result = normalizeScheduleWindow({
      startDate,
      endDate,
      hour: 12,
      minute: 0,
    });
    const durationMs = result.endDate.getTime() - result.startDate.getTime();
    expect(durationMs).toBe(5 * 24 * 60 * 60 * 1000);
  });

  it("returns hour and minute from normalized start date", () => {
    const startDate = new Date("2024-01-15T12:00:00Z");
    const endDate = new Date("2024-01-20T12:00:00Z");
    const result = normalizeScheduleWindow({
      startDate,
      endDate,
      hour: 14,
      minute: 45,
    });
    expect(result.hour).toBe(14);
    expect(result.minute).toBe(45);
  });
});
