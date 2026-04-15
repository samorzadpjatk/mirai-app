/**
 * Notifications GraphQL Types
 *
 * Pothos type definitions for the Notifications domain.
 * Maps from Notification DTOs to GraphQL schema types.
 *
 * @module notifications/types
 */

import { builder } from "../builder";

// =============================================================================
// Enums
// =============================================================================

/**
 * Notification status enum
 */
export const NotificationStatusEnum = builder.enumType("NotificationStatus", {
  description: "Status of a notification",
  values: {
    DRAFT: { value: "DRAFT" },
    READY: { value: "READY" },
    SENT: { value: "SENT" },
    FAILED: { value: "FAILED" },
    CANCELLED: { value: "CANCELLED" },
  },
});

/**
 * Notification priority enum
 */
export const NotificationPriorityEnum = builder.enumType(
  "NotificationPriority",
  {
    description: "Priority level of a notification",
    values: {
      LOW: { value: "LOW" },
      NORMAL: { value: "NORMAL" },
      HIGH: { value: "HIGH" },
      URGENT: { value: "URGENT" },
    },
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input type for pagination
 */
export const PaginationInput = builder.inputType(
  "NotificationPaginationInput",
  {
    description: "Pagination input for notification queries",
    fields: (t) => ({
      page: t.int({
        description: "Page number (1-based)",
        required: false,
        defaultValue: 1,
      }),
      pageSize: t.int({
        description: "Number of items per page (1-100)",
        required: false,
        defaultValue: 20,
      }),
    }),
  },
);

/**
 * Input type for offset-based pagination (admin queries)
 */
export const OffsetPaginationInput = builder.inputType(
  "NotificationOffsetPaginationInput",
  {
    description: "Offset-based pagination for admin queries",
    fields: (t) => ({
      limit: t.int({
        description: "Number of items to return (1-100)",
        required: false,
        defaultValue: 50,
      }),
      offset: t.int({
        description: "Number of items to skip",
        required: false,
        defaultValue: 0,
      }),
    }),
  },
);

/**
 * Input type for getAll query
 */
export const GetAllNotificationsInput = builder.inputType(
  "GetAllNotificationsInput",
  {
    description: "Input for fetching all notifications (admin only)",
    fields: (t) => ({
      tripId: t.id({
        description: "Optional trip ID to filter by",
        required: false,
      }),
      pagination: t.field({
        type: OffsetPaginationInput,
        description: "Pagination options",
        required: false,
      }),
    }),
  },
);

/**
 * Input type for create notification mutation
 */
export const CreateNotificationInput = builder.inputType(
  "CreateNotificationInput",
  {
    description: "Input for creating a new notification",
    fields: (t) => ({
      title: t.string({
        description: "Notification title",
        required: true,
      }),
      body: t.string({
        description: "Notification body content",
        required: true,
      }),
      url: t.string({
        description: "Optional URL to open when notification is tapped",
        required: false,
      }),
      tripId: t.id({
        description: "Optional trip ID to associate with notification",
        required: false,
      }),
      priority: t.field({
        type: NotificationPriorityEnum,
        description: "Notification priority",
        required: false,
        defaultValue: "NORMAL",
      }),
    }),
  },
);

/**
 * Input type for update notification mutation
 */
export const UpdateNotificationInput = builder.inputType(
  "UpdateNotificationInput",
  {
    description: "Input for updating a notification",
    fields: (t) => ({
      notificationId: t.id({
        description: "ID of notification to update",
        required: true,
      }),
      title: t.string({
        description: "New title",
        required: false,
      }),
      body: t.string({
        description: "New body content",
        required: false,
      }),
      url: t.string({
        description: "New URL (null to clear)",
        required: false,
      }),
      priority: t.field({
        type: NotificationPriorityEnum,
        description: "New priority",
        required: false,
      }),
    }),
  },
);

/**
 * Input type for update notification status mutation
 */
export const UpdateNotificationStatusInput = builder.inputType(
  "UpdateNotificationStatusInput",
  {
    description: "Input for updating notification status",
    fields: (t) => ({
      notificationId: t.id({
        description: "ID of notification to update",
        required: true,
      }),
      newStatus: t.field({
        type: NotificationStatusEnum,
        description: "New status to set",
        required: true,
      }),
    }),
  },
);

/**
 * Input type for delete notification mutation
 */
export const DeleteNotificationInput = builder.inputType(
  "DeleteNotificationInput",
  {
    description: "Input for deleting a notification",
    fields: (t) => ({
      notificationId: t.id({
        description: "ID of notification to delete",
        required: true,
      }),
    }),
  },
);

// =============================================================================
// Object Types
// =============================================================================

/**
 * Notification type
 */
export const NotificationType = builder.objectType("Notification", {
  description: "A notification message",
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Unique notification ID",
      nullable: false,
    }),
    title: t.exposeString("title", {
      description: "Notification title",
      nullable: false,
    }),
    body: t.exposeString("body", {
      description: "Notification body content",
      nullable: false,
    }),
    url: t.exposeString("url", {
      description: "Optional URL to open when tapped",
      nullable: true,
    }),
    status: t.field({
      type: NotificationStatusEnum,
      description: "Current status",
      nullable: false,
      resolve: (notification: { status: string }) =>
        notification.status as
          | "DRAFT"
          | "READY"
          | "SENT"
          | "FAILED"
          | "CANCELLED",
    }),
    priority: t.field({
      type: NotificationPriorityEnum,
      description: "Priority level",
      nullable: false,
      resolve: (notification: { priority: string }) =>
        notification.priority as "LOW" | "NORMAL" | "HIGH" | "URGENT",
    }),
    tripId: t.exposeID("tripId", {
      description: "Associated trip ID (null if global)",
      nullable: true,
    }),
    createdById: t.exposeID("createdById", {
      description: "User ID who created the notification",
      nullable: false,
    }),
    createdAt: t.field({
      type: "DateTime",
      description: "When notification was created",
      nullable: false,
      resolve: (notification: { createdAt: Date }) => notification.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      description: "When notification was last updated",
      nullable: true,
      resolve: (notification: { updatedAt?: Date }) =>
        notification.updatedAt ?? null,
    }),
    scheduledFor: t.field({
      type: "DateTime",
      description: "When notification is scheduled to be sent",
      nullable: true,
      resolve: (notification: { scheduledFor?: Date | null }) =>
        notification.scheduledFor ?? null,
    }),
    sentAt: t.field({
      type: "DateTime",
      description: "When notification was actually sent",
      nullable: true,
      resolve: (notification: { sentAt?: Date | null }) =>
        notification.sentAt ?? null,
    }),
    isSent: t.exposeBoolean("isSent", {
      description: "Whether notification has been sent",
      nullable: false,
    }),
    isScheduled: t.exposeBoolean("isScheduled", {
      description: "Whether notification is scheduled for future delivery",
      nullable: false,
    }),
    isReadyToSend: t.exposeBoolean("isReadyToSend", {
      description: "Whether notification is ready to be sent",
      nullable: true,
    }),
  }),
});

