import { z } from "zod";

export const getDeliveriesInputSchema = z
  .object({
    tripId: z.string(),
    status: z.enum(["pending", "success", "partial_failure", "failure"]).optional(),
    scheduleId: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    limit: z.number().min(1).max(100).default(50),
    offset: z.number().min(0).default(0),
  })
  .optional();

export const getDeliveryByNotificationIdInputSchema = z.object({
  notificationId: z.string(),
  tripId: z.string(),
});

export const getDeliveryStatsInputSchema = z
  .object({
    tripId: z.string(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    scheduleId: z.string().optional(),
  })
  .optional();

export const getFailedDeliveriesInputSchema = z
  .object({
    tripId: z.string(),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  })
  .optional();
