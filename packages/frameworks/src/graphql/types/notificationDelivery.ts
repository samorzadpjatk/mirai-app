/**
 * Notification Delivery GraphQL Types
 *
 * Pothos type definitions for the Notification Delivery domain.
 * Maps from NotificationDeliveryController outputs to GraphQL schema types.
 *
 * @module notificationDelivery/types
 */

import { builder } from "../builder";

// =============================================================================
// Enums
// =============================================================================

/**
 * Delivery status enum for GraphQL
 */
export const DeliveryStatusEnum = builder.enumType("DeliveryStatus", {
  description: "Status of a notification delivery",
  values: {
    PENDING: { value: "pending" },
    SUCCESS: { value: "success" },
    PARTIAL_FAILURE: { value: "partial_failure" },
    FAILURE: { value: "failure" },
  },
});

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input type for getDeliveries query
 */
export const GetDeliveriesInput = builder.inputType("GetDeliveriesInput", {
  description: "Input for fetching notification deliveries with filters",
  fields: (t) => ({
    tripId: t.id({
      description: "Filter by trip ID",
      required: false,
    }),
    status: t.field({
      type: DeliveryStatusEnum,
      description: "Filter by delivery status",
      required: false,
    }),
    scheduleId: t.id({
      description: "Filter by schedule ID",
      required: false,
    }),
    startDate: t.field({
      type: "DateTime",
      description: "Filter deliveries after this date",
      required: false,
    }),
    endDate: t.field({
      type: "DateTime",
      description: "Filter deliveries before this date",
      required: false,
    }),
    limit: t.int({
      description: "Number of deliveries to return (1-100, default 50)",
      required: false,
      defaultValue: 50,
    }),
    offset: t.int({
      description: "Offset for pagination (default 0)",
      required: false,
      defaultValue: 0,
    }),
  }),
});

/**
 * Input type for getDeliveryByNotificationId query
 */
export const GetDeliveryByNotificationIdInput = builder.inputType(
  "GetDeliveryByNotificationIdInput",
  {
    description: "Input for fetching a delivery by notification ID",
    fields: (t) => ({
      notificationId: t.id({
        description: "Notification ID to look up",
        required: true,
      }),
      tripId: t.id({
        description: "Trip ID for the notification",
        required: true,
      }),
    }),
  },
);

/**
 * Input type for getDeliveryStats query
 */
export const GetDeliveryStatsInput = builder.inputType(
  "GetDeliveryStatsInput",
  {
    description: "Input for fetching delivery statistics",
    fields: (t) => ({
      tripId: t.id({
        description: "Filter by trip ID",
        required: false,
      }),
      startDate: t.field({
        type: "DateTime",
        description: "Filter deliveries after this date",
        required: false,
      }),
      endDate: t.field({
        type: "DateTime",
        description: "Filter deliveries before this date",
        required: false,
      }),
      scheduleId: t.id({
        description: "Filter by schedule ID",
        required: false,
      }),
    }),
  },
);

/**
 * Input type for getFailedDeliveries query
 */
export const GetFailedDeliveriesInput = builder.inputType(
  "GetFailedDeliveriesInput",
  {
    description: "Input for fetching failed deliveries",
    fields: (t) => ({
      tripId: t.id({
        description: "Filter by trip ID",
        required: false,
      }),
      limit: t.int({
        description: "Number of deliveries to return (1-100, default 20)",
        required: false,
        defaultValue: 20,
      }),
      offset: t.int({
        description: "Offset for pagination (default 0)",
        required: false,
        defaultValue: 0,
      }),
    }),
  },
);

// =============================================================================
// Object Types
// =============================================================================

/**
 * Notification creator info type
 */
