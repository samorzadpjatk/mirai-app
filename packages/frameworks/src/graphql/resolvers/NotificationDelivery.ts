import { builder } from "../builder.js";
import { NotificationDelivery } from "../../../domain/src/entities/NotificationDelivery.js";
import type { GraphQLContext } from "../builder.js";
import { GraphQLError } from "graphql";

/**
 * NotificationDelivery Resolvers
 *
 * GraphQL resolvers for NotificationDelivery domain.
 */

// Enum for delivery status
const DeliveryStatusEnum = builder.enumType("DeliveryStatus", {
  values: ["pending", "success", "partial_failure", "failure"] as const,
});

// NotificationDelivery type
builder.node(NotificationDelivery, {
  id: { resolve: (nd) => nd.id },
  name: "NotificationDelivery",
  fields: (t) => ({
    id: t.exposeID("id"),
    notificationId: t.exposeString("notificationId"),
    tripId: t.exposeString("tripId", { nullable: true }),
    status: t.field({
      type: DeliveryStatusEnum,
      resolve: (nd) => nd.status,
    }),
    totalRecipients: t.exposeInt("totalRecipients"),
    successCount: t.exposeInt("successCount"),
    failureCount: t.exposeInt("failureCount"),
    deliveryStartedAt: t.field({
      type: "DateTime",
      resolve: (nd) => nd.deliveryStartedAt,
    }),
    deliveryCompletedAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (nd) => nd.deliveryCompletedAt,
    }),
    errorLog: t.exposeString("errorLog", { nullable: true }),
    scheduleId: t.exposeString("scheduleId", { nullable: true }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (nd) => nd.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (nd) => nd.updatedAt,
    }),
    notification: t.field({
      type: "Notification",
      nullable: true,
      resolve: async (nd, _, ctx: GraphQLContext) => {
        const controller = ctx.container.resolve("notificationController");
        const result = await controller.getById(
          { id: nd.notificationId },
          ctx.container,
        );
        if (result.kind === "err") return null;
        return result.value;
      },
    }),
    trip: t.field({
      type: "Trip",
      nullable: true,
      resolve: async (nd, _, ctx: GraphQLContext) => {
        if (!nd.tripId) return null;
        const controller = ctx.container.resolve("tripController");
        const result = await controller.getById(
          { id: nd.tripId },
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
  notificationDelivery: t.field({
    type: NotificationDelivery,
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve(
        "notificationDeliveryController",
      );
      const result = await controller.getById(
        { id: args.id.toString() },
        ctx.container,
      );
      if (result.kind === "err") return null;
      return result.value;
    },
  }),

  notificationDeliveries: t.field({
    type: [NotificationDelivery],
    args: {
      tripId: t.arg.string(),
      status: t.arg({ type: DeliveryStatusEnum }),
      scheduleId: t.arg.string(),
      startDate: t.arg({ type: "DateTime" }),
      endDate: t.arg({ type: "DateTime" }),
      limit: t.arg.int({ defaultValue: 20 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve(
        "notificationDeliveryController",
      );
      const result = await controller.getDeliveries(
        {
          tripId: args.tripId ?? undefined,
          status: args.status ?? undefined,
          scheduleId: args.scheduleId ?? undefined,
          startDate: args.startDate ?? undefined,
          endDate: args.endDate ?? undefined,
          limit: args.limit,
          offset: args.offset,
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
    },
  }),

  deliveryStats: t.field({
    type: builder.objectType("DeliveryStats", {
      fields: (t) => ({
        totalDeliveries: t.exposeInt("totalDeliveries"),
        totalRecipients: t.exposeInt("totalRecipients"),
        totalSuccess: t.exposeInt("totalSuccess"),
        totalFailures: t.exposeInt("totalFailures"),
        avgSuccessPerDelivery: t.exposeFloat("avgSuccessPerDelivery"),
        avgFailuresPerDelivery: t.exposeFloat("avgFailuresPerDelivery"),
        successRate: t.exposeFloat("successRate"),
      }),
    }),
    args: {
      tripId: t.arg.string(),
      status: t.arg({ type: DeliveryStatusEnum }),
      startDate: t.arg({ type: "DateTime" }),
      endDate: t.arg({ type: "DateTime" }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve(
        "notificationDeliveryController",
      );
      const result = await controller.getStats(
        {
          tripId: args.tripId ?? undefined,
          status: args.status ?? undefined,
          startDate: args.startDate ?? undefined,
          endDate: args.endDate ?? undefined,
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
    },
  }),

  failedDeliveries: t.field({
    type: [NotificationDelivery],
    args: {
      tripId: t.arg.string({ required: true }),
      limit: t.arg.int({ defaultValue: 20 }),
      offset: t.arg.int({ defaultValue: 0 }),
    },
    resolve: async (_, args, ctx: GraphQLContext) => {
      const controller = ctx.container.resolve(
        "notificationDeliveryController",
      );
      const result = await controller.findFailed(
        {
          tripId: args.tripId,
          limit: args.limit,
          offset: args.offset,
        },
        ctx.container,
      );
      if (result.kind === "err") {
        throw new GraphQLError(result.error.message, { extensions: { code: "INTERNAL_SERVER_ERROR" } });
      }
      return result.value;
    },
  }),
}));

// No mutations for delivery - deliveries are created automatically by the system
// when notifications are sent
