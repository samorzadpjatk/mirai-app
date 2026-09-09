import { extractUserIdsFromParticipants } from "@mirai-app/common/notifications";
import type { DB } from "@mirai-app/db";
import { tripParticipants } from "@mirai-app/db";
import { and, eq } from "drizzle-orm";
import type { NotificationData } from "../services/notificationService";
import { sendMobileNotifications } from "../services/notificationService";
import { logger } from "./logger";
import { sendNotification } from "./notifications";

export interface NotifyGroupParams {
  db: DB;
  /** Author of the notification row (`notifications.created_by_id`). */
  actorId: string;
  tripId: string;
  groupId: string;
  notification: NotificationData;
}

/**
 * Create a notification for every member of a group and push it.
 *
 * Creating the row is only half the job — `sendNotification` writes
 * `notifications` and `notification_pushes` but never talks to Expo, so the
 * push has to be dispatched explicitly.
 */
async function notifyGroupMembers({
  db,
  actorId,
  tripId,
  groupId,
  notification,
}: NotifyGroupParams): Promise<string | null> {
  const participants = await db
    .select({ userId: tripParticipants.userId })
    .from(tripParticipants)
    .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.groupId, groupId)));

  const userIds = extractUserIdsFromParticipants(participants);
  if (userIds.length === 0) {
    return null;
  }

  const { notificationId } = await sendNotification({
    db,
    userId: actorId,
    input: {
      userIds,
      title: notification.title,
      body: notification.body,
      url: notification.url,
      tripId,
    },
  });

  await sendMobileNotifications(db, notificationId);

  return notificationId;
}

/**
 * Fire-and-forget wrapper for notifications that must never break the mutation
 * that triggered them. A push failing is not a reason to roll back an
 * admin's coin adjustment or a group's reward purchase.
 */
export async function notifyGroupMembersSafely(
  params: NotifyGroupParams,
  context: Record<string, unknown>,
): Promise<string | null> {
  try {
    return await notifyGroupMembers(params);
  } catch (error) {
    logger.error({ ...context, error }, "Failed to send automatic group notification");
    return null;
  }
}
