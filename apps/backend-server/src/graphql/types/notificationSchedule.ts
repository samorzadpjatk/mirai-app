/**
 * NotificationSchedule GraphQL Type
 *
 * Pothos type definition for the NotificationSchedule domain entity.
 * Maps from NotificationScheduleOutput DTO to GraphQL schema type.
 *
 * ## Fields
 *
 * - id: Unique schedule ID (UUID)
 * - name: Schedule name
 * - tripId: Associated trip ID (nullable)
 * - notificationType: Type of notification (CHALLENGE, INFO, REMINDER, ANNOUNCEMENT, DAILY_RANKING)
 * - notificationTitle: Notification title (nullable)
 * - notificationBody: Notification body content (nullable)
 * - notificationUrl: Optional URL for the notification (nullable)
 * - startDate: When the schedule starts
 * - endDate: When the schedule ends
 * - hour: Scheduled hour (0-23)
 * - minute: Scheduled minute (0-59)
 * - isActive: Whether the schedule is currently active
 * - createdById: ID of the user who created the schedule
 * - lastRun: Last execution timestamp (nullable)
 * - createdAt: When the schedule was created
 * - updatedAt: When the schedule was last updated
 * - computed fields: isCurrentlyActive, isExpired, isUpcoming, formattedTime
 *
 * @module NotificationSchedule
 */

import { builder } from "../builder";
import type { NotificationScheduleOutput } from "@mirai-app/adapters";
import { NotificationScheduleType as NotificationScheduleTypeEnumValue } from "@mirai-app/domain";

// =============================================================================
// Enum Types
// =============================================================================

/**
 * Notification schedule type enum
 */
export const NotificationScheduleTypeEnum = builder.enumType(
  "NotificationScheduleType",
  {
    description: "Type of scheduled notification",
    values: {
      CHALLENGE: { value: "CHALLENGE" as NotificationScheduleTypeEnumValue },
      INFO: { value: "INFO" as NotificationScheduleTypeEnumValue },
      REMINDER: { value: "REMINDER" as NotificationScheduleTypeEnumValue },
      ANNOUNCEMENT: {
        value: "ANNOUNCEMENT" as NotificationScheduleTypeEnumValue,
      },
      DAILY_RANKING: {
        value: "DAILY_RANKING" as NotificationScheduleTypeEnumValue,
      },
    },
  },
);

/**
 * Last run status enum for execution history
 */
export const LastRunStatusEnum = builder.enumType("LastRunStatus", {
  description: "Status of the last schedule execution",
  values: {
    SUCCESS: { value: "SUCCESS" },
    FAILURE: { value: "FAILURE" },
    PARTIAL: { value: "PARTIAL" },
  },
});

// =============================================================================
// NotificationSchedule Object Type
// =============================================================================

/**
 * NotificationSchedule type for GraphQL schema
 *
 * Derived from NotificationScheduleOutput DTO to maintain type safety
 * between domain layer and API layer.
 */
