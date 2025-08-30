import webpush from "web-push";
import { db } from "~/server/db";
import { env } from "~/env";

// Interface for webpush error handling
interface WebPushError extends Error {
  statusCode?: number;
}

// Configure web-push with VAPID keys
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${env.VAPID_EMAIL}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

interface NotificationData {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
}

export class NotificationService {
  /**
   * Send notification to all members of a group
   */
  static async sendToGroupMembers(
    groupId: string, 
    notification: NotificationData,
    excludeUserId?: string // Optional: exclude a specific user (e.g., the admin who triggered it)
  ): Promise<{ sent: number; failed: number; totalMembers: number }> {
    try {
      // Get all users in the group with their push subscriptions
      const groupMembers = await db.userGroup.findMany({
        where: {
          groupId: groupId,
          ...(excludeUserId && {
            userId: {
              not: excludeUserId
            }
          })
        },
        include: {
          user: {
            include: {
              pushSubscriptions: true,
            },
          },
        },
      });

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        url: notification.url ?? "/",
        data: notification.data ?? {},
        timestamp: Date.now(),
      });

      let totalSent = 0;
      let totalFailed = 0;

      // Send notifications to each group member
      for (const member of groupMembers) {
        const subscriptions = member.user.pushSubscriptions;
        
        if (subscriptions.length > 0) {
          const results = await Promise.allSettled(
            subscriptions.map(async (subscription) => {
              try {
                const pushSubscription = {
                  endpoint: subscription.endpoint,
                  keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                  },
                };

                return await webpush.sendNotification(pushSubscription, payload);
              } catch (error: unknown) {
                console.error("Error sending notification:", error);
                
                // Remove invalid subscriptions
                if ((error as WebPushError).statusCode === 410 || (error as WebPushError).statusCode === 404) {
                  await db.pushSubscription.delete({
                    where: { id: subscription.id },
                  });
                }
                
                throw error;
              }
            })
          );

          totalSent += results.filter((result): result is PromiseFulfilledResult<unknown> => result.status === 'fulfilled').length;
          totalFailed += results.filter((result): result is PromiseRejectedResult => result.status === 'rejected').length;
        }
      }

      return {
        sent: totalSent,
        failed: totalFailed,
        totalMembers: groupMembers.length,
      };
    } catch (error) {
      console.error("Error in sendToGroupMembers:", error);
      throw error;
    }
  }

  /**
   * Send notification to a specific user
   */
  static async sendToUser(
    userId: string,
    notification: NotificationData
  ): Promise<{ sent: number; failed: number }> {
    try {
      const subscriptions = await db.pushSubscription.findMany({
        where: {
          userId: userId,
        },
      });

      if (subscriptions.length === 0) {
        return { sent: 0, failed: 0 };
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        url: notification.url ?? "/",
        data: notification.data ?? {},
        timestamp: Date.now(),
      });

      const results = await Promise.allSettled(
        subscriptions.map(async (subscription) => {
          try {
            const pushSubscription = {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            };

            return await webpush.sendNotification(pushSubscription, payload);
          } catch (error: unknown) {
            console.error("Error sending notification:", error);
            
            // Remove invalid subscriptions
            if ((error as WebPushError).statusCode === 410 || (error as WebPushError).statusCode === 404) {
              await db.pushSubscription.delete({
                where: { id: subscription.id },
              });
            }
            
            throw error;
          }
        })
      );

      const successful = results.filter((result): result is PromiseFulfilledResult<unknown> => result.status === 'fulfilled').length;
      const failed = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected').length;

      return { sent: successful, failed: failed };
    } catch (error) {
      console.error("Error in sendToUser:", error);
      throw error;
    }
  }

  /**
   * Create notifications for common group events
   */
  static createCoinsAddedNotification(groupName: string, amount: number): NotificationData {
    return {
      title: `💰 ${groupName} otrzymała monety!`,
      body: `Wasza gildia otrzymała ${amount} monet! Sprawdźcie aktualny ranking.`,
      url: "/ranking",
      data: {
        type: "coins_added",
        amount: amount,
        groupName: groupName,
      },
    };
  }

  static createNewMemberNotification(groupName: string, memberName: string): NotificationData {
    return {
      title: `👥 Nowy członek w ${groupName}!`,
      body: `${memberName} dołączył do waszej gildii!`,
      url: "/",
      data: {
        type: "new_member",
        memberName: memberName,
        groupName: groupName,
      },
    };
  }

  static createRankingUpdateNotification(groupName: string, newPosition: number): NotificationData {
    return {
      title: `🏆 Aktualizacja rankingu!`,
      body: `${groupName} zajmuje teraz ${newPosition} miejsce w rankingu!`,
      url: "/ranking",
      data: {
        type: "ranking_update",
        position: newPosition,
        groupName: groupName,
      },
    };
  }
}
