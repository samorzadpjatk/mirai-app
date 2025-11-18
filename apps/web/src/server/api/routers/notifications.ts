import { z } from "zod";
import webpush from "web-push";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  createTRPCRouter,
  moderatorProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { env } from "~/env";
import { NotificationService } from "~/server/services/notificationService";
import { send, sendRanking } from "../utils/webPush";

// Configure web-push with VAPID keys
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${env.VAPID_EMAIL}`,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
}

export const notificationRouter = createTRPCRouter({
  // Get VAPID public key for client-side subscription
  getVapidPublicKey: publicProcedure.query(() => {
    if (!env.VAPID_PUBLIC_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "VAPID public key not configured",
      });
    }
    return { publicKey: env.VAPID_PUBLIC_KEY };
  }),

  // Subscribe to push notifications
  subscribe: protectedProcedure
    .input(
      z.object({
        subscription: z.object({
          endpoint: z.string(),
          keys: z.object({
            p256dh: z.string(),
            auth: z.string(),
          }),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Store the subscription in the database
        const subscription = await ctx.prisma.pushSubscription.upsert({
          where: {
            userId: ctx.session.user.id,
          },
          update: {
            endpoint: input.subscription.endpoint,
            p256dh: input.subscription.keys.p256dh,
            auth: input.subscription.keys.auth,
            updatedAt: new Date(),
          },
          create: {
            userId: ctx.session.user.id,
            endpoint: input.subscription.endpoint,
            p256dh: input.subscription.keys.p256dh,
            auth: input.subscription.keys.auth,
          },
        });

        return { success: true, subscriptionId: subscription.id };
      } catch (error) {
        console.error("Error saving push subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save push subscription",
        });
      }
    }),

  // Unsubscribe from push notifications
  unsubscribe: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await ctx.prisma.pushSubscription.deleteMany({
        where: {
          userId: ctx.session.user.id,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error removing push subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove push subscription",
      });
    }
  }),

  // Get user's notification preferences/subscription status
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await ctx.prisma.pushSubscription.findFirst({
      where: {
        userId: ctx.session.user.id,
      },
    });

    return {
      isSubscribed: !!subscription,
      subscriptionId: subscription?.id,
      endpoint: subscription?.endpoint,
    };
  }),

  getAllMy: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const count = await ctx.prisma.notification.count({
        where: { pushes: { some: { targetUserId: ctx.session.user.id } } },
      });
      const totalPages = Math.ceil(count / input.pageSize);
      if (input.page > totalPages && totalPages > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Page ${input.page} exceeds total pages ${totalPages}`,
        });
      }
      const notifications = await ctx.prisma.notification.findMany({
        where: { pushes: { some: { targetUserId: ctx.session.user.id } } },
        orderBy: { createdAt: "desc" },
        include: { createdBy: { select: { id: true, name: true } } },
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
      });
      return {
        notifications,
        pagination: {
          total: count,
          page: input.page,
          pageSize: input.pageSize,
          totalPages,
        },
      };
    }),

  getAll: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const count = await ctx.prisma.notification.count();
      const totalPages = Math.ceil(count / input.pageSize);
      if (input.page > totalPages && totalPages > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Page ${input.page} exceeds total pages ${totalPages}`,
        });
      }
      const notifications = await ctx.prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, name: true } },
          pushes: {
            select: {
              sentAt: true,
              status: true,
              failureReason: true,
              targetUser: { select: { id: true, name: true } },
            },
          },
        },
        take: input.pageSize,
        skip: (input.page - 1) * input.pageSize,
      });
      return {
        notifications,
        pagination: {
          total: count,
          page: input.page,
          pageSize: input.pageSize,
          totalPages,
        },
      };
    }),

  // Send push notification to specific users
  sendToGroup: moderatorProcedure
    .input(
      z.object({
        groupId: z.string(),
        title: z.string(),
        body: z.string(),
        url: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const members = await ctx.prisma.user.findMany({
          where: {
            OR: [
              { group: { id: input.groupId } },
              { organizerGroup: { some: { id: input.groupId } } },
            ],
          },
          select: { id: true },
        });
        const userIds = members.map((m) => m.id);
        const payload = {
          userIds,
          title: input.title,
          body: input.body,
          url: input.url,
        };
        return await send({
          db: ctx.prisma,
          userId: ctx.session.user.id,
          input: payload,
        });
      } catch (error) {
        console.error("Error sending notification to group:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification to group",
        });
      }
    }),
  sendToAll: moderatorProcedure
    .input(
      z.object({
        title: z.string(),
        body: z.string(),
        url: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const members = await ctx.prisma.user.findMany({
          select: { id: true },
        });
        const userIds = members.map((m) => m.id);
        const payload = {
          userIds,
          title: input.title,
          body: input.body,
          url: input.url,
        };
        return await send({
          db: ctx.prisma,
          userId: ctx.session.user.id,
          input: payload,
        });
      } catch (error) {
        console.error("Error sending notification to group:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification to group",
        });
      }
    }),

  sendRankingUpdateToGroups: moderatorProcedure.mutation(async ({ ctx }) => {
    try {
      return await sendRanking({
        db: ctx.prisma,
        userId: ctx.session.user.id,
      });
    } catch (error) {
      console.error("Error sending ranking update notifications:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send ranking update notifications",
      });
    }
  }),
  sendCoinAddedToGroup: moderatorProcedure
    .input(
      z.object({
        groupId: z.string(),
        coins: z.number(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const group = await ctx.prisma.group.findFirst({
          where: { id: input.groupId },
        });
        if (!group) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }

        const members = await ctx.prisma.user.findMany({
          where: {
            OR: [
              { group: { id: input.groupId } },
              { organizerGroup: { some: { id: input.groupId } } },
            ],
          },
          select: { id: true },
        });
        const userIds = members.map((m) => m.id);
        const notificationData =
          NotificationService.createCoinsAddedNotification(
            group.name,
            input.coins,
            input.reason,
          );
        const payload = {
          userIds,
          title: notificationData.title,
          body: notificationData.body,
          url: notificationData.url,
        };
        return await send({
          db: ctx.prisma,
          userId: ctx.session.user.id,
          input: payload,
        });
      } catch (error) {
        console.error(
          "Error sending coins added notification to group:",
          error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send coins added notification to group",
        });
      }
    }),
  sendCoinRemovedFromGroup: moderatorProcedure
    .input(
      z.object({
        groupId: z.string(),
        coins: z.number(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const group = await ctx.prisma.group.findFirst({
          where: { id: input.groupId },
        });
        if (!group) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }

        const members = await ctx.prisma.user.findMany({
          where: {
            OR: [
              { group: { id: input.groupId } },
              { organizerGroup: { some: { id: input.groupId } } },
            ],
          },
          select: { id: true },
        });
        const userIds = members.map((m) => m.id);
        const notificationData =
          NotificationService.createCoinsRemovedNotification(
            group.name,
            input.coins,
            input.reason,
          );
        const payload = {
          userIds,
          title: notificationData.title,
          body: notificationData.body,
          url: notificationData.url,
        };
        return await send({
          db: ctx.prisma,
          userId: ctx.session.user.id,
          input: payload,
        });
      } catch (error) {
        console.error(
          "Error sending coins added notification to group:",
          error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send coins added notification to group",
        });
      }
    }),
  sendNewMemberToGroup: moderatorProcedure
    .input(
      z.object({
        groupId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const group = await ctx.prisma.group.findFirst({
          where: { id: input.groupId },
        });
        if (!group) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }
        const user = await ctx.prisma.user.findFirst({
          where: { id: input.userId },
        });
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        const members = await ctx.prisma.user.findMany({
          where: { group: { id: group.id } },
          select: { id: true },
        });
        const userIds = members.map((m) => m.id);
        const notificationData =
          NotificationService.createNewMemberNotification(
            group.name,
            user.name ?? "A new member",
          );
        const payload = {
          userIds,
          title: notificationData.title,
          body: notificationData.body,
          url: notificationData.url,
        };
        return await send({
          db: ctx.prisma,
          userId: ctx.session.user.id,
          input: payload,
        });
      } catch (error) {
        console.error(
          "Error sending coins added notification to group:",
          error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send coins added notification to group",
        });
      }
    }),
  sendCustomToGroup: moderatorProcedure
    .input(
      z.object({
        groupId: z.string(),
        title: z.string(),
        body: z.string(),
        url: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const members = await ctx.prisma.user.findMany({
          where: { group: { id: input.groupId } },
          select: { id: true },
        });
        const userIds = members.map((m) => m.id);
        const payload = {
          userIds,
          title: input.title,
          body: input.body,
          url: input.url,
        };
        return await send({
          db: ctx.prisma,
          userId: ctx.session.user.id,
          input: payload,
        });
      } catch (error) {
        console.error("Error sending custom notification to group:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send custom notification to group",
        });
      }
    }),

  retryNotification: moderatorProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const notification = await ctx.prisma.notification.findFirst({
          where: { id: input.notificationId },
        });
        const pushes = await ctx.prisma.notificationPush.findMany({
          where: { notificationId: input.notificationId, status: "failed" },
        });
        if (!notification) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notification not found",
          });
        }
        if (pushes.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No failed pushes to retry",
          });
        }
        const payload = {
          userIds: pushes.map((p) => p.targetUserId),
          title: notification.title,
          body: notification.body,
          url: notification.url,
        };
        return await send({
          db: ctx.prisma,
          userId: ctx.session.user.id,
          input: payload,
        });
      } catch (error) {
        console.error("Error retrying notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retry notification",
        });
      }
    }),

  delete: adminProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.prisma.notification.delete({
          where: { id: input.notificationId },
        });
        return { success: true };
      } catch (error) {
        console.error("Error deleting notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete notification",
        });
      }
    }),
});
