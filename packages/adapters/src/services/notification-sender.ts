import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  notificationDeliveries,
  notificationScheduleExecutions,
  notificationSchedules,
} from "@mirai-app/frameworks/drizzle/schema";
import { eq } from "drizzle-orm";
import { Effect, Data } from "effect";

/**
 * NotificationSenderError for notification sender operations
 */
export class NotificationSenderError extends Data.TaggedError(
  "NotificationSenderError",
)<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {
  readonly code = "NOTIFICATION_SENDER_ERROR" as const;
}

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
  trackDeliveryStart(input: {
    notificationId: string;
  }): Effect.Effect<{ success: true }, NotificationSenderError, never> {
    return Effect.gen(this, function* () {
      // Get schedule execution for this notification
      const scheduleExecution = yield* Effect.tryPromise({
        try: () =>
          this.db
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
            .limit(1),
        catch: (error) =>
          new NotificationSenderError({
            operation: "trackDeliveryStart",
            message: "Failed to fetch schedule execution",
            cause: error,
          }),
      });

      // Get tripId from schedule
      let tripId: string | null = null;
      let scheduleId: string | null = null;
      if (scheduleExecution?.[0]?.scheduleId) {
        const schedule = yield* Effect.tryPromise({
          try: () =>
            this.db
              .select({
                tripId: notificationSchedules.tripId,
                id: notificationSchedules.id,
              })
              .from(notificationSchedules)
              .where(
                eq(notificationSchedules.id, scheduleExecution[0].scheduleId),
              )
              .limit(1),
          catch: (error) =>
            new NotificationSenderError({
              operation: "trackDeliveryStart",
              message: "Failed to fetch schedule",
              cause: error,
            }),
        });
        tripId = schedule?.[0]?.tripId ?? null;
        scheduleId = schedule?.[0]?.id ?? null;
      }

      // Insert delivery record
      yield* Effect.tryPromise({
        try: () =>
          this.db.insert(notificationDeliveries).values({
            notificationId: input.notificationId,
            tripId,
            scheduleId,
            deliveryStartedAt: new Date(),
            status: "pending",
          }),
        catch: (error) =>
          new NotificationSenderError({
            operation: "trackDeliveryStart",
            message: "Failed to insert delivery record",
            cause: error,
          }),
      });

      return { success: true };
    });
  }

  /**
   * Track delivery completion for a notification
   */
  trackDeliveryComplete(input: {
    notificationId: string;
    totalRecipients: number;
    successCount: number;
    failureCount: number;
    errors: string | null;
  }): Effect.Effect<{ success: true }, NotificationSenderError, never> {
    return Effect.gen(this, function* () {
      const status =
        input.failureCount === 0
          ? "success"
          : input.successCount === 0
            ? "failure"
            : "partial_failure";

      yield* Effect.tryPromise({
        try: () =>
          this.db
            .update(notificationDeliveries)
            .set({
              deliveryCompletedAt: new Date(),
              totalRecipients: input.totalRecipients,
              successCount: input.successCount,
              failureCount: input.failureCount,
              errors: input.errors,
              status,
            })
            .where(
              eq(notificationDeliveries.notificationId, input.notificationId),
            ),
        catch: (error) =>
          new NotificationSenderError({
            operation: "trackDeliveryComplete",
            message: "Failed to update delivery record",
            cause: error,
          }),
      });

      return { success: true };
    });
  }

  /**
   * Track delivery failure for a notification
   */
  trackDeliveryFailure(input: {
    notificationId: string;
    error: string | Error;
  }): Effect.Effect<{ success: true }, NotificationSenderError, never> {
    return Effect.gen(this, function* () {
      const errorMessage =
        input.error instanceof Error
          ? input.error.message
          : String(input.error);

      // Check if delivery record exists
      const existing = yield* Effect.tryPromise({
        try: () =>
          this.db
            .select({ id: notificationDeliveries.id })
            .from(notificationDeliveries)
            .where(
              eq(notificationDeliveries.notificationId, input.notificationId),
            )
            .limit(1),
        catch: (error) =>
          new NotificationSenderError({
            operation: "trackDeliveryFailure",
            message: "Failed to check existing delivery",
            cause: error,
          }),
      });

      if (existing?.[0]) {
        // Update existing record
        yield* Effect.tryPromise({
          try: () =>
            this.db
              .update(notificationDeliveries)
              .set({
                deliveryCompletedAt: new Date(),
                errors: errorMessage,
                status: "failure",
              })
              .where(
                eq(notificationDeliveries.notificationId, input.notificationId),
              ),
          catch: (error) =>
            new NotificationSenderError({
              operation: "trackDeliveryFailure",
              message: "Failed to update delivery record",
              cause: error,
            }),
        });
      } else {
        // Need to create new record with schedule info
        const scheduleExecution = yield* Effect.tryPromise({
          try: () =>
            this.db
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
              .limit(1),
          catch: (error) =>
            new NotificationSenderError({
              operation: "trackDeliveryFailure",
              message: "Failed to fetch schedule execution",
              cause: error,
            }),
        });

        // Get tripId from schedule
        let tripId: string | null = null;
        let scheduleId: string | null = null;
        if (scheduleExecution?.[0]?.scheduleId) {
          const schedule = yield* Effect.tryPromise({
            try: () =>
              this.db
                .select({
                  tripId: notificationSchedules.tripId,
                  id: notificationSchedules.id,
                })
                .from(notificationSchedules)
                .where(
                  eq(notificationSchedules.id, scheduleExecution[0].scheduleId),
                )
                .limit(1),
            catch: (error) =>
              new NotificationSenderError({
                operation: "trackDeliveryFailure",
                message: "Failed to fetch schedule",
                cause: error,
              }),
          });
          tripId = schedule?.[0]?.tripId ?? null;
          scheduleId = schedule?.[0]?.id ?? null;
        }

        // Insert new delivery record with failure status
        yield* Effect.tryPromise({
          try: () =>
            this.db.insert(notificationDeliveries).values({
              notificationId: input.notificationId,
              tripId,
              scheduleId,
              deliveryStartedAt: new Date(),
              deliveryCompletedAt: new Date(),
              errors: errorMessage,
              status: "failure",
            }),
          catch: (error) =>
            new NotificationSenderError({
              operation: "trackDeliveryFailure",
              message: "Failed to insert delivery record",
              cause: error,
            }),
        });
      }

      return { success: true };
    });
  }
}
