/**
 * Notification Sender GraphQL Types
 *
 * Pothos type definitions for notification sending operations.
 * Includes types for sending mobile notifications and tracking delivery status.
 *
 * @module notificationSender/types
 */

import { builder } from "../builder";

// =============================================================================
// Enum Types
// =============================================================================

/**
 * Delivery status for notification tracking
 */
export const NotificationDeliveryStatusEnum = builder.enumType(
  "NotificationDeliveryStatus",
  {
    description: "Status of a notification delivery",
    values: {
      PENDING: { value: "pending" },
      SUCCESS: { value: "success" },
      PARTIAL_FAILURE: { value: "partial_failure" },
      FAILURE: { value: "failure" },
    },
  },
);

// =============================================================================
// Object Types
// =============================================================================

/**
 * Result of sending mobile notifications
 */
export const SendMobileNotificationsPayloadType = builder.objectType(
  "SendMobileNotificationsPayload",
  {
    description: "Result of sending mobile push notifications",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      success: t.boolean({
        description: "Whether the send operation was successful",
        nullable: false,
        resolve: (payload) =>
          (payload as SendMobileNotificationsResult).success,
      }),
      sent: t.int({
        description: "Number of notifications successfully sent",
        nullable: false,
        resolve: (payload) => (payload as SendMobileNotificationsResult).sent,
      }),
      failed: t.int({
        description: "Number of notifications that failed to send",
        nullable: false,
        resolve: (payload) => (payload as SendMobileNotificationsResult).failed,
      }),
      total: t.int({
        description: "Total number of recipients targeted",
        nullable: false,
        resolve: (payload) => (payload as SendMobileNotificationsResult).total,
      }),
    }),
  },
);

/**
 * Result of tracking delivery start
 */
export const TrackDeliveryStartPayloadType = builder.objectType(
  "TrackDeliveryStartPayload",
  {
    description: "Result of tracking delivery start",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      success: t.boolean({
        description: "Whether the tracking was recorded successfully",
        nullable: false,
        resolve: (payload) => (payload as TrackDeliveryResult).success,
      }),
    }),
  },
);

/**
 * Result of tracking delivery completion
 */
export const TrackDeliveryCompletePayloadType = builder.objectType(
  "TrackDeliveryCompletePayload",
  {
    description: "Result of tracking delivery completion",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      success: t.boolean({
        description: "Whether the tracking was recorded successfully",
        nullable: false,
        resolve: (payload) => (payload as TrackDeliveryResult).success,
      }),
    }),
  },
);

/**
 * Result of tracking delivery failure
 */
export const TrackDeliveryFailurePayloadType = builder.objectType(
  "TrackDeliveryFailurePayload",
  {
    description: "Result of tracking delivery failure",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      success: t.boolean({
        description: "Whether the failure was recorded successfully",
        nullable: false,
        resolve: (payload) => (payload as TrackDeliveryResult).success,
      }),
    }),
  },
);

/**
 * Inactive user check result
 */
export const CheckInactiveUsersPayloadType = builder.objectType(
  "CheckInactiveUsersPayload",
  {
    description: "Result of checking inactive users",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      checked: t.int({
        description: "Number of users checked for inactivity",
        nullable: false,
        resolve: (payload) => (payload as CheckInactiveUsersResult).checked,
      }),
      notified: t.int({
        description: "Number of users notified",
        nullable: false,
        resolve: (payload) => (payload as CheckInactiveUsersResult).notified,
      }),
      skipped: t.int({
        description: "Number of users skipped",
        nullable: false,
        resolve: (payload) => (payload as CheckInactiveUsersResult).skipped,
      }),
      errors: t.int({
        description: "Number of errors encountered",
        nullable: false,
        resolve: (payload) => (payload as CheckInactiveUsersResult).errors,
      }),
    }),
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for sending mobile notifications
 */
export const SendMobileNotificationsInput = builder.inputType(
  "SendMobileNotificationsInput",
  {
    description: "Input for sending mobile push notifications",
    fields: (t) => ({
      notificationId: t.id({
        description: "ID of the notification to send",
        required: true,
      }),
    }),
  },
);

/**
 * Input for tracking delivery start
 */
export const TrackDeliveryStartInput = builder.inputType(
  "TrackDeliveryStartInput",
  {
    description: "Input for tracking delivery start",
    fields: (t) => ({
      notificationId: t.id({
        description: "ID of the notification being delivered",
        required: true,
      }),
    }),
  },
);

/**
 * Input for tracking delivery completion
 */
export const TrackDeliveryCompleteInput = builder.inputType(
  "TrackDeliveryCompleteInput",
  {
    description: "Input for tracking delivery completion",
    fields: (t) => ({
      notificationId: t.id({
        description: "ID of the notification that was delivered",
        required: true,
      }),
      totalRecipients: t.int({
        description: "Total number of recipients",
        required: true,
      }),
      successCount: t.int({
        description: "Number of successful deliveries",
        required: true,
      }),
      failureCount: t.int({
        description: "Number of failed deliveries",
        required: true,
      }),
      errors: t.string({
        description: "Error details if any failures occurred",
        required: false,
      }),
    }),
  },
);

/**
 * Input for tracking delivery failure
 */
export const TrackDeliveryFailureInput = builder.inputType(
  "TrackDeliveryFailureInput",
  {
    description: "Input for tracking delivery failure",
    fields: (t) => ({
      notificationId: t.id({
        description: "ID of the notification that failed",
        required: true,
      }),
      error: t.string({
        description: "Error message describing the failure",
        required: true,
      }),
    }),
  },
);

// =============================================================================
// TypeScript Type Definitions (for resolver use)
// =============================================================================

export interface SendMobileNotificationsResult {
  success: boolean;
  sent: number;
  failed: number;
  total: number;
}

export interface TrackDeliveryResult {
  success: boolean;
}

export interface CheckInactiveUsersResult {
  checked: number;
  notified: number;
  skipped: number;
  errors: number;
}

// =============================================================================
// Export
// =============================================================================

export default {
  SendMobileNotificationsPayloadType,
  TrackDeliveryStartPayloadType,
  TrackDeliveryCompletePayloadType,
  TrackDeliveryFailurePayloadType,
  CheckInactiveUsersPayloadType,
};
