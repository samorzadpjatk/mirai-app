import type { DB } from "@mirai-app/db";
import { NotificationService } from "../services/notificationService";
import { notifyGroupMembersSafely } from "./groupNotifications";

export interface NotifyCoinChangeParams {
  db: DB;
  /** Author of the notification row (`notifications.created_by_id`). */
  actorId: string;
  tripId: string;
  groupId: string;
  groupName: string;
  /**
   * Signed amount as the endpoint received it. `group.addCoins` is the single
   * endpoint the admin app uses for both directions and encodes a removal as a
   * negative amount, so the sign — not the caller — decides the template.
   */
  amount: number;
  reason?: string | null;
}

/**
 * Notify a group that an admin changed its coin balance.
 *
 * The activity feed and push notifications are two separate systems: writing a
 * rank-change activity row does not notify anybody. Coin adjustments only ever
 * reached the feed, so members were never told their guild gained or lost
 * coins.
 */
export async function notifyCoinChange({
  db,
  actorId,
  tripId,
  groupId,
  groupName,
  amount,
  reason,
}: NotifyCoinChangeParams): Promise<string | null> {
  if (amount === 0) {
    return null;
  }

  const added = amount > 0;
  const magnitude = Math.abs(amount);
  const trimmedReason = reason?.trim() ? reason.trim() : undefined;

  const notification = added
    ? NotificationService.createCoinsAddedNotification(groupName, magnitude, trimmedReason)
    : NotificationService.createCoinsRemovedNotification(groupName, magnitude, trimmedReason);

  return await notifyGroupMembersSafely(
    { db, actorId, tripId, groupId, notification },
    { scope: "coin", groupId, added },
  );
}
