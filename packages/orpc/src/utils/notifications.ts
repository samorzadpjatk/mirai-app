import type { DB } from "@mirai-app/db";
import { notifications, notificationPushes, groups, tripParticipants } from "@mirai-app/db";
import { eq, and, desc } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { NotificationService } from "../services/notificationService";
import { executeWithRetry } from "../utils/resilience";

export interface SendNotificationInput {
  title: string;
  body: string;
  url: string;
  userIds: string[];
  tripId: string | null;
}

export interface SendNotificationResult {
  success: boolean;
  notificationId: string;
}

export async function sendNotification({
  db,
  userId,
  input,
}: {
  db: DB;
  userId: string;
  input: SendNotificationInput;
}): Promise<SendNotificationResult> {
  try {
    return await executeWithRetry(
      async () => {
        const uniqueUserIds = Array.from(new Set(input.userIds));

        const inserted = await db.insert(notifications).values({
          title: input.title,
          body: input.body,
          url: input.url,
          createdById: userId,
          tripId: input.tripId,
        }).returning();
        const notification = inserted[0];

        if (!notification) {
          throw new Error("Failed to create notification");
        }

        if (uniqueUserIds.length > 0) {
          await db.insert(notificationPushes).values(
            uniqueUserIds.map((targetUserId) => ({
              notificationId: notification.id,
              targetUserId,
              status: "pending",
            }))
          ).onConflictDoNothing();
        }

        return {
          success: true,
          notificationId: notification.id,
        };
      },
      (error, retryAttempt) => {
        console.error(
          `Error creating notification (attempt ${retryAttempt + 1}):`,
          error,
        );
      },
    );
  } catch (error) {
    console.error("Error creating notification after retries:", error);
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create notification" });
  }
}

export async function sendRankingUpdate({
  db,
  userId,
  tripId,
}: {
  db: DB;
  userId: string;
  tripId: string;
}): Promise<{
  success: boolean;
  notificationIds: string[];
}> {
  const groupRows = await db.select().from(groups)
    .where(and(eq(groups.tripId, tripId), eq(groups.isDeleted, false)))
    .orderBy(desc(groups.coins));

  const results = await Promise.allSettled(
    groupRows.map(async (group, index) => {
      const participants = await db.select({ userId: tripParticipants.userId })
        .from(tripParticipants)
        .where(and(eq(tripParticipants.tripId, tripId), eq(tripParticipants.groupId, group.id)));
      const userIds = participants.map((p) => p.userId);
      const notificationData =
        NotificationService.createRankingUpdateNotification(
          group.name,
          index + 1,
        );

      return await sendNotification({
        db,
        userId,
        input: {
          userIds,
          title: notificationData.title,
          body: notificationData.body,
          url: notificationData.url,
          tripId,
        },
      });
    }),
  );

  const successfulResults = results
    .filter((r): r is PromiseFulfilledResult<SendNotificationResult> => r.status === "fulfilled")
    .map((r) => r.value);

  return {
    success: successfulResults.length === groupRows.length,
    notificationIds: successfulResults.map((r) => r.notificationId),
  };
}