/**
 * Pagination info for notifications
 */
export const NotificationPaginationInfoType = builder.objectType(
  "NotificationPaginationInfo",
  {
    description: "Pagination information for notification lists",
    fields: (t) => ({
      total: t.exposeInt("total", {
        description: "Total number of items",
        nullable: false,
      }),
      page: t.exposeInt("page", {
        description: "Current page number",
        nullable: false,
      }),
      pageSize: t.exposeInt("pageSize", {
        description: "Items per page",
        nullable: false,
      }),
      totalPages: t.exposeInt("totalPages", {
        description: "Total number of pages",
        nullable: false,
      }),
    }),
  },
);

/**
 * Offset pagination info for admin queries
 */
export const NotificationOffsetPaginationInfoType = builder.objectType(
  "NotificationOffsetPaginationInfo",
  {
    description: "Offset-based pagination information",
    fields: (t) => ({
      total: t.exposeInt("total", {
        description: "Total number of items",
        nullable: false,
      }),
      limit: t.exposeInt("limit", {
        description: "Items per page",
        nullable: false,
      }),
      offset: t.exposeInt("offset", {
        description: "Number of items skipped",
        nullable: false,
      }),
      hasMore: t.exposeBoolean("hasMore", {
        description: "Whether there are more items",
        nullable: false,
      }),
    }),
  },
);

