/**
 * Notification Delivery GraphQL Resolvers
 *
 * Resolvers for Notification Delivery queries.
 * Maps controller outputs to GraphQL responses with proper error handling.
 *
 * @module notificationDelivery/resolvers
 */

import { builder } from "../builder";
import { NotificationDeliveryController } from "@mirai-app/adapters";
import { requireAdmin } from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";
import { GraphQLError } from "graphql";

// =============================================================================
// Import Types (registers them with builder)
// =============================================================================

import "../types/notificationDelivery";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: notificationDeliveries - Get deliveries with filters
 *
 * Requires admin role.
 * Returns paginated list of notification deliveries.
 */
builder.queryField("notificationDeliveries", (t) =>
  t.field({
    description: "Get notification deliveries with optional filters",
    type: "NotificationDeliveryListResult",
    nullable: false,
    args: {
      input: t.arg({
        type: "GetDeliveriesInput",
        description: "Input for fetching deliveries",
        required: false,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin role
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationDeliveryController>(
          "notificationDeliveryController",
        );

      // Call controller method
      const result = await controller.getDeliveries({
        tripId: args.input?.tripId ?? undefined,
        status: args.input?.status ?? undefined,
        scheduleId: args.input?.scheduleId ?? undefined,
        startDate: args.input?.startDate ?? undefined,
        endDate: args.input?.endDate ?? undefined,
        limit: args.input?.limit ?? 50,
        offset: args.input?.offset ?? 0,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: notificationDeliveryByNotificationId - Get delivery by notification ID
 *
 * Requires admin role.
 * Returns a single delivery matching the notification ID.
 */
builder.queryField("notificationDeliveryByNotificationId", (t) =>
  t.field({
    description: "Get a notification delivery by notification ID",
    type: "NotificationDelivery",
    nullable: true,
    args: {
      input: t.arg({
        type: "GetDeliveryByNotificationIdInput",
        description: "Input for fetching delivery by notification ID",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin role
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationDeliveryController>(
          "notificationDeliveryController",
        );

      // Call controller method
      const result = await controller.getDeliveryByNotificationId({
        notificationId: args.input.notificationId,
        tripId: args.input.tripId,
      });

      if (!result.success) {
        // Return null for not found errors
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: deliveryStats - Get delivery statistics
 *
 * Requires admin role.
 * Returns aggregated statistics for deliveries.
 */
builder.queryField("deliveryStats", (t) =>
  t.field({
    description: "Get notification delivery statistics",
    type: "DeliveryStats",
    nullable: false,
    args: {
      input: t.arg({
        type: "GetDeliveryStatsInput",
        description: "Input for fetching delivery statistics",
        required: false,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin role
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationDeliveryController>(
          "notificationDeliveryController",
        );

      // Call controller method
      const result = await controller.getDeliveryStats({
        tripId: args.input?.tripId ?? undefined,
        startDate: args.input?.startDate ?? undefined,
        endDate: args.input?.endDate ?? undefined,
        scheduleId: args.input?.scheduleId ?? undefined,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: failedDeliveries - Get failed deliveries
 *
 * Requires admin role.
 * Returns paginated list of failed deliveries.
 */
builder.queryField("failedDeliveries", (t) =>
  t.field({
    description: "Get failed notification deliveries",
    type: "NotificationDeliveryListResult",
    nullable: false,
    args: {
      input: t.arg({
        type: "GetFailedDeliveriesInput",
        description: "Input for fetching failed deliveries",
        required: false,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin role
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationDeliveryController>(
          "notificationDeliveryController",
        );

      // Call controller method
      const result = await controller.getFailedDeliveries({
        tripId: args.input?.tripId ?? undefined,
        limit: args.input?.limit ?? 20,
        offset: args.input?.offset ?? 0,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
