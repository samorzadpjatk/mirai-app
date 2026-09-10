import { describe, expect, it } from "vitest";
import {
  APP_TIME_ZONE,
  getTimeZoneOffsetMs,
  getZonedParts,
  previousZonedDayAtTime,
  zonedDateAtTime,
  zonedDateKey,
  zonedWallClockToUtc,
} from "../timezone";

const HOUR_MS = 60 * 60 * 1000;

describe("APP_TIME_ZONE", () => {
  it("is the zone admins actually pick times in", () => {
    expect(APP_TIME_ZONE).toBe("Europe/Warsaw");
  });
});

describe("getZonedParts", () => {
  it("reads wall-clock fields in the target zone", () => {
    expect(getZonedParts(new Date("2024-01-15T08:30:00Z"))).toEqual({
      year: 2024,
      month: 1,
      day: 15,
      hour: 9,
      minute: 30,
      second: 0,
    });
  });

  it("renders midnight as hour 0, not 24", () => {
    expect(getZonedParts(new Date("2024-01-14T23:00:00Z")).hour).toBe(0);
    expect(getZonedParts(new Date("2024-01-14T23:00:00Z")).day).toBe(15);
  });
});

describe("getTimeZoneOffsetMs", () => {
  it("returns +1h in winter and +2h in summer", () => {
    expect(getTimeZoneOffsetMs(new Date("2024-01-15T12:00:00Z"))).toBe(HOUR_MS);
    expect(getTimeZoneOffsetMs(new Date("2024-07-15T12:00:00Z"))).toBe(2 * HOUR_MS);
  });

  it("returns zero for UTC", () => {
    expect(getTimeZoneOffsetMs(new Date("2024-07-15T12:00:00Z"), "UTC")).toBe(0);
  });
});

describe("zonedWallClockToUtc", () => {
  it("converts a winter wall-clock time", () => {
    const result = zonedWallClockToUtc({
      year: 2024,
      month: 1,
      day: 15,
      hour: 7,
      minute: 30,
    });
    expect(result.toISOString()).toBe("2024-01-15T06:30:00.000Z");
  });

  it("converts a summer wall-clock time with the DST offset", () => {
    const result = zonedWallClockToUtc({
      year: 2024,
      month: 7,
      day: 15,
      hour: 7,
      minute: 30,
    });
    expect(result.toISOString()).toBe("2024-07-15T05:30:00.000Z");
  });

  it("round-trips through getZonedParts on the spring-forward day", () => {
    // Warsaw jumps 02:00 -> 03:00 on 2024-03-31.
    const result = zonedWallClockToUtc({
      year: 2024,
      month: 3,
      day: 31,
      hour: 7,
      minute: 0,
    });
    expect(getZonedParts(result)).toMatchObject({ day: 31, hour: 7, minute: 0 });
  });

  it("round-trips on the autumn fall-back day", () => {
    // Warsaw goes 03:00 -> 02:00 on 2024-10-27.
    const result = zonedWallClockToUtc({
      year: 2024,
      month: 10,
      day: 27,
      hour: 18,
      minute: 0,
    });
    expect(getZonedParts(result)).toMatchObject({ day: 27, hour: 18, minute: 0 });
  });

  it("lands inside the day for a time skipped by the spring-forward gap", () => {
    // 02:30 does not exist on 2024-03-31 in Warsaw.
    const result = zonedWallClockToUtc({
      year: 2024,
      month: 3,
      day: 31,
      hour: 2,
      minute: 30,
    });
    expect(getZonedParts(result).day).toBe(31);
    expect(getZonedParts(result).hour).toBe(3);
  });
});

describe("zonedDateAtTime", () => {
  it("uses the zone-local calendar day of the reference instant", () => {
    // 23:10 UTC on 14 Jan is already 15 Jan in Warsaw.
    const result = zonedDateAtTime(new Date("2024-01-14T23:10:00Z"), 7, 30);
    expect(result.toISOString()).toBe("2024-01-15T06:30:00.000Z");
  });
});

describe("zonedDateKey", () => {
  it("is a zero-padded, lexicographically sortable zone-local day", () => {
    expect(zonedDateKey(new Date("2024-01-14T23:10:00Z"))).toBe("2024-01-15");
    expect(zonedDateKey(new Date("2024-09-05T21:00:00Z"))).toBe("2024-09-05");
  });

  it("sorts in chronological order", () => {
    const earlier = zonedDateKey(new Date("2024-01-09T12:00:00Z"));
    const later = zonedDateKey(new Date("2024-01-10T12:00:00Z"));
    expect(earlier < later).toBe(true);
  });
});

describe("previousZonedDayAtTime", () => {
  it("steps back exactly one zone-local day", () => {
    const result = previousZonedDayAtTime(new Date("2024-01-15T09:00:00Z"), 7, 30);
    expect(result.toISOString()).toBe("2024-01-14T06:30:00.000Z");
  });

  it("stays on the previous calendar day across a DST change", () => {
    // 2024-10-27 is the fall-back day; a naive -24h from early on the 28th
    // could otherwise land back on the 28th.
    const result = previousZonedDayAtTime(new Date("2024-10-28T05:00:00Z"), 7, 30);
    expect(zonedDateKey(result)).toBe("2024-10-27");
    expect(getZonedParts(result)).toMatchObject({ hour: 7, minute: 30 });
  });
});
