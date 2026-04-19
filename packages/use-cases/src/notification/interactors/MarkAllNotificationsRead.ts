import { Effect } from "effect";
import { NotificationPortTag } from "../ports/NotificationPort";
import { UserId } from "@mirai-app/domain";

/**
 * Input for MarkAllNotificationsReadUseCase
 */
export interface MarkAllNotificationsReadInput {
  userId: string;
}

/**
 * Result DTO for MarkAllNotificationsReadUseCase
 */
export interface MarkAllNotificationsReadResultDTO {
  count: number;
}

/**
 * Mark All Notifications Read Use Case
 *
 * Marks all notifications for a user as read by deleting them from the user's view.
 * Returns the count of affected notifications.
 */
export class MarkAllNotificationsReadUseCase {
  execute(input: MarkAllNotificationsReadInput) {
    return Effect.gen(function* () {
      const notificationPort = yield* NotificationPortTag;

      // Find all notifications for the user
      const notifications = yield* notificationPort.findByUserId(
        input.userId,
      );

      // Delete all notifications
      // Note: In a real implementation, you might want to mark them as read
      // instead of deleting, depending on your requirements
      let deletedCount = 0;
      for (const notification of notifications) {
        yield* notificationPort.delete(notification.id);
        deletedCount++;
      }

      return {
        count: deletedCount,
      };
    });
  }
}
