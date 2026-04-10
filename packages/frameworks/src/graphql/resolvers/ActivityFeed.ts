import { builder } from "../builder.js";
import { ActivityFeed } from "../../../domain/src/entities/ActivityFeed.js";
import { Notification } from "../../../domain/src/entities/Notification.js";
import type { DIContext } from "../../di/src/index.js";
import { TRPCError } from "@trpc/server";

const ActivityFeedItemType = builder.objectType("ActivityFeedItem", {
  fields: (t) => ({
    id: t.exposeID("id"),
    userId: t.exposeString("userId"),
    type: t.exposeString("type"),
    content: t.exposeString("content"),
    metadata: t.field({
      type: "JSON",
      nullable: true,
      resolve: (item) => (item as any).metadata ?? null,
    }),
    createdAt: t.field({
      type: "Date",
      resolve: (item) => (item as any).createdAt,
    }),
    user: t.field({
      type: "User",
      resolve: async (item, _args, ctx: DIContext) => {
        const controller = ctx.container.resolve("userController");
        const result = await controller.getById(
          { id: (item as any).userId },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: result.error.message,
          });
        }
        return result.value;
      },
    }),
  }),
});

builder.node(ActivityFeed, {
  id: { resolve: (a) => a.id },
  name: "ActivityFeed",
  fields: (t) => ({
    id: t.exposeID("id"),
    userId: t.exposeString("userId"),
    items: t.field({
      type: [ActivityFeedItemType],
      resolve: async (a, _args, ctx: DIContext) => {
        const controller = ctx.container.resolve("activityFeedController");
        const result = await controller.getItems(
          { feedId: a.id },
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
    user: t.field({
      type: "User",
      resolve: async (a, _args, ctx: DIContext) => {
        const controller = ctx.container.resolve("userController");
        const result = await controller.getById(
          { id: a.userId },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: result.error.message,
          });
        }
        return result.value;
      },
    }),
  }),
});

builder.queryType({
  fields: (t) => ({
    activityFeed: t.field({
      type: ActivityFeed,
      args: {
        userId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("activityFeedController");
        const result = await controller.getByUserId(
          { userId: args.userId },
          ctx.container,
        );
        if (result.kind === "err") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: result.error.message,
          });
        }
        return result.value;
      },
    }),
    activityFeedItems: t.field({
      type: [ActivityFeedItemType],
      args: {
        userId: t.arg.string({ required: true }),
        limit: t.arg.int({ defaultValue: 20 }),
        offset: t.arg.int({ defaultValue: 0 }),
      },
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("activityFeedController");
        const feedResult = await controller.getByUserId(
          { userId: args.userId },
          ctx.container,
        );
        if (feedResult.kind === "err") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: feedResult.error.message,
          });
        }
        const itemsResult = await controller.getItems(
          { feedId: feedResult.value.id },
          ctx.container,
        );
        if (itemsResult.kind === "err") {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: itemsResult.error.message,
          });
        }
        return itemsResult.value.slice(args.offset, args.offset + args.limit);
      },
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    addActivityFeedItem: t.field({
      type: ActivityFeedItemType,
      args: {
        userId: t.arg.string({ required: true }),
        type: t.arg.string({ required: true }),
        content: t.arg.string({ required: true }),
        metadata: t.arg({ type: "JSON" }),
      },
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("activityFeedController");
        const result = await controller.addItem(
          {
            userId: args.userId,
            type: args.type,
            content: args.content,
            metadata: args.metadata ?? undefined,
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
    clearActivityFeed: t.field({
      type: "Boolean",
      args: {
        userId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("activityFeedController");
        const result = await controller.clearFeed(
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
