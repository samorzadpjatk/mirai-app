import type { UserId } from "../../user/value-objects/UserId";
import type { PushSubscriptionId } from "../value-objects/NotificationId";

/**
 * PushSubscription entity interface
 * Represents a user's push notification subscription
 */
export interface PushSubscription {
  id: PushSubscriptionId;
  userId: UserId;
  token: string;
  createdAt: Date;
  updatedAt: Date;
}
