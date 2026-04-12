import { Effect } from "effect";
import { NotificationRepositoryTag } from "../ports/NotificationRepository";
import type { Notification } from "@mirai-app/domain";

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
export class NotificationNotFoundError extends Error {
  readonly _tag = "NotificationNotFoundError";
  constructor() {
    super("Notification not found");
  }
}

/**
 * Helper function to convert Notification to output DTO
 */
function toOutput(notification: Notification): GetNotificationOutput {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    url: notification.url,
    status: notification.status,
    priority: notification.priority,
    tripId: notification.tripId,
    createdById: notification.createdById,
    createdAt: notification.createdAt,
    isSent: notification.isSent(),
    isScheduled: notification.isScheduled(),
    isReadyToSend: notification.isReadyToSend(),
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
 *   Effect.provideService(NotificationRepositoryTag, repository)
 * );
 * const result = await Effect.runPromise(program);
 * ```
 */
export function getNotificationUseCase(
  input: GetNotificationInput,
): Effect.Effect<
  GetNotificationOutput,
  NotificationNotFoundError,
  NotificationRepositoryTag
> {
  return Effect.gen(function* () {
    const repo = yield* NotificationRepositoryTag;

    const notification = yield* repo.findById(input.notificationId);

    if (!notification) {
      return yield* Effect.fail(new NotificationNotFoundError());
    }

    return toOutput(notification);
  });
}
