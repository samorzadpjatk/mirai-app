import { db } from "~/server/db";
import { NotificationService } from "./notificationService";
import webpush from "web-push";
import { env } from "~/env";

// Configure web-push with VAPID keys
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${env.VAPID_EMAIL}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

interface WebPushError extends Error {
  statusCode?: number;
}

// Type for group ranking data
interface GroupRanking {
  id: string;
  name: string;
  coins: number;
  members: Array<{
    user: {
      id: string;
      name: string | null;
    };
  }>;
}

export class ScheduledNotificationService {
  /**
   * Helper function to send notification to a user and handle web push directly
   */
  private static async sendNotificationToUser(
    user: any,
    notification: { title: string; body: string; url?: string; data?: Record<string, unknown> }
  ): Promise<{ sent: number; failed: number }> {
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      url: notification.url ?? "/",
      data: notification.data ?? {},
      timestamp: Date.now(),
    });

    let sent = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      user.pushSubscriptions.map(async (subscription: any) => {
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

    sent = results.filter(result => result.status === 'fulfilled').length;
    failed = results.filter(result => result.status === 'rejected').length;

    return { sent, failed };
  }
  /**
   * Generate and send ranking update notifications to all users
   */
  static async sendRankingUpdate(scheduleName: string): Promise<{
    sent: number;
    failed: number;
    totalUsers: number;
  }> {
    try {
      // Get current ranking
      const ranking = await db.group.findMany({
        orderBy: { coins: "desc" },
        include: {
          members: {
            include: {
              user: {
                include: {
                  pushSubscriptions: true,
                },
              },
            },
          },
          organizer: {
            select: {
              id: true,
              name: true,
              pushSubscriptions: true,
            },
          },
        },
      });

      if (ranking.length === 0) {
        console.log("No groups found for ranking update");
        return { sent: 0, failed: 0, totalUsers: 0 };
      }

      console.log(`Found ${ranking.length} groups for ranking update`);

      // Create ranking message
      const topGroup = ranking[0];
      // Create ranking message (for potential future use)
      // const _rankingMessage = this.createRankingUpdateMessage(ranking);

      let totalSent = 0;
      let totalFailed = 0;
      let totalUsers = 0;

      // Send notifications to all users in all groups
      for (const group of ranking) {
        const groupPosition = ranking.findIndex(g => g.id === group.id) + 1;
        
        // Create personalized message for this group
        const personalizedMessage = this.createPersonalizedRankingMessage(
          group.name,
          groupPosition,
          group.coins,
          topGroup?.name ?? "",
          topGroup?.coins ?? 0,
        ) as { title: string; body: string; url?: string; data?: Record<string, unknown> };

        // Get first admin user for createdBy
        const firstAdmin = await db.user.findFirst({
          where: { isAdmin: true },
        });
        
        if (!firstAdmin) {
          console.error("No admin user found for scheduled notification");
          continue; // Skip this group if no admin found
        }

        // Create notification record for this group
        const notification = await db.webPushNotification.create({
          data: {
            title: personalizedMessage.title,
            body: personalizedMessage.body,
            targetGroupId: group.id,
            status: "pending",
            createdBy: firstAdmin.id,
          },
        });

        // Send to group members and organizer
        const allUsersInGroup = [
          ...group.members.map(m => m.user),
          group.organizer
        ].filter((user, index, self) => 
          // Remove duplicates and filter users with subscriptions
          self.findIndex(u => u.id === user.id) === index && 
          user.pushSubscriptions && user.pushSubscriptions.length > 0
        );

        console.log(`Group ${group.name}: ${group.members.length} members, ${allUsersInGroup.length} users with push subscriptions`);

        let groupSent = 0;
        let groupFailed = 0;

        for (const user of allUsersInGroup) {
          totalUsers++;
          try {
            const result = await this.sendNotificationToUser(user, personalizedMessage);
            groupSent += result.sent;
            groupFailed += result.failed;
            totalSent += result.sent;
            totalFailed += result.failed;
          } catch (error) {
            console.error(`Failed to send ranking update to user ${user.id}:`, error);
            groupFailed += user.pushSubscriptions?.length || 0;
            totalFailed += user.pushSubscriptions?.length || 0;
          }
        }

        // Update notification record
        await db.webPushNotification.update({
          where: { id: notification.id },
          data: {
            status: groupSent > 0 ? "sent" : "failed",
            sentAt: groupSent > 0 ? new Date() : null,
            deliveryAttempts: 1,
            lastAttemptAt: new Date(),
            failureReason: groupSent === 0 ? `Ranking update failed for ${scheduleName}` : null,
          },
        });
      }

      console.log(`Ranking update sent: ${totalSent} successful, ${totalFailed} failed, ${totalUsers} total users`);

      return {
        sent: totalSent,
        failed: totalFailed,
        totalUsers: totalUsers,
      };
    } catch (error) {
      console.error("Error in sendRankingUpdate:", error);
      throw error;
    }
  }

  /**
   * Create a general ranking update message
   */
  private static createRankingUpdateMessage(ranking: GroupRanking[]): { title: string; body: string; url: string; data: Record<string, unknown> } {
    const topGroup = ranking[0];
    const top3 = ranking.slice(0, 3);

    let message = "🏆 Aktualizacja Rankingu Gildii!\n\n";
    message += "Najlepsze 3 gildie:\n";
    
    top3.forEach((group, index) => {
      const emoji = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";
      message += `${emoji} ${group.name}: ${group.coins} monet\n`;
    });

    return {
      title: "🏆 Ranking Gildii - Aktualizacja",
      body: message.trim(),
      url: "/ranking",
      data: {
        type: "ranking_update",
        topGroup: topGroup?.name,
        topCoins: topGroup?.coins,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Create a personalized ranking message for a specific group
   */
  private static createPersonalizedRankingMessage(
    groupName: string,
    position: number,
    coins: number,
    topGroupName: string,
    topGroupCoins: number,
  ): { title: string; body: string; url: string; data: Record<string, unknown> } {
    let title: string;
    let body: string;

    if (position === 1) {
      title = `🥇 ${groupName} - Liderzy Rankingu!`;
      body = `Gratulacje! Wasza gildia jest na 1. miejscu z ${coins} monetami! Kontynuujcie dobrą pracę!`;
    } else if (position <= 3) {
      const emoji = position === 2 ? "🥈" : "🥉";
      title = `${emoji} ${groupName} - Top 3!`;
      body = `Wasza gildia jest na ${position}. miejscu z ${coins} monetami! `;
      
      if (position === 2) {
        const coinDiff = topGroupCoins - coins;
        body += `Do 1. miejsca brakuje wam ${coinDiff} monet!`;
      } else {
        body += `Świetna robota! Jesteście w TOP 3!`;
      }
    } else {
      title = `📊 ${groupName} - Pozycja ${position}`;
      body = `Wasza gildia jest obecnie na ${position}. miejscu z ${coins} monetami. `;
      
      const coinDiff = topGroupCoins - coins;
      body += `Lider (${topGroupName}) ma ${topGroupCoins} monet. Pozostało ${coinDiff} monet do dogonięcia!`;
    }

    return {
      title,
      body,
      url: "/ranking",
      data: {
        type: "personalized_ranking_update",
        groupName,
        position,
        coins,
        topGroupName,
        topGroupCoins,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Send weekly summary to all users
   */
  static async sendWeeklySummary(): Promise<{
    sent: number;
    failed: number;
    totalUsers: number;
  }> {
    try {
      // Get ranking data
      const ranking = await db.group.findMany({
        orderBy: { coins: "desc" },
        include: {
          members: {
            include: {
              user: {
                include: {
                  pushSubscriptions: true,
                },
              },
            },
          },
          organizer: {
            select: {
              id: true,
              name: true,
              pushSubscriptions: true,
            },
          },
          coinTransactions: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
          },
        },
      });

      // Get total transactions from last week
      const totalTransactions = await db.coinTransaction.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Calculate total coins distributed this week
      const totalCoinsThisWeek = await db.coinTransaction.aggregate({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          amount: {
            gt: 0, // Only positive amounts (coins added)
          },
        },
        _sum: {
          amount: true,
        },
      });

      const summaryNotification: { title: string; body: string; url?: string; data?: Record<string, unknown> } = {
        title: "📊 Podsumowanie Tygodnia",
        body: `W tym tygodniu: ${totalCoinsThisWeek._sum.amount ?? 0} monet rozdane, ${totalTransactions} transakcji. Lider: ${ranking[0]?.name ?? 'Brak'} (${ranking[0]?.coins ?? 0} monet). Sprawdź pełny ranking!`,
        url: "/ranking",
        data: {
          type: "weekly_summary",
          totalCoins: totalCoinsThisWeek._sum.amount ?? 0,
          totalTransactions,
          leader: ranking[0]?.name ?? null,
          leaderCoins: ranking[0]?.coins ?? 0,
          timestamp: Date.now(),
        },
      };

      // Get first admin user for createdBy
      const firstAdmin = await db.user.findFirst({
        where: { isAdmin: true },
      });
      
      if (!firstAdmin) {
        throw new Error("No admin user found for scheduled weekly summary notification");
      }

      // Create notification record for weekly summary
      const notification = await db.webPushNotification.create({
        data: {
          title: summaryNotification.title,
          body: summaryNotification.body,
          sentToAll: true,
          status: "pending",
          createdBy: firstAdmin.id,
        },
      });

      let totalSent = 0;
      let totalFailed = 0;
      let totalUsers = 0;

      // Get all unique users from all groups
      const allUsers = new Map();
      
      for (const group of ranking) {
        // Add group members
        for (const member of group.members) {
          if (member.user.pushSubscriptions && member.user.pushSubscriptions.length > 0) {
            allUsers.set(member.user.id, member.user);
          }
        }

        // Add organizer
        if (group.organizer.pushSubscriptions && group.organizer.pushSubscriptions.length > 0) {
          allUsers.set(group.organizer.id, group.organizer);
        }
      }

      // Send to all unique users
      for (const user of allUsers.values()) {
        totalUsers++;
        try {
          const result = await this.sendNotificationToUser(user, summaryNotification);
          totalSent += result.sent;
          totalFailed += result.failed;
        } catch (error) {
          console.error(`Failed to send weekly summary to user ${user.id}:`, error);
          totalFailed += user.pushSubscriptions?.length || 0;
        }
      }

      // Update notification record
      await db.webPushNotification.update({
        where: { id: notification.id },
        data: {
          status: totalSent > 0 ? "sent" : "failed",
          sentAt: totalSent > 0 ? new Date() : null,
          deliveryAttempts: 1,
          lastAttemptAt: new Date(),
          failureReason: totalSent === 0 ? "Weekly summary failed - no active subscriptions" : null,
        },
      });

      return {
        sent: totalSent,
        failed: totalFailed,
        totalUsers: totalUsers,
      };
    } catch (error) {
      console.error("Error in sendWeeklySummary:", error);
      throw error;
    }
  }

  /**
   * Check and execute scheduled notifications
   */
  static async executeScheduledNotifications(): Promise<{
    executed: number;
    failed: number;
    skipped: number;
  }> {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Get active schedules that should run now
      const activeSchedules = await db.notificationSchedule.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
          hour: currentHour,
          minute: currentMinute,
        },
      });

      let executed = 0;
      let failed = 0;
      let skipped = 0;

      for (const schedule of activeSchedules) {
        try {
          // Check if this schedule was already executed today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (schedule.lastRun && schedule.lastRun >= today) {
            console.log(`Schedule ${schedule.name} already executed today, skipping`);
            skipped++;
            continue;
          }

          console.log(`Executing scheduled notification: ${schedule.name}`);

          // Execute the notification based on schedule name/type
          if (schedule.name.toLowerCase().includes("ranking")) {
            await this.sendRankingUpdate(schedule.name);
          } else if (schedule.name.toLowerCase().includes("weekly")) {
            await this.sendWeeklySummary();
          } else {
            // Default to ranking update
            await this.sendRankingUpdate(schedule.name);
          }

          // Update last run timestamp
          await db.notificationSchedule.update({
            where: { id: schedule.id },
            data: { lastRun: now },
          });

          executed++;
        } catch (error) {
          console.error(`Failed to execute schedule ${schedule.name}:`, error);
          failed++;
        }
      }

      return { executed, failed, skipped };
    } catch (error) {
      console.error("Error in executeScheduledNotifications:", error);
      throw error;
    }
  }
}
