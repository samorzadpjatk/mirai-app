/**
 * Notifications GraphQL Resolvers
 *
 * Resolvers for Notifications queries and mutations.
 * Maps controller outputs to GraphQL responses with proper error handling.
 *
 * @module notifications/resolvers
 */

import { builder } from "../builder";
import {
  requireAuth,
  requireAdmin,
  requireModerator,
} from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";
import { GraphQLError } from "graphql";

// =============================================================================
// Import Types (registers them with builder)
// =============================================================================

import "../types/notifications";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: myNotifications - Get current user's notifications
 *
 * Requires authentication.
 * Returns paginated notifications for the authenticated user.
 */
builder.queryField("myNotifications", (t) =>
  t.field({
    description: "Get current user's notifications",
    type: "MyNotificationsResult",
    nullable: false,
    args: {
      input: t.arg({
        type: "NotificationPaginationInput",
        description: "Pagination options",
        required: false,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      // Require authentication
      await requireAuth(context);

      // Get controller from context
      const controller = context.controllers.notificationController;

      const page = args.input?.page ?? 1;
      const pageSize = args.input?.pageSize ?? 20;

      // Call controller method
      const result = await controller.list({
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        notifications: result.data,
        pagination: {
          total: result.data.length,
          page,
          pageSize,
          totalPages: Math.ceil(result.data.length / pageSize),
        },
      };
    },
  }),
);

/**
 * Query: allNotifications - Get all notifications (admin only)
 *
 * Requires admin role.
 * Supports filtering by tripId and offset-based pagination.
 */
builder.queryField("allNotifications", (t) =>
  t.field({
    description: "Get all notifications (admin only)",
    type: "AllNotificationsResult",
    nullable: false,
    args: {
      input: t.arg({
        type: "GetAllNotificationsInput",
        description: "Filter and pagination options",
        required: false,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin
      await requireAdmin(context);

      // Get controller from context
      const controller = context.controllers.notificationController;

      const tripId = args.input?.tripId;
      const limit = args.input?.pagination?.limit ?? 50;
      const offset = args.input?.pagination?.offset ?? 0;

      // If tripId provided, use getByTripId
      if (tripId) {
        const result = await controller.getByTripId({ tripId });

        if (!result.success) {
          throw mapErrorToGraphQL(new Error(result.error));
        }

        return {
          notifications: result.data,
          pagination: {
            total: result.data.length,
            limit,
            offset,
            hasMore: false,
          },
        };
      }

      // Otherwise, list all with pagination
      const result = await controller.list({ limit, offset });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        notifications: result.data,
        pagination: {
          total: result.data.length,
          limit,
          offset,
          hasMore: result.data.length >= limit,
        },
      };
    },
  }),
);

/**
 * Query: notification - Get a single notification by ID
 *
 * Requires admin role.
 */
builder.queryField("notification", (t) =>
  t.field({
    description: "Get a single notification by ID (admin only)",
    type: "Notification",
    nullable: true,
    args: {
      id: t.arg.id({
        description: "Notification ID to fetch",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin
      await requireAdmin(context);

      // Get controller from context
      const controller = context.controllers.notificationController;

      const result = await controller.getById({ id: args.id });

      if (!result.success) {
        // Return null for not found
        if (result.error.toLowerCase().includes("not found")) {
          return null;
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: createNotification - Create a new notification
 *
 * Requires moderator or admin role.
 */
builder.mutationField("createNotification", (t) =>
  t.field({
    description: "Create a new notification (moderator only)",
    type: "CreateNotificationResult",
    nullable: false,
    args: {
      input: t.arg({
        type: "CreateNotificationInput",
        description: "Input for creating notification",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator
      const authContext = await requireModerator(context);

      // Get controller from context
      const controller = context.controllers.notificationController;

      const result = await controller.create({
        title: args.input.title,
        body: args.input.body,
        url: args.input.url ?? undefined,
        tripId: args.input.tripId ?? undefined,
        priority: args.input.priority ?? "NORMAL",
        createdById: authContext.userId as string,
        scheduledFor: null,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Mutation: updateNotification - Update an existing notification
 *
 * Requires admin role.
 */
builder.mutationField("updateNotification", (t) =>
  t.field({
    description: "Update a notification (admin only)",
    type: "UpdateNotificationResult",
    nullable: false,
    args: {
      input: t.arg({
        type: "UpdateNotificationInput",
        description: "Input for updating notification",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin
      await requireAdmin(context);

      // Get controller from context
      const controller = context.controllers.notificationController;

      const result = await controller.update({
        notificationId: args.input.notificationId,
        title: args.input.title ?? undefined,
        body: args.input.body ?? undefined,
        url: args.input.url === null ? null : (args.input.url ?? undefined),
        priority: args.input.priority ?? undefined,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { notification: result.data };
    },
  }),
);

/**
 * Mutation: updateNotificationStatus - Update notification status
 *
 * Requires admin role.
 */
builder.mutationField("updateNotificationStatus", (t) =>
  t.field({
    description: "Update notification status (admin only)",
    type: "UpdateNotificationStatusResult",
    nullable: false,
    args: {
      input: t.arg({
        type: "UpdateNotificationStatusInput",
        description: "Input for updating status",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin
      await requireAdmin(context);

      // Get controller from context
      const controller = context.controllers.notificationController;

      const result = await controller.updateStatus({
        notificationId: args.input.notificationId,
        newStatus: args.input.newStatus,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Mutation: deleteNotification - Delete a notification
 *
 * Requires admin role.
 */
builder.mutationField("deleteNotification", (t) =>
  t.field({
    description: "Delete a notification (admin only)",
    type: "DeleteNotificationResult",
    nullable: false,
    args: {
      input: t.arg({
        type: "DeleteNotificationInput",
        description: "Input for deleting notification",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin
      await requireAdmin(context);

      // Get controller from context
      const controller = context.controllers.notificationController;

      const result = await controller.delete({ id: args.input.notificationId });

      if (!result.success) {
        const error = new Error(result.error);
        if (result.error.toLowerCase().includes("not found")) {
          throw new GraphQLError(result.error, {
            extensions: { code: "NOT_FOUND" },
          });
        }
        throw mapErrorToGraphQL(error);
      }

      return { success: true };
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
