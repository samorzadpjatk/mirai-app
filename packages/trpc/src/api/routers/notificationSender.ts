import { sendMobileNotifications } from "../../services/notificationService";
import { createTRPCRouter, publicProcedure } from "../trpc";
import z from "zod";

export interface InactivityCheckResult {
  checked: number;
  notified: number;
  skipped: number;
  errors: number;
}

export const notificationSenderRouter = createTRPCRouter({
  sendMobileNotifications: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return await sendMobileNotifications(ctx.db, input.notificationId);
    }),
  trackDeliveryStart: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const scheduleExecution =
          await ctx.db.notificationScheduleExecution.findFirst({
            where: { notificationId: input.notificationId },
            select: { schedule: {select: {id: true, tripId: true}} },
          });

        await ctx.db.notificationDelivery.create({
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
    .mutation(async ({ input, ctx }) => {
      try {
        const status =
          input.failureCount === 0
            ? "success"
            : input.successCount === 0
              ? "failure"
              : "partial_failure";

        await ctx.db.notificationDelivery.update({
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
    .mutation(async ({ input, ctx }) => {
      try {
        const errorMessage =
          input.error instanceof Error
            ? input.error.message
            : String(input.error);

        const existing = await ctx.db.notificationDelivery.findUnique({
          where: { notificationId: input.notificationId },
        });

        if (existing) {
          await ctx.db.notificationDelivery.update({
            where: { notificationId: input.notificationId },
            data: {
              deliveryCompletedAt: new Date(),
              errors: errorMessage,
              status: "failure",
            },
          });
        } else {
          const scheduleExecution =
            await ctx.db.notificationScheduleExecution.findFirst({
              where: { notificationId: input.notificationId },
              select: { schedule: {select: {id: true, tripId: true}} },
            });

          await ctx.db.notificationDelivery.create({
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
  checkInactiveUsers: publicProcedure.mutation(async () => {
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