const NotificationScheduleObjectType = builder.objectType(
  "NotificationSchedule",
  {
    description: "A scheduled notification campaign",
    authScopes: {
      public: true, // Schedule info is publicly viewable
    },
    fields: (t) => ({
      // -------------------------------------------------------------------------
      // Identity Fields
      // -------------------------------------------------------------------------

      id: t.exposeID("id", {
        description: "Unique identifier for the schedule (UUID)",
        nullable: false,
      }),

      name: t.exposeString("name", {
        description: "Schedule name/campaign name",
        nullable: false,
      }),

      tripId: t.exposeID("tripId", {
        description:
          "ID of the trip this schedule is associated with (optional)",
        nullable: true,
      }),

      // -------------------------------------------------------------------------
      // Notification Content Fields
      // -------------------------------------------------------------------------

      notificationType: t.field({
        type: NotificationScheduleTypeEnum,
        description: "Type of notification to send",
        nullable: false,
        resolve: (schedule) =>
          (schedule as NotificationScheduleOutput)
            .notificationType as NotificationScheduleTypeEnumValue,
      }),

      notificationTitle: t.exposeString("notificationTitle", {
        description: "Notification title (optional for INFO type)",
        nullable: true,
      }),

      notificationBody: t.exposeString("notificationBody", {
        description: "Notification body content (optional for INFO type)",
        nullable: true,
      }),

      notificationUrl: t.exposeString("notificationUrl", {
        description: "Optional URL to include in the notification",
        nullable: true,
      }),

      // -------------------------------------------------------------------------
      // Schedule Time Fields
      // -------------------------------------------------------------------------

      startDate: t.field({
        type: "DateTime",
        description: "When the schedule becomes active",
        nullable: false,
        resolve: (schedule) =>
          (schedule as NotificationScheduleOutput).startDate,
      }),

      endDate: t.field({
        type: "DateTime",
        description: "When the schedule expires",
        nullable: false,
        resolve: (schedule) => (schedule as NotificationScheduleOutput).endDate,
      }),

      hour: t.exposeInt("hour", {
        description: "Scheduled hour (0-23)",
        nullable: false,
      }),

      minute: t.exposeInt("minute", {
        description: "Scheduled minute (0-59)",
        nullable: false,
      }),

      // -------------------------------------------------------------------------
      // Status Fields
      // -------------------------------------------------------------------------

      isActive: t.exposeBoolean("isActive", {
        description: "Whether the schedule is enabled",
        nullable: false,
      }),

      createdById: t.exposeID("createdById", {
        description: "ID of the user who created this schedule",
        nullable: false,
      }),

      lastRun: t.field({
        type: "DateTime",
        description: "When the schedule last ran (null if never run)",
        nullable: true,
        resolve: (schedule) => (schedule as NotificationScheduleOutput).lastRun,
      }),

      // -------------------------------------------------------------------------
      // Timestamp Fields
      // -------------------------------------------------------------------------

      createdAt: t.field({
        type: "DateTime",
        description: "When the schedule was created",
        nullable: false,
        resolve: (schedule) =>
          (schedule as NotificationScheduleOutput).createdAt,
      }),

      updatedAt: t.field({
        type: "DateTime",
        description: "When the schedule was last updated",
        nullable: false,
        resolve: (schedule) =>
          (schedule as NotificationScheduleOutput).updatedAt,
      }),

      // -------------------------------------------------------------------------
      // Computed Fields
      // -------------------------------------------------------------------------

      isCurrentlyActive: t.boolean({
        description:
          "Whether the schedule is currently within its active time window",
        nullable: false,
        resolve: (schedule) =>
          (schedule as NotificationScheduleOutput).isCurrentlyActive,
      }),

      isExpired: t.boolean({
        description: "Whether the schedule has passed its end date",
        nullable: false,
        resolve: (schedule) =>
          (schedule as NotificationScheduleOutput).isExpired,
      }),

      isUpcoming: t.boolean({
        description: "Whether the schedule has not yet reached its start date",
        nullable: false,
        resolve: (schedule) =>
          (schedule as NotificationScheduleOutput).isUpcoming,
      }),

      formattedTime: t.string({
        description: "Formatted time string (HH:MM)",
        nullable: false,
        resolve: (schedule) =>
          (schedule as NotificationScheduleOutput).formattedTime,
      }),
    }),
  },
);

// =============================================================================
// Simplified NotificationSchedule Type (for list views)
// =============================================================================

/**
 * Simplified notification schedule type for list views
 * Used when returning lists of schedules with fewer fields
 */
export const NotificationScheduleSummaryType = builder.objectType(
  "NotificationScheduleSummary",
  {
    description:
      "A simplified view of a notification schedule for list displays",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Unique identifier for the schedule",
        nullable: false,
      }),

      name: t.exposeString("name", {
        description: "Schedule name",
        nullable: false,
      }),

      tripId: t.exposeID("tripId", {
        description: "Associated trip ID",
        nullable: true,
      }),

      notificationType: t.field({
        type: NotificationScheduleTypeEnum,
        description: "Type of notification",
        nullable: false,
        resolve: (schedule) =>
          (schedule as { notificationType: string })
            .notificationType as NotificationScheduleTypeEnumValue,
      }),

      isActive: t.exposeBoolean("isActive", {
        description: "Whether the schedule is enabled",
        nullable: false,
      }),

      startDate: t.field({
        type: "DateTime",
        description: "Schedule start date",
        nullable: false,
        resolve: (schedule) => (schedule as { startDate: Date }).startDate,
      }),

      endDate: t.field({
        type: "DateTime",
        description: "Schedule end date",
        nullable: false,
        resolve: (schedule) => (schedule as { endDate: Date }).endDate,
      }),

      hour: t.exposeInt("hour", {
        description: "Scheduled hour",
        nullable: false,
      }),

      minute: t.exposeInt("minute", {
        description: "Scheduled minute",
        nullable: false,
      }),
    }),
  },
);

