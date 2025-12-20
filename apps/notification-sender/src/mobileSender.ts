import type { Prisma } from "@integral-2025-app/db";
import {
  Expo,
  type ExpoPushMessage,
  type ExpoPushTicket,
} from "expo-server-sdk";

export async function sendMobileNotifications(
  db: Prisma.TransactionClient,
  notificationId: string,
) {
  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) return { success: false, sent: 0, failed: 0, total: 0 };

  const subs = await db.mobilePushSubscription.findMany();
  if (subs.length === 0) {
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  const expo = new Expo();
  const messages: ExpoPushMessage[] = [];
  const userByToken = new Map<string, string>();

  for (const s of subs) {
    if (s.platform !== "expo") continue;
    if (!Expo.isExpoPushToken(s.token)) continue;
    userByToken.set(s.token, s.userId);
    messages.push({
      to: s.token,
      title: notification.title,
      body: notification.body,
      data: { url: notification.url },
      sound: "default",
      priority: "default",
    });
  }

  if (messages.length === 0) {
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];
  for (const chunk of chunks) {
    try {
      const t = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...t);
    } catch {
      tickets.push(
        ...chunk.map(
          (): ExpoPushTicket => ({ status: "error", message: "network error" }),
        ),
      );
    }
  }

  const results = tickets.map((t, idx) => {
    const token = messages[idx]?.to as string;
    const userId = userByToken.get(token)!;
    const statusCode = t.status === "ok" ? 200 : 500;
    return { userId, statusCode };
  });

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
          failureReason: "expo",
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
