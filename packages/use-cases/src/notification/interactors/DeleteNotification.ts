import { Effect } from "effect";
import { NotificationPortTag } from "../ports/NotificationPort";
import type { DeleteNotificationResultDTO } from "../dto/NotificationDTOs";

/**
 * Input for DeleteNotificationUseCase
 */
export interface DeleteNotificationInput {
  notificationId: string;
}

/**
 * Delete Notification Use Case
 *
 * Deletes a notification by ID.
 */
export class DeleteNotificationUseCase {
  execute(input: DeleteNotificationInput) {
    return Effect.gen(function* () {
      const notificationPort = yield* NotificationPortTag;

      yield* notificationPort.delete(input.notificationId);

      return {
        success: true,
      };
    });
  }
}
