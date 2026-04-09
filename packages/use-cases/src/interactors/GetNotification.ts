import type { Result } from "@repo/domain";
import { ok, err, Notification } from "@repo/domain";
import type { NotificationRepository } from "../ports/NotificationRepository";

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
 * GetNotification Use Case
 *
 * Retrieves a notification by ID.
 * Returns error if notification not found.
 */
export class GetNotificationUseCase {
  constructor(private notificationRepository: NotificationRepository) {}

  async execute(
    input: GetNotificationInput,
  ): Promise<Result<GetNotificationOutput, string>> {
    const notification = await this.notificationRepository.findById(
      input.notificationId,
    );

    if (!notification) {
      return err("Notification not found");
    }

    return ok(this.toOutput(notification));
  }

  private toOutput(notification: Notification): GetNotificationOutput {
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
}
