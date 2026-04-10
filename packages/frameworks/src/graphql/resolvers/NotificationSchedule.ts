import { builder } from "../builder.js";
import { NotificationSchedule } from "../../../domain/src/entities/NotificationSchedule.js";
import type { DIContext } from "../../di/src/index.js";
import { TRPCError } from "@trpc/server";

/**
 * NotificationSchedule Resolvers
 *
 * GraphQL resolvers for NotificationSchedule domain.
 */

// Enum for notification schedule type
const NotificationScheduleTypeEnum = builder.enumType(
  "NotificationScheduleType",
  {
    values: [
      "CHALLENGE",
      "REMINDER",
      "ANNOUNCEMENT",
      "DAILY_RANKING",
      "INFO",
    ] as const,
  },
);

// NotificationSchedule type
builder.node(NotificationSchedule, {
  id: { resolve: (ns) => ns.id },
  name: "NotificationSchedule",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    tripId: t.exposeString("tripId", { nullable: true }),
    notificationType: t.field({
      type: NotificationScheduleTypeEnum,
      resolve: (ns) => ns.notificationType,
    }),
    notificationTitle: t.exposeString("notificationTitle", { nullable: true }),
    notificationBody: t.exposeString("notificationBody", { nullable: true }),
    notificationUrl: t.exposeString("notificationUrl", { nullable: true }),
    startDate: t.field({
      type: "DateTime",
      resolve: (ns) => ns.startDate,
    }),
    endDate: t.field({
      type: "DateTime",
      resolve: (ns) => ns.endDate,
    }),
    hour: t.exposeInt("hour"),
    minute: t.exposeInt("minute"),
    isActive: t.exposeBoolean("isActive"),
    createdById: t.exposeString("createdById"),
    lastRun: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (ns) => ns.lastRun,
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (ns) => ns.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (ns) => ns.updatedAt,
    }),
    trip: t.field({
      type: "Trip",
      nullable: true,
      resolve: async (ns, _, ctx: DIContext) => {
        if (!ns.tripId) return null;
        const controller = ctx.container.resolve("tripController");
        const result = await controller.getById(
          { id: ns.tripId },
          ctx.container,
        );
        if (result.kind === "err") return null;
        return result.value;
      },
    }),
    createdBy: t.field({
      type: "User",
      nullable: true,
      resolve: async (ns, _, ctx: DIContext) => {
        const controller = ctx.container.resolve("userController");
        const result = await controller.getById(
          { id: ns.createdById },
          ctx.container,
        );
        if (result.kind === "err") return null;
        return result.value;
      },
    }),
  }),
});

// Queries
builder.queryFields((t) => ({
  notificationSchedule: t.field({
    type: NotificationSchedule,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve(
        "notificationScheduleController",
      );
      const result = await controller.getById(
        { id: args.id.toString() },
        ctx.container,
      );
      if (result.kind === "err") return null;
      return result.value;
    },
  }),

  notificationSchedules: t.field({
    type: [NotificationSchedule],
    args: {
      tripId: t.arg.string(),
      type: t.arg({ type: NotificationScheduleTypeEnum }),
      isActive: t.arg.boolean(),
      limit: t.arg.int({ defaultValue: 20 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve(
        "notificationScheduleController",
      );
      const result = await controller.getAll(
        {
          tripId: args.tripId ?? undefined,
          notificationType: args.type ?? undefined,
          isActive: args.isActive ?? undefined,
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

  activeSchedules: t.field({
    type: [NotificationSchedule],
    resolve: async (_, __, ctx: DIContext) => {
      const controller = ctx.container.resolve(
        "notificationScheduleController",
      );
      const result = await controller.findActive({}, ctx.container);
      if (result.kind === "err") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error.message,
        });
      }
      return result.value;
    },
  }),

  upcomingSchedules: t.field({
    type: [NotificationSchedule],
    args: {
      days: t.arg.int({ defaultValue: 7 }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve(
        "notificationScheduleController",
      );
      const result = await controller.findUpcoming(
        { days: args.days },
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
}));

// Mutations
builder.mutationFields((t) => ({
  createNotificationSchedule: t.field({
    type: NotificationSchedule,
    args: {
      name: t.arg.string({ required: true }),
      tripId: t.arg.string(),
      notificationType: t.arg({
        type: NotificationScheduleTypeEnum,
        required: true,
      }),
      notificationTitle: t.arg.string(),
      notificationBody: t.arg.string(),
      notificationUrl: t.arg.string(),
      startDate: t.arg({ type: "DateTime", required: true }),
      endDate: t.arg({ type: "DateTime", required: true }),
      hour: t.arg.int({ required: true }),
      minute: t.arg.int({ required: true }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve(
        "notificationScheduleController",
      );
      const result = await controller.create(args, ctx.container);
      if (result.kind === "err") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error.message,
        });
      }
      return result.value;
    },
  }),

  updateNotificationSchedule: t.field({
    type: NotificationSchedule,
    args: {
      id: t.arg.id({ required: true }),
      name: t.arg.string(),
      notificationTitle: t.arg.string(),
      notificationBody: t.arg.string(),
      notificationUrl: t.arg.string(),
      startDate: t.arg({ type: "DateTime" }),
      endDate: t.arg({ type: "DateTime" }),
      hour: t.arg.int(),
      minute: t.arg.int(),
      isActive: t.arg.boolean(),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve(
        "notificationScheduleController",
      );
      const result = await controller.update(
        {
          id: args.id.toString(),
          ...args,
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

  toggleScheduleActive: t.field({
    type: NotificationSchedule,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve(
        "notificationScheduleController",
      );
      const result = await controller.toggleActive(
        { id: args.id.toString() },
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

  deleteNotificationSchedule: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: DIContext) => {
      const controller = ctx.container.resolve(
        "notificationScheduleController",
      );
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
}));
