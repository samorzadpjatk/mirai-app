import {
  Notification,
  NotificationStatus,
  NotificationPriority,
  ValidationError,
} from "@mirai-app/domain";
import { Effect, Data } from "effect";
import { NotificationGatewayTag } from "../ports/gateway";

/**
 * Input for CreateNotification use case
 */
export interface CreateNotificationInput {
  title: string;
  body: string;
  url?: string | null;
  createdById: string;
  tripId?: string | null;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  scheduledFor?: Date | null;
}

/**
 * Output DTO for CreateNotification use case
 */
export interface CreateNotificationOutput {
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
}

/**
 * Error types for CreateNotification use case
 */
export class NotificationCreationError extends Data.TaggedError(
  "NotificationCreationError",
)<{ message: string }> {}

export class NotificationRepositoryError extends Data.TaggedError(
  "NotificationRepositoryError",
)<{ message: string }> {}

/**
 * CreateNotification Use Case
 *
 * Creates a new notification.
 * Returns error if validation fails.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const result = yield* createNotificationUseCase(input);
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
export function createNotificationUseCase(
  input: CreateNotificationInput,
): Effect.Effect<
  CreateNotificationOutput,
  NotificationCreationError | NotificationRepositoryError,
  NotificationGatewayTag
> {
  return Effect.gen(function* () {
    const notificationRepo = yield* NotificationGatewayTag;

    // Create domain entity using Effect-based static create method
    const notification = yield* Notification.create({
      title: input.title,
      body: input.body,
      url: input.url ?? null,
      createdById: input.createdById,
      tripId: input.tripId ?? null,
      status: input.status ?? NotificationStatus.DRAFT,
      priority: input.priority ?? NotificationPriority.NORMAL,
      scheduledFor: input.scheduledFor ?? null,
    }).pipe(
      Effect.mapError(
        (validationError: ValidationError) =>
          new NotificationCreationError({
            message: validationError.message,
          }),
      ),
    );

    // Save to repository
    const saved = yield* notificationRepo.create(notification).pipe(
      Effect.mapError(
        () =>
          new NotificationRepositoryError({
            message: "Failed to create notification",
          }),
      ),
    );

    return toOutput(saved);
  });
}

function toOutput(notification: Notification): CreateNotificationOutput {
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
  };
}
