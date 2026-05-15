import { z } from "zod";
import { ORPCError } from "@orpc/server";
import {
  adminProcedure,
  createORPCRouter,
  moderatorProcedure,
  protectedProcedure,
} from "../../api/trpc";
import { NotificationService } from "../../services/notificationService";
import { sendNotification, sendRankingUpdate } from "../../utils/notifications";
import type { SendNotificationResult } from "../../utils/notifications";
import { sendMobileNotifications } from "../../services/notificationService";
import { eq, and, count } from "drizzle-orm";
import {
  notifications,
  notificationPushes,
  pushSubscriptions,
  tripParticipants,
} from "@mirai-app/db";

export const notificationRouter = createORPCRouter({
  subscribe: protectedProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const [subscription] = await context.db
          .insert(pushSubscriptions)
          .values({
            userId: context.dbUser.id,
            token: input.token,
          })
          .onConflictDoUpdate({
            target: [pushSubscriptions.userId, pushSubscriptions.token],
            set: { updatedAt: new Date() },
          })
          .returning();
        return { success: true, id: subscription!.id };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Error saving push subscription:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
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
    .handler(async ({ context, input }) => {
      try {
        const deleted = await context.db
          .delete(pushSubscriptions)
          .where(
            and(
              eq(pushSubscriptions.userId, context.dbUser.id),
              eq(pushSubscriptions.token, input.token),
            ),
          )
          .returning();

        if (deleted.length === 0) {
          throw new ORPCError("NOT_FOUND", { message: "No subscription found with that token" });
        }

        return { success: true, deletedCount: deleted.length };
      } catch (error) {
        if (error instanceof ORPCError) {
          throw error;
        }
        console.error("Error removing push subscription:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to remove push subscription",
        });
      }
    }),

  unsubscribeAll: protectedProcedure.handler(async ({ context }) => {
    try {
      const deleted = await context.db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, context.dbUser.id))
        .returning();
      return { success: true, deletedCount: deleted.length };
    } catch (error) {
      console.error("Error removing all push subscriptions:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to remove all push subscriptions",
      });
    }
  }),

  getSubscriptionStatus: protectedProcedure.handler(async ({ context }) => {
    const subscriptions = await context.db.query.pushSubscriptions.findMany({
      where: (ps, { eq }) => eq(ps.userId, context.dbUser.id),
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
    .handler(async ({ context, input }) => {
      const pushRows = await context.db
        .select({ notificationId: notificationPushes.notificationId })
        .from(notificationPushes)
        .where(eq(notificationPushes.targetUserId, context.dbUser.id));
      const notificationIds = pushRows.map((p) => p.notificationId);
      const count = notificationIds.length;
      const totalPages = Math.ceil(count / input.pageSize);
      if (input.page > totalPages && totalPages > 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Page ${input.page} exceeds total pages ${totalPages}`,
        });
      }
      const notificationList =
        notificationIds.length > 0
          ? await context.db.query.notifications.findMany({
              where: (n, { inArray }) => inArray(n.id, notificationIds),
              with: {
                createdBy: {
                  columns: { id: true, firstName: true, lastName: true },
                },
              },
              orderBy: (n, { desc }) => desc(n.createdAt),
              limit: input.pageSize,
              offset: (input.page - 1) * input.pageSize,
            })
          : [];
      return {
        notifications: notificationList,
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
    .handler(async ({ context, input }) => {
      const where = input?.tripId ? eq(notifications.tripId, input.tripId) : undefined;
      const limit = input?.pagination?.limit ?? 50;
      const offset = input?.pagination?.offset ?? 0;

      const [notificationList, totalResult] = await Promise.all([
        context.db.query.notifications.findMany({
          where,
          orderBy: (n, { desc }) => desc(n.createdAt),
          with: {
            createdBy: {
              columns: { id: true, firstName: true, lastName: true },
            },
            pushes: {
              columns: {
                targetUserId: true,
                sentAt: true,
                status: true,
                failureReason: true,
              },
            },
          },
          limit,
          offset,
        }),
        context.db.select({ count: count() }).from(notifications).where(where),
      ]);

      const total = totalResult[0]?.count ?? 0;

      return {
        notifications: notificationList,
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
    .handler(async ({ context, input }) => {
      try {
        const group = await context.db.query.groups.findFirst({
          where: (g, { eq }) => eq(g.id, input.groupId),
        });
        if (group?.tripId !== input.tripId || group.isDeleted) {
          throw new ORPCError("NOT_FOUND", { message: "Group not found" });
        }
        const participants = await context.db
          .select({ userId: tripParticipants.userId })
          .from(tripParticipants)
          .where(
            and(
              eq(tripParticipants.tripId, input.tripId),
              eq(tripParticipants.groupId, input.groupId),
            ),
          );
        const userIds = participants.map((p) => p.userId);
        const result = await sendNotification({
          db: context.db,
          userId: context.dbUser.id,
          input: {
            userIds,
            title: input.title,
            body: input.body,
            url: input.url,
            tripId: input.tripId,
          },
        });
        await sendMobileNotifications(context.db, result.notificationId);
        return result;
      } catch (error) {
        console.error("Error sending notification to group:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
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
    .handler(async ({ context, input }) => {
      try {
        const participants = await context.db
          .select({ userId: tripParticipants.userId })
          .from(tripParticipants)
          .where(eq(tripParticipants.tripId, input.tripId));
        const userIds = participants.map((p) => p.userId);
        const result = await sendNotification({
          db: context.db,
          userId: context.dbUser.id,
          input: {
            userIds,
            title: input.title,
            body: input.body,
            url: input.url,
            tripId: input.tripId,
          },
        });
        await sendMobileNotifications(context.db, result.notificationId);
        return result;
      } catch (error) {
        console.error("Error sending notification to all:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to send notification to all users",
        });
      }
    }),

  sendRankingUpdateToGroups: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      try {
        return await sendRankingUpdate({
          db: context.db,
          userId: context.dbUser.id,
          tripId: input.tripId,
        });
      } catch (error) {
        console.error("Error sending ranking update notifications:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
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
    .handler(async ({ context, input }) => {
      try {
        const group = await context.db.query.groups.findFirst({
          where: (g, { eq }) => eq(g.id, input.groupId),
        });
        if (group?.tripId !== input.tripId) {
          throw new ORPCError("NOT_FOUND", { message: "Group not found" });
        }

        const participants = await context.db
          .select({ userId: tripParticipants.userId })
          .from(tripParticipants)
          .where(
            and(
              eq(tripParticipants.tripId, input.tripId),
              eq(tripParticipants.groupId, input.groupId),
            ),
          );
        const userIds = participants.map((p) => p.userId);
        const notificationData = NotificationService.createCoinsAddedNotification(
          group.name,
          input.coins,
          input.reason,
        );
        return await sendNotification({
          db: context.db,
          userId: context.dbUser.id,
          input: {
            userIds,
            title: notificationData.title,
            body: notificationData.body,
            url: notificationData.url,
            tripId: input.tripId,
          },
        });
      } catch (error) {
        console.error("Error sending coins added notification to group:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
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
    .handler(async ({ context, input }) => {
      try {
        const group = await context.db.query.groups.findFirst({
          where: (g, { eq }) => eq(g.id, input.groupId),
        });
        if (group?.tripId !== input.tripId) {
          throw new ORPCError("NOT_FOUND", { message: "Group not found" });
        }

        const participants = await context.db
          .select({ userId: tripParticipants.userId })
          .from(tripParticipants)
          .where(
            and(
              eq(tripParticipants.tripId, input.tripId),
              eq(tripParticipants.groupId, input.groupId),
            ),
          );
        const userIds = participants.map((p) => p.userId);
        const notificationData = NotificationService.createCoinsRemovedNotification(
          group.name,
          input.coins,
          input.reason,
        );
        return await sendNotification({
          db: context.db,
          userId: context.dbUser.id,
          input: {
            userIds,
            title: notificationData.title,
            body: notificationData.body,
            url: notificationData.url,
            tripId: input.tripId,
          },
        });
      } catch (error) {
        console.error("Error sending coins removed notification to group:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
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
    .handler(async ({ context, input }) => {
      try {
        const group = await context.db.query.groups.findFirst({
          where: (g, { eq }) => eq(g.id, input.groupId),
        });
        if (group?.tripId !== input.tripId) {
          throw new ORPCError("NOT_FOUND", { message: "Group not found" });
        }
        const user = await context.db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, input.userId),
          columns: { id: true, firstName: true, lastName: true },
        });
        if (!user) {
          throw new ORPCError("NOT_FOUND", { message: "User not found" });
        }
        const firstName = typeof user.firstName === "string" ? user.firstName : null;
        const lastName = typeof user.lastName === "string" ? user.lastName : null;
        const participants = await context.db
          .select({ userId: tripParticipants.userId })
          .from(tripParticipants)
          .where(
            and(eq(tripParticipants.tripId, input.tripId), eq(tripParticipants.groupId, group.id)),
          );
        const userIds = participants.map((p) => p.userId);
        const formatFullName = (): string => {
          const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
          if (fullName) return fullName;
          if (firstName) return firstName;
          if (lastName) return lastName;
          return "A new member";
        };

        const notificationData = NotificationService.createNewMemberNotification(
          group.name,
          formatFullName(),
        );
        const notificationResult: SendNotificationResult = await sendNotification({
          db: context.db,
          userId: context.dbUser.id,
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
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
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
    .handler(async ({ context, input }) => {
      try {
        const group = await context.db.query.groups.findFirst({
          where: (g, { eq }) => eq(g.id, input.groupId),
        });
        if (group?.tripId !== input.tripId || group.isDeleted) {
          throw new ORPCError("NOT_FOUND", { message: "Group not found" });
        }
        const participants = await context.db
          .select({ userId: tripParticipants.userId })
          .from(tripParticipants)
          .where(
            and(
              eq(tripParticipants.tripId, input.tripId),
              eq(tripParticipants.groupId, input.groupId),
            ),
          );
        const userIds = participants.map((p) => p.userId);
        return await sendNotification({
          db: context.db,
          userId: context.dbUser.id,
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
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
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
    .handler(async ({ context, input }) => {
      try {
        const notification = await context.db.query.notifications.findFirst({
          where: (n, { eq }) => eq(n.id, input.notificationId),
        });
        const pushes = await context.db.query.notificationPushes.findMany({
          where: (np, { eq, and }) =>
            and(eq(np.notificationId, input.notificationId), eq(np.status, "failed")),
        });
        if (!notification) {
          throw new ORPCError("NOT_FOUND", { message: "Notification not found" });
        }
        if (pushes.length === 0) {
          throw new ORPCError("BAD_REQUEST", { message: "No failed pushes to retry" });
        }

        await context.db
          .update(notificationPushes)
          .set({
            status: "pending",
            sentAt: null,
            failureReason: null,
          })
          .where(
            and(
              eq(notificationPushes.notificationId, input.notificationId),
              eq(notificationPushes.status, "failed"),
            ),
          );

        const retryResult = await sendMobileNotifications(context.db, input.notificationId);

        return {
          success: retryResult.success,
          notificationId: input.notificationId,
          retriedCount: pushes.length,
          sent: retryResult.sent,
          failed: retryResult.failed,
        };
      } catch (error) {
        console.error("Error retrying notification:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to retry notification" });
      }
    }),

  delete: adminProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        await context.db.delete(notifications).where(eq(notifications.id, input.notificationId));
        return { success: true };
      } catch (error) {
        console.error("Error deleting notification:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to delete notification" });
      }
    }),
});
