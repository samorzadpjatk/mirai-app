import { executeWithRetry } from "../utils/resilience";
import { type PrismaClient } from "@integral-2025-app/db";
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";

export interface NotificationData {
  title: string;
  body: string;
  url: string;
}

export class NotificationService {
  /**
   * Create notifications for common group events
   */
  static createCoinsAddedNotification(
    groupName: string,
    amount: number,
    reason: string | undefined,
  ): NotificationData {
    let body;
    if (reason) {
      body = `Your guild received ${amount} coins!\nReason: ${reason}\nClick me to see your balance!`;
    } else {
      body = `Your guild received ${amount} coins!\nClick me to see your balance!`;
    }
    return {
      title: `💰 ${groupName} received coins!`,
      body: body,
      url: "/group/my",
    };
  }
  static createCoinsRemovedNotification(
    groupName: string,
    amount: number,
    reason: string | undefined,
  ): NotificationData {
    let body;
    if (reason) {
      body = `Your guild lost ${amount} coins!\nReason: ${reason}\nClick me to see your balance!`;
    } else {
      body = `Your guild lost ${amount} coins!\nClick me to see your balance!`;
    }
    return {
      title: `💸 ${groupName} - Coins Seized`,
      body: body,
      url: "/group/my",
    };
  }

  static createNewMemberNotification(
    groupName: string,
    memberName: string,
  ): NotificationData {
    return {
      title: `👥 New member in ${groupName}!`,
      body: `${memberName} joined your guild!`,
      url: "/group/my",
    };
  }

  static createRankingUpdateNotification(
    groupName: string,
    newPosition: number,
  ): NotificationData {
    return {
      title: `🏆 Ranking update!`,
      body: `${groupName} now holds ${newPosition} place in the ranking! Click me to check the current ranking.`,
      url: "/ranking",
    };
  }
}

export async function sendMobileNotifications(
  db: PrismaClient,
  notificationId: string,
) {
  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) return { success: false, sent: 0, failed: 0, total: 0 };

  const subs = await db.pushSubscription.findMany();
  if (subs.length === 0) {
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  const expo = new Expo();
  const messages: ExpoPushMessage[] = [];
  const userByToken = new Map<string, string>();

  for (const s of subs) {
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
      const t = await executeWithRetry(
        () => expo.sendPushNotificationsAsync(chunk),
        (err, retryAttempt) => {
          console.error(
            `Error sending push notification chunk (attempt ${retryAttempt + 1}):`,
            err,
          );
        },
        undefined,
        3,
        500,
      );
      tickets.push(...t);
    } catch {
      tickets.push(
        ...chunk.map(
          (): ExpoPushTicket => ({
            status: "error",
            message: "network error",
          }),
        ),
      );
    }
  }

  const results = tickets
    .map((t, idx) => {
      const token = messages[idx]?.to;
      if (!token || typeof token !== "string") return null;
      const userId = userByToken.get(token);
      if (!userId) return null;
      const statusCode = t.status === "ok" ? 200 : 500;
      return { userId, statusCode };
    })
    .filter(
      (
        r,
      ): r is {
        userId: string;
        statusCode: number;
      } => r !== null,
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
