import { NotificationStatus, DatabaseError } from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { NotificationGatewayTag } from "../ports/gateway";
import type { NotificationDTO } from "../dto";

/**
 * Input for ScheduleNotification use case
 */
export interface ScheduleNotificationInput {
  notificationId: string;
  scheduledFor: Date;
}

/**
 * Output DTO for ScheduleNotification use case
 */
export interface ScheduleNotificationOutput {
  id: string;
  title: string;
  body: string;
  url: string | null;
  createdById: string;
  tripId: string | null;
  status: string;
  priority: string;
  scheduledFor: Date;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Error types for ScheduleNotification use case
 */
export class NotificationNotFoundError extends Data.TaggedError(
  "NotificationNotFoundError",
)<{ notificationId: string }> {}

export class NotificationScheduleError extends Data.TaggedError(
  "NotificationScheduleError",
)<{ message: string }> {}

export class NotificationValidationError extends Data.TaggedError(
  "NotificationValidationError",
)<{ message: string; field?: string }> {}

export class NotificationStateError extends Data.TaggedError(
  "NotificationStateError",
)<{ message: string }> {}

/**
 * ScheduleNotification Use Case
 *
 * Schedules a notification for future delivery.
 * The notification status is updated to READY and scheduledFor is set.
 * Returns error if notification not found, already sent, or scheduled time is in the past.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* scheduleNotificationUseCase(input);
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
export function scheduleNotificationUseCase(
  input: ScheduleNotificationInput,
): Effect.Effect<
  ScheduleNotificationOutput,
  | DatabaseError
  | NotificationNotFoundError
  | NotificationValidationError
  | NotificationStateError
  | NotificationScheduleError,
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

    // Cannot schedule if already sent
    if (existing.status === NotificationStatus.SENT) {
      return yield* Effect.fail(
        new NotificationStateError({
          message: "Cannot schedule a notification that has already been sent",
        }),
      );
    }

    // Cannot schedule if already cancelled
    if (existing.status === NotificationStatus.CANCELLED) {
      return yield* Effect.fail(
        new NotificationStateError({
          message: "Cannot schedule a notification that has been cancelled",
        }),
      );
    }

    // Validate scheduled time is in the future
    const now = new Date();
    if (input.scheduledFor.getTime() <= now.getTime()) {
      return yield* Effect.fail(
        new NotificationValidationError({
          message: "Scheduled time must be in the future",
          field: "scheduledFor",
        }),
      );
    }

    // Build updated DTO with scheduled time
    const isDraftOrFailed =
      existing.status === NotificationStatus.DRAFT ||
      existing.status === NotificationStatus.FAILED;

    const updated: NotificationDTO = {
      ...existing,
      scheduledAt: input.scheduledFor,
      // Update status to READY if currently DRAFT or FAILED
      ...(isDraftOrFailed && { status: NotificationStatus.READY }),
      updatedAt: new Date(),
    };

    // Save to repository
    const saved = yield* notificationRepo.update(updated).pipe(
      Effect.mapError(
        () =>
          new NotificationScheduleError({
            message: "Failed to schedule notification",
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(notification: NotificationDTO): ScheduleNotificationOutput {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.content,
    url: null,
    createdById: notification.createdById,
    tripId: notification.tripId,
    status: notification.status,
    priority: notification.priority,
    scheduledFor: notification.scheduledAt!,
    sentAt: notification.sentAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}
