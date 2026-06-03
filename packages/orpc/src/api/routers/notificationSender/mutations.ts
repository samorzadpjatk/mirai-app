import { notificationDeliveries } from "@mirai-app/db";
import { buildDeliveryStatus, extractErrorMessage } from "@mirai-app/shared/notifications";
import { eq } from "drizzle-orm";
import { sendMobileNotifications } from "../../../services/notificationService";
import { logger } from "../../../utils/logger";
import { publicProcedure } from "../../trpc";
import {
  SendMobileNotificationsInput,
  TrackDeliveryCompleteInput,
  TrackDeliveryFailureInput,
  TrackDeliveryStartInput,
} from "./types";

export const sendMobileNotificationsMutation = publicProcedure
  .input(SendMobileNotificationsInput)
  .handler(async ({ input, context }) => {
    return await sendMobileNotifications(context.db, input.notificationId);
  });

export const trackDeliveryStartMutation = publicProcedure
  .input(TrackDeliveryStartInput)
  .handler(async ({ input, context }) => {
    try {
      const scheduleExecution = await context.db.query.notificationScheduleExecutions.findFirst({
        where: (nse, { eq }) => eq(nse.notificationId, input.notificationId),
        with: { schedule: true },
      });

      await context.db
        .insert(notificationDeliveries)
        .values({
          tripId: scheduleExecution?.schedule?.tripId,
          notificationId: input.notificationId,
          scheduleId: scheduleExecution?.schedule?.id,
          deliveryStartedAt: new Date(),
          status: "pending",
        })
        .returning();

      logger.info(
        { notificationId: input.notificationId },
        "[Delivery Tracker] Started tracking delivery",
      );
    } catch (error) {
      logger.error(
        { notificationId: input.notificationId, error },
        "[Delivery Tracker] Failed to track delivery start",
      );
    }
  });

export const trackDeliveryCompleteMutation = publicProcedure
  .input(TrackDeliveryCompleteInput)
  .handler(async ({ input, context }) => {
    try {
      const status = buildDeliveryStatus(input.successCount, input.failureCount);

      await context.db
        .update(notificationDeliveries)
        .set({
          deliveryCompletedAt: new Date(),
          totalRecipients: input.totalRecipients,
          successCount: input.successCount,
          failureCount: input.failureCount,
          errors: input.errors,
          status,
        })
        .where(eq(notificationDeliveries.notificationId, input.notificationId))
        .returning();

      logger.info(
        {
          notificationId: input.notificationId,
          successCount: input.successCount,
          totalRecipients: input.totalRecipients,
        },
        "[Delivery Tracker] Completed tracking delivery",
      );
    } catch (error) {
      logger.error(
        { notificationId: input.notificationId, error },
        "[Delivery Tracker] Failed to track delivery completion",
      );
    }
  });

export const trackDeliveryFailureMutation = publicProcedure
  .input(TrackDeliveryFailureInput)
  .handler(async ({ input, context }) => {
    try {
      const errorMessage = extractErrorMessage(input.error);

      const existing = await context.db.query.notificationDeliveries.findFirst({
        where: (nd, { eq }) => eq(nd.notificationId, input.notificationId),
      });

      if (existing) {
        await context.db
          .update(notificationDeliveries)
          .set({
            deliveryCompletedAt: new Date(),
            errors: errorMessage,
            status: "failure",
          })
          .where(eq(notificationDeliveries.notificationId, input.notificationId));
      } else {
        const scheduleExecution = await context.db.query.notificationScheduleExecutions.findFirst({
          where: (nse, { eq }) => eq(nse.notificationId, input.notificationId),
          with: { schedule: true },
        });

        await context.db.insert(notificationDeliveries).values({
          notificationId: input.notificationId,
          scheduleId: scheduleExecution?.schedule?.id,
          tripId: scheduleExecution?.schedule?.tripId,
          deliveryStartedAt: new Date(),
          deliveryCompletedAt: new Date(),
          errors: errorMessage,
          status: "failure",
        });
      }

      logger.info({ notificationId: input.notificationId }, "[Delivery Tracker] Tracked failure");
    } catch (err) {
      logger.error(
        { notificationId: input.notificationId, error: err },
        "[Delivery Tracker] Failed to track delivery failure",
      );
    }
  });