export const NotificationCreatorType = builder.objectType(
  "NotificationCreator",
  {
    description: "Creator of the notification",
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Creator user ID",
        nullable: false,
      }),
      firstName: t.exposeString("firstName", {
        description: "Creator first name",
        nullable: true,
      }),
      lastName: t.exposeString("lastName", {
        description: "Creator last name",
        nullable: true,
      }),
      authUserId: t.exposeString("authUserId", {
        description: "Auth provider user ID",
        nullable: true,
      }),
    }),
  },
);

/**
 * Notification info type (embedded in delivery)
 */
export const NotificationInfoType = builder.objectType("NotificationInfo", {
  description: "Notification information within a delivery",
  fields: (t) => ({
    id: t.exposeID("id", {
      description: "Notification ID",
      nullable: false,
    }),
    title: t.exposeString("title", {
      description: "Notification title",
      nullable: false,
    }),
    body: t.exposeString("body", {
      description: "Notification body",
      nullable: false,
    }),
    url: t.exposeString("url", {
      description: "Notification URL/deep link",
      nullable: true,
    }),
    createdAt: t.field({
      type: "DateTime",
      description: "When notification was created",
      nullable: false,
      resolve: (notification: { createdAt: Date }) => notification.createdAt,
    }),
    tripId: t.exposeID("tripId", {
      description: "Trip ID the notification belongs to",
      nullable: true,
    }),
    createdBy: t.field({
      type: NotificationCreatorType,
      description: "User who created the notification",
      nullable: true,
      resolve: (notification: { createdBy?: unknown }) =>
        notification.createdBy,
    }),
  }),
});

/**
 * Notification delivery type
 */
export const NotificationDeliveryType = builder.objectType(
  "NotificationDelivery",
  {
    description: "A notification delivery record",
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Unique delivery ID",
        nullable: false,
      }),
      notificationId: t.exposeID("notificationId", {
        description: "ID of the notification being delivered",
        nullable: false,
      }),
      tripId: t.exposeID("tripId", {
        description: "Trip ID this delivery belongs to",
        nullable: false,
      }),
      status: t.field({
        type: DeliveryStatusEnum,
        description: "Current delivery status",
        nullable: false,
        resolve: (delivery: { status: string }) =>
          delivery.status.toUpperCase().replace(/_/g, "_") as
            | "PENDING"
            | "SUCCESS"
            | "PARTIAL_FAILURE"
            | "FAILURE",
      }),
      totalRecipients: t.exposeInt("totalRecipients", {
        description: "Total number of intended recipients",
        nullable: false,
      }),
      successCount: t.exposeInt("successCount", {
        description: "Number of successful deliveries",
        nullable: false,
      }),
      failureCount: t.exposeInt("failureCount", {
        description: "Number of failed deliveries",
        nullable: false,
      }),
      deliveryStartedAt: t.field({
        type: "DateTime",
        description: "When delivery started",
        nullable: false,
        resolve: (delivery: { deliveryStartedAt: Date }) =>
          delivery.deliveryStartedAt,
      }),
      deliveryCompletedAt: t.field({
        type: "DateTime",
        description: "When delivery completed (null if still in progress)",
        nullable: true,
        resolve: (delivery: { deliveryCompletedAt?: Date | null }) =>
          delivery.deliveryCompletedAt,
      }),
      errorLog: t.exposeString("errorLog", {
        description: "Error log for failed deliveries",
        nullable: true,
      }),
      scheduleId: t.exposeID("scheduleId", {
        description: "Associated schedule ID if scheduled delivery",
        nullable: true,
      }),
      createdAt: t.field({
        type: "DateTime",
        description: "When delivery record was created",
        nullable: false,
        resolve: (delivery: { createdAt: Date }) => delivery.createdAt,
      }),
      updatedAt: t.field({
        type: "DateTime",
        description: "When delivery record was last updated",
        nullable: false,
        resolve: (delivery: { updatedAt: Date }) => delivery.updatedAt,
      }),
      notification: t.field({
        type: NotificationInfoType,
        description: "Associated notification details",
        nullable: true,
        resolve: (delivery: { notification?: unknown }) =>
          delivery.notification,
      }),
    }),
  },
);

