import { ORPCError } from "@orpc/server";
import { eq, and } from "drizzle-orm";
import {
  notifications,
  notificationPushes,
  pushSubscriptions,
  tripParticipants,
} from "@mirai-app/db";
import { NotificationService, sendMobileNotifications } from "../../../services/notificationService";
import { sendNotification, sendRankingUpdate } from "../../../utils/notifications";
import type { SendNotificationResult } from "../../../utils/notifications";
import { formatDisplayName } from "@mirai-app/shared";
import { logger } from "../../../utils/logger";
import type { NotificationContext } from "./queries";

export const subscribe = async (context: NotificationContext, input: { token: string }) => {
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
    logger.error({ error: err }, "Error saving push subscription");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: `Failed to save push subscription: ${err.message}`,
      cause: err,
    });
  }
};

export const unsubscribe = async (context: NotificationContext, input: { token: string }) => {
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
    logger.error({ error }, "Error removing push subscription");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to remove push subscription",
    });
  }
};

export const unsubscribeAll = async (context: NotificationContext) => {
  try {
    const deleted = await context.db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, context.dbUser.id))
      .returning();
    return { success: true, deletedCount: deleted.length };
  } catch (error) {
    logger.error({ error }, "Error removing all push subscriptions");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to remove all push subscriptions",
    });
  }
};

export const sendToGroup = async (
  context: NotificationContext,
  input: { tripId: string; groupId: string; title: string; body: string; url: string },
) => {
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
    logger.error({ error }, "Error sending notification to group");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to send notification to group",
    });
  }
};

export const sendToAll = async (
  context: NotificationContext,
  input: { tripId: string; title: string; body: string; url: string },
) => {
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
    logger.error({ error }, "Error sending notification to all");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to send notification to all users",
    });
  }
};

export const sendRankingUpdateToGroups = async (
  context: NotificationContext,
  input: { tripId: string },
) => {
  try {
    return await sendRankingUpdate({
      db: context.db,
      userId: context.dbUser.id,
      tripId: input.tripId,
    });
  } catch (error) {
    logger.error({ error }, "Error sending ranking update notifications");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to send ranking update notifications",
    });
  }
};

export const sendCoinAddedToGroup = async (
  context: NotificationContext,
  input: { tripId: string; groupId: string; coins: number; reason?: string },
) => {
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
    logger.error({ error }, "Error sending coins added notification to group");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to send coins added notification to group",
    });
  }
};

export const sendCoinRemovedFromGroup = async (
  context: NotificationContext,
  input: { tripId: string; groupId: string; coins: number; reason?: string },
) => {
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
    logger.error({ error }, "Error sending coins removed notification to group");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to send coins removed notification to group",
    });
  }
};

export const sendNewMemberToGroup = async (
  context: NotificationContext,
  input: { tripId: string; groupId: string; userId: string },
) => {
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

    const notificationData = NotificationService.createNewMemberNotification(
      group.name,
      formatDisplayName(firstName, lastName, "A new member") ?? "A new member",
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
    logger.error({ error: err }, "Error sending new member notification to group");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to send new member notification to group",
      cause: err,
    });
  }
};

export const sendCustomToGroup = async (
  context: NotificationContext,
  input: { tripId: string; groupId: string; title: string; body: string; url: string },
) => {
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
    logger.error({ error }, "Error sending custom notification to group");
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to send custom notification to group",
    });
  }
};

export const retryNotification = async (
  context: NotificationContext,
  input: { notificationId: string },
) => {
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
    logger.error({ error }, "Error retrying notification");
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to retry notification" });
  }
};

export const deleteNotification = async (
  context: NotificationContext,
  input: { notificationId: string },
) => {
  try {
    await context.db.delete(notifications).where(eq(notifications.id, input.notificationId));
    return { success: true };
  } catch (error) {
    logger.error({ error }, "Error deleting notification");
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to delete notification" });
  }
};
