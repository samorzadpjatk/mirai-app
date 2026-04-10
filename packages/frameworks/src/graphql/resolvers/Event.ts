import { builder } from "../builder.js";
import type { DIContext } from "../../di/src/index.js";
import { TRPCError } from "@trpc/server";

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
      resolve: async (e, _args, ctx: DIContext) => {
        const userId = (e as any).userId;
        if (!userId) return null;
        const controller = ctx.container.resolve("userController");
        const result = await controller.getById({ id: userId }, ctx.container);
        if (result.kind === "err") return null;
        return result.value;
      },
    }),
    group: t.field({
      type: "Group",
      nullable: true,
      resolve: async (e, _args, ctx: DIContext) => {
        const groupId = (e as any).groupId;
        if (!groupId) return null;
        const controller = ctx.container.resolve("groupController");
        const result = await controller.getById({ id: groupId }, ctx.container);
        if (result.kind === "err") return null;
        return result.value;
      },
    }),
    trip: t.field({
      type: "Trip",
      nullable: true,
      resolve: async (e, _args, ctx: DIContext) => {
        const tripId = (e as any).tripId;
        if (!tripId) return null;
        const controller = ctx.container.resolve("tripController");
        const result = await controller.getById({ id: tripId }, ctx.container);
        if (result.kind === "err") return null;
        return result.value;
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
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("eventController");
        const result = await controller.getEvents(
          {
            type: args.type ?? undefined,
            userId: args.userId ?? undefined,
            groupId: args.groupId ?? undefined,
            tripId: args.tripId ?? undefined,
            limit: args.limit,
            offset: args.offset,
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
    event: t.field({
      type: Event,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("eventController");
        const result = await controller.getById(
          { id: args.id.toString() },
          ctx.container,
        );
        if (result.kind === "err") return null;
        return result.value;
      },
    }),
    recentEvents: t.field({
      type: [Event],
      args: {
        limit: t.arg.int({ defaultValue: 10 }),
      },
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("eventController");
        const result = await controller.getRecent(
          { limit: args.limit },
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
    emitEvent: t.field({
      type: Event,
      args: {
        type: t.arg({ type: EventTypeEnum, required: true }),
        payload: t.arg({ type: "JSON", required: true }),
        userId: t.arg.string(),
        groupId: t.arg.string(),
        tripId: t.arg.string(),
      },
      resolve: async (_root, args, ctx: DIContext) => {
        const controller = ctx.container.resolve("eventController");
        const result = await controller.emit(
          {
            type: args.type,
            payload: args.payload,
            userId: args.userId ?? undefined,
            groupId: args.groupId ?? undefined,
            tripId: args.tripId ?? undefined,
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
  }),
});
