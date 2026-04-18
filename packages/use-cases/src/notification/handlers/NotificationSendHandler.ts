import { Effect, Schedule, Data, Either } from "effect";
import type {
  NotificationCreated,
  IPushSubscriptionPort,
  INotificationDeliveryPort,
  INotificationServicePort,
  IEventHandler,
  NotificationDelivery,
  NotificationId,
  PushSubscription,
} from "@mirai-app/domain";
import {
  PushSubscriptionPortTag,
  NotificationDeliveryPortTag,
  NotificationServicePortTag,
} from "../ports/NotificationPort";

/**
 * Error types for non-retryable push notification failures
 * These error types implement the Data.TaggedError pattern from Effect
 */
export class DeviceNotRegisteredError extends Data.TaggedError("DeviceNotRegisteredError")<{
  token: string;
  userId: string;
}> {}

export class InvalidCredentialsError extends Data.TaggedError("InvalidCredentialsError")<{
  message: string;
}> {}

/**
 * Result type for notification send operation
 */
interface SendResult {
  success: boolean;
  sent: number;
  failed: number;
}

/**
 * NotificationSendHandler - Event handler for NotificationCreated events
 *
 * Handles the asynchronous delivery of push notifications when a notification
 * is created. Fetches push subscriptions, sends notifications via Expo API with
 * retry logic, and tracks delivery status.
 *
 * Error isolation: All errors are caught internally and logged. The handler
 * never propagates errors to the event bus (Effect<void, never, R>).
 *
 * Retry strategy: Exponential backoff with configurable delays.
 * Non-retryable errors (DeviceNotRegistered, InvalidCredentials) fail immediately.
 *
 * Dependencies: PushSubscriptionPortTag, NotificationDeliveryPortTag, NotificationServicePortTag
 * Note: Dependencies must be provided by the caller/event bus before calling handle()
 */