// =============================================================================
// Pagination Types
// =============================================================================

/**
 * Pagination info for schedule lists
 */
export const NotificationSchedulePaginationType = builder.objectType(
  "NotificationSchedulePagination",
  {
    description: "Pagination metadata for notification schedule lists",
    fields: (t) => ({
      total: t.exposeInt("total", {
        description: "Total number of schedules available",
        nullable: false,
      }),
      limit: t.exposeInt("limit", {
        description: "Number of items per page",
        nullable: false,
      }),
      offset: t.exposeInt("offset", {
        description: "Number of items skipped",
        nullable: false,
      }),
      hasMore: t.exposeBoolean("hasMore", {
        description: "Whether more items are available",
        nullable: false,
      }),
    }),
  },
);

/**
 * Paginated schedule list result
 */
export const NotificationSchedulesConnectionType = builder.objectType(
  "NotificationSchedulesConnection",
  {
    description: "A paginated list of notification schedules with metadata",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      schedules: t.field({
        type: [NotificationScheduleSummaryType],
        description: "The schedules in this page",
        nullable: false,
        resolve: (conn) => (conn as { schedules: unknown[] }).schedules,
      }),
      pagination: t.field({
        type: NotificationSchedulePaginationType,
        description: "Pagination metadata",
        nullable: false,
        resolve: (conn) => (conn as { pagination: unknown }).pagination,
      }),
    }),
  },
);

// =============================================================================
// Execution History Types
// =============================================================================

/**
 * Notification info within execution history
 */
export const ExecutionHistoryNotificationType = builder.objectType(
  "ExecutionHistoryNotification",
  {
    description: "Notification details in execution history",
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
      createdAt: t.field({
        type: "DateTime",
        description: "When the notification was created",
        nullable: false,
        resolve: (n) => (n as { createdAt: Date }).createdAt,
      }),
    }),
  },
);

/**
 * Single execution history entry
 */
export const ExecutionHistoryEntryType = builder.objectType(
  "ExecutionHistoryEntry",
  {
    description: "A single execution history record",
    fields: (t) => ({
      id: t.exposeID("id", {
        description: "Execution record ID",
        nullable: false,
      }),
      executedAt: t.field({
        type: "DateTime",
        description: "When the execution occurred",
        nullable: false,
        resolve: (entry) => (entry as { executedAt: Date }).executedAt,
      }),
      notification: t.field({
        type: ExecutionHistoryNotificationType,
        description: "The notification that was sent (null if failed)",
        nullable: true,
        resolve: (entry) =>
          (entry as { notification: unknown | null }).notification,
      }),
    }),
  },
);

/**
 * Execution history result
 */
export const ExecutionHistoryResultType = builder.objectType(
  "ExecutionHistoryResult",
  {
    description: "Result of querying execution history",
    fields: (t) => ({
      executions: t.field({
        type: [ExecutionHistoryEntryType],
        description: "List of execution history entries",
        nullable: false,
        resolve: (result) => (result as { executions: unknown[] }).executions,
      }),
    }),
  },
);

// =============================================================================
// Mutation Output Types
// =============================================================================

/**
 * Output type for create schedule mutation
 */
export const CreateNotificationSchedulePayloadType = builder.objectType(
  "CreateNotificationSchedulePayload",
  {
    description: "Result of creating a new notification schedule",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      schedule: t.field({
        type: "NotificationSchedule",
        description: "The newly created schedule",
        nullable: false,
        resolve: (payload) =>
          (payload as { schedule: NotificationScheduleOutput }).schedule,
      }),
    }),
  },
);

/**
 * Output type for update schedule mutation
 */
export const UpdateNotificationSchedulePayloadType = builder.objectType(
  "UpdateNotificationSchedulePayload",
  {
    description: "Result of updating a notification schedule",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      schedule: t.field({
        type: "NotificationSchedule",
        description: "The updated schedule",
        nullable: false,
        resolve: (payload) =>
          (payload as { schedule: NotificationScheduleOutput }).schedule,
      }),
    }),
  },
);

