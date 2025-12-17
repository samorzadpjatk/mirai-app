import type { Prisma } from "@integral-2025-app/db";
import webpush, { WebPushError } from "web-push";

export async function sendNotifications(
  db: Prisma.TransactionClient,
  notificationId: string,
) {
  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) return { success: false, sent: 0, failed: 0, total: 0 };

  const subscriptions = await db.pushSubscription.findMany();
  if (subscriptions.length === 0) {
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url,
    timestamp: Date.now(),
  });

  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      let statusCode = 0;
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      };
      try {
        const res = await webpush.sendNotification(pushSubscription, payload);
        statusCode = res.statusCode;
      } catch (err) {
        if (err instanceof WebPushError) {
          statusCode = err.statusCode ?? 0;
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.pushSubscription
              .delete({ where: { id: subscription.id } })
              .catch(() => void 0);
          }
        } else {
          statusCode = 0;
        }
      } finally {
        return { userId: subscription.userId, statusCode };
      }
    }),
  );

  const successful = results.filter(
    (r) => r.statusCode >= 200 && r.statusCode < 300,
  );
  const failed = results.filter(
    (r) => r.statusCode < 200 || r.statusCode >= 300,
  );

  if (successful.length + failed.length > 0) {
    await db.notificationPush.createMany({
      data: [
        ...successful.map((r) => ({
          notificationId: notification.id,
          targetUserId: r.userId,
          status: "sent",
          sentAt: new Date(),
        })),
        ...failed.map((r) => ({
          notificationId: notification.id,
          targetUserId: r.userId,
          status: "failed",
          sentAt: new Date(),
          failureReason: `HTTP ${r.statusCode}`,
        })),
      ],
    });
  }

  return {
    success: failed.length === 0,
    sent: successful.length,
    failed: failed.length,
    total: results.length,
  };
}