/**
 * My notifications result type
 */
export const MyNotificationsResultType = builder.objectType(
  "MyNotificationsResult",
  {
    description: "Result of fetching current user's notifications",
    fields: (t) => ({
      notifications: t.field({
        type: [NotificationType],
        description: "List of notifications",
        nullable: false,
        resolve: (result: {
          notifications: Array<{
            id: string;
            title: string;
            body: string;
            url: string | null;
            status: string;
            priority: string;
            tripId: string | null;
            createdById: string;
            createdAt: Date;
            isSent: boolean;
          }>;
        }) => result.notifications,
      }),
      pagination: t.field({
        type: NotificationPaginationInfoType,
        description: "Pagination information",
        nullable: false,
        resolve: (result: {
          pagination: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
          };
        }) => result.pagination,
      }),
    }),
  },
);

/**
 * All notifications result type (admin)
 */
export const AllNotificationsResultType = builder.objectType(
  "AllNotificationsResult",
  {
    description: "Result of fetching all notifications (admin only)",
    fields: (t) => ({
      notifications: t.field({
        type: [NotificationType],
        description: "List of notifications",
        nullable: false,
        resolve: (result: {
          notifications: Array<{
            id: string;
            title: string;
            body: string;
            url: string | null;
            status: string;
            priority: string;
            tripId: string | null;
            createdById: string;
            createdAt: Date;
            isSent: boolean;
          }>;
        }) => result.notifications,
      }),
      pagination: t.field({
        type: NotificationOffsetPaginationInfoType,
        description: "Pagination information",
        nullable: false,
        resolve: (result: {
          pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
          };
        }) => result.pagination,
      }),
    }),
  },
);

/**
 * Create notification result type
 */
export const CreateNotificationResultType = builder.objectType(
  "CreateNotificationResult",
  {
    description: "Result of creating a notification",
    fields: (t) => ({
      notification: t.field({
        type: NotificationType,
        description: "The created notification",
        nullable: false,
        resolve: (result: {
          id: string;
          title: string;
          body: string;
          url: string | null;
          status: string;
          priority: string;
          tripId: string | null;
          createdById: string;
          createdAt: Date;
          isScheduled: boolean;
        }) => result,
      }),
    }),
  },
);

/**
 * Update notification result type
 */
export const UpdateNotificationResultType = builder.objectType(
  "UpdateNotificationResult",
  {
    description: "Result of updating a notification",
    fields: (t) => ({
      notification: t.field({
        type: NotificationType,
        description: "The updated notification",
        nullable: false,
        resolve: (result: {
          id: string;
          title: string;
          body: string;
          url: string | null;
          status: string;
          priority: string;
          tripId: string | null;
          updatedAt: Date;
        }) => result,
      }),
    }),
  },
);

/**
 * Update notification status result type
 */
export const UpdateNotificationStatusResultType = builder.objectType(
  "UpdateNotificationStatusResult",
  {
    description: "Result of updating notification status",
    fields: (t) => ({
      notification: t.field({
        type: NotificationType,
        description: "The notification with updated status",
        nullable: false,
        resolve: (result: {
          id: string;
          title: string;
          previousStatus: string;
          newStatus: string;
          updatedAt: Date;
        }) => ({
          ...result,
          status: result.newStatus,
          body: "", // These fields come from the controller
          priority: "NORMAL",
          tripId: null,
          createdById: "",
          createdAt: result.updatedAt,
          isSent: result.newStatus === "SENT",
          isScheduled: false,
        }),
      }),
      previousStatus: t.field({
        type: NotificationStatusEnum,
        description: "Previous status",
        nullable: false,
        resolve: (result: { previousStatus: string }) =>
          result.previousStatus as
            | "DRAFT"
            | "READY"
            | "SENT"
            | "FAILED"
            | "CANCELLED",
      }),
      newStatus: t.field({
        type: NotificationStatusEnum,
        description: "New status",
        nullable: false,
        resolve: (result: { newStatus: string }) =>
          result.newStatus as
            | "DRAFT"
            | "READY"
            | "SENT"
            | "FAILED"
            | "CANCELLED",
      }),
    }),
  },
);

