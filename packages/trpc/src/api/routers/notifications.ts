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
import type { SendNotificationResult } from "../../utils/notifications";
import { sendMobileNotifications } from "../../services/notificationService";

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
      isSubscribed: subscriptions.length > 0,
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
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
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

  getAll: adminProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
          pagination: z
            .object({
              limit: z.number().int().min(1).max(100).default(50),
              offset: z.number().int().min(0).default(0),
            })
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const where = input?.tripId ? { tripId: input.tripId } : undefined;
      const limit = input?.pagination?.limit ?? 50;
      const offset = input?.pagination?.offset ?? 0;

      const [notifications, total] = await Promise.all([
        ctx.db.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            pushes: {
              select: {
                targetUserId: true,
                sentAt: true,
                status: true,
                failureReason: true,
              },
            },
          },
          take: limit,
          skip: offset,
        }),
        ctx.db.notification.count({ where }),
      ]);

      return {
        notifications,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

  sendToGroup: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        title: z.string(),
        body: z.string(),
        url: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const group = await ctx.db.group.findUnique({
          where: { id: input.groupId },
        });
        if (group?.tripId !== input.tripId || group.isDeleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }
        const participants = await ctx.db.tripParticipant.findMany({
          where: { tripId: input.tripId, groupId: input.groupId },
          select: { userId: true },
        });
        const userIds = participants.map((p) => p.userId);
        const result = await sendNotification({
          db: ctx.db,
          userId: ctx.dbUser.id,
          input: {
            userIds,
            title: input.title,
            body: input.body,
            url: input.url,
            tripId: input.tripId,
          },
        });
        await sendMobileNotifications(ctx.db, result.notificationId);
        return result;
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
        tripId: z.string(),
        title: z.string(),
        body: z.string(),
        url: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const participants = await ctx.db.tripParticipant.findMany({
          where: { tripId: input.tripId },
          select: { userId: true },
        });
        const userIds = participants.map((p) => p.userId);
        const result = await sendNotification({
          db: ctx.db,
          userId: ctx.dbUser.id,
          input: {
            userIds,
            title: input.title,
            body: input.body,
            url: input.url,
            tripId: input.tripId,
          },
        });
        await sendMobileNotifications(ctx.db, result.notificationId);
        return result;
      } catch (error) {
        console.error("Error sending notification to all:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send notification to all users",
        });
      }
    }),

  sendRankingUpdateToGroups: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await sendRankingUpdate({
          db: ctx.db,
          userId: ctx.dbUser.id,
          tripId: input.tripId,
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
        tripId: z.string(),
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
        if (group?.tripId !== input.tripId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }

        const participants = await ctx.db.tripParticipant.findMany({
          where: { tripId: input.tripId, groupId: input.groupId },
          select: { userId: true },
        });
        const userIds = participants.map((p) => p.userId);
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
            tripId: input.tripId,
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
        tripId: z.string(),
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
        if (group?.tripId !== input.tripId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }

        const participants = await ctx.db.tripParticipant.findMany({
          where: { tripId: input.tripId, groupId: input.groupId },
          select: { userId: true },
        });
        const userIds = participants.map((p) => p.userId);
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
            tripId: input.tripId,
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
        tripId: z.string(),
        groupId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const group = await ctx.db.group.findFirst({
          where: { id: input.groupId },
        });
        if (group?.tripId !== input.tripId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }
        const user = await ctx.db.user.findFirst({
          where: { id: input.userId },
          select: { id: true, firstName: true, lastName: true },
        });
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        const firstName =
          typeof user.firstName === "string" ? user.firstName : null;
        const lastName =
          typeof user.lastName === "string" ? user.lastName : null;
        const participants = await ctx.db.tripParticipant.findMany({
          where: { tripId: input.tripId, groupId: group.id },
          select: { userId: true },
        });
        const userIds = participants.map((p) => p.userId);
        const formatFullName = (): string => {
          const fullName = [firstName, lastName]
            .filter(Boolean)
            .join(" ")
            .trim();
          if (fullName) return fullName;
          if (firstName) return firstName;
          if (lastName) return lastName;
          return "A new member";
        };

        const notificationData =
          NotificationService.createNewMemberNotification(
            group.name,
            formatFullName(),
          );
        const notificationResult: SendNotificationResult =
          await sendNotification({
            db: ctx.db,
            userId: ctx.dbUser.id,
            input: {
              userIds,
              title: notificationData.title,
              body: notificationData.body,
              url: notificationData.url,
              tripId: input.tripId,
            },
          });
        return notificationResult;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        console.error("Error sending new member notification to group:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send new member notification to group",
          cause: err,
        });
      }
    }),

  sendCustomToGroup: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        title: z.string(),
        body: z.string(),
        url: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const group = await ctx.db.group.findUnique({
          where: { id: input.groupId },
        });
        if (group?.tripId !== input.tripId || group.isDeleted) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Group not found",
          });
        }
        const participants = await ctx.db.tripParticipant.findMany({
          where: { tripId: input.tripId, groupId: input.groupId },
          select: { userId: true },
        });
        const userIds = participants.map((p) => p.userId);
        return await sendNotification({
          db: ctx.db,
          userId: ctx.dbUser.id,
          input: {
            userIds,
            title: input.title,
            body: input.body,
            url: input.url,
            tripId: input.tripId,
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

        await ctx.db.notificationPush.updateMany({
          where: {
            notificationId: input.notificationId,
            status: "failed",
          },
          data: {
            status: "pending",
            sentAt: null,
            failureReason: null,
          },
        });

        const retryResult = await sendMobileNotifications(ctx.db, input.notificationId);

        return {
          success: retryResult.success,
          notificationId: input.notificationId,
          retriedCount: pushes.length,
          sent: retryResult.sent,
          failed: retryResult.failed,
        };
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