/**
 * Pagination info for delivery list
 */
export const DeliveryPaginationType = builder.objectType("DeliveryPagination", {
  description: "Pagination information for delivery queries",
  fields: (t) => ({
    total: t.exposeInt("total", {
      description: "Total number of matching deliveries",
      nullable: false,
    }),
    limit: t.exposeInt("limit", {
      description: "Number of items per page",
      nullable: false,
    }),
    offset: t.exposeInt("offset", {
      description: "Current offset",
      nullable: false,
    }),
  }),
});

/**
 * Delivery list result type
 */
export const NotificationDeliveryListResultType = builder.objectType(
  "NotificationDeliveryListResult",
  {
    description: "Result of fetching a list of notification deliveries",
    fields: (t) => ({
      deliveries: t.field({
        type: [NotificationDeliveryType],
        description: "List of deliveries",
        nullable: false,
        resolve: (result: { deliveries: unknown[] }) => result.deliveries,
      }),
      pagination: t.field({
        type: DeliveryPaginationType,
        description: "Pagination information",
        nullable: false,
        resolve: (result: {
          total: number;
          limit: number;
          offset: number;
        }) => ({
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        }),
      }),
    }),
  },
);

/**
 * Status breakdown for statistics
 */
export const DeliveryStatusBreakdownType = builder.objectType(
  "DeliveryStatusBreakdown",
  {
    description: "Count of deliveries per status",
    fields: (t) => ({
      pending: t.int({
        description: "Number of pending deliveries",
        nullable: false,
        resolve: (breakdown: Record<string, number>) => breakdown.pending ?? 0,
      }),
      success: t.int({
        description: "Number of successful deliveries",
        nullable: false,
        resolve: (breakdown: Record<string, number>) => breakdown.success ?? 0,
      }),
      partialFailure: t.int({
        description: "Number of partially failed deliveries",
        nullable: false,
        resolve: (breakdown: Record<string, number>) =>
          breakdown.partial_failure ?? 0,
      }),
      failure: t.int({
        description: "Number of failed deliveries",
        nullable: false,
        resolve: (breakdown: Record<string, number>) => breakdown.failure ?? 0,
      }),
    }),
  },
);

/**
 * Delivery statistics type
 */
export const DeliveryStatsType = builder.objectType("DeliveryStats", {
  description: "Statistics for notification deliveries",
  fields: (t) => ({
    totalDeliveries: t.exposeInt("totalDeliveries", {
      description: "Total number of deliveries",
      nullable: false,
    }),
    totalRecipients: t.exposeInt("totalRecipients", {
      description: "Total intended recipients across all deliveries",
      nullable: false,
    }),
    totalSuccess: t.exposeInt("totalSuccess", {
      description: "Total successful deliveries",
      nullable: false,
    }),
    totalFailures: t.exposeInt("totalFailures", {
      description: "Total failed deliveries",
      nullable: false,
    }),
    avgSuccessPerDelivery: t.exposeFloat("avgSuccessPerDelivery", {
      description: "Average successful deliveries per batch",
      nullable: false,
    }),
    avgFailuresPerDelivery: t.exposeFloat("avgFailuresPerDelivery", {
      description: "Average failed deliveries per batch",
      nullable: false,
    }),
    successRate: t.exposeFloat("successRate", {
      description: "Overall success rate (0.0 - 1.0)",
      nullable: false,
    }),
    statusBreakdown: t.field({
      type: DeliveryStatusBreakdownType,
      description: "Breakdown of deliveries by status",
      nullable: false,
      resolve: (stats: { statusBreakdown: Record<string, number> }) =>
        stats.statusBreakdown,
    }),
  }),
});

// =============================================================================
// Export
// =============================================================================

export { NotificationDeliveryType as default };
