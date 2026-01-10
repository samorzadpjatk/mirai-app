import { TRPCError } from "@trpc/server";
import { z } from "zod";

export function validateDateRange(startDate: Date, endDate: Date): void {
  if (endDate <= startDate) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `End date (${endDate.toISOString()}) must be after start date (${startDate.toISOString()})`,
    });
  }
}

export function validateFutureDates(
  startDate: Date,
  endDate: Date,
  allowPastStart = false,
): void {
  const now = new Date();

  if (!allowPastStart && startDate < now) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Start date (${startDate.toISOString()}) cannot be in the past. Current time: ${now.toISOString()}`,
    });
  }

  if (endDate < now) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `End date (${endDate.toISOString()}) cannot be in the past. Current time: ${now.toISOString()}`,
    });
  }
}

export function validateScheduleTime(
  startDate: Date,
  hour: number,
  minute: number,
): void {
  const scheduleDateTime = new Date(startDate);
  scheduleDateTime.setHours(hour, minute, 0, 0);

  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (scheduleDateTime < fiveMinutesFromNow) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Schedule time (${scheduleDateTime.toISOString()}) must be at least 5 minutes in the future. Current time: ${now.toISOString()}`,
    });
  }
}

export function validateMinimumDuration(startDate: Date, endDate: Date): void {
  const durationMs = endDate.getTime() - startDate.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (durationMs < oneDayMs) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Schedule must run for at least 24 hours. Current duration: ${Math.round(durationMs / (60 * 60 * 1000))} hours`,
    });
  }
}

export function validateNotificationContent(
  notificationType: string,
  notificationTitle?: string,
  notificationBody?: string,
): void {
  if (notificationType === "custom") {
    if (!notificationTitle?.trim()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Notification title is required for custom notifications",
      });
    }

    if (!notificationBody?.trim()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Notification body is required for custom notifications",
      });
    }
  }
}

export function validateReasonableDateRange(
  startDate: Date,
  endDate: Date,
  allowPastStart = false,
): void {
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (!allowPastStart && startDate < now) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Start date cannot be in the past. Current time: ${now.toISOString()}`,
    });
  }

  if (endDate > oneYearFromNow) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `End date cannot be more than 1 year in the future. Maximum allowed: ${oneYearFromNow.toISOString()}`,
    });
  }
}

export const notificationScheduleCreateSchema = z.object({
  name: z.string().min(3).max(100),
  notificationType: z.enum(["custom", "ranking"]),
  notificationTitle: z.string().optional(),
  notificationBody: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).default(0),
  isActive: z.boolean().default(true),
});

export const notificationScheduleUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(3).max(100).optional(),
  notificationTitle: z.string().optional(),
  notificationBody: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  hour: z.number().int().min(0).max(23).optional(),
  minute: z.number().int().min(0).max(59).optional(),
  isActive: z.boolean().optional(),
});

export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const filterSchema = z.object({
  notificationType: z.enum(["custom", "ranking"]).optional(),
  isActive: z.boolean().optional(),
  startDateFrom: z.date().optional(),
  startDateTo: z.date().optional(),
  search: z.string().optional(),
});
