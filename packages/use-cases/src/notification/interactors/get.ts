import { Effect, Data } from "effect";
import { NotificationGatewayTag } from "../ports/gateway";
import { DatabaseError, NotificationStatus } from "@mirai-app/domain";
import type { NotificationDTO } from "../dto";

/**
 * Input for GetNotification use case
 */
export interface GetNotificationInput {
  notificationId: string;
}

/**
 * Output DTO for GetNotification use case
 */
export interface GetNotificationOutput {
  id: string;
  title: string;
  body: string;
  url: string | null;
  status: string;
  priority: string;
  tripId: string | null;
  createdById: string;
  createdAt: Date;
  isSent: boolean;
  isScheduled: boolean;
  isReadyToSend: boolean;
}

/**
 * Error types for GetNotification use case
 */
export class NotificationNotFoundError extends Data.TaggedError(
  "NotificationNotFoundError",
)<{ notificationId: string }> {}

/**
 * Helper function to convert NotificationDTO to output DTO
 */
function toOutput(notification: NotificationDTO): GetNotificationOutput {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.content,
    url: null, // DTO has no url field
    status: notification.status,
    priority: notification.priority,
    tripId: notification.tripId,
    createdById: notification.createdById,
    createdAt: notification.createdAt,
    isSent: notification.status === NotificationStatus.SENT,
    isScheduled: notification.scheduledAt !== null,
    isReadyToSend: notification.status === NotificationStatus.READY,
  };
}

/**
 * GetNotification Use Case
 *
 * Retrieves a notification by ID.
 * Returns error if notification not found.
 *
 * ## Effect-based Pattern
 *
 * This use case returns Effect.Effect and uses Context.Tag for dependency injection:
 *
 * ```typescript
 * const program = getNotificationUseCase(input).pipe(
 *   Effect.provideService(NotificationGatewayTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getNotificationUseCase(
  input: GetNotificationInput,
): Effect.Effect<
  GetNotificationOutput,
  DatabaseError | NotificationNotFoundError,
  NotificationGatewayTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationGatewayTag;

    const notification = yield* repo.findById(input.notificationId);

    if (!notification) {
      return yield* Effect.fail(
        new NotificationNotFoundError({ notificationId: input.notificationId }),
      );
    }

    return toOutput(notification);
  });
}
