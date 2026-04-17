import { GraphQLError } from "graphql";
import { builder } from "../../builder.js";
import { NotificationType } from "./types.js";
import { NotificationScheduleType } from "./scheduleTypes.js";
import {
  NotificationPriorityEnum,
  NotificationStatusEnum,
  NotificationScheduleTypeEnum,
} from "./enums.js";
import type {
  NotificationDTO,
  NotificationScheduleDTO,
} from "@mirai-app/use-cases";
import { publishNotificationCreated } from "./subscriptions.js";

/**
 * Create Notification Input
 */
const CreateNotificationInput = builder.inputType("CreateNotificationInput", {
  description: "Input for creating a notification",
  fields: (t) => ({
    title: t.field({ type: "String", required: true }),
    body: t.field({ type: "String", required: true }),
    url: t.field({ type: "String" }),
    tripId: t.field({ type: "ID" }),
    priority: t.field({
      type: NotificationPriorityEnum,
      required: true,
    }),
    scheduledFor: t.field({ type: "DateTime" }),
  }),
});

/**
 * Update Notification Input
 */
const UpdateNotificationInput = builder.inputType("UpdateNotificationInput", {
  description: "Input for updating a notification",
  fields: (t) => ({
    title: t.field({ type: "String" }),
    body: t.field({ type: "String" }),
    url: t.field({ type: "String" }),
    priority: t.field({ type: NotificationPriorityEnum }),
  }),
});

/**
 * Update Notification Status Input
 */
const UpdateNotificationStatusInput = builder.inputType(
  "UpdateNotificationStatusInput",
  {
    description: "Input for updating notification status",
    fields: (t) => ({
      newStatus: t.field({
        type: NotificationStatusEnum,
        required: true,
      }),
    }),
  },
);

/**
 * Schedule Notification Input
 */
const ScheduleNotificationInput = builder.inputType(
  "ScheduleNotificationInput",
  {
    description: "Input for scheduling a notification",
    fields: (t) => ({
      scheduledFor: t.field({
        type: "DateTime",
        required: true,
      }),
    }),
  },
);

/**
 * Create Notification Schedule Input
 */
const CreateNotificationScheduleInput = builder.inputType(
  "CreateNotificationScheduleInput",
  {
    description: "Input for creating a notification schedule",
    fields: (t) => ({
      name: t.field({ type: "String", required: true }),
      tripId: t.field({ type: "ID" }),
      notificationType: t.field({
        type: NotificationScheduleTypeEnum,
        required: true,
      }),
      notificationTitle: t.field({ type: "String" }),
      notificationBody: t.field({ type: "String" }),
      notificationUrl: t.field({ type: "String" }),
      startDate: t.field({ type: "DateTime", required: true }),
      endDate: t.field({ type: "DateTime", required: true }),
      hour: t.field({ type: "Int", required: true }),
      minute: t.field({ type: "Int", required: true }),
      isActive: t.field({ type: "Boolean", required: true }),
    }),
  },
);

/**
 * Update Notification Schedule Input
 */
const UpdateNotificationScheduleInput = builder.inputType(
  "UpdateNotificationScheduleInput",
  {
    description: "Input for updating a notification schedule",
    fields: (t) => ({
      name: t.field({ type: "String" }),
      notificationTitle: t.field({ type: "String" }),
      notificationBody: t.field({ type: "String" }),
      notificationUrl: t.field({ type: "String" }),
      startDate: t.field({ type: "DateTime" }),
      endDate: t.field({ type: "DateTime" }),
      hour: t.field({ type: "Int" }),
      minute: t.field({ type: "Int" }),
      isActive: t.field({ type: "Boolean" }),
    }),
  },
);

/**
 * GraphQL Context type for notification mutations
 */
