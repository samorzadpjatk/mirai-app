import { builder } from "../../builder.js";

/**
 * NotificationPriority
 *
 * Priority levels for notifications.
 */
export const NotificationPriorityEnum = builder.enumType(
  "NotificationPriority",
  {
    description: "Priority levels for notifications",
    values: {
      LOW: { value: "LOW" },
      NORMAL: { value: "NORMAL" },
      HIGH: { value: "HIGH" },
      URGENT: { value: "URGENT" },
    },
  },
);

/**
 * NotificationStatus
 *
 * Status workflow for notifications:
 * DRAFT -> READY -> SENT
 *            -> FAILED
 *            -> CANCELLED
 */
export const NotificationStatusEnum = builder.enumType("NotificationStatus", {
  description: "Status workflow for notifications",
  values: {
    DRAFT: { value: "DRAFT" },
    READY: { value: "READY" },
    SENT: { value: "SENT" },
    CANCELLED: { value: "CANCELLED" },
    FAILED: { value: "FAILED" },
  },
});

/**
 * NotificationScheduleType
 *
 * Types of notification schedules.
 */
export const NotificationScheduleTypeEnum = builder.enumType(
  "NotificationScheduleType",
  {
    description: "Types of notification schedules",
    values: {
      ONE_TIME: { value: "ONE_TIME" },
      RECURRING: { value: "RECURRING" },
    },
  },
);

/**
 * LastRunStatus
 *
 * Status of the last schedule execution.
 */
export const LastRunStatusEnum = builder.enumType("LastRunStatus", {
  description: "Status of the last schedule execution",
  values: {
    SUCCESS: { value: "SUCCESS" },
    PARTIAL_FAILURE: { value: "PARTIAL_FAILURE" },
    FAILURE: { value: "FAILURE" },
    SKIPPED: { value: "SKIPPED" },
  },
});

/**
 * DeliveryStatus
 *
 * Status of a notification delivery.
 */
export const DeliveryStatusEnum = builder.enumType("DeliveryStatus", {
  description: "Status of a notification delivery",
  values: {
    PENDING: { value: "PENDING" },
    SENT: { value: "SENT" },
    FAILED: { value: "FAILED" },
    RETRYING: { value: "RETRYING" },
  },
});