/**
 * Output type for toggle active mutation
 */
export const ToggleScheduleActivePayloadType = builder.objectType(
  "ToggleScheduleActivePayload",
  {
    description: "Result of toggling schedule active status",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      schedule: t.field({
        type: "NotificationSchedule",
        description: "The schedule with toggled status",
        nullable: false,
        resolve: (payload) =>
          (payload as { schedule: NotificationScheduleOutput }).schedule,
      }),
    }),
  },
);

/**
 * Output type for duplicate schedule mutation
 */
export const DuplicateNotificationSchedulePayloadType = builder.objectType(
  "DuplicateNotificationSchedulePayload",
  {
    description: "Result of duplicating a notification schedule",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      schedule: t.field({
        type: "NotificationSchedule",
        description: "The duplicated schedule",
        nullable: false,
        resolve: (payload) =>
          (payload as { schedule: NotificationScheduleOutput }).schedule,
      }),
    }),
  },
);

/**
 * Output type for delete schedule mutation
 */
export const DeleteNotificationSchedulePayloadType = builder.objectType(
  "DeleteNotificationSchedulePayload",
  {
    description: "Result of deleting a notification schedule",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      success: t.boolean({
        description: "Whether the deletion was successful",
        nullable: false,
        resolve: (payload) => (payload as { success: boolean }).success,
      }),
      message: t.string({
        description: "Status message",
        nullable: false,
        resolve: (payload) => (payload as { message: string }).message,
      }),
      deletedExecutionCount: t.int({
        description: "Number of execution history records deleted",
        nullable: true,
        resolve: (payload) =>
          (payload as { deletedExecutionCount?: number }).deletedExecutionCount,
      }),
    }),
  },
);

/**
 * Output type for bulk delete mutation
 */
export const BulkDeleteNotificationSchedulesPayloadType = builder.objectType(
  "BulkDeleteNotificationSchedulesPayload",
  {
    description: "Result of bulk deleting notification schedules",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      success: t.boolean({
        description: "Whether the operation was successful",
        nullable: false,
        resolve: (payload) => (payload as { success: boolean }).success,
      }),
      deletedCount: t.int({
        description: "Number of schedules deleted",
        nullable: false,
        resolve: (payload) =>
          (payload as { deletedCount: number }).deletedCount,
      }),
      requestedCount: t.int({
        description: "Number of schedules requested for deletion",
        nullable: false,
        resolve: (payload) =>
          (payload as { requestedCount: number }).requestedCount,
      }),
      notFoundIds: t.stringList({
        description: "IDs that were not found",
        nullable: true,
        resolve: (payload) =>
          (payload as { notFoundIds?: string[] }).notFoundIds ?? null,
      }),
    }),
  },
);

/**
 * Output type for bulk toggle active mutation
 */
export const BulkToggleActivePayloadType = builder.objectType(
  "BulkToggleActivePayload",
  {
    description: "Result of bulk toggling schedule active status",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      success: t.boolean({
        description: "Whether the operation was successful",
        nullable: false,
        resolve: (payload) => (payload as { success: boolean }).success,
      }),
      updatedCount: t.int({
        description: "Number of schedules updated",
        nullable: false,
        resolve: (payload) =>
          (payload as { updatedCount: number }).updatedCount,
      }),
    }),
  },
);

/**
 * Output type for update last run mutation
 */
export const UpdateLastRunPayloadType = builder.objectType(
  "UpdateLastRunPayload",
  {
    description: "Result of updating the last run timestamp",
    authScopes: {
      public: true,
    },
    fields: (t) => ({
      schedule: t.field({
        type: "NotificationSchedule",
        description: "The schedule with updated last run timestamp",
        nullable: false,
        resolve: (payload) =>
          (payload as { schedule: NotificationScheduleOutput }).schedule,
      }),
    }),
  },
);

// =============================================================================
// Input Types
// =============================================================================

/**
 * Input for pagination
 */
export const NotificationSchedulePaginationInput = builder.inputType("NotificationSchedulePaginationInput", {
  description: "Pagination parameters for list queries",
  fields: (t) => ({
    limit: t.int({
      description: "Maximum number of items to return (1-100)",
      required: false,
      defaultValue: 30,
    }),
    offset: t.int({
      description: "Number of items to skip",
      required: false,
      defaultValue: 0,
    }),
  }),
});

