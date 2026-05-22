import z from "zod";

export interface InactivityCheckResult {
  checked: number;
  notified: number;
  skipped: number;
  errors: number;
}

export const SendMobileNotificationsInput = z.object({
  notificationId: z.string(),
});

export const TrackDeliveryStartInput = z.object({
  notificationId: z.string(),
});

export const TrackDeliveryCompleteInput = z.object({
  notificationId: z.string(),
  totalRecipients: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  errors: z.string().nullable(),
});

export const TrackDeliveryFailureInput = z.object({
  notificationId: z.string(),
  error: z.union([z.string(), z.instanceof(Error)]),
});
