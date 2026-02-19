import type { Prisma } from "@integral-2025-app/db";
import { TRPCError } from "@trpc/server";
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
  db: Prisma.TransactionClient;
  userId: string;
  input: SendNotificationInput;
}): Promise<SendNotificationResult> {
  try {
    return await executeWithRetry(
      async () => {
        const uniqueUserIds = Array.from(new Set(input.userIds));

        const notification = await db.notification.create({
          data: {
            title: input.title,
            body: input.body,
            url: input.url,
            createdById: userId,
            tripId: input.tripId,
          },
        });

        if (uniqueUserIds.length > 0) {
          await db.notificationPush.createMany({
            data: uniqueUserIds.map((targetUserId) => ({
              notificationId: notification.id,
              targetUserId,
              status: "pending",
              sentAt: null,
              failureReason: null,
            })),
            skipDuplicates: true,
          });
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
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create notification",
    });
  }
}

export async function sendRankingUpdate({
  db,
  userId,
  tripId,
}: {
  db: Prisma.TransactionClient;
  userId: string;
  tripId: string;
}): Promise<{
  success: boolean;
  notificationIds: string[];
}> {
  const groups = await db.group.findMany({
    where: { tripId, isDeleted: false },
    orderBy: { coins: "desc" },
  });

  const results = await Promise.all(
    groups.map(async (group, index) => {
      const participants = await db.tripParticipant.findMany({
        where: { tripId, groupId: group.id },
        select: { userId: true },
      });
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

  return {
    success: results.every((r) => r.success),
    notificationIds: results.map((r) => r.notificationId),
  };
}
