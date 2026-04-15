import { builder } from "../builder.js";
import {
  Notification,
  NotificationType,
} from "../../../domain/src/entities/Notification.js";
import type { GraphQLContext } from "../builder.js";
import { GraphQLError } from "graphql";

const NotificationTypeEnum = builder.enumType("NotificationType", {
  values: [
    "FRIEND_REQUEST",
    "GROUP_INVITE",
    "CHALLENGE_COMPLETE",
    "LEVEL_UP",
  ] as const,
});

builder.node(Notification, {
  id: { resolve: (n) => n.id },
  name: "Notification",
  fields: (t) => ({
    id: t.exposeID("id"),
    userId: t.exposeString("userId"),
    type: t.field({
      type: NotificationTypeEnum,
      resolve: (n) => n.type,
    }),
    content: t.exposeString("content"),
    isRead: t.exposeBoolean("isRead"),
    senderId: t.exposeString("senderId", { nullable: true }),
    referenceId: t.exposeString("referenceId", { nullable: true }),
    createdAt: t.field({
      type: "Date",
      resolve: (n) => n.createdAt,
    }),
    sender: t.field({
      type: "User",
      nullable: true,
      resolve: async (n, _args, ctx: GraphQLContext) => {
        if (!n.senderId) return null;
        const controller = ctx.controllers.userController;
        const result = await controller.getById({ id: n.senderId });
        if (!result.success) return null;
        return result.data;
      },
    }),
  }),
});

builder.queryType({
  fields: (t) => ({
    notifications: t.field({
      type: [Notification],
      args: {
        userId: t.arg.string(),
        unreadOnly: t.arg.boolean({ defaultValue: false }),
        limit: t.arg.int({ defaultValue: 20 }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.controllers.notificationController;
        const result = await controller.list({
          userId: args.userId,
          limit: args.limit,
        });
        if (!result.success) {
          throw new GraphQLError(result.error, {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          });
        }
        // Filter by unread if requested
        if (args.unreadOnly) {
          return result.data.filter((n: any) => !n.isRead);
        }
        return result.data;
      },
    }),
    notification: t.field({
      type: Notification,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.controllers.notificationController;
        const result = await controller.getById({ id: args.id.toString() });
        if (!result.success) return null;
        return result.data;
      },
    }),
    unreadCount: t.field({
      type: "Int",
      args: {
        userId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.controllers.notificationController;
        const result = await controller.list({ userId: args.userId });
        if (!result.success) {
          throw new GraphQLError(result.error, {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          });
        }
        return result.data.filter((n: any) => !n.isRead).length;
      },
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    markNotificationAsRead: t.field({
      type: Notification,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.controllers.notificationController;
        const result = await controller.updateStatus({
          id: args.id.toString(),
          isRead: true,
        });
        if (!result.success) {
          throw new GraphQLError(result.error, {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          });
        }
        return result.data;
      },
    }),
    markAllNotificationsAsRead: t.field({
      type: "Int",
      args: {
        userId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.controllers.notificationController;
        // Get all unread notifications for user
        const listResult = await controller.list({ userId: args.userId });
        if (!listResult.success) {
          throw new GraphQLError(listResult.error, {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          });
        }
        const unreadNotifications = listResult.data.filter(
          (n: any) => !n.isRead,
        );
        // Mark each as read
        let updatedCount = 0;
        for (const notification of unreadNotifications) {
          const updateResult = await controller.updateStatus({
            id: notification.id,
            isRead: true,
          });
          if (updateResult.success) {
            updatedCount++;
          }
        }
        return updatedCount;
      },
    }),
    createNotification: t.field({
      type: Notification,
      args: {
        userId: t.arg.string({ required: true }),
        type: t.arg({ type: NotificationTypeEnum, required: true }),
        content: t.arg.string({ required: true }),
        senderId: t.arg.string(),
        referenceId: t.arg.string(),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.controllers.notificationController;
        const result = await controller.create({
          userId: args.userId,
          type: args.type,
          content: args.content,
          senderId: args.senderId ?? undefined,
          referenceId: args.referenceId ?? undefined,
        });
        if (!result.success) {
          throw new GraphQLError(result.error, {
            extensions: { code: "BAD_REQUEST" },
          });
        }
        return result.data;
      },
    }),
    deleteNotification: t.field({
      type: "Boolean",
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        const controller = ctx.controllers.notificationController;
        const result = await controller.delete({ id: args.id.toString() });
        if (!result.success) {
          throw new GraphQLError(result.error, {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          });
        }
        return true;
      },
    }),
  }),
});
