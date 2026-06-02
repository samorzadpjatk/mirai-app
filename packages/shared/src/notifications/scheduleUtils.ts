import { resolveAuthEmail } from "./authUtils";

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

export function getNextScheduledStartDate(hour: number, minute: number, now = new Date()): Date {
  const startDate = new Date(now);
  startDate.setHours(hour, minute, 0, 0);

  const minimumDate = new Date(now.getTime() + 5 * 60 * 1000);
  if (startDate < minimumDate) {
    startDate.setDate(startDate.getDate() + 1);
  }

  return startDate;
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

export function normalizeScheduleWindow(params: {
  startDate: Date;
  endDate: Date;
  hour: number;
  minute: number;
}) {
  const normalizedStartDate = new Date(params.startDate);
  normalizedStartDate.setUTCHours(params.hour, params.minute, 0, 0);

  const durationMs = params.endDate.getTime() - params.startDate.getTime();
  const normalizedEndDate = new Date(normalizedStartDate.getTime() + durationMs);

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    hour: normalizedStartDate.getUTCHours(),
    minute: normalizedStartDate.getUTCMinutes(),
  };
}
