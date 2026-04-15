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
// Push Subscription Query and Mutation Fields
// =============================================================================

import { PushSubscription } from "@mirai-app/domain";

/**
 * Query: myNotificationSubscriptions - Get user's push notification subscriptions
 *
 * Requires authentication.
 */
builder.queryField("myNotificationSubscriptions", (t) =>
  t.field({
    description: "Get current user's push notification subscriptions",
    type: "MyNotificationSubscriptions",
    nullable: false,
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, _args, context) => {
      const authContext = await requireAuth(context);

      // Get repository from context via Effect
      const runtime = context.runtime;
      const { Effect } = await import("effect");

      const program = Effect.gen(function* () {
        // Access the PushSubscriptionRepository from the layer
        const { PushSubscriptionRepository } = yield* Effect.promise(() =>
          import("@mirai-app/adapters").then((m) => ({
            PushSubscriptionRepository: m.PushSubscriptionRepository,
          })),
        );

        return yield* PushSubscriptionRepository.findByUserId(
          authContext.userId as string,
        );
      });

      const subscriptions = await Effect.runPromise(
        Effect.provide(program, context.appLayer),
      );

      return {
        subscriptions: subscriptions.map((sub: PushSubscription) => ({
          id: sub.id,
          userId: sub.userId,
          expoPushToken: sub.expoPushToken,
          platform: sub.platform,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
        })),
      };
    },
  }),
);

/**
 * Mutation: subscribeToNotifications - Subscribe to push notifications
 *
 * Requires authentication.
 */
builder.mutationField("subscribeToNotifications", (t) =>
  t.field({
    description: "Subscribe to push notifications",
    type: "SubscribeToNotificationsResult",
    nullable: false,
    args: {
      input: t.arg({
        type: "SubscribeToNotificationsInput",
        description: "Input for subscribing",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      const authContext = await requireAuth(context);
      const { Effect } = await import("effect");
      const { PushSubscription } = await import("@mirai-app/domain");

      const token = args.input.token;
      // Detect platform from user agent (simplified - can be enhanced)
      const platform = "unknown";

      const program = Effect.gen(function* () {
        // Create push subscription entity
        const subscription = yield* PushSubscription.create({
          userId: authContext.userId as string,
          expoPushToken: token,
          platform,
        });

        // Save via repository
        const { PushSubscriptionRepository } = yield* Effect.promise(() =>
          import("@mirai-app/adapters").then((m) => ({
            PushSubscriptionRepository: m.PushSubscriptionRepository,
          })),
        );

        yield* PushSubscriptionRepository.save(subscription);

        return subscription;
      });

      try {
        const subscription = await Effect.runPromise(
          Effect.provide(program, context.appLayer),
        );

        return {
          success: true,
          subscription: {
            id: subscription.id,
            userId: subscription.userId,
            expoPushToken: subscription.expoPushToken,
            platform: subscription.platform,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
          },
        };
      } catch (_error) {
        return { success: false };
      }
    },
  }),
);

/**
 * Mutation: unsubscribeFromNotifications - Unsubscribe from push notifications
 *
 * Requires authentication.
 */
builder.mutationField("unsubscribeFromNotifications", (t) =>
  t.field({
    description: "Unsubscribe from push notifications",
    type: "UnsubscribeFromNotificationsResult",
    nullable: false,
    args: {
      input: t.arg({
        type: "UnsubscribeFromNotificationsInput",
        description: "Input for unsubscribing",
        required: true,
      }),
    },
    authScopes: {
      authenticated: true,
    },
    resolve: async (_root, args, context) => {
      const authContext = await requireAuth(context);
      const { Effect } = await import("effect");

      const token = args.input.token;

      const program = Effect.gen(function* () {
        // Find subscriptions by user ID
        const { PushSubscriptionRepository } = yield* Effect.promise(() =>
          import("@mirai-app/adapters").then((m) => ({
            PushSubscriptionRepository: m.PushSubscriptionRepository,
          })),
        );

        const subscriptions = yield* PushSubscriptionRepository.findByUserId(
          authContext.userId as string,
        );

        // Find the subscription with matching token
        const subscription = subscriptions.find(
          (sub: PushSubscription) => sub.expoPushToken === token,
        );

        if (subscription) {
          // Delete the subscription
          yield* PushSubscriptionRepository.delete(subscription.id);
          return true;
        }

        return false;
      });

      try {
        const deleted = await Effect.runPromise(
          Effect.provide(program, context.appLayer),
        );
        return { success: deleted };
      } catch (_error) {
        return { success: false };
      }
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
