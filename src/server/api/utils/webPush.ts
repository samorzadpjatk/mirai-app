import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import webpush, { WebPushError } from "web-push";
import { NotificationService } from "~/server/services/notificationService";

export async function send({
  db,
  userId,
  input,
}: {
  db: PrismaClient;
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
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No push subscriptions found to send to",
      });
    }

    const payload = JSON.stringify({
      title: input.title,
      body: input.body,
      url: input.url,
      timestamp: Date.now(),
    });

    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        let statusCode = 0;
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };
          const result = await webpush.sendNotification(
            pushSubscription,
            payload,
          );
          statusCode = result.statusCode;
        } catch (error) {
          console.error("Error sending notification:", error);
          // Remove invalid subscriptions
          if (error instanceof WebPushError) {
            if (error.statusCode === 410 || error.statusCode === 404) {
              await db.pushSubscription.delete({
                where: { id: subscription.id },
              });
            }
            statusCode = error.statusCode;
          }
        } finally {
          return { userId: subscription.userId, statusCode };
        }
      }),
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
  db: PrismaClient;
  userId: string;
}) {
  const groups = await db.group.findMany({
    orderBy: { coins: "desc" },
  });
  const results = await Promise.all(
    groups.map(async (group, index) => {
      const members = await db.user.findMany({
        where: {
          OR: [{ group: { id: group.id } }, { organizerGroup: { id: group.id } }],
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
