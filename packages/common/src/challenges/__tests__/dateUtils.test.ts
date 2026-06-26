import { describe, expect, it } from "vitest";
import {
  addDays,
  DAY_MS,
  endOfDay,
  HOUR_MS,
  inferPeerVotingDurationHours,
  inferRecurringDaysFromWindow,
  MAX_PEER_VOTING_DURATION_HOURS,
  MAX_RECURRING_DAYS,
  resolvePeerVotingTemplateWindow,
  resolveRecurringDays,
  resolveRecurringTemplateWindow,
  startOfDay,
} from "../dateUtils";

describe("startOfDay", () => {
  it("resets time to midnight", () => {
    const date = new Date("2024-06-15T14:30:45.500Z");
    const result = startOfDay(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("does not mutate input", () => {
    const date = new Date("2024-06-15T14:30:00Z");
    const original = new Date(date);
    startOfDay(date);
    expect(date.getTime()).toBe(original.getTime());
  });
});

describe("endOfDay", () => {
  it("sets time to end of day", () => {
    const date = new Date("2024-06-15T08:00:00.000Z");
    const result = endOfDay(date);
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it("does not mutate input", () => {
    const date = new Date("2024-06-15T08:00:00Z");
    const original = new Date(date);
    endOfDay(date);
    expect(date.getTime()).toBe(original.getTime());
  });
});

describe("addDays", () => {
  it("adds days to a date", () => {
    const date = new Date("2024-06-15T00:00:00Z");
    const result = addDays(date, 5);
    expect(result.getDate()).toBe(20);
  });

  it("subtracts days when negative", () => {
    const date = new Date("2024-06-15T00:00:00Z");
    const result = addDays(date, -3);
    expect(result.getDate()).toBe(12);
  });

  it("does not mutate input", () => {
    const date = new Date("2024-06-15T00:00:00Z");
    const original = new Date(date);
    addDays(date, 5);
    expect(date.getTime()).toBe(original.getTime());
  });
});

describe("inferRecurringDaysFromWindow", () => {
  it("returns null when startTime is missing", () => {
    expect(inferRecurringDaysFromWindow(null, new Date())).toBeNull();
    expect(inferRecurringDaysFromWindow(undefined, new Date())).toBeNull();
  });

  it("returns null when endTime is missing", () => {
    expect(inferRecurringDaysFromWindow(new Date(), null)).toBeNull();
    expect(inferRecurringDaysFromWindow(new Date(), undefined)).toBeNull();
  });

  it("returns null when end is before start", () => {
    const start = new Date("2024-06-15T00:00:00Z");
    const end = new Date("2024-06-14T00:00:00Z");
    expect(inferRecurringDaysFromWindow(start, end)).toBeNull();
  });

  it("calculates 1 day for same day", () => {
    const start = new Date("2024-06-15T08:00:00Z");
    const end = new Date("2024-06-15T20:00:00Z");
    expect(inferRecurringDaysFromWindow(start, end)).toBe(1);
  });

  it("calculates 3 days for 2-day span", () => {
    const start = new Date("2024-06-15T00:00:00Z");
    const end = new Date("2024-06-17T00:00:00Z");
    expect(inferRecurringDaysFromWindow(start, end)).toBe(3);
  });
});

describe("resolveRecurringDays", () => {
  it("returns null when not recurring", () => {
    expect(resolveRecurringDays({ isRecurring: false })).toBeNull();
    expect(resolveRecurringDays({ isRecurring: null })).toBeNull();
    expect(resolveRecurringDays({ isRecurring: undefined })).toBeNull();
  });

  it("returns recurringDays when provided and valid", () => {
    expect(resolveRecurringDays({ isRecurring: true, recurringDays: 5 })).toBe(5);
  });

  it("returns fallbackDays when recurringDays is missing", () => {
    expect(resolveRecurringDays({ isRecurring: true, fallbackDays: 7 })).toBe(7);
  });

  it("prefers recurringDays over fallbackDays", () => {
    expect(resolveRecurringDays({ isRecurring: true, recurringDays: 3, fallbackDays: 7 })).toBe(3);
  });

  it("returns null for invalid values", () => {
    expect(resolveRecurringDays({ isRecurring: true, recurringDays: 0 })).toBeNull();
    expect(resolveRecurringDays({ isRecurring: true, recurringDays: -1 })).toBeNull();
    expect(resolveRecurringDays({ isRecurring: true, recurringDays: 1.5 })).toBeNull();
    expect(
      resolveRecurringDays({ isRecurring: true, recurringDays: MAX_RECURRING_DAYS + 1 }),
    ).toBeNull();
  });

  it("returns null when both recurringDays and fallbackDays are invalid", () => {
    expect(
      resolveRecurringDays({ isRecurring: true, recurringDays: 0, fallbackDays: -1 }),
    ).toBeNull();
  });
});

describe("resolveRecurringTemplateWindow", () => {
  it("creates window from anchor date", () => {
    const anchor = new Date("2024-06-15T12:00:00Z");
    const result = resolveRecurringTemplateWindow({ anchorDate: anchor, recurringDays: 3 });

    expect(result.startTime).toEqual(startOfDay(anchor));
    expect(result.endTime).toEqual(endOfDay(addDays(startOfDay(anchor), 2)));
  });

  it("creates single-day window", () => {
    const anchor = new Date("2024-06-15T08:00:00Z");
    const result = resolveRecurringTemplateWindow({ anchorDate: anchor, recurringDays: 1 });

    expect(result.startTime).toEqual(startOfDay(anchor));
    expect(result.endTime).toEqual(endOfDay(startOfDay(anchor)));
  });
});

describe("inferPeerVotingDurationHours", () => {
  it("returns votingDurationHours when provided", () => {
    expect(inferPeerVotingDurationHours({ votingDurationHours: 5 })).toBe(5);
  });

  it("returns null when no duration or window provided", () => {
    expect(inferPeerVotingDurationHours({})).toBeNull();
    expect(inferPeerVotingDurationHours({ votingDurationHours: null })).toBeNull();
  });

  it("calculates from voting window", () => {
    const start = new Date("2024-06-15T08:00:00Z");
    const end = new Date("2024-06-15T14:00:00Z");
    expect(inferPeerVotingDurationHours({ votingStartTime: start, votingEndTime: end })).toBe(6);
  });

  it("uses fallback window when primary is missing", () => {
    const start = new Date("2024-06-15T08:00:00Z");
    const end = new Date("2024-06-15T10:00:00Z");
    expect(
      inferPeerVotingDurationHours({
        fallbackVotingStartTime: start,
        fallbackVotingEndTime: end,
      }),
    ).toBe(2);
  });

  it("prefers primary window over fallback", () => {
    const primaryStart = new Date("2024-06-15T08:00:00Z");
    const primaryEnd = new Date("2024-06-15T10:00:00Z");
    const fallbackStart = new Date("2024-06-15T12:00:00Z");
    const fallbackEnd = new Date("2024-06-15T16:00:00Z");
    expect(
      inferPeerVotingDurationHours({
        votingStartTime: primaryStart,
        votingEndTime: primaryEnd,
        fallbackVotingStartTime: fallbackStart,
        fallbackVotingEndTime: fallbackEnd,
      }),
    ).toBe(2);
  });

  it("returns null for non-positive duration", () => {
    const start = new Date("2024-06-15T14:00:00Z");
    const end = new Date("2024-06-15T08:00:00Z");
    expect(inferPeerVotingDurationHours({ votingStartTime: start, votingEndTime: end })).toBeNull();
  });

  it("returns at least 1 hour for positive short durations", () => {
    const start = new Date("2024-06-15T08:00:00Z");
    const end = new Date("2024-06-15T08:30:00Z");
    expect(inferPeerVotingDurationHours({ votingStartTime: start, votingEndTime: end })).toBe(1);
  });
});

describe("resolvePeerVotingTemplateWindow", () => {
  it("creates window from submission end time", () => {
    const submissionEnd = new Date("2024-06-15T18:00:00Z");
    const result = resolvePeerVotingTemplateWindow({
      submissionEndTime: submissionEnd,
      votingDurationHours: 4,
    });

    expect(result.votingStartTime).toEqual(submissionEnd);
    expect(result.votingEndTime).toEqual(new Date(submissionEnd.getTime() + 4 * HOUR_MS));
  });
});

describe("constants", () => {
  it("has correct constant values", () => {
    expect(HOUR_MS).toBe(60 * 60 * 1000);
    expect(DAY_MS).toBe(24 * 60 * 60 * 1000);
    expect(MAX_PEER_VOTING_DURATION_HOURS).toBe(24 * 30);
    expect(MAX_RECURRING_DAYS).toBe(30);
  });
});