interface NotificationMutationContext {
  controllers: {
    notificationController: {
      create: (input: unknown) => Promise<
        | {
            success: true;
            data: {
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
            };
          }
        | { success: false; error: string }
      >;
      update: (input: unknown) => Promise<
        | {
            success: true;
            data: {
              id: string;
              title: string;
              body: string;
              url: string | null;
              status: string;
              priority: string;
              tripId: string | null;
              updatedAt: Date;
            };
          }
        | { success: false; error: string }
      >;
      delete: (
        input: unknown,
      ) => Promise<
        | { success: true; data: { deleted: true; id: string } }
        | { success: false; error: string }
      >;
      updateStatus: (input: unknown) => Promise<
        | {
            success: true;
            data: {
              id: string;
              title: string;
              previousStatus: string;
              newStatus: string;
              updatedAt: Date;
            };
          }
        | { success: false; error: string }
      >;
      schedule: (input: unknown) => Promise<
        | {
            success: true;
            data: {
              id: string;
              title: string;
              body: string;
              url: string | null;
              status: string;
              priority: string;
              tripId: string | null;
              scheduledFor: Date;
              sentAt: Date | null;
              createdAt: Date;
              updatedAt: Date;
            };
          }
        | { success: false; error: string }
      >;
    };
    notificationScheduleController: {
      create: (
        input: unknown,
      ) => Promise<
        | { success: true; data: NotificationScheduleDTO }
        | { success: false; error: string }
      >;
      update: (
        input: unknown,
      ) => Promise<
        | { success: true; data: NotificationScheduleDTO }
        | { success: false; error: string }
      >;
      delete: (input: unknown) => Promise<
        | {
            success: true;
            data: {
              success: boolean;
              message: string;
              deletedExecutionCount?: number;
            };
          }
        | { success: false; error: string }
      >;
      toggleActive: (
        input: unknown,
      ) => Promise<
        | { success: true; data: NotificationScheduleDTO }
        | { success: false; error: string }
      >;
    };
    notificationDeliveryController: {
      markAsRead: (input: {
        notificationId: string;
        userId: string;
      }) => Promise<
        | { success: true; data: NotificationDTO }
        | { success: false; error: string }
      >;
      markAllAsRead: (input: {
        userId: string;
      }) => Promise<
        | { success: true; data: { markedCount: number } }
        | { success: false; error: string }
      >;
    };
  };
  authContext?: {
    userId: string;
    role: string;
  };
}

/**
 * Notification Mutations
 */
