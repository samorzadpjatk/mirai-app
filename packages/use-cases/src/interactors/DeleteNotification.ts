import { Notification } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { NotificationRepositoryTag } from "../ports/NotificationRepository";

/**
 * Input for DeleteNotification use case
 */
export interface DeleteNotificationInput {
  notificationId: string;
}

/**
 * Output DTO for DeleteNotification use case
 */
export interface DeleteNotificationOutput {
  success: boolean;
  deletedNotificationId: string;
}

/**
 * Error types for DeleteNotification use case
 */
export class NotificationNotFoundError extends Data.TaggedError(
  "NotificationNotFoundError",
)<{ notificationId: string }> {}

export class NotificationDeleteError extends Data.TaggedError(
  "NotificationDeleteError",
)<{ message: string }> {}

export class NotificationAlreadySentError extends Data.TaggedError(
  "NotificationAlreadySentError",
)<{ notificationId: string }> {}

/**
 * DeleteNotification Use Case
 *
 * Deletes a notification.
 * Returns error if notification not found or has already been sent.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* deleteNotificationUseCase(input);
 *   return result;
 * });
 *
 * const runnable = program.pipe(
 *   Effect.provideService(NotificationRepositoryTag, repository)
 * );
 *
 * const result = await Effect.runPromise(runnable);
 * ```
 */
export function deleteNotificationUseCase(
  input: DeleteNotificationInput,
): Effect.Effect<
  DeleteNotificationOutput,
  | NotificationNotFoundError
  | NotificationAlreadySentError
  | NotificationDeleteError,
  NotificationRepositoryTag
> {
  return Effect.gen(function* () {
    const notificationRepo = yield* NotificationRepositoryTag;

    // Check if notification exists
    const exists = yield* notificationRepo.exists(input.notificationId);

    if (!exists) {
      return yield* Effect.fail(
        new NotificationNotFoundError({
          notificationId: input.notificationId,
        }),
      );
    }

    // Find the notification to check its status
    const notification = yield* notificationRepo.findById(input.notificationId);

    if (notification && notification.isSent()) {
      return yield* Effect.fail(
        new NotificationAlreadySentError({
          notificationId: input.notificationId,
        }),
      );
    }

    // Delete from repository
    yield* notificationRepo.delete(input.notificationId).pipe(
      Effect.mapError(
        () =>
          new NotificationDeleteError({
            message: "Failed to delete notification",
          }),
      ),
    );

    return {
      success: true,
      deletedNotificationId: input.notificationId,
    };
  });
}
