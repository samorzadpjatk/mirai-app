import {
  Notification,
  NotificationStatus,
  NotificationPriority,
  ValidationError,
  StateTransitionError,
} from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { NotificationRepositoryTag } from "../ports/NotificationRepository";
import { DatabaseError } from "@mirai-app/domain/ports";

/**
 * Input for UpdateNotification use case
 */
export interface UpdateNotificationInput {
  notificationId: string;
  title?: string;
  body?: string;
  url?: string | null;
  status?: NotificationStatus;
  priority?: NotificationPriority;
}

/**
 * Output DTO for UpdateNotification use case
 */
export interface UpdateNotificationOutput {
  id: string;
  title: string;
  body: string;
  url: string | null;
  createdById: string;
  tripId: string | null;
  status: string;
  priority: string;
  scheduledFor: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Error types for UpdateNotification use case
 */
export class NotificationNotFoundError extends Data.TaggedError(
  "NotificationNotFoundError",
)<{ notificationId: string }> {}

export class NotificationUpdateError extends Data.TaggedError(
  "NotificationUpdateError",
)<{ message: string }> {}

export class NotificationValidationError extends Data.TaggedError(
  "NotificationValidationError",
)<{ message: string; field?: string }> {}

export class NotificationStateError extends Data.TaggedError(
  "NotificationStateError",
)<{ message: string }> {}

/**
 * UpdateNotification Use Case
 *
 * Updates an existing notification.
 * Returns error if notification not found or validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* updateNotificationUseCase(input);
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
export function updateNotificationUseCase(
  input: UpdateNotificationInput,
): Effect.Effect<
  UpdateNotificationOutput,
  | DatabaseError
  | NotificationNotFoundError
  | NotificationValidationError
  | NotificationStateError
  | NotificationUpdateError,
  NotificationRepositoryTag
> {
  return Effect.gen(function* () {
    const notificationRepo = yield* NotificationRepositoryTag;

    // Find the notification
    const existing = yield* notificationRepo.findById(input.notificationId);

    if (!existing) {
      return yield* Effect.fail(
        new NotificationNotFoundError({
          notificationId: input.notificationId,
        }),
      );
    }

    // Update content if provided
    let updated = existing;
    if (
      input.title !== undefined ||
      input.body !== undefined ||
      input.url !== undefined
    ) {
      updated = yield* updated
        .updateContent({
          title: input.title,
          body: input.body,
          url: input.url,
        })
        .pipe(
          Effect.mapError((error) => {
            if (error instanceof ValidationError) {
              return new NotificationValidationError({
                message: error.message,
                field: error.field,
              });
            }
            return new NotificationStateError({
              message: error.message,
            });
          }),
        );
    }

    // Update status if provided
    if (input.status !== undefined && input.status !== updated.status) {
      updated = yield* updated.updateStatus(input.status).pipe(
        Effect.mapError(
          (error) =>
            new NotificationStateError({
              message: `Cannot transition from ${error.from} to ${error.to}: ${error.message}`,
            }),
        ),
      );
    }

    // Update priority if provided
    if (input.priority !== undefined && input.priority !== updated.priority) {
      updated = updated.updatePriority(input.priority);
    }

    // Save to repository
    const saved = yield* notificationRepo.update(updated).pipe(
      Effect.mapError(
        () =>
          new NotificationUpdateError({
            message: "Failed to update notification",
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(notification: Notification): UpdateNotificationOutput {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    url: notification.url,
    createdById: notification.createdById,
    tripId: notification.tripId,
    status: notification.status,
    priority: notification.priority,
    scheduledFor: notification.scheduledFor,
    sentAt: notification.sentAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}
