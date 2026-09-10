import { APP_TIME_ZONE, previousZonedDayAtTime, zonedDateAtTime, zonedDateKey } from "./timezone";

/**
 * How long after its nominal time an occurrence may still be fired. The
 * executor ticks on an interval, so an occurrence practically never lines up
 * with a tick; the grace window is also what lets a restart or a slow tick
 * recover a send instead of silently dropping it.
 */
export const DEFAULT_SCHEDULE_GRACE_MINUTES = 15;

/** Default gap between executor ticks. Must stay well below the grace window. */
export const DEFAULT_SCHEDULE_INTERVAL_MINUTES = 5;

export interface ExecutableSchedule {
  id: string;
  /** Wall-clock hour in {@link APP_TIME_ZONE}, as picked by the admin. */
  hour: number;
  /** Wall-clock minute in {@link APP_TIME_ZONE}, as picked by the admin. */
  minute: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  lastRun: Date | null;
}

export interface ResolveDueOccurrenceOptions {
  now?: Date;
  graceMinutes?: number;
  timeZone?: string;
}

/**
 * Decide whether a schedule has an occurrence that is due right now, and return
 * the instant that occurrence was nominally for (`null` when nothing is due).
 *
 * The executor is occurrence-driven rather than window-driven: it recomputes
 * the schedule's own hour:minute for the current zone-local day, so a tick that
 * arrives late — or not at all, because the process was down — still fires as
 * long as it lands inside the grace window. `lastRun` is what makes a fired
 * occurrence stay fired; `endDate` only bounds which days are eligible, which
 * is why a one-time schedule with a two-minute window is no longer fragile.
 */
export function resolveDueOccurrence(
  schedule: ExecutableSchedule,
  options: ResolveDueOccurrenceOptions = {},
): Date | null {
  const {
    now = new Date(),
    graceMinutes = DEFAULT_SCHEDULE_GRACE_MINUTES,
    timeZone = APP_TIME_ZONE,
  } = options;

  if (!schedule.isActive) {
    return null;
  }

  const graceMs = Math.max(0, graceMinutes) * 60 * 1000;
  const nowMs = now.getTime();

  const candidates = [
    zonedDateAtTime(now, schedule.hour, schedule.minute, timeZone),
    previousZonedDayAtTime(now, schedule.hour, schedule.minute, timeZone),
  ];

  let occurrence: Date | null = null;
  for (const candidate of candidates) {
    if (candidate.getTime() > nowMs) {
      continue;
    }
    if (occurrence === null || candidate.getTime() > occurrence.getTime()) {
      occurrence = candidate;
    }
  }

  if (!occurrence) {
    return null;
  }

  if (nowMs - occurrence.getTime() > graceMs) {
    return null;
  }

  // Compare zone-local calendar days rather than instants. Rows created before
  // the time-zone fix carry a `startDate` that is off by the UTC offset, and a
  // strict instant comparison would keep skipping their very first occurrence.
  const occurrenceKey = zonedDateKey(occurrence, timeZone);
  if (occurrenceKey < zonedDateKey(schedule.startDate, timeZone)) {
    return null;
  }
  if (occurrenceKey > zonedDateKey(schedule.endDate, timeZone)) {
    return null;
  }

  if (schedule.lastRun && schedule.lastRun.getTime() >= occurrence.getTime()) {
    return null;
  }

  return occurrence;
}
