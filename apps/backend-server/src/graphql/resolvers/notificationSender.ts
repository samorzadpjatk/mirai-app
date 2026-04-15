/**
 * Notification Sender GraphQL Resolvers
 *
 * Resolvers for notification sending operations.
 * Maps service calls to GraphQL responses with proper error handling.
 *
 * @module notificationSender/resolvers
 */

import { builder } from "../builder";
import { requireAdmin } from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";

// =============================================================================
// Import Types (registers them with builder)
// =============================================================================

import "../types/notificationSender";

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: sendMobileNotifications - Send mobile push notifications
 *
 * Requires admin role. Sends push notifications for a given notification ID.
 */
builder.mutationField("sendMobileNotifications", (t) =>
  t.field({
    description: "Send mobile push notifications (admin only)",
    type: "SendMobileNotificationsPayload",
    args: {
      input: t.arg({
        type: "SendMobileNotificationsInput",
        description: "Input for sending notifications",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get notification service from context
      const notificationService = context.controllers.notificationController;

      // Send notifications
      const result = await notificationService.sendMobileNotifications(
        args.input.notificationId,
      );

      return result;
    },
  }),
);

/**
 * Mutation: trackDeliveryStart - Track the start of a notification delivery
 *
 * Requires admin role. Records when a delivery process starts.
 */
builder.mutationField("trackDeliveryStart", (t) =>
  t.field({
    description: "Track the start of a notification delivery (admin only)",
    type: "TrackDeliveryStartPayload",
    args: {
      input: t.arg({
        type: "TrackDeliveryStartInput",
        description: "Input for tracking delivery start",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get notification delivery controller from context
      const deliveryController =
        context.controllers.notificationDeliveryController;

      // Track delivery start
      const result = await deliveryController.trackDeliveryStart({
        notificationId: args.input.notificationId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { success: true };
    },
  }),
);

/**
 * Mutation: trackDeliveryComplete - Track the completion of a notification delivery
 *
 * Requires admin role. Records delivery completion with statistics.
 */
builder.mutationField("trackDeliveryComplete", (t) =>
  t.field({
    description: "Track the completion of a notification delivery (admin only)",
    type: "TrackDeliveryCompletePayload",
    args: {
      input: t.arg({
        type: "TrackDeliveryCompleteInput",
        description: "Input for tracking delivery completion",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get notification delivery controller from context
      const deliveryController =
        context.controllers.notificationDeliveryController;

      // Track delivery completion
      const result = await deliveryController.trackDeliveryComplete({
        notificationId: args.input.notificationId,
        totalRecipients: args.input.totalRecipients,
        successCount: args.input.successCount,
        failureCount: args.input.failureCount,
        errors: args.input.errors ?? null,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { success: true };
    },
  }),
);

/**
 * Mutation: trackDeliveryFailure - Track a notification delivery failure
 *
 * Requires admin role. Records when a delivery fails.
 */
builder.mutationField("trackDeliveryFailure", (t) =>
  t.field({
    description: "Track a notification delivery failure (admin only)",
    type: "TrackDeliveryFailurePayload",
    args: {
      input: t.arg({
        type: "TrackDeliveryFailureInput",
        description: "Input for tracking delivery failure",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get notification delivery controller from context
      const deliveryController =
        context.controllers.notificationDeliveryController;

      // Track delivery failure
      const result = await deliveryController.trackDeliveryFailure({
        notificationId: args.input.notificationId,
        error: args.input.error,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { success: true };
    },
  }),
);

/**
 * Mutation: checkInactiveUsers - Check for inactive users and send nudges
 *
 * Requires admin role. Currently returns static values (feature disabled).
 */
builder.mutationField("checkInactiveUsers", (t) =>
  t.field({
    description:
      "Check for inactive users and send nudge notifications (admin only, currently disabled)",
    type: "CheckInactiveUsersPayload",
    authScopes: {
      admin: true,
    },
    resolve: async (_root, _args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Inactivity nudge notifications are disabled
      // Return static values matching the original tRPC implementation
      return {
        checked: 0,
        notified: 0,
        skipped: 0,
        errors: 0,
      };
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
