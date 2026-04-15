import { builder } from "../builder";
import { ActivityFeed } from "@mirai-app/domain";
import type { GraphQLContext } from "../builder";
import { GraphQLError } from "graphql";

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
      resolve: async (item, _args, ctx: GraphQLContext) => {
        const controller = ctx.controllers.userController;
        const result = await controller.getById({ id: (item as any).userId });
        if (!result.success) {
          throw new GraphQLError(result.error, {
            extensions: { code: "NOT_FOUND" },
          });
        }
        return result.data;
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
      resolve: async (a, _args, ctx: GraphQLContext) => {
        // TODO: Implement items retrieval via controller
        // For now return empty array
        return [];
      },
    }),
    user: t.field({
      type: "User",
      resolve: async (a, _args, ctx: GraphQLContext) => {
        const controller = ctx.controllers.userController;
        const result = await controller.getById({ id: a.userId });
        if (!result.success) {
          throw new GraphQLError(result.error, {
            extensions: { code: "NOT_FOUND" },
          });
        }
        return result.data;
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
      resolve: async (_root, args, ctx: GraphQLContext) => {
        // TODO: Implement activity feed retrieval via controller
        // For now return a stub
        return { id: "feed-" + args.userId, userId: args.userId };
      },
    }),
    activityFeedItems: t.field({
      type: [ActivityFeedItemType],
      args: {
        userId: t.arg.string({ required: true }),
        limit: t.arg.int({ defaultValue: 20 }),
        offset: t.arg.int({ defaultValue: 0 }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        // TODO: Implement items retrieval via controller
        return [];
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
      resolve: async (_root, args, ctx: GraphQLContext) => {
        // TODO: Implement via controller
        return {
          id: "item-" + Date.now(),
          userId: args.userId,
          type: args.type,
          content: args.content,
        };
      },
    }),
    clearActivityFeed: t.field({
      type: "Boolean",
      args: {
        userId: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx: GraphQLContext) => {
        // TODO: Implement via controller
        return true;
      },
    }),
  }),
});
