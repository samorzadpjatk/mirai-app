import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  createTRPCRouter,
  moderatorProcedure,
  protectedProcedure,
} from "../../api/trpc";
import { NotificationService } from "../../services/notificationService";
import { sendNotification, sendRankingUpdate } from "../../utils/notifications";

export const notificationRouter = createTRPCRouter({
  subscribe: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const subscription = await ctx.db.pushSubscription.upsert({
          where: {
            userId_token: {
              userId: ctx.dbUser.id,
              token: input.token,
            },
          },
          update: {
            updatedAt: new Date(),
          },
          create: {
            userId: ctx.dbUser.id,
            token: input.token,
          },
        });
        return { success: true, id: subscription.id };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Error saving push subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to save push subscription: ${err.message}`,
          cause: err,
        });
      }
    }),

  unsubscribe: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.pushSubscription.deleteMany({
          where: {
            userId: ctx.dbUser.id,
            token: input.token,
          },
        });

        if (result.count === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No subscription found with that token",
          });
        }

        return { success: true, deletedCount: result.count };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error removing push subscription:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove push subscription",
        });
      }
    }),

  unsubscribeAll: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const result = await ctx.db.pushSubscription.deleteMany({
        where: {
          userId: ctx.dbUser.id,
        },
      });
      return { success: true, deletedCount: result.count };
    } catch (error) {
      console.error("Error removing all push subscriptions:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to remove all push subscriptions",
      });
    }
  }),

  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const subscriptions = await ctx.db.pushSubscription.findMany({
      where: {
        userId: ctx.dbUser.id,
      },
    });

    return {
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        token: s.token,
        createdAt: s.createdAt,
      })),
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
      const count = await ctx.db.notification.count({
        where: { pushes: { some: { targetUserId: ctx.dbUser.id } } },
      });
      const totalPages = Math.ceil(count / input.pageSize);
      if (input.page > totalPages && totalPages > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Page ${input.page} exceeds total pages ${totalPages}`,
        });
      }
      const notifications = await ctx.db.notification.findMany({
        where: { pushes: { some: { targetUserId: ctx.dbUser.id } } },
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
      const count = await ctx.db.notification.count();
      const totalPages = Math.ceil(count / input.pageSize);
      if (input.page > totalPages && totalPages > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Page ${input.page} exceeds total pages ${totalPages}`,
        });
      }
      const notifications = await ctx.db.notification.findMany({
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
        const members = await ctx.db.user.findMany({
          where: {
            OR: [
              { group: { id: input.groupId } },
              { organizerGroup: { some: { id: input.groupId } } },
            ],
          },
          select: { id: true },
        });
        const userIds = members.map((m) => m.id);
        return await sendNotification({
          db: ctx.db,
          userId: ctx.dbUser.id,
          input: {
            userIds,
            title: input.title,
            body: input.body,
            url: input.url,
          },
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
        const members = await ctx.db.user.findMany({
          select: { id: true },
        });
        const userIds = members.map((m) => m.id);
        return await sendNotification({
          db: ctx.db,
          userId: ctx.dbUser.id,
          input: {
            userIds,
            title: input.title,
            body: input.body,
            url: input.url,
          },
        });
      } catch (error) {
        console.error("Error sending notification to all:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification to all users",
        });
      }
    }),

  sendRankingUpdateToGroups: moderatorProcedure.mutation(async ({ ctx }) => {
    try {
      return await sendRankingUpdate({
        db: ctx.db,
        userId: ctx.dbUser.id,
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
        const group = await ctx.db.group.findFirst({
          where: { id: input.groupId },
        });
        if (!group) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }

        const members = await ctx.db.user.findMany({
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
        return await sendNotification({
          db: ctx.db,
          userId: ctx.dbUser.id,
          input: {
            userIds,
            title: notificationData.title,
            body: notificationData.body,
            url: notificationData.url,
          },
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
        const group = await ctx.db.group.findFirst({
          where: { id: input.groupId },
        });
        if (!group) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }

        const members = await ctx.db.user.findMany({
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
        return await sendNotification({
          db: ctx.db,
          userId: ctx.dbUser.id,
          input: {
            userIds,
            title: notificationData.title,
            body: notificationData.body,
            url: notificationData.url,
          },
        });
      } catch (error) {
        console.error(
          "Error sending coins removed notification to group:",
          error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send coins removed notification to group",
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
        const group = await ctx.db.group.findFirst({
          where: { id: input.groupId },
        });
        if (!group) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }
        const user = await ctx.db.user.findFirst({
          where: { id: input.userId },
        });
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        const members = await ctx.db.user.findMany({
          where: { group: { id: group.id } },
          select: { id: true },
        });
        const userIds = members.map((m) => m.id);
        const notificationData =
          NotificationService.createNewMemberNotification(
            group.name,
            user.name ?? "A new member",
          );
        return await sendNotification({
          db: ctx.db,
          userId: ctx.dbUser.id,
          input: {
            userIds,
            title: notificationData.title,
            body: notificationData.body,
            url: notificationData.url,
          },
        });
      } catch (error) {
        console.error("Error sending new member notification to group:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send new member notification to group",
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
        const members = await ctx.db.user.findMany({
          where: { group: { id: input.groupId } },
          select: { id: true },
        });
        const userIds = members.map((m) => m.id);
        return await sendNotification({
          db: ctx.db,
          userId: ctx.dbUser.id,
          input: {
            userIds,
            title: input.title,
            body: input.body,
            url: input.url,
          },
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
        const notification = await ctx.db.notification.findFirst({
          where: { id: input.notificationId },
        });
        const pushes = await ctx.db.notificationPush.findMany({
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
        return await sendNotification({
          db: ctx.db,
          userId: ctx.dbUser.id,
          input: {
            userIds: pushes.map((p) => p.targetUserId),
            title: notification.title,
            body: notification.body,
            url: notification.url,
          },
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
        await ctx.db.notification.delete({
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
