import { builder } from "../../builder.js";
import { NotificationType } from "./types.js";
import { EventEmitterPubSub } from "@mirai-app/adapters";
import type { NotificationDTO } from "@mirai-app/use-cases";
import type { GraphQLContext } from "../../context.js";

/**
 * PubSub channel name for notification events
 */
const NOTIFICATION_CREATED_CHANNEL = "notification:created";

/**
 * Global PubSub instance for notification events
 * This is a singleton used across the application
 */
export const notificationPubSub = new EventEmitterPubSub();

/**
 * Structured logging for subscription events
 */
function logSubscriptionEvent(
  level: "info" | "error" | "warn",
  message: string,
  context: GraphQLContext,
  details?: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    component: "NotificationSubscription",
    message,
    requestId: context.requestId,
    userId: context.authContext?.user?.id,
    ...details,
  };

  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Create async iterable for notification subscriptions
 * Filters notifications by tripId and userId if specified
 * Also verifies that the authenticated user matches the filter criteria
 */
async function* createNotificationIterable(
  tripId: string | null | undefined,
  userId: string | null | undefined,
  context: GraphQLContext,
): AsyncIterableIterator<NotificationDTO> {
  const subscription = notificationPubSub.subscribe<NotificationDTO>(
    NOTIFICATION_CREATED_CHANNEL,
  );

  // Get authenticated user ID from context
  const authUserId = context.authContext?.user?.id;

  logSubscriptionEvent("info", "Subscription started", context, {
    tripId,
    userId,
    authUserId,
  });

  try {
    for await (const notification of subscription.asyncIterable) {
      // Security: Verify authentication
      if (!authUserId) {
        logSubscriptionEvent(
          "error",
          "Unauthenticated subscription attempt",
          context,
        );
        throw new Error("Authentication required for subscription");
      }

      // Security: If userId filter is specified, verify it matches the authenticated user
      // This prevents users from subscribing to other users' notifications
      if (userId && userId !== authUserId) {
        logSubscriptionEvent(
          "warn",
          "User filter mismatch - access denied",
          context,
          {
            filterUserId: userId,
            authUserId,
          },
        );
        throw new Error("Cannot subscribe to notifications for other users");
      }

      // Filter: If tripId is specified, only yield matching notifications
      if (tripId && notification.tripId !== tripId) {
        continue;
      }

      // Filter: If userId is specified, only yield notifications for that user
      if (userId && notification.createdById !== userId) {
        continue;
      }

      logSubscriptionEvent(
        "info",
        "Notification yielded to subscriber",
        context,
        {
          notificationId: notification.id,
          tripId: notification.tripId,
          createdById: notification.createdById,
        },
      );

      yield notification;
    }
  } finally {
    // Clean up subscription when client disconnects
    subscription.unsubscribe();
    logSubscriptionEvent("info", "Subscription ended", context);
  }
}

/**
 * Notification Subscriptions
 *
 * Real-time subscriptions for notification events.
 * Uses EventEmitterPubSub for event streaming.
 *
 * Security: Requires authentication. User filtering enforces that users
 * can only subscribe to their own notifications.
 */
builder.subscriptionFields((t) => ({
  /**
   * Subscribe to new notifications
   *
   * This subscription emits events whenever a new notification is created
   * in the system. The notification-sender service subscribes to this
   * to process and send push notifications.
   *
   * Auth: Requires authentication
   * Filter: Supports filtering by tripId and userId
   * Security: User filter must match authenticated user
   */
  notificationCreated: t.field({
    type: NotificationType,
    description:
      "Subscribe to newly created notifications for real-time processing. Requires authentication.",
    authScopes: { authenticated: true },
    args: {
      // Optional filter by tripId for trip-specific notifications
      tripId: t.arg.id({
        required: false,
        description: "Optional: Filter notifications by trip ID",
      }),
      // Optional filter by userId - must match authenticated user
      userId: t.arg.id({
        required: false,
        description:
          "Optional: Filter notifications by user ID (must match authenticated user)",
      }),
    },
    subscribe: (
      _parent,
      args: { tripId?: string | null; userId?: string | null },
      context: GraphQLContext,
    ) => {
      return createNotificationIterable(args.tripId, args.userId, context);
    },
    resolve: (payload) => payload,
  }),
}));

/**
 * Helper function to publish notification created events
 *
 * Call this when a new notification is created to trigger
 * the subscription and notify all listeners.
 */
export function publishNotificationCreated(
  notification: NotificationDTO,
): void {
  notificationPubSub.publish(NOTIFICATION_CREATED_CHANNEL, notification);
}
