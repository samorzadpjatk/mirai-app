import { db } from "~/server/db";
import { NotificationService } from "./notificationService";

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
   * Generate and send ranking update notifications to all users
   */
  static async sendRankingUpdate(_scheduleName: string): Promise<{
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
        return { sent: 0, failed: 0, totalUsers: 0 };
      }

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

        // Send to group members
        if (group.members.length > 0) {
          for (const member of group.members) {
            if (member.user.pushSubscriptions.length > 0) {
              totalUsers++;
              try {
                const result = await NotificationService.sendToUser(
                  member.user.id,
                  personalizedMessage
                );
                totalSent += result.sent;
                totalFailed += result.failed;
              } catch (error) {
                console.error(`Failed to send ranking update to user ${member.user.id}:`, error);
                totalFailed += member.user.pushSubscriptions.length;
              }
            }
          }
        }

        // Send to organizer if they have subscriptions
        if (group.organizer.pushSubscriptions.length > 0) {
          totalUsers++;
          try {
            const result = await NotificationService.sendToUser(
              group.organizer.id,
              personalizedMessage
            );
            totalSent += result.sent;
            totalFailed += result.failed;
          } catch (error) {
            console.error(`Failed to send ranking update to organizer ${group.organizer.id}:`, error);
            totalFailed += group.organizer.pushSubscriptions.length;
          }
        }
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
  private static createRankingUpdateMessage(ranking: GroupRanking[]): string {
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
  ): { title: string; body: string; data: Record<string, unknown> } {
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

      let totalSent = 0;
      let totalFailed = 0;
      let totalUsers = 0;

      // Send to all users
      for (const group of ranking) {
        // Send to group members
        for (const member of group.members) {
          if (member.user.pushSubscriptions.length > 0) {
            totalUsers++;
            try {
              const result = await NotificationService.sendToUser(
                member.user.id,
                summaryNotification
              );
              totalSent += result.sent;
              totalFailed += result.failed;
            } catch (error) {
              console.error(`Failed to send weekly summary to user ${member.user.id}:`, error);
              totalFailed += member.user.pushSubscriptions.length;
            }
          }
        }

        // Send to organizer
        if (group.organizer.pushSubscriptions.length > 0) {
          totalUsers++;
          try {
            const result = await NotificationService.sendToUser(
              group.organizer.id,
              summaryNotification
            );
            totalSent += result.sent;
            totalFailed += result.failed;
          } catch (error) {
            console.error(`Failed to send weekly summary to organizer ${group.organizer.id}:`, error);
            totalFailed += group.organizer.pushSubscriptions.length;
          }
        }
      }

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
