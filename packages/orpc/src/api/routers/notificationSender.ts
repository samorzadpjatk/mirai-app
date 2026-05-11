import { sendMobileNotifications } from "../../services/notificationService";
import { createORPCRouter, publicProcedure } from "../trpc";
import z from "zod";

export interface InactivityCheckResult {
  checked: number;
  notified: number;
  skipped: number;
  errors: number;
}

export const notificationSenderRouter = createORPCRouter({
  sendMobileNotifications: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .handler(async ({ input, context }) => {
      return await sendMobileNotifications(context.db, input.notificationId);
    }),
  trackDeliveryStart: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .handler(async ({ input, context }) => {
      try {
        const scheduleExecution =
          await context.db.notificationScheduleExecution.findFirst({
            where: { notificationId: input.notificationId },
            select: { schedule: {select: {id: true, tripId: true}} },
          });

        await context.db.notificationDelivery.create({
          data: {
            tripId: scheduleExecution?.schedule.tripId,
            notificationId: input.notificationId,
            scheduleId: scheduleExecution?.schedule.id,
            deliveryStartedAt: new Date(),
            status: "pending",
          },
        });

        console.log(
          `[Delivery Tracker] Started tracking delivery for notification ${input.notificationId}`,
        );
      } catch (error) {
        console.error(
          "[Delivery Tracker] Failed to track delivery start:",
          error,
        );
      }
    }),
  trackDeliveryComplete: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
        totalRecipients: z.number(),
        successCount: z.number(),
        failureCount: z.number(),
        errors: z.string().nullable(),
      }),
    )
    .handler(async ({ input, context }) => {
      try {
        const status =
          input.failureCount === 0
            ? "success"
            : input.successCount === 0
              ? "failure"
              : "partial_failure";

        await context.db.notificationDelivery.update({
          where: { notificationId: input.notificationId },
          data: {
            deliveryCompletedAt: new Date(),
            totalRecipients: input.totalRecipients,
            successCount: input.successCount,
            failureCount: input.failureCount,
            errors: input.errors,
            status,
          },
        });

        console.log(
          `[Delivery Tracker] Completed tracking for notification ${input.notificationId}: ${input.successCount}/${input.totalRecipients} successful`,
        );
      } catch (error) {
        console.error(
          "[Delivery Tracker] Failed to track delivery completion:",
          error,
        );
      }
    }),
  trackDeliveryFailure: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
        error: z.union([z.string(), z.instanceof(Error)]),
      }),
    )
    .handler(async ({ input, context }) => {
      try {
        const errorMessage =
          input.error instanceof Error
            ? input.error.message
            : String(input.error);

        const existing = await context.db.notificationDelivery.findUnique({
          where: { notificationId: input.notificationId },
        });

        if (existing) {
          await context.db.notificationDelivery.update({
            where: { notificationId: input.notificationId },
            data: {
              deliveryCompletedAt: new Date(),
              errors: errorMessage,
              status: "failure",
            },
          });
        } else {
          const scheduleExecution =
            await context.db.notificationScheduleExecution.findFirst({
              where: { notificationId: input.notificationId },
              select: { schedule: {select: {id: true, tripId: true}} },
            });

          await context.db.notificationDelivery.create({
            data: {
              notificationId: input.notificationId,
              scheduleId: scheduleExecution?.schedule.id,
              tripId: scheduleExecution?.schedule.tripId,
              deliveryStartedAt: new Date(),
              deliveryCompletedAt: new Date(),
              errors: errorMessage,
              status: "failure",
            },
          });
        }

        console.log(
          `[Delivery Tracker] Tracked failure for notification ${input.notificationId}`,
        );
      } catch (err) {
        console.error(
          "[Delivery Tracker] Failed to track delivery failure:",
          err,
        );
      }
    }),
  checkInactiveUsers: publicProcedure.handler(() => {
    // Inactivity nudge notifications are disabled.
    return {
      checked: 0,
      notified: 0,
      skipped: 0,
      errors: 0,
    } satisfies InactivityCheckResult;
  }),
});

export type NotificationSenderRouter = typeof notificationSenderRouter;
