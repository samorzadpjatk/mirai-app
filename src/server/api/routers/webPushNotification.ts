import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { NotificationService } from "~/server/services/notificationService";

export const webPushNotificationRouter = createTRPCRouter({
  // Get all web push notifications with pagination and filtering
  getAll: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        status: z.enum(["pending", "sent", "failed", "all"]).optional(),
        targetType: z.enum(["user", "group", "all_users", "all"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, status, targetType } = input;
      const skip = (page - 1) * pageSize;

      // Build filter conditions
      const where: any = {};
      
      if (status && status !== "all") {
        where.status = status;
      }
      
      if (targetType && targetType !== "all") {
        if (targetType === "user") {
          where.targetUserId = { not: null };
          where.sentToAll = false;
        } else if (targetType === "group") {
          where.targetGroupId = { not: null };
          where.sentToAll = false;
        } else if (targetType === "all_users") {
          where.sentToAll = true;
        }
      }

      const [notifications, total] = await Promise.all([
        ctx.db.webPushNotification.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            targetUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            targetGroup: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        }),
        ctx.db.webPushNotification.count({ where }),
      ]);

      return {
        notifications,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  // Get notification statistics
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalNotifications,
      sentNotifications,
      failedNotifications,
      pendingNotifications,
      todayNotifications,
    ] = await Promise.all([
      ctx.db.webPushNotification.count(),
      ctx.db.webPushNotification.count({ where: { status: "sent" } }),
      ctx.db.webPushNotification.count({ where: { status: "failed" } }),
      ctx.db.webPushNotification.count({ where: { status: "pending" } }),
      ctx.db.webPushNotification.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      total: totalNotifications,
      sent: sentNotifications,
      failed: failedNotifications,
      pending: pendingNotifications,
      today: todayNotifications,
      successRate: totalNotifications > 0 ? ((sentNotifications / totalNotifications) * 100).toFixed(1) : "0",
    };
  }),

  // Send custom notification to specific user
  sendToUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        title: z.string().min(1, "Tytuł jest wymagany"),
        body: z.string().min(1, "Treść jest wymagana"),
        icon: z.string().optional(),
        badge: z.string().optional(),
        tag: z.string().optional(),
        requireInteraction: z.boolean().default(false),
        silent: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Create notification record
        const notification = await ctx.db.webPushNotification.create({
          data: {
            title: input.title,
            body: input.body,
            icon: input.icon,
            badge: input.badge,
            tag: input.tag,
            requireInteraction: input.requireInteraction,
            silent: input.silent,
            targetUserId: input.userId,
            sentToAll: false,
            status: "pending",
            createdBy: ctx.session.user.id,
          },
        });

        // Send the notification
        const result = await NotificationService.sendToUser(input.userId, {
          title: input.title,
          body: input.body,
          data: {
            notificationId: notification.id,
            type: "custom",
          },
        });

        // Update notification status
        await ctx.db.webPushNotification.update({
          where: { id: notification.id },
          data: {
            status: result.sent > 0 ? "sent" : "failed",
            sentAt: result.sent > 0 ? new Date() : null,
            deliveryAttempts: 1,
            lastAttemptAt: new Date(),
            failureReason: result.sent === 0 ? "No active subscriptions or delivery failed" : null,
          },
        });

        return {
          success: true,
          notificationId: notification.id,
          sent: result.sent,
          failed: result.failed,
        };
      } catch (error) {
        console.error("Error sending notification to user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification",
        });
      }
    }),

  // Send custom notification to all users
  sendToAll: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "Tytuł jest wymagany"),
        body: z.string().min(1, "Treść jest wymagana"),
        icon: z.string().optional(),
        badge: z.string().optional(),
        tag: z.string().optional(),
        requireInteraction: z.boolean().default(false),
        silent: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Create notification record
        const notification = await ctx.db.webPushNotification.create({
          data: {
            title: input.title,
            body: input.body,
            icon: input.icon,
            badge: input.badge,
            tag: input.tag,
            requireInteraction: input.requireInteraction,
            silent: input.silent,
            sentToAll: true,
            status: "pending",
            createdBy: ctx.session.user.id,
          },
        });

        // Get all subscriptions and send notifications
        const allSubscriptions = await ctx.db.pushSubscription.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        let sent = 0;
        let failed = 0;

        if (allSubscriptions.length > 0) {
          // Use the existing notification service logic
          const result = await ctx.trpc.notifications.sendCustomToAll({
            title: input.title,
            body: input.body,
            url: "/",
          });

          sent = result.sent;
          failed = result.failed;
        }

        // Update notification status
        await ctx.db.webPushNotification.update({
          where: { id: notification.id },
          data: {
            status: sent > 0 ? "sent" : "failed",
            sentAt: sent > 0 ? new Date() : null,
            deliveryAttempts: 1,
            lastAttemptAt: new Date(),
            failureReason: sent === 0 ? "No active subscriptions or delivery failed" : null,
          },
        });

        return {
          success: true,
          notificationId: notification.id,
          sent,
          failed,
          totalUsers: new Set(allSubscriptions.map(s => s.userId)).size,
        };
      } catch (error) {
        console.error("Error sending notification to all users:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification",
        });
      }
    }),

  // Retry failed notification
  retryNotification: adminProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.db.webPushNotification.findUnique({
        where: { id: input.notificationId },
        include: {
          targetUser: true,
          targetGroup: true,
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      if (notification.status !== "failed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only retry failed notifications",
        });
      }

      try {
        let result = { sent: 0, failed: 0 };

        if (notification.sentToAll) {
          // Retry sending to all users
          result = await ctx.trpc.notifications.sendCustomToAll({
            title: notification.title,
            body: notification.body,
            url: "/",
          });
        } else if (notification.targetUserId) {
          // Retry sending to specific user
          result = await NotificationService.sendToUser(notification.targetUserId, {
            title: notification.title,
            body: notification.body,
            data: {
              notificationId: notification.id,
              type: "retry",
            },
          });
        } else if (notification.targetGroupId) {
          // Retry sending to group
          result = await NotificationService.sendToGroupMembers(
            notification.targetGroupId,
            {
              title: notification.title,
              body: notification.body,
              data: {
                notificationId: notification.id,
                type: "retry",
              },
            }
          );
        }

        // Update notification status
        await ctx.db.webPushNotification.update({
          where: { id: input.notificationId },
          data: {
            status: result.sent > 0 ? "sent" : "failed",
            sentAt: result.sent > 0 ? new Date() : null,
            deliveryAttempts: notification.deliveryAttempts + 1,
            lastAttemptAt: new Date(),
            failureReason: result.sent === 0 ? "Retry failed - no active subscriptions" : null,
          },
        });

        return {
          success: true,
          sent: result.sent,
          failed: result.failed,
        };
      } catch (error) {
        console.error("Error retrying notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retry notification",
        });
      }
    }),

  // Delete notification from history
  delete: adminProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.webPushNotification.delete({
        where: { id: input.notificationId },
      });

      return { success: true };
    }),
});
