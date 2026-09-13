import { describe, expect, it } from "vitest";
import { getZonedParts } from "../../utils/timezone";
import {
  attachCreatedByEmail,
  getNextScheduledStartDate,
  getTemplateScheduleDates,
  normalizeScheduleWindow,
  toOptionalString,
} from "../scheduleUtils";

// Hours and minutes are Europe/Warsaw wall-clock values, so assertions read
// them back in that zone rather than through the process time zone.
const warsaw = (date: Date) => getZonedParts(date, "Europe/Warsaw");

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
    const schedule = {};
    const emailMap = new Map();
    const result = attachCreatedByEmail(schedule, emailMap);
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
    // 08:00 UTC is 09:00 in Warsaw (winter, UTC+1).
    const now = new Date("2024-01-15T08:00:00Z");
    const result = getNextScheduledStartDate(10, 0, now);
    expect(warsaw(result)).toMatchObject({ day: 15, hour: 10, minute: 0 });
    expect(result.toISOString()).toBe("2024-01-15T09:00:00.000Z");
  });

  it("returns next day if time is in the past", () => {
    const now = new Date("2024-01-15T12:00:00Z");
    const result = getNextScheduledStartDate(10, 0, now);
    expect(warsaw(result)).toMatchObject({ day: 16, hour: 10 });
  });

  it("returns next day if time is within 5 minutes", () => {
    // 08:58 UTC is 09:58 in Warsaw.
    const now = new Date("2024-01-15T08:58:00Z");
    const result = getNextScheduledStartDate(10, 0, now);
    expect(warsaw(result)).toMatchObject({ day: 16, hour: 10 });
  });

  it("resolves the wall-clock hour with the summer offset", () => {
    const now = new Date("2024-07-15T04:00:00Z");
    const result = getNextScheduledStartDate(10, 0, now);
    // Warsaw is UTC+2 in July.
    expect(result.toISOString()).toBe("2024-07-15T08:00:00.000Z");
  });

  it("rolls over month ends", () => {
    const now = new Date("2024-01-31T23:00:00Z");
    const result = getNextScheduledStartDate(1, 0, now);
    expect(warsaw(result)).toMatchObject({ year: 2024, month: 2, day: 1, hour: 1 });
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
    expect(warsaw(result.startDate).hour).toBe(9);
    expect(result.endDate.getFullYear()).toBe(now.getFullYear() + 1);
  });
});

describe("normalizeScheduleWindow", () => {
  it("interprets hour/minute as Europe/Warsaw wall clock, not UTC", () => {
    const startDate = new Date("2024-01-15T12:00:00Z");
    const endDate = new Date("2024-01-20T12:00:00Z");
    const result = normalizeScheduleWindow({
      startDate,
      endDate,
      hour: 9,
      minute: 30,
    });
    // Winter offset is +1, so 09:30 Warsaw is 08:30 UTC. The old
    // implementation produced 09:30 UTC, i.e. 10:30 Warsaw — one hour late.
    expect(result.startDate.toISOString()).toBe("2024-01-15T08:30:00.000Z");
    expect(warsaw(result.startDate)).toMatchObject({ hour: 9, minute: 30 });
  });

  it("uses the summer offset for summer dates", () => {
    const startDate = new Date("2024-07-15T12:00:00Z");
    const endDate = new Date("2024-07-20T12:00:00Z");
    const result = normalizeScheduleWindow({ startDate, endDate, hour: 13, minute: 0 });
    // Warsaw is UTC+2 in July: two hours, not the one that applies in January.
    expect(result.startDate.toISOString()).toBe("2024-07-15T11:00:00.000Z");
  });

  it("keeps an early-morning pick on its own day instead of rolling it back", () => {
    // 00:30 Warsaw on 15 Jan is 23:30 UTC on 14 Jan. Stamping the hour onto UTC
    // moved the schedule to 00:30 UTC on 14 Jan — a day in the past, which the
    // "start date cannot be in the past" check then rejected outright.
    const startDate = new Date("2024-01-14T23:30:00Z");
    const endDate = new Date("2024-01-14T23:32:00Z");
    const result = normalizeScheduleWindow({ startDate, endDate, hour: 0, minute: 30 });
    expect(result.startDate.toISOString()).toBe("2024-01-14T23:30:00.000Z");
    expect(warsaw(result.startDate)).toMatchObject({ day: 15, hour: 0, minute: 30 });
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

  it("returns the wall-clock hour and minute unchanged", () => {
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