export class NotificationSendHandler
  implements
    IEventHandler<
      NotificationCreated,
      PushSubscriptionPortTag | NotificationDeliveryPortTag | NotificationServicePortTag
    >
{
  readonly eventTag = "NotificationCreated";

  /**
   * Retry schedule for sending notifications.
   * Defaults to exponential backoff: 1s, 2s, 4s with max 3 retries.
   * Can be overridden for testing to avoid timing issues.
   */
  private readonly retrySchedule: Schedule.Schedule<unknown>;

  constructor(retrySchedule?: Schedule.Schedule<unknown>) {
    this.retrySchedule = retrySchedule ??
      Schedule.exponential("1 seconds").pipe(
        Schedule.intersect(Schedule.recurs(3))
      );
  }

  handle(
    event: NotificationCreated
  ): Effect.Effect<
    void,
    never,
    PushSubscriptionPortTag | NotificationDeliveryPortTag | NotificationServicePortTag
  > {
    const self = this;
    return Effect.gen(function* () {
      yield* Effect.log("Processing NotificationCreated event").pipe(
        Effect.annotateLogs({
          notificationId: event.aggregateId,
          userCount: event.userIds.length,
        })
      );

      const pushSubscriptionPort = yield* PushSubscriptionPortTag;
      const deliveryPort = yield* NotificationDeliveryPortTag;
      const notificationService = yield* NotificationServicePortTag;

      // Create initial delivery record
      const deliveryId = crypto.randomUUID() as NotificationDelivery["id"];

      yield* deliveryPort.create({
        id: deliveryId,
        notificationId: event.aggregateId,
        tripId: event.tripId,
        scheduleId: null,
        status: "pending",
        deliveryStartedAt: new Date(),
        deliveryCompletedAt: null,
        totalRecipients: event.userIds.length,
        successCount: null,
        failureCount: null,
        errors: null,
      });

      // Fetch subscriptions for target users
      const subscriptionsResult = yield* Effect.all(
        event.userIds.map((userId) => pushSubscriptionPort.findByUserId(userId)),
        { concurrency: 5 }
      ).pipe(
        Effect.either
      );

      // Handle subscription fetch failure
      if (Either.isLeft(subscriptionsResult)) {
        const error = subscriptionsResult.left;
        yield* Effect.logError("Failed to fetch subscriptions").pipe(
          Effect.annotateLogs({ error })
        );

        yield* deliveryPort.update({
          id: deliveryId,
          notificationId: event.aggregateId,
          tripId: event.tripId,
          scheduleId: null,
          status: "failure",
          deliveryStartedAt: new Date(),
          deliveryCompletedAt: new Date(),
          totalRecipients: event.userIds.length,
          successCount: 0,
          failureCount: event.userIds.length,
          errors: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      const allSubscriptions = subscriptionsResult.right.flat();

      // Handle case where no subscriptions found
      if (allSubscriptions.length === 0) {
        yield* deliveryPort.update({
          id: deliveryId,
          notificationId: event.aggregateId,
          tripId: event.tripId,
          scheduleId: null,
          status: "success",
          deliveryStartedAt: new Date(),
          deliveryCompletedAt: new Date(),
          totalRecipients: 0,
          successCount: 0,
          failureCount: 0,
          errors: null,
        });
        return;
      }

      // Send notifications with retry logic
      const sendResult = yield* self.sendWithRetry(
        notificationService,
        event.aggregateId
      );

      // Determine final status
      const status =
        sendResult.failed === 0
          ? "success"
          : sendResult.sent === 0
            ? "failure"
            : "partial_failure";

      yield* deliveryPort.update({
        id: deliveryId,
        notificationId: event.aggregateId,
        tripId: event.tripId,
        scheduleId: null,
        status,
        deliveryStartedAt: new Date(),
        deliveryCompletedAt: new Date(),
        totalRecipients: allSubscriptions.length,
        successCount: sendResult.sent,
        failureCount: sendResult.failed,
        errors: null,
      });
    }).pipe(
      Effect.catchAll((error) => {
        return Effect.gen(this, function* () {
          yield* Effect.logError("Unhandled error in NotificationSendHandler").pipe(
            Effect.annotateLogs({
              error,
              eventTag: this.eventTag,
            })
          );

          const deliveryPort = yield* NotificationDeliveryPortTag;
          const deliveryId = crypto.randomUUID() as NotificationDelivery["id"];

          yield* Effect.orElse(
            deliveryPort.create({
              id: deliveryId,
              notificationId: event.aggregateId,
              tripId: event.tripId,
              scheduleId: null,
              status: "failure",
              deliveryStartedAt: new Date(),
              deliveryCompletedAt: new Date(),
              totalRecipients: event.userIds.length,
              successCount: 0,
              failureCount: event.userIds.length,
              errors: error instanceof Error ? error.message : String(error),
            }),
            () => Effect.void
          );
        });
      })
    ) as Effect.Effect<
      void,
      never,
      PushSubscriptionPortTag | NotificationDeliveryPortTag | NotificationServicePortTag
    >;
  }

  private sendWithRetry(
    notificationService: INotificationServicePort,
    notificationId: NotificationId
  ) {
    const self = this;
    return Effect.gen(function* () {
      // Apply retry policy - the send effect must be created INSIDE the retry
      // so it gets re-executed on each retry attempt
      const result = yield* Effect.retry(
        Effect.sync(() =>
          notificationService.sendMobileNotifications(notificationId)
        ).pipe(Effect.flatten),
        {
          schedule: self.retrySchedule,
          while: (error) => {
            const errorWithTag = error as { _tag?: string };
            const isNonRetryable =
              errorWithTag._tag === "DeviceNotRegisteredError" ||
              errorWithTag._tag === "InvalidCredentialsError";
            return !isNonRetryable;
          },
        }
      ).pipe(Effect.either);

      if (Either.isLeft(result)) {
        return { success: false, sent: 0, failed: 1 };
      }

      const successResult = result.right;
      return {
        success: successResult.success,
        sent: successResult.sent,
        failed: successResult.failed,
      };
    });
  }
}
