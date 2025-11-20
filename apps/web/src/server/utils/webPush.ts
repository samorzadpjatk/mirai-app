import type { Prisma } from "@integral-2025-app/db";
import { TRPCError } from "@trpc/server";
import webpush, { WebPushError } from "web-push";
import { NotificationService } from "../services/notificationService";
import { executeWithRetry } from "./resilience";

type PushSubscriptionNotificationResult = {
  userId: string;
  statusCode: number;
};

export async function send({
  db,
  userId,
  input,
}: {
  db: Prisma.TransactionClient;
  userId: string;
  input: { title: string; body: string; url: string; userIds: string[] };
}) {
  try {
    const notification = await db.notification.create({
      data: {
        title: input.title,
        body: input.body,
        url: input.url,
        createdById: userId,
      },
    });

    // Get user's push subscriptions
    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId: { in: input.userIds },
      },
    });

    if (subscriptions.length === 0) {
      return {
        success: true,
        sent: 0,
        failed: 0,
        total: 0,
      };
    }

    const payload = JSON.stringify({
      title: input.title,
      body: input.body,
      url: input.url,
      timestamp: Date.now(),
    });

    const results = await Promise.all(
      subscriptions.map(
        async (subscription): Promise<PushSubscriptionNotificationResult> => {
          let statusCode = 0;
          const userId = subscription.userId;

          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          const sendNotification = async () => {
            const result = await webpush.sendNotification(
              pushSubscription,
              payload,
            );
            statusCode = result.statusCode;
          };

          const onError = async (err: unknown, retryAttempt: number) => {
            console.error(
              `Error sending push notification subscription on attempt ${retryAttempt}`,
              err,
            );

            if (err instanceof WebPushError) {
              if (err.statusCode === 410 || err.statusCode === 404) {
                await db.pushSubscription
                  .delete({
                    where: { id: subscription.id },
                  })
                  .catch((deleteErr) =>
                    console.error(
                      "Failed to delete an invalid subscription.",
                      deleteErr,
                    ),
                  );

                statusCode = err.statusCode;
              }
            }
          };
          try {
            await executeWithRetry(sendNotification, onError);
          } catch (err) {
            console.error("Error sending notification:", err);
          } finally {
            return { userId, statusCode };
          }
        },
      ),
    );

    const successful = results.filter(
      (result) => result.statusCode >= 200 && result.statusCode < 300,
    );
    const failed = results.filter(
      (result) => result.statusCode < 200 || result.statusCode >= 300,
    );

    await db.notificationPush.createMany({
      data: successful
        .map((result) => ({
          notificationId: notification.id,
          targetUserId: result.userId,
          status: "sent",
          sentAt: new Date(),
        }))
        .concat(
          failed.map((result) => ({
            notificationId: notification.id,
            targetUserId: result.userId,
            status: "failed",
            sentAt: new Date(),
            failureReason: `HTTP ${result.statusCode}`,
          })),
        ),
    });

    return {
      success: true,
      sent: successful.length,
      failed: failed.length,
      total: results.length,
    };
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to send push notification",
    });
  }
}

export async function sendRanking({
  db,
  userId,
}: {
  db: Prisma.TransactionClient;
  userId: string;
}) {
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
      const input = {
        userIds,
        title: notificationData.title,
        body: notificationData.body,
        url: notificationData.url,
      };
      return await send({
        db,
        userId,
        input,
      });
    }),
  );
  return {
    success: results.every((r) => r.success),
    sent: results.reduce((sum, r) => sum + r.sent, 0),
    failed: results.reduce((sum, r) => sum + r.failed, 0),
    total: results.reduce((sum, r) => sum + r.total, 0),
  };
}
