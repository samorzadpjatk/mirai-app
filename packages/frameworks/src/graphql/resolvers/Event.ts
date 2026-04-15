import { builder } from "../builder.js";
import type { GraphQLContext } from "../builder.js";
import { GraphQLError } from "graphql";

const EventTypeEnum = builder.enumType("EventType", {
  values: [
    "USER_JOINED",
    "USER_LEFT",
    "TRIP_CREATED",
    "CHALLENGE_COMPLETED",
    "LEVEL_UP",
    "POINTS_EARNED",
  ] as const,
});

const Event = builder.objectType("Event", {
  fields: (t) => ({
    id: t.exposeID("id"),
    type: t.field({
      type: EventTypeEnum,
      resolve: (e) => (e as any).type,
    }),
    payload: t.field({
      type: "JSON",
      resolve: (e) => (e as any).payload,
    }),
    userId: t.exposeString("userId", { nullable: true }),
    groupId: t.exposeString("groupId", { nullable: true }),
    tripId: t.exposeString("tripId", { nullable: true }),
    createdAt: t.field({
      type: "Date",
      resolve: (e) => (e as any).createdAt,
    }),
    user: t.field({
      type: "User",
      nullable: true,
      resolve: async (e, _args, ctx: GraphQLContext) => {
        const userId = (e as any).userId;
        if (!userId) return null;
        const controller = ctx.controllers.userController;
        const result = await controller.getById({ id: userId });
        if (!result.success) return null;
        return result.data;
      },
    }),
    group: t.field({
      type: "Group",
      nullable: true,
      resolve: async (e, _args, ctx: GraphQLContext) => {
        const groupId = (e as any).groupId;
        if (!groupId) return null;
        const controller = ctx.controllers.groupController;
        const result = await controller.getById({ id: groupId });
        if (!result.success) return null;
        return result.data;
      },
    }),
    trip: t.field({
      type: "Trip",
      nullable: true,
      resolve: async (e, _args, ctx: GraphQLContext) => {
        const tripId = (e as any).tripId;
        if (!tripId) return null;
        const controller = ctx.controllers.tripController;
        const result = await controller.getById({ id: tripId });
        if (!result.success) return null;
        return result.data;
      },
    }),
  }),
});

builder.queryType({
  fields: (t) => ({
    events: t.field({
      type: [Event],
      args: {
        type: t.arg({ type: EventTypeEnum }),
        userId: t.arg.string(),
        groupId: t.arg.string(),
        tripId: t.arg.string(),
        limit: t.arg.int({ defaultValue: 20 }),
        offset: t.arg.int({ defaultValue: 0 }),
      },
      resolve: async (_root, _args, _ctx: GraphQLContext) => {
        // TODO: Implement EventController and use ctx.controllers.eventController
        return [];
      },
    }),
    event: t.field({
      type: Event,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_root, _args, _ctx: GraphQLContext) => {
        // TODO: Implement EventController and use ctx.controllers.eventController
        return null;
      },
    }),
    recentEvents: t.field({
      type: [Event],
      args: {
        limit: t.arg.int({ defaultValue: 10 }),
      },
      resolve: async (_root, _args, _ctx: GraphQLContext) => {
        // TODO: Implement EventController and use ctx.controllers.eventController
        return [];
      },
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    emitEvent: t.field({
      type: Event,
      args: {
        type: t.arg({ type: EventTypeEnum, required: true }),
        payload: t.arg({ type: "JSON", required: true }),
        userId: t.arg.string(),
        groupId: t.arg.string(),
        tripId: t.arg.string(),
      },
      resolve: async (_root, args, _ctx: GraphQLContext) => {
        // TODO: Implement EventController and use ctx.controllers.eventController
        return {
          id: "event-" + Date.now(),
          type: args.type,
          payload: args.payload,
          userId: args.userId,
          groupId: args.groupId,
          tripId: args.tripId,
          createdAt: new Date(),
        };
      },
    }),
  }),
});
