import { resolveAuthEmail } from "./authUtils";
import { APP_TIME_ZONE, getZonedParts, zonedDateAtTime, zonedWallClockToUtc } from "./timezone";

export interface ScheduledNotificationTemplate {
  key: "daily_morning" | "daily_evening";
  name: string;
  hour: number;
  minute: number;
  notificationType: "custom";
  notificationTitle: string;
  notificationBody: string;
  notificationUrl: string;
}

export const toOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

export const attachCreatedByEmail = <
  T extends { createdBy?: { authUserId?: string | null } | null },
>(
  schedule: T,
  emailByAuthUserId: Map<string, string | null>,
) => {
  const createdBy = schedule.createdBy;
  if (!createdBy) return schedule;
  const { authUserId, ...rest } = createdBy;
  return {
    ...schedule,
    createdBy: {
      ...rest,
      email: resolveAuthEmail(emailByAuthUserId, authUserId),
    },
  };
};

/**
 * Next instant at which the clock in {@link APP_TIME_ZONE} reads `hour:minute`,
 * skipping ahead a day when that is less than five minutes away.
 *
 * `hour`/`minute` are wall-clock values as picked by an admin in Poland, not
 * UTC — the process time zone must not influence the result, which is why this
 * no longer goes through `Date#setHours`.
 */
export function getNextScheduledStartDate(
  hour: number,
  minute: number,
  now = new Date(),
  timeZone: string = APP_TIME_ZONE,
): Date {
  const sameDay = zonedDateAtTime(now, hour, minute, timeZone);
  const minimumDate = new Date(now.getTime() + 5 * 60 * 1000);

  if (sameDay >= minimumDate) {
    return sameDay;
  }

  const parts = getZonedParts(now, timeZone);
  // Date.UTC normalises month/day overflow, so month ends and leap years are
  // handled for us; the fields are then reinterpreted as wall-clock values.
  const nextDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));

  return zonedWallClockToUtc(
    {
      year: nextDay.getUTCFullYear(),
      month: nextDay.getUTCMonth() + 1,
      day: nextDay.getUTCDate(),
      hour,
      minute,
    },
    timeZone,
  );
}

export function getTemplateScheduleDates(
  template: ScheduledNotificationTemplate,
  now = new Date(),
): {
  startDate: Date;
  endDate: Date;
} {
  const startDate = getNextScheduledStartDate(template.hour, template.minute, now);
  const endDate = new Date(now);
  endDate.setFullYear(endDate.getFullYear() + 1);

  return { startDate, endDate };
}

/**
 * Pin a schedule's window to the hour/minute the admin picked.
 *
 * `hour`/`minute` are wall-clock values in {@link APP_TIME_ZONE} — the picker
 * on the phone produces them with `Date#getHours()` in Poland. They are stored
 * unchanged so that each day's occurrence can be recomputed with whatever UTC
 * offset is in effect that day, while `startDate` becomes the absolute instant
 * that wall-clock time refers to on its own zone-local calendar day.
 *
 * Previously the picked hour was stamped straight onto UTC
 * (`setUTCHours`), which shifted every send one or two hours late and pushed
 * anything picked between 00:00 and 01:59 back onto the previous day, where
 * the "start date cannot be in the past" check rejected it outright.
 */
export function normalizeScheduleWindow(params: {
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
  timeZone?: string;
}) {
  const timeZone = params.timeZone ?? APP_TIME_ZONE;
  const normalizedStartDate = zonedDateAtTime(
    params.startDate,
    params.hour,
    params.minute,
    timeZone,
  );

  const durationMs = params.endDate.getTime() - params.startDate.getTime();
  const normalizedEndDate = new Date(normalizedStartDate.getTime() + durationMs);

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    hour: params.hour,
    minute: params.minute,
  };
}
