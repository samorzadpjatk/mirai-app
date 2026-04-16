import {
  NotificationStatus,
  NotificationPriority,
  DatabaseError,
} from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { NotificationGatewayTag } from "../ports/gateway";
import type { NotificationDTO } from "../dto";

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
 *   Effect.provideService(NotificationGatewayTag, repository)
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
  NotificationGatewayTag
> {
  return Effect.gen(function* () {
    const notificationRepo = yield* NotificationGatewayTag;

    // Find the notification
    const existing = yield* notificationRepo.findById(input.notificationId);

    if (!existing) {
      return yield* Effect.fail(
        new NotificationNotFoundError({
          notificationId: input.notificationId,
        }),
      );
    }

    // Validate title if provided
    if (input.title !== undefined && input.title.trim().length === 0) {
      return yield* Effect.fail(
        new NotificationValidationError({
          message: "Title cannot be empty",
          field: "title",
        }),
      );
    }

    // Validate body if provided
    if (input.body !== undefined && input.body.trim().length === 0) {
      return yield* Effect.fail(
        new NotificationValidationError({
          message: "Body cannot be empty",
          field: "body",
        }),
      );
    }

    // Build updated DTO
    const updated: NotificationDTO = {
      ...existing,
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.body !== undefined && { content: input.body.trim() }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.priority !== undefined && { priority: input.priority }),
      updatedAt: new Date(),
    };

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

function toOutput(notification: NotificationDTO): UpdateNotificationOutput {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.content,
    url: null,
    createdById: notification.createdById,
    tripId: notification.tripId,
    status: notification.status,
    priority: notification.priority,
    scheduledFor: notification.scheduledAt,
    sentAt: notification.sentAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}
