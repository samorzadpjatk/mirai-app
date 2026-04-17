import type { NotificationId, NotificationPushId } from "../../notification/value-objects/NotificationId";
import type { UserId } from "../../user/value-objects/UserId";

/**
 * NotificationPush entity interface
 * Represents a push notification delivery attempt to a specific user
 */
export interface NotificationPush {
  id: NotificationPushId;
  notificationId: NotificationId;
  targetUserId: UserId;
  status: "pending" | "sent" | "failed";
  sentAt: Date | null;
  failureReason: string | null;
}
