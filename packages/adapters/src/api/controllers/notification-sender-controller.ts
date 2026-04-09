/**
 * Notification Sender Controller
 *
 * tRPC-ready controller for notification sending operations.
 */

import { z } from "zod";
import { publicProcedure } from "../trpc";
import { NotificationService } from "../../services/notificationService";
import { PrismaNotificationSenderService } from "../../services/PrismaNotificationSenderService";

export const notificationSenderController = {
  sendMobileNotifications: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const notificationService = new NotificationService(ctx.db);
      return await notificationService.sendMobileNotifications(
        input.notificationId,
      );
    }),

  trackDeliveryStart: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const service = new PrismaNotificationSenderService(ctx.db);
      const result = await service.trackDeliveryStart({
        notificationId: input.notificationId,
      });

      // Delivery tracking result logged by service layer
      void result;
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
      const service = new PrismaNotificationSenderService(ctx.db);
      const result = await service.trackDeliveryComplete({
        notificationId: input.notificationId,
        totalRecipients: input.totalRecipients,
        successCount: input.successCount,
        failureCount: input.failureCount,
        errors: input.errors,
      });

      // Delivery tracking result logged by service layer
      void result;
    }),

  trackDeliveryFailure: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
        error: z.union([z.string(), z.instanceof(Error)]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const service = new PrismaNotificationSenderService(ctx.db);
      const result = await service.trackDeliveryFailure({
        notificationId: input.notificationId,
        error: input.error,
      });

      // Delivery tracking result logged by service layer
      void result;
    }),

  checkInactiveUsers: publicProcedure.mutation(() => {
    // Inactivity nudge notifications are disabled.
    return {
      checked: 0,
      notified: 0,
      skipped: 0,
      errors: 0,
    };
  }),
};
