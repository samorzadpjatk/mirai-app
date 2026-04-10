/**
 * NotificationSchedule GraphQL Resolvers
 *
 * Resolvers for NotificationSchedule domain queries and mutations.
 * Maps use case outputs to GraphQL responses with proper error handling.
 *
 * @module NotificationSchedule/resolvers
 */

import { builder } from "../builder";
import type { NotificationScheduleOutput } from "@mirai-app/adapters";
import { NotificationScheduleController } from "@mirai-app/adapters";
import {
  requireAuth,
  requireAdmin,
  requireModerator,
} from "../utils/auth-helpers";
import { mapErrorToGraphQL } from "../utils/error-mapper";

// =============================================================================
// Query Fields
// =============================================================================

/**
 * Query: notificationSchedules - Get all schedules with filtering (moderator+)
 *
 * Requires moderator or admin role. Returns paginated schedules with filtering.
 */
builder.queryField("notificationSchedules", (t) =>
  t.field({
    description: "Get all notification schedules with filtering (moderator+)",
    type: "NotificationSchedulesConnection",
    args: {
      pagination: t.arg({
        type: "PaginationInput",
        description: "Pagination parameters",
        required: false,
      }),
      filter: t.arg({
        type: "NotificationScheduleFilterInput",
        description: "Filter options",
        required: false,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator or admin authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Fetch schedules
      const result = await controller.getAll({
        pagination: args.pagination
          ? {
              limit: args.pagination.limit ?? 30,
              offset: args.pagination.offset ?? 0,
            }
          : undefined,
        filter: args.filter
          ? {
              tripId: args.filter.tripId ?? null,
              notificationType: args.filter.notificationType ?? undefined,
              isActive: args.filter.isActive ?? undefined,
              startDateFrom: args.filter.startDateFrom ?? undefined,
              startDateTo: args.filter.startDateTo ?? undefined,
              search: args.filter.search ?? undefined,
            }
          : undefined,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return result.data;
    },
  }),
);

/**
 * Query: notificationSchedule - Get a single schedule by ID (moderator+)
 *
 * Requires moderator or admin role. Returns a single schedule or null if not found.
 */
builder.queryField("notificationSchedule", (t) =>
  t.field({
    description: "Get a notification schedule by its ID (moderator+)",
    type: "NotificationSchedule",
    nullable: true,
    args: {
      id: t.arg.id({
        description: "Schedule ID",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (
      _root,
      args,
      context,
    ): Promise<NotificationScheduleOutput | null> => {
      // Require moderator or admin authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Fetch schedule
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

/**
 * Query: activeNotificationSchedules - Get all active schedules (moderator+)
 *
 * Returns schedules that are currently within their active time window.
 */
builder.queryField("activeNotificationSchedules", (t) =>
  t.field({
    description: "Get all currently active notification schedules (moderator+)",
    type: ["NotificationSchedule"],
    args: {
      tripId: t.arg.id({
        description: "Filter by trip ID",
        required: false,
      }),
      notificationType: t.arg({
        type: "NotificationScheduleType",
        description: "Filter by notification type",
        required: false,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator or admin authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Fetch active schedules
      const result = await controller.getActive();

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      // Apply optional filters
      let schedules = result.data;

      if (args.tripId !== undefined && args.tripId !== null) {
        schedules = schedules.filter((s) => s.tripId === args.tripId);
      }

      if (
        args.notificationType !== undefined &&
        args.notificationType !== null
      ) {
        schedules = schedules.filter(
          (s) => s.notificationType === args.notificationType,
        );
      }

      return schedules;
    },
  }),
);

/**
 * Query: upcomingNotificationSchedules - Get upcoming schedules (moderator+)
 *
 * Returns schedules that are scheduled to run soon.
 */
builder.queryField("upcomingNotificationSchedules", (t) =>
  t.field({
    description: "Get upcoming notification schedules (moderator+)",
    type: ["NotificationSchedule"],
    args: {
      limit: t.arg.int({
        description: "Maximum number of schedules to return",
        required: false,
        defaultValue: 50,
      }),
      withinMinutes: t.arg.int({
        description: "How many minutes in the future to look",
        required: false,
        defaultValue: 30,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator or admin authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Fetch upcoming schedules
      const result = await controller.getUpcoming({
        days: Math.ceil((args.withinMinutes ?? 30) / (24 * 60)),
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      // Apply limit
      return result.data.slice(0, args.limit ?? 50);
    },
  }),
);

/**
 * Query: notificationScheduleExecutionHistory - Get execution history (moderator+)
 *
 * Returns the execution history for a specific schedule.
 */
builder.queryField("notificationScheduleExecutionHistory", (t) =>
  t.field({
    description:
      "Get execution history for a notification schedule (moderator+)",
    type: "ExecutionHistoryResult",
    args: {
      scheduleId: t.arg.id({
        description: "ID of the schedule",
        required: true,
      }),
      pagination: t.arg({
        type: "PaginationInput",
        description: "Pagination parameters",
        required: false,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator or admin authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Fetch execution history
      const result = await controller.getExecutionHistory({
        scheduleId: args.scheduleId,
        limit: args.pagination?.limit ?? 30,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { executions: result.data.executions };
    },
  }),
);

// =============================================================================
// Mutation Fields
// =============================================================================

/**
 * Mutation: createNotificationSchedule - Create a new schedule (admin only)
 *
 * Requires admin role. Creates a new notification schedule.
 */
builder.mutationField("createNotificationSchedule", (t) =>
  t.field({
    description: "Create a new notification schedule (admin only)",
    type: "CreateNotificationSchedulePayload",
    args: {
      input: t.arg({
        type: "CreateNotificationScheduleInput",
        description: "Schedule creation data",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      const authContext = await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Create schedule
      const result = await controller.create({
        name: args.input.name,
        tripId: args.input.tripId ?? null,
        notificationType: args.input.notificationType,
        notificationTitle: args.input.notificationTitle ?? null,
        notificationBody: args.input.notificationBody ?? null,
        notificationUrl: args.input.notificationUrl ?? null,
        startDate: args.input.startDate,
        endDate: args.input.endDate,
        hour: args.input.hour,
        minute: args.input.minute,
        isActive: args.input.isActive ?? true,
        createdById: authContext.userId as string,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { schedule: result.data };
    },
  }),
);

/**
 * Mutation: updateNotificationSchedule - Update an existing schedule (admin only)
 *
 * Requires admin role. Updates schedule details.
 */
builder.mutationField("updateNotificationSchedule", (t) =>
  t.field({
    description: "Update an existing notification schedule (admin only)",
    type: "UpdateNotificationSchedulePayload",
    args: {
      input: t.arg({
        type: "UpdateNotificationScheduleInput",
        description: "Schedule update data",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Update schedule
      const result = await controller.update({
        id: args.input.id,
        name: args.input.name ?? undefined,
        notificationTitle: args.input.notificationTitle ?? null,
        notificationBody: args.input.notificationBody ?? null,
        notificationUrl: args.input.notificationUrl ?? null,
        startDate: args.input.startDate ?? undefined,
        endDate: args.input.endDate ?? undefined,
        hour: args.input.hour ?? undefined,
        minute: args.input.minute ?? undefined,
        isActive: args.input.isActive ?? undefined,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { schedule: result.data };
    },
  }),
);

/**
 * Mutation: toggleNotificationScheduleActive - Toggle active status (admin only)
 *
 * Requires admin role. Toggles the isActive flag of a schedule.
 */
builder.mutationField("toggleNotificationScheduleActive", (t) =>
  t.field({
    description:
      "Toggle the active status of a notification schedule (admin only)",
    type: "ToggleScheduleActivePayload",
    args: {
      id: t.arg.id({
        description: "ID of the schedule to toggle",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Toggle active status
      const result = await controller.toggleActive({ id: args.id });

      if (!result.success) {
        // Return specific error for not found
        if (result.error.toLowerCase().includes("not found")) {
          throw mapErrorToGraphQL(
            Object.assign(new Error(result.error), { name: "NotFoundError" }),
          );
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { schedule: result.data };
    },
  }),
);

/**
 * Mutation: duplicateNotificationSchedule - Duplicate a schedule (admin only)
 *
 * Requires admin role. Creates a copy of an existing schedule.
 */
builder.mutationField("duplicateNotificationSchedule", (t) =>
  t.field({
    description: "Duplicate a notification schedule (admin only)",
    type: "DuplicateNotificationSchedulePayload",
    args: {
      id: t.arg.id({
        description: "ID of the schedule to duplicate",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      const authContext = await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Duplicate schedule
      const result = await controller.duplicate({
        id: args.id,
        newCreatedById: authContext.userId as string,
      });

      if (!result.success) {
        // Return specific error for not found
        if (result.error.toLowerCase().includes("not found")) {
          throw mapErrorToGraphQL(
            Object.assign(new Error(result.error), { name: "NotFoundError" }),
          );
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { schedule: result.data.schedule };
    },
  }),
);

/**
 * Mutation: deleteNotificationSchedule - Delete a schedule (admin only)
 *
 * Requires admin role. Soft-deletes a schedule.
 */
builder.mutationField("deleteNotificationSchedule", (t) =>
  t.field({
    description: "Delete a notification schedule (admin only)",
    type: "DeleteNotificationSchedulePayload",
    args: {
      id: t.arg.id({
        description: "ID of the schedule to delete",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Delete schedule
      const result = await controller.delete({ id: args.id });

      if (!result.success) {
        // Return specific error for not found
        if (result.error.toLowerCase().includes("not found")) {
          throw mapErrorToGraphQL(
            Object.assign(new Error(result.error), { name: "NotFoundError" }),
          );
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        success: result.data.success,
        message: result.data.message,
        deletedExecutionCount: result.data.deletedExecutionCount,
      };
    },
  }),
);

/**
 * Mutation: bulkDeleteNotificationSchedules - Bulk delete schedules (admin only)
 *
 * Requires admin role. Deletes multiple schedules at once.
 */
builder.mutationField("bulkDeleteNotificationSchedules", (t) =>
  t.field({
    description: "Bulk delete notification schedules (admin only)",
    type: "BulkDeleteNotificationSchedulesPayload",
    args: {
      ids: t.arg.idList({
        description: "IDs of the schedules to delete",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Bulk delete schedules
      const result = await controller.bulkDelete({
        ids: args.ids.map((id) => id.toString()),
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        success: result.data.success,
        deletedCount: result.data.deletedCount,
        requestedCount: result.data.requestedCount,
        notFoundIds: result.data.notFoundIds,
      };
    },
  }),
);

/**
 * Mutation: bulkToggleNotificationScheduleActive - Bulk toggle active (admin only)
 *
 * Requires admin role. Toggles active status for multiple schedules.
 */
builder.mutationField("bulkToggleNotificationScheduleActive", (t) =>
  t.field({
    description:
      "Bulk toggle active status of notification schedules (admin only)",
    type: "BulkToggleActivePayload",
    args: {
      ids: t.arg.idList({
        description: "IDs of the schedules to toggle",
        required: true,
      }),
      isActive: t.arg.boolean({
        description: "Target active status (true=active, false=inactive)",
        required: true,
      }),
    },
    authScopes: {
      admin: true,
    },
    resolve: async (_root, args, context) => {
      // Require admin authentication
      await requireAdmin(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Bulk toggle active status
      const result = await controller.bulkToggleActive({
        ids: args.ids.map((id) => id.toString()),
        isActive: args.isActive,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        success: result.data.success,
        updatedCount: result.data.updatedCount,
      };
    },
  }),
);

/**
 * Mutation: updateNotificationScheduleLastRun - Update last run timestamp (moderator+)
 *
 * Requires moderator or admin role. Updates when the schedule last ran.
 */
builder.mutationField("updateNotificationScheduleLastRun", (t) =>
  t.field({
    description: "Update the last run timestamp of a schedule (moderator+)",
    type: "UpdateLastRunPayload",
    args: {
      input: t.arg({
        type: "UpdateLastRunInput",
        description: "Last run update data",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      // Require moderator or admin authentication
      await requireModerator(context);

      // Get controller from DI container
      const controller =
        context.container.resolve<NotificationScheduleController>(
          "notificationScheduleController",
        );

      // Update last run
      const result = await controller.updateLastRun({
        id: args.input.id,
        lastRun: args.input.lastRunAt,
      });

      if (!result.success) {
        // Return specific error for not found
        if (result.error.toLowerCase().includes("not found")) {
          throw mapErrorToGraphQL(
            Object.assign(new Error(result.error), { name: "NotFoundError" }),
          );
        }
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return { schedule: result.data };
    },
  }),
);

// =============================================================================
// Export
// =============================================================================

// Resolvers are registered automatically by importing this file
export {};