/**
 * Input for filtering notification schedules
 */
export const NotificationScheduleFilterInput = builder.inputType(
  "NotificationScheduleFilterInput",
  {
    description: "Filter options for notification schedule queries",
    fields: (t) => ({
      tripId: t.id({
        description: "Filter by associated trip ID",
        required: false,
      }),
      notificationType: t.field({
        type: NotificationScheduleTypeEnum,
        description: "Filter by notification type",
        required: false,
      }),
      isActive: t.boolean({
        description: "Filter by active status",
        required: false,
      }),
      startDateFrom: t.field({
        type: "DateTime",
        description: "Filter by start date (from)",
        required: false,
      }),
      startDateTo: t.field({
        type: "DateTime",
        description: "Filter by start date (to)",
        required: false,
      }),
      search: t.string({
        description: "Search by name",
        required: false,
      }),
    }),
  },
);

/**
 * Input for creating a notification schedule
 */
export const CreateNotificationScheduleInput = builder.inputType(
  "CreateNotificationScheduleInput",
  {
    description: "Input for creating a new notification schedule",
    fields: (t) => ({
      name: t.string({
        description: "Schedule name (1-100 characters)",
        required: true,
      }),
      tripId: t.id({
        description: "Associated trip ID (optional)",
        required: false,
      }),
      notificationType: t.field({
        type: NotificationScheduleTypeEnum,
        description: "Type of notification",
        required: true,
      }),
      notificationTitle: t.string({
        description:
          "Notification title (optional for INFO type, max 200 chars)",
        required: false,
      }),
      notificationBody: t.string({
        description:
          "Notification body (optional for INFO type, max 2000 chars)",
        required: false,
      }),
      notificationUrl: t.string({
        description: "Optional URL for the notification (max 500 chars)",
        required: false,
      }),
      startDate: t.field({
        type: "DateTime",
        description: "When the schedule starts",
        required: true,
      }),
      endDate: t.field({
        type: "DateTime",
        description: "When the schedule ends",
        required: true,
      }),
      hour: t.int({
        description: "Scheduled hour (0-23)",
        required: true,
      }),
      minute: t.int({
        description: "Scheduled minute (0-59)",
        required: true,
      }),
      isActive: t.boolean({
        description: "Whether the schedule is initially active",
        required: false,
      }),
    }),
  },
);

/**
 * Input for updating a notification schedule
 */
export const UpdateNotificationScheduleInput = builder.inputType(
  "UpdateNotificationScheduleInput",
  {
    description: "Input for updating an existing notification schedule",
    fields: (t) => ({
      id: t.id({
        description: "ID of the schedule to update",
        required: true,
      }),
      name: t.string({
        description: "New schedule name (1-100 characters)",
        required: false,
      }),
      notificationTitle: t.string({
        description: "New notification title (max 200 chars)",
        required: false,
      }),
      notificationBody: t.string({
        description: "New notification body (max 2000 chars)",
        required: false,
      }),
      notificationUrl: t.string({
        description: "New notification URL (max 500 chars)",
        required: false,
      }),
      startDate: t.field({
        type: "DateTime",
        description: "New start date",
        required: false,
      }),
      endDate: t.field({
        type: "DateTime",
        description: "New end date",
        required: false,
      }),
      hour: t.int({
        description: "New scheduled hour (0-23)",
        required: false,
      }),
      minute: t.int({
        description: "New scheduled minute (0-59)",
        required: false,
      }),
      isActive: t.boolean({
        description: "New active status",
        required: false,
      }),
    }),
  },
);

/**
 * Input for updating last run
 */
export const UpdateLastRunInput = builder.inputType("UpdateLastRunInput", {
  description: "Input for updating the last run timestamp",
  fields: (t) => ({
    id: t.id({
      description: "ID of the schedule",
      required: true,
    }),
    lastRunAt: t.field({
      type: "DateTime",
      description: "When the schedule last ran",
      required: true,
    }),
    lastRunStatus: t.field({
      type: LastRunStatusEnum,
      description: "Status of the last run",
      required: true,
    }),
    lastRunError: t.string({
      description: "Error message if the run failed",
      required: false,
    }),
  }),
});

// =============================================================================
// Export
// =============================================================================

export default NotificationScheduleObjectType;