builder.mutationFields((t) => ({
  /**
   * Create a new notification
   */
  createNotification: t.field({
    type: NotificationType,
    args: {
      input: t.arg({ type: CreateNotificationInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          title: string;
          body: string;
          url?: string | null;
          tripId?: string | null;
          priority: string;
          scheduledFor?: Date | null;
        };
      },
      ctx: NotificationMutationContext,
    ) => {
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.notificationController;
      const result = await controller.create({
        title: args.input.title,
        body: args.input.body,
        url: args.input.url ?? undefined,
        tripId: args.input.tripId ?? undefined,
        priority: args.input.priority,
        createdById: ctx.authContext.userId,
        scheduledFor: args.input.scheduledFor ?? undefined,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Publish the notification created event for real-time subscriptions
      // This triggers the notification-sender service to process the notification
      publishNotificationCreated(result.data as NotificationDTO);

      return result.data;
    },
  }),

  /**
   * Update a notification
   */
  updateNotification: t.field({
    type: NotificationType,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateNotificationInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
        input: {
          title?: string | null;
          body?: string | null;
          url?: string | null;
          priority?: string | null;
        };
      },
      ctx: NotificationMutationContext,
    ) => {
      const controller = ctx.controllers.notificationController;
      const result = await controller.update({
        notificationId: args.id,
        title: args.input.title ?? undefined,
        body: args.input.body ?? undefined,
        url: args.input.url ?? undefined,
        priority: args.input.priority ?? undefined,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Delete a notification
   */
  deleteNotification: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: NotificationMutationContext,
    ) => {
      const controller = ctx.controllers.notificationController;
      const result = await controller.delete({
        id: args.id,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return true;
    },
  }),

  /**
   * Update notification status
   */
  updateNotificationStatus: t.field({
    type: NotificationType,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateNotificationStatusInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
        input: {
          newStatus: string;
        };
      },
      ctx: NotificationMutationContext,
    ) => {
      const controller = ctx.controllers.notificationController;
      const result = await controller.updateStatus({
        notificationId: args.id,
        newStatus: args.input.newStatus,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Schedule a notification
   */
  scheduleNotification: t.field({
    type: NotificationType,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: ScheduleNotificationInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
        input: {
          scheduledFor: Date;
        };
      },
      ctx: NotificationMutationContext,
    ) => {
      const controller = ctx.controllers.notificationController;
      const result = await controller.schedule({
        notificationId: args.id,
        scheduledFor: args.input.scheduledFor,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Mark a notification as read
   */
  markNotificationRead: t.field({
    type: NotificationType,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: NotificationMutationContext,
    ) => {
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.notificationDeliveryController;
      const result = await controller.markAsRead({
        notificationId: args.id,
        userId: ctx.authContext.userId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Mark all notifications as read for the current user
   */
  markAllNotificationsRead: t.field({
    type: "Boolean",
    args: {},
    resolve: async (_parent, _args: {}, ctx: NotificationMutationContext) => {
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.notificationDeliveryController;
      const result = await controller.markAllAsRead({
        userId: ctx.authContext.userId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return true;
    },
  }),

  /**
   * Create a new notification schedule
   */
  createNotificationSchedule: t.field({
    type: NotificationScheduleType,
    args: {
      input: t.arg({ type: CreateNotificationScheduleInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        input: {
          name: string;
          tripId?: string | null;
          notificationType: string;
          notificationTitle?: string | null;
          notificationBody?: string | null;
          notificationUrl?: string | null;
          startDate: Date;
          endDate: Date;
          hour: number;
          minute: number;
          isActive: boolean;
        };
      },
      ctx: NotificationMutationContext,
    ) => {
      if (!ctx.authContext?.userId) {
        throw new GraphQLError("Authentication required", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const controller = ctx.controllers.notificationScheduleController;
      const result = await controller.create({
        name: args.input.name,
        tripId: args.input.tripId ?? undefined,
        notificationType: args.input.notificationType,
        notificationTitle: args.input.notificationTitle ?? undefined,
        notificationBody: args.input.notificationBody ?? undefined,
        notificationUrl: args.input.notificationUrl ?? undefined,
        startDate: args.input.startDate,
        endDate: args.input.endDate,
        hour: args.input.hour,
        minute: args.input.minute,
        isActive: args.input.isActive,
        createdById: ctx.authContext.userId,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Update a notification schedule
   */
  updateNotificationSchedule: t.field({
    type: NotificationScheduleType,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateNotificationScheduleInput, required: true }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
        input: {
          name?: string | null;
          notificationTitle?: string | null;
          notificationBody?: string | null;
          notificationUrl?: string | null;
          startDate?: Date | null;
          endDate?: Date | null;
          hour?: number | null;
          minute?: number | null;
          isActive?: boolean | null;
        };
      },
      ctx: NotificationMutationContext,
    ) => {
      const controller = ctx.controllers.notificationScheduleController;
      const result = await controller.update({
        id: args.id,
        name: args.input.name ?? undefined,
        notificationTitle: args.input.notificationTitle ?? undefined,
        notificationBody: args.input.notificationBody ?? undefined,
        notificationUrl: args.input.notificationUrl ?? undefined,
        startDate: args.input.startDate ?? undefined,
        endDate: args.input.endDate ?? undefined,
        hour: args.input.hour ?? undefined,
        minute: args.input.minute ?? undefined,
        isActive: args.input.isActive ?? undefined,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),

  /**
   * Delete a notification schedule
   */
  deleteNotificationSchedule: t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: NotificationMutationContext,
    ) => {
      const controller = ctx.controllers.notificationScheduleController;
      const result = await controller.delete({
        id: args.id,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return true;
    },
  }),

  /**
   * Toggle notification schedule active status
   */
  toggleNotificationScheduleActive: t.field({
    type: NotificationScheduleType,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (
      _parent,
      args: { id: string },
      ctx: NotificationMutationContext,
    ) => {
      const controller = ctx.controllers.notificationScheduleController;

      const result = await controller.toggleActive({
        id: args.id,
      });

      if (!result.success) {
        throw new GraphQLError(result.error, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      return result.data;
    },
  }),
}));
