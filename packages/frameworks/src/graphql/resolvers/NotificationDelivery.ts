import { builder } from "../builder";
import { NotificationDelivery } from "@mirai-app/domain";
import type { GraphQLContext } from "../builder";
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
        const controller = ctx.controllers.notificationController;
        const result = await controller.getById({ id: nd.notificationId });
        if (!result.success) return null;
        return result.data;
      },
    }),
    trip: t.field({
      type: "Trip",
      nullable: true,
      resolve: async (nd, _, ctx: GraphQLContext) => {
        if (!nd.tripId) return null;
        const controller = ctx.controllers.tripController;
        const result = await controller.getById({ id: nd.tripId });
        if (!result.success) return null;
        return result.data;
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
      // TODO: Implement getById in NotificationDeliveryController
      const controller = ctx.controllers.notificationDeliveryController;
      const result = await controller.getDeliveries({ limit: 1000 });
      if (!result.success) return null;
      const delivery = result.data.find(
        (d: any) => d.id === args.id.toString(),
      );
      return delivery || null;
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
      const controller = ctx.controllers.notificationDeliveryController;
      const result = await controller.getDeliveries({
        tripId: args.tripId ?? undefined,
        status: args.status ?? undefined,
        limit: args.limit,
        offset: args.offset,
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return result.data;
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
      const controller = ctx.controllers.notificationDeliveryController;
      const result = await controller.getDeliveries({
        tripId: args.tripId ?? undefined,
        status: args.status ?? undefined,
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      // Calculate stats from deliveries
      const deliveries = result.data;
      const totalRecipients = deliveries.reduce(
        (sum: number, d: any) => sum + d.totalRecipients,
        0,
      );
      const totalSuccess = deliveries.reduce(
        (sum: number, d: any) => sum + d.successCount,
        0,
      );
      const totalFailures = deliveries.reduce(
        (sum: number, d: any) => sum + d.failureCount,
        0,
      );
      return {
        totalDeliveries: deliveries.length,
        totalRecipients,
        totalSuccess,
        totalFailures,
        avgSuccessPerDelivery:
          deliveries.length > 0 ? totalSuccess / deliveries.length : 0,
        avgFailuresPerDelivery:
          deliveries.length > 0 ? totalFailures / deliveries.length : 0,
        successRate: totalRecipients > 0 ? totalSuccess / totalRecipients : 0,
      };
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
      const controller = ctx.controllers.notificationDeliveryController;
      const result = await controller.getDeliveries({
        tripId: args.tripId,
        status: "failure",
        limit: args.limit,
        offset: args.offset,
      });
      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
      return result.data;
    },
  }),
}));

// No mutations for delivery - deliveries are created automatically by the system
// when notifications are sent
