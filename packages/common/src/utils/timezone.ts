/**
 * Time-zone helpers for anything an admin picks off a wall clock.
 *
 * Admins pick hours and minutes on their phone, i.e. in Poland's civil time
 * zone. The database stores absolute instants (`timestamptz`), so a wall-clock
 * time has to be converted with the UTC offset that is actually in effect on
 * that day — a hard-coded +1/+2 shift breaks twice a year on DST transitions,
 * and stamping the picked hour straight onto UTC (the previous behaviour) sends
 * every notification one or two hours late.
 *
 * These live outside `notifications/` because recurring challenge windows have
 * the same problem: their daily start and end are wall-clock times too. Nothing
 * here reads the process time zone, which is the point — the server runs in UTC
 * (the distroless image sets no `TZ`), so `Date#setHours` would silently place
 * every window two hours off in summer.
 */

export const APP_TIME_ZONE = "Europe/Warsaw";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

export interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function createFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Break an absolute instant down into the wall-clock fields an observer in
 * `timeZone` would read off a clock at that moment.
 */
export function getZonedParts(date: Date, timeZone: string = APP_TIME_ZONE): ZonedDateParts {
  const parts = createFormatter(timeZone).formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes): number => {
    const found = parts.find((part) => part.type === type);
    return found ? Number.parseInt(found.value, 10) : 0;
  };

  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    // Some ICU builds still render midnight as "24" under hourCycle h23.
    hour: lookup("hour") % 24,
    minute: lookup("minute"),
    second: lookup("second"),
  };
}

/**
 * The UTC offset of `timeZone` at the given instant, in milliseconds
 * (positive east of Greenwich, so +7_200_000 for Warsaw in summer).
 */
export function getTimeZoneOffsetMs(date: Date, timeZone: string = APP_TIME_ZONE): number {
  const parts = getZonedParts(date, timeZone);
  const asIfUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  // Milliseconds are not part of the formatted output, so drop them from both
  // sides before comparing.
  return asIfUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Convert a wall-clock date/time in `timeZone` into the absolute instant it
 * refers to.
 *
 * The offset depends on the instant we are trying to find, so the first guess
 * is refined once. That resolves every real DST case: for a time that is
 * skipped by a spring-forward the result lands just after the gap, and for a
 * time that happens twice in autumn the earlier (still-DST) occurrence wins.
 */
export function zonedWallClockToUtc(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string = APP_TIME_ZONE,
): Date {
  const naiveUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);

  const firstGuessOffset = getTimeZoneOffsetMs(new Date(naiveUtcMs), timeZone);
  const firstGuess = new Date(naiveUtcMs - firstGuessOffset);

  const refinedOffset = getTimeZoneOffsetMs(firstGuess, timeZone);
  if (refinedOffset === firstGuessOffset) {
    return firstGuess;
  }

  return new Date(naiveUtcMs - refinedOffset);
}

/**
 * The instant at which the clock in `timeZone` shows `hour:minute` on the same
 * zone-local calendar day as `reference`.
 */
export function zonedDateAtTime(
  reference: Date,
  hour: number,
  minute: number,
  timeZone: string = APP_TIME_ZONE,
): Date {
  const parts = getZonedParts(reference, timeZone);
  return zonedWallClockToUtc(
    { year: parts.year, month: parts.month, day: parts.day, hour, minute },
    timeZone,
  );
}

/**
 * `YYYY-MM-DD` for the zone-local calendar day an instant falls on. Sorts
 * lexicographically, so it doubles as a comparable day key.
 */
export function zonedDateKey(date: Date, timeZone: string = APP_TIME_ZONE): string {
  const { year, month, day } = getZonedParts(date, timeZone);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * The same wall-clock time one zone-local day earlier. Used to look back across
 * midnight when deciding whether a schedule's most recent occurrence is still
 * inside its grace window.
 */
export function previousZonedDayAtTime(
  reference: Date,
  hour: number,
  minute: number,
  timeZone: string = APP_TIME_ZONE,
): Date {
  // Stepping back 24h in absolute time can land on the same calendar day across
  // a DST shift, so anchor on noon of the previous zone-local day instead.
  const parts = getZonedParts(new Date(reference.getTime() - 24 * HOUR_MS), timeZone);
  const anchor = zonedWallClockToUtc(
    { year: parts.year, month: parts.month, day: parts.day, hour: 12, minute: 0 },
    timeZone,
  );
  return zonedDateAtTime(anchor, hour, minute, timeZone);
}

/**
 * The instant at which the zone-local calendar day of `date` begins (00:00).
 */
export function zonedStartOfDay(date: Date, timeZone: string = APP_TIME_ZONE): Date {
  const { year, month, day } = getZonedParts(date, timeZone);
  return zonedWallClockToUtc({ year, month, day, hour: 0, minute: 0 }, timeZone);
}

/**
 * The last millisecond of the zone-local calendar day of `date` (23:59:59.999).
 */
export function zonedEndOfDay(date: Date, timeZone: string = APP_TIME_ZONE): Date {
  const { year, month, day } = getZonedParts(date, timeZone);
  const endMinute = zonedWallClockToUtc({ year, month, day, hour: 23, minute: 59 }, timeZone);
  return new Date(endMinute.getTime() + 59 * 1000 + 999);
}

/**
 * A whole number identifying the zone-local calendar day, so that two instants
 * can be compared and subtracted by day.
 *
 * Subtracting instants and dividing by 24h is wrong across a DST boundary,
 * where a local day lasts 23 or 25 hours; this counts calendar days instead.
 */
export function zonedDayNumber(date: Date, timeZone: string = APP_TIME_ZONE): number {
  const { year, month, day } = getZonedParts(date, timeZone);
  return Math.round(Date.UTC(year, month - 1, day) / (24 * HOUR_MS));
}

/**
 * `days` zone-local calendar days after `date`, keeping the same wall-clock
 * time. Month ends and leap years are handled by `Date.UTC` normalisation.
 */
export function addZonedDays(date: Date, days: number, timeZone: string = APP_TIME_ZONE): Date {
  const parts = getZonedParts(date, timeZone);
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return zonedWallClockToUtc(
    {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
      hour: parts.hour,
      minute: parts.minute,
    },
    timeZone,
  );
}
