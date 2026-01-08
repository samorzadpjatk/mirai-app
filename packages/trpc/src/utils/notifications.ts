import type { Prisma } from "@integral-2025-app/db";
import { TRPCError } from "@trpc/server";
import { NotificationService } from "../services/notificationService";
import { executeWithRetry } from "@integral-2025-app/common-utils";

export interface SendNotificationInput {
  title: string;
  body: string;
  url: string;
  userIds: string[];
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
        const notification = await db.notification.create({
          data: {
            title: input.title,
            body: input.body,
            url: input.url,
            createdById: userId,
          },
        });

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
}: {
  db: Prisma.TransactionClient;
  userId: string;
}): Promise<{
  success: boolean;
  notificationIds: string[];
}> {
  const groups = await db.group.findMany({
    orderBy: { coins: "desc" },
  });

  const results = await Promise.all(
    groups.map(async (group, index) => {
      const members = await db.user.findMany({
        where: {
          OR: [
            { group: { id: group.id } },
            { organizerGroup: { some: { id: group.id } } },
          ],
        },
        select: { id: true },
      });
      const userIds = members.map((m) => m.id);
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
        },
      });
    }),
  );

  return {
    success: results.every((r) => r.success),
    notificationIds: results.map((r) => r.notificationId),
  };
}
