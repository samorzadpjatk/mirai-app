import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  notificationDeliveries,
  notificationScheduleExecutions,
} from "@mirai-app/frameworks/drizzle/schema/notificationDelivery";
import { eq } from "drizzle-orm";

/**
 * DrizzleNotificationSenderService
 *
 * Handles notification delivery tracking operations.
 * Encapsulates Drizzle queries for delivery creation and updates.
 */
export class DrizzleNotificationSenderService {
  constructor(private db: DrizzleDb) {}

  /**
   * Track delivery start for a notification
   */
  async trackDeliveryStart(input: {
    notificationId: string;
  }): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const [scheduleExecution] = await this.db
        .select({
          scheduleId: notificationScheduleExecutions.scheduleId,
        })
        .from(notificationScheduleExecutions)
        .where(
          eq(
            notificationScheduleExecutions.notificationId,
            input.notificationId,
          ),
        )
        .limit(1);

      // Get tripId from schedule
      let tripId: string | null = null;
      let scheduleId: string | null = null;
      if (scheduleExecution?.scheduleId) {
        const { notificationSchedules } =
          await import("@mirai-app/frameworks/drizzle/schema/notificationDelivery");
        const [schedule] = await this.db
          .select({
            tripId: notificationSchedules.tripId,
            id: notificationSchedules.id,
          })
          .from(notificationSchedules)
          .where(eq(notificationSchedules.id, scheduleExecution.scheduleId))
          .limit(1);
        tripId = schedule?.tripId ?? null;
        scheduleId = schedule?.id ?? null;
      }

      await this.db.insert(notificationDeliveries).values({
        notificationId: input.notificationId,
        tripId,
        scheduleId,
        deliveryStartedAt: new Date(),
        status: "pending",
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to track delivery start" };
    }
  }

  /**
   * Track delivery completion for a notification
   */
  async trackDeliveryComplete(input: {
    notificationId: string;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    errors: string | null;
  }): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const status =
        input.failureCount === 0
          ? "success"
          : input.successCount === 0
            ? "failure"
            : "partial_failure";

      await this.db
        .update(notificationDeliveries)
        .set({
          deliveryCompletedAt: new Date(),
          totalRecipients: input.totalRecipients,
          successCount: input.successCount,
          failureCount: input.failureCount,
          errors: input.errors,
          status,
        })
        .where(eq(notificationDeliveries.notificationId, input.notificationId));

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to track delivery completion" };
    }
  }

  /**
   * Track delivery failure for a notification
   */
  async trackDeliveryFailure(input: {
    notificationId: string;
    error: string | Error;
  }): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const errorMessage =
        input.error instanceof Error
          ? input.error.message
          : String(input.error);

      const [existing] = await this.db
        .select({ id: notificationDeliveries.id })
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.notificationId, input.notificationId))
        .limit(1);

      if (existing) {
        await this.db
          .update(notificationDeliveries)
          .set({
            deliveryCompletedAt: new Date(),
            errors: errorMessage,
            status: "failure",
          })
          .where(
            eq(notificationDeliveries.notificationId, input.notificationId),
          );
      } else {
        const [scheduleExecution] = await this.db
          .select({
            scheduleId: notificationScheduleExecutions.scheduleId,
          })
          .from(notificationScheduleExecutions)
          .where(
            eq(
              notificationScheduleExecutions.notificationId,
              input.notificationId,
            ),
          )
          .limit(1);

        // Get tripId from schedule
        let tripId: string | null = null;
        let scheduleId: string | null = null;
        if (scheduleExecution?.scheduleId) {
          const { notificationSchedules } =
            await import("@mirai-app/frameworks/drizzle/schema/notificationDelivery");
          const [schedule] = await this.db
            .select({
              tripId: notificationSchedules.tripId,
              id: notificationSchedules.id,
            })
            .from(notificationSchedules)
            .where(eq(notificationSchedules.id, scheduleExecution.scheduleId))
            .limit(1);
          tripId = schedule?.tripId ?? null;
          scheduleId = schedule?.id ?? null;
        }

        await this.db.insert(notificationDeliveries).values({
          notificationId: input.notificationId,
          tripId,
          scheduleId,
          deliveryStartedAt: new Date(),
          deliveryCompletedAt: new Date(),
          errors: errorMessage,
          status: "failure",
        });
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: "Failed to track delivery failure" };
    }
  }
}
