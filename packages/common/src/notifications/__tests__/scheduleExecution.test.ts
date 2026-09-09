import { describe, expect, it } from "vitest";
import type { ExecutableSchedule } from "../scheduleExecution";
import {
  DEFAULT_SCHEDULE_GRACE_MINUTES,
  DEFAULT_SCHEDULE_INTERVAL_MINUTES,
  resolveDueOccurrence,
} from "../scheduleExecution";

function buildSchedule(overrides: Partial<ExecutableSchedule> = {}): ExecutableSchedule {
  return {
    id: "schedule-1",
    // 07:30 Europe/Warsaw, i.e. 06:30 UTC in winter.
    hour: 7,
    minute: 30,
    startDate: new Date("2024-01-01T06:30:00Z"),
    endDate: new Date("2025-01-01T06:30:00Z"),
    isActive: true,
    lastRun: null,
    ...overrides,
  };
}

describe("scheduler defaults", () => {
  it("keeps the tick interval well inside the grace window", () => {
    expect(DEFAULT_SCHEDULE_INTERVAL_MINUTES).toBeLessThan(DEFAULT_SCHEDULE_GRACE_MINUTES);
  });
});

describe("resolveDueOccurrence", () => {
  it("fires at the wall-clock time in Europe/Warsaw", () => {
    const occurrence = resolveDueOccurrence(buildSchedule(), {
      now: new Date("2024-01-15T06:31:00Z"),
    });
    expect(occurrence?.toISOString()).toBe("2024-01-15T06:30:00.000Z");
  });

  it("uses the summer offset in summer", () => {
    const occurrence = resolveDueOccurrence(buildSchedule(), {
      now: new Date("2024-07-15T05:31:00Z"),
    });
    // 07:30 Warsaw is 05:30 UTC in July.
    expect(occurrence?.toISOString()).toBe("2024-07-15T05:30:00.000Z");
  });

  it("does not fire before the occurrence", () => {
    expect(
      resolveDueOccurrence(buildSchedule(), { now: new Date("2024-01-15T06:29:00Z") }),
    ).toBeNull();
  });

  it("still fires a tick that arrives late, inside the grace window", () => {
    const occurrence = resolveDueOccurrence(buildSchedule(), {
      now: new Date("2024-01-15T06:44:00Z"),
      graceMinutes: 15,
    });
    expect(occurrence?.toISOString()).toBe("2024-01-15T06:30:00.000Z");
  });

  it("gives up once the grace window has passed", () => {
    expect(
      resolveDueOccurrence(buildSchedule(), {
        now: new Date("2024-01-15T06:46:00Z"),
        graceMinutes: 15,
      }),
    ).toBeNull();
  });

  it("does not fire the same occurrence twice", () => {
    const occurrence = resolveDueOccurrence(
      buildSchedule({ lastRun: new Date("2024-01-15T06:31:00Z") }),
      { now: new Date("2024-01-15T06:35:00Z") },
    );
    expect(occurrence).toBeNull();
  });

  it("fires again the next day after a previous run", () => {
    const occurrence = resolveDueOccurrence(
      buildSchedule({ lastRun: new Date("2024-01-15T06:31:00Z") }),
      { now: new Date("2024-01-16T06:31:00Z") },
    );
    expect(occurrence?.toISOString()).toBe("2024-01-16T06:30:00.000Z");
  });

  it("looks back across midnight for a late-evening schedule", () => {
    // 23:45 Warsaw on 15 Jan is 22:45 UTC; at 22:55 UTC the zone-local day is
    // still the 15th, but a schedule set for 00:10 needs yesterday's candidate.
    const schedule = buildSchedule({
      hour: 23,
      minute: 45,
      startDate: new Date("2024-01-01T22:45:00Z"),
    });
    const occurrence = resolveDueOccurrence(schedule, {
      now: new Date("2024-01-15T23:50:00Z"),
      graceMinutes: 15,
    });
    // 23:50 UTC is 00:50 on the 16th in Warsaw, so today's 23:45 has not
    // happened yet and the 15th's occurrence (22:45 UTC) is 65 minutes old.
    expect(occurrence).toBeNull();

    const withinGrace = resolveDueOccurrence(schedule, {
      now: new Date("2024-01-15T22:55:00Z"),
      graceMinutes: 15,
    });
    expect(withinGrace?.toISOString()).toBe("2024-01-15T22:45:00.000Z");
  });

  it("ignores inactive schedules", () => {
    expect(
      resolveDueOccurrence(buildSchedule({ isActive: false }), {
        now: new Date("2024-01-15T06:31:00Z"),
      }),
    ).toBeNull();
  });

  it("does not fire before the schedule's first day", () => {
    const schedule = buildSchedule({
      startDate: new Date("2024-02-01T06:30:00Z"),
      endDate: new Date("2024-02-01T06:32:00Z"),
    });
    expect(resolveDueOccurrence(schedule, { now: new Date("2024-01-15T06:31:00Z") })).toBeNull();
  });

  it("does not fire after the schedule's last day", () => {
    const schedule = buildSchedule({
      startDate: new Date("2024-01-01T06:30:00Z"),
      endDate: new Date("2024-01-10T06:30:00Z"),
    });
    expect(resolveDueOccurrence(schedule, { now: new Date("2024-01-15T06:31:00Z") })).toBeNull();
  });

  it("fires a one-time schedule whose window is only two minutes wide", () => {
    // This is what admin/notifications/new.tsx creates for "scheduled once":
    // endDate is startDate + 2 minutes. A window-driven executor that only
    // looks at rows with `endDate >= now` would practically never catch it.
    const schedule = buildSchedule({
      hour: 13,
      minute: 0,
      startDate: new Date("2024-01-15T12:00:00Z"),
      endDate: new Date("2024-01-15T12:02:00Z"),
    });

    const occurrence = resolveDueOccurrence(schedule, {
      now: new Date("2024-01-15T12:09:00Z"),
      graceMinutes: 15,
    });
    expect(occurrence?.toISOString()).toBe("2024-01-15T12:00:00.000Z");
  });

  it("fires a legacy row whose startDate was stamped in the wrong zone", () => {
    // Rows created before the fix carry a startDate one or two hours after the
    // wall-clock time they were meant for. Comparing zone-local days rather
    // than instants keeps that first occurrence reachable.
    const schedule = buildSchedule({
      hour: 13,
      minute: 0,
      startDate: new Date("2024-01-15T13:00:00Z"),
      endDate: new Date("2024-01-15T13:02:00Z"),
    });

    const occurrence = resolveDueOccurrence(schedule, {
      now: new Date("2024-01-15T12:01:00Z"),
      graceMinutes: 15,
    });
    expect(occurrence?.toISOString()).toBe("2024-01-15T12:00:00.000Z");
  });
});