/**
 * Delete notification result type
 */
export const DeleteNotificationResultType = builder.objectType(
  "DeleteNotificationResult",
  {
    description: "Result of deleting a notification",
    fields: (t) => ({
      success: t.exposeBoolean("success", {
        description: "Whether deletion was successful",
        nullable: false,
      }),
    }),
  },
);

// =============================================================================
// Push Subscription Types
// =============================================================================

/**
 * Input type for subscribing to push notifications
 */
export const SubscribeToNotificationsInput = builder.inputType(
  "SubscribeToNotificationsInput",
  {
    description: "Input for subscribing to push notifications",
    fields: (t) => ({
      token: t.string({
        description: "Expo push token",
        required: true,
      }),
    }),
  },
);

/**
 * Input type for unsubscribing from push notifications
 */
export const UnsubscribeFromNotificationsInput = builder.inputType(
  "UnsubscribeFromNotificationsInput",
  {
    description: "Input for unsubscribing from push notifications",
    fields: (t) => ({
      token: t.string({
        description: "Expo push token to unsubscribe",
        required: true,
      }),
    }),
  },
);

/**
 * Push notification subscription type
 */
export const PushSubscriptionType = builder.objectType("PushSubscription", {
  description: "A user's push notification subscription",
  fields: (t) => ({
    token: t.exposeString("expoPushToken", {
      description: "Expo push token",
      nullable: false,
    }),
    platform: t.exposeString("platform", {
      description: "Device platform (ios, android)",
      nullable: false,
    }),
    createdAt: t.field({
      type: "DateTime",
      description: "When the subscription was created",
      nullable: false,
      resolve: (sub: { createdAt: Date }) => sub.createdAt,
    }),
  }),
});

/**
 * My notification subscriptions result type
 */
export const MyNotificationSubscriptionsType = builder.objectType(
  "MyNotificationSubscriptions",
  {
    description: "Result of fetching user's push notification subscriptions",
    fields: (t) => ({
      isSubscribed: t.boolean({
        description: "Whether the user has any active subscriptions",
        nullable: false,
        resolve: (result: { subscriptions: Array<{ id: string }> }) =>
          result.subscriptions.length > 0,
      }),
      subscriptions: t.field({
        type: [PushSubscriptionType],
        description: "List of active push subscriptions",
        nullable: false,
        resolve: (result: {
          subscriptions: Array<{
            expoPushToken: string;
            platform: string;
            createdAt: Date;
          }>;
        }) => result.subscriptions,
      }),
    }),
  },
);

/**
 * Subscribe to notifications result type
 */
export const SubscribeToNotificationsResultType = builder.objectType(
  "SubscribeToNotificationsResult",
  {
    description: "Result of subscribing to push notifications",
    fields: (t) => ({
      success: t.exposeBoolean("success", {
        description: "Whether subscription was successful",
        nullable: false,
      }),
      subscription: t.field({
        type: PushSubscriptionType,
        description: "The created subscription",
        nullable: true,
        resolve: (result: {
          subscription?: {
            expoPushToken: string;
            platform: string;
            createdAt: Date;
          };
        }) => result.subscription ?? null,
      }),
    }),
  },
);

/**
 * Unsubscribe from notifications result type
 */
export const UnsubscribeFromNotificationsResultType = builder.objectType(
  "UnsubscribeFromNotificationsResult",
  {
    description: "Result of unsubscribing from push notifications",
    fields: (t) => ({
      success: t.exposeBoolean("success", {
        description: "Whether unsubscription was successful",
        nullable: false,
      }),
    }),
  },
);

// =============================================================================
// Export
// =============================================================================

export { NotificationType as default };
