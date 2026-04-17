import { Effect, Data } from "effect";
import {
  NotificationPortTag,
  NotificationServicePortTag,
} from "../ports/NotificationPort";
import type { ApplicationError } from "@mirai-app/domain";
import type { RetryNotificationResultDTO } from "../dto/NotificationDTOs";

/**
 * Notification not found error
 */
export class NotificationNotFoundError extends Data.TaggedError(
  "NotificationNotFoundError",
)<{
  notificationId: string;
}>() {}

/**
 * No failed pushes error
 */
export class NoFailedPushesError extends Data.TaggedError(
  "NoFailedPushesError",
)<{
  notificationId: string;
}>() {}

/**
 * Input for RetryNotificationUseCase
 */
export interface RetryNotificationInput {
  notificationId: string;
}

/**
 * Retry Notification Use Case
 *
 * Retries failed notification pushes for a notification.
 */
export class RetryNotificationUseCase {
  execute(
    input: RetryNotificationInput,
  ): Effect.Effect<
    RetryNotificationResultDTO,
    ApplicationError | NotificationNotFoundError | NoFailedPushesError,
    NotificationPortTag | NotificationServicePortTag
  > {
    return Effect.gen(function* () {
      const notificationPort = yield* NotificationPortTag;
      const notificationService = yield* NotificationServicePortTag;

      // Check notification exists
      const notificationWithPushes = yield* notificationPort.findWithPushes(
        input.notificationId,
      );

      if (!notificationWithPushes) {
        return yield* Effect.fail(
          new NotificationNotFoundError({
            notificationId: input.notificationId,
          }),
        );
      }

      // Get failed pushes
      const failedPushes = yield* notificationPort.getFailedPushes(
        input.notificationId,
      );

      if (failedPushes.length === 0) {
        return yield* Effect.fail(
          new NoFailedPushesError({ notificationId: input.notificationId }),
        );
      }

      // Reset failed pushes to pending
      yield* notificationPort.resetFailedPushes(input.notificationId);

      // Retry sending mobile notifications
      const result = yield* notificationService.sendMobileNotifications(
        input.notificationId,
      );

      return {
        success: result.success,
        notificationId: input.notificationId,
        retriedCount: failedPushes.length,
        sent: result.sent,
        failed: result.failed,
      };
    });
  }
}
