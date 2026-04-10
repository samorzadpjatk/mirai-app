import { builder } from "../builder.js";
import {
  Notification,
  NotificationType,
} from "../../../domain/src/entities/Notification.js";
import type { DIContext } from "../../di/src/index.js";
import { TRPCError } from "@trpc/server";

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
      resolve: async (n, _args, ctx: DIContext) => {
        if (!n.senderId) return null;
        const controller = ctx.container.resolve("userController");
        const result = await controller.getById(
          { id: n.senderId },
          ctx.container,
        );
        if (result.kind === "err") return null;
        return result.value;
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
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("notificationController");
        const result = await controller.getByUserId(
          {
            userId: args.userId,
            unreadOnly: args.unreadOnly,
            limit: args.limit,
          },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error.message,
          });
        }
        return result.value;
      },
    }),
    notification: t.field({
      type: Notification,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("notificationController");
        const result = await controller.getById(
          { id: args.id.toString() },
          ctx.container,
        );
        if (result.kind === "err") return null;
        return result.value;
      },
    }),
    unreadCount: t.field({
      type: "Int",
      args: {
        userId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("notificationController");
        const result = await controller.getUnreadCount(
          { userId: args.userId },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error.message,
          });
        }
        return result.value;
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
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("notificationController");
        const result = await controller.markAsRead(
          { id: args.id.toString() },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error.message,
          });
        }
        return result.value;
      },
    }),
    markAllNotificationsAsRead: t.field({
      type: "Int",
      args: {
        userId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("notificationController");
        const result = await controller.markAllAsRead(
          { userId: args.userId },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error.message,
          });
        }
        return result.value;
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
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("notificationController");
        const result = await controller.create(
          {
            userId: args.userId,
            type: args.type,
            content: args.content,
            senderId: args.senderId ?? undefined,
            referenceId: args.referenceId ?? undefined,
          },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error.message,
          });
        }
        return result.value;
      },
    }),
    deleteNotification: t.field({
      type: "Boolean",
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("notificationController");
        const result = await controller.delete(
          { id: args.id.toString() },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error.message,
          });
        }
        return result.value;
      },
    }),
  }),
});
