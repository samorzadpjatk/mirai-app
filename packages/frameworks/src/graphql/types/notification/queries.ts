import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import {
  NotificationConnectionType,
  buildNotificationConnection,
} from "./types.js";
import {
  NotificationScheduleConnectionType,
  buildNotificationScheduleConnection,
} from "./scheduleTypes.js";
import {
  NotificationDeliveryConnectionType,
  buildNotificationDeliveryConnection,
} from "./deliveryTypes.js";
import type {
  NotificationDTO,
  NotificationScheduleDTO,
  NotificationDeliveryDTO,
} from "@mirai-app/use-cases";

/**
 * Notification Queries
 */
builder.queryFields((t) => ({
  /**
   * Find notifications for a user with cursor-based pagination
   */
  notificationsByUser: t.field({
    type: NotificationConnectionType,
    args: {
      userId: t.arg.id({
        required: true,
        description: "ID of the user to fetch notifications for",
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        userId: string;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          notificationController: {
            getByUserIdConnection: (input: {
              userId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: NotificationDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.notificationController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByUserIdConnection({
        userId: args.userId,
        first,
        after: afterCursor,
      });

      return buildNotificationConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Find unread notifications for a user with cursor-based pagination
   */
  unreadNotificationsByUser: t.field({
    type: NotificationConnectionType,
    args: {
      userId: t.arg.id({
        required: true,
        description: "ID of the user to fetch unread notifications for",
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        userId: string;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          notificationController: {
            getUnreadByUserIdConnection: (input: {
              userId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: NotificationDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.notificationController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getUnreadByUserIdConnection({
        userId: args.userId,
        first,
        after: afterCursor,
      });

      return buildNotificationConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Get notifications for the current authenticated user
   */
  myNotifications: t.field({
    type: NotificationConnectionType,
    args: {
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        authContext?: { userId: string };
        controllers: {
          notificationController: {
            getByUserIdConnection: (input: {
              userId: string;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: NotificationDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      if (!ctx.authContext) {
        throw new Error("Authentication required");
      }
      const controller = ctx.controllers.notificationController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByUserIdConnection({
        userId: ctx.authContext.userId,
        first,
        after: afterCursor,
      });

      return buildNotificationConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Get all notifications (admin only)
   */
  allNotifications: t.field({
    type: NotificationConnectionType,
    args: {
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          notificationController: {
            getAllConnection: (input: {
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: NotificationDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.notificationController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getAllConnection({
        first,
        after: afterCursor,
      });

      return buildNotificationConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Get notification schedules with cursor-based pagination
   */
  notificationSchedules: t.field({
    type: NotificationScheduleConnectionType,
    args: {
      tripId: t.arg.id({
        description: "Filter by trip ID",
        required: false,
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        tripId?: string | null;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          notificationScheduleController: {
            getAllConnection: (input: {
              tripId?: string | null;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: NotificationScheduleDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.notificationScheduleController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getAllConnection({
        tripId: args.tripId ?? null,
        first,
        after: afterCursor,
      });

      return buildNotificationScheduleConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),

  /**
   * Get a single notification schedule by ID
   */
  notificationSchedule: t.field({
    type: "NotificationSchedule",
    nullable: true,
    args: {
      id: t.arg.id({
        required: true,
        description: "ID of the notification schedule to fetch",
      }),
    },
    resolve: async (
      _parent,
      args: {
        id: string;
      },
      ctx: {
        controllers: {
          notificationScheduleController: {
            getById: (input: { id: string }) => Promise<{
              success: boolean;
              data?: NotificationScheduleDTO;
              error?: string;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.notificationScheduleController;
      const result = await controller.getById({ id: args.id });

      if (!result.success) {
        return null;
      }

      return result.data;
    },
  }),

  /**
   * Get notification deliveries with cursor-based pagination
   */
  notificationDeliveries: t.field({
    type: NotificationDeliveryConnectionType,
    args: {
      notificationId: t.arg.id({
        description: "Filter by notification ID",
        required: false,
      }),
      userId: t.arg.id({
        description: "Filter by user ID",
        required: false,
      }),
      first: t.arg.int({
        description: "Returns the first n elements from the list",
      }),
      after: t.arg.string({
        description: "Returns elements after this cursor",
      }),
    },
    resolve: async (
      _parent,
      args: {
        notificationId?: string | null;
        userId?: string | null;
        first?: number | null;
        after?: string | null;
      },
      ctx: {
        controllers: {
          notificationDeliveryController: {
            getAllConnection: (input: {
              notificationId?: string | null;
              userId?: string | null;
              first: number;
              after: CursorDataWithDate | null;
            }) => Promise<{
              items: NotificationDeliveryDTO[];
              hasMore: boolean;
            }>;
          };
        };
      },
    ) => {
      const controller = ctx.controllers.notificationDeliveryController;
      const first = clampFirst(args.first ?? null);
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getAllConnection({
        notificationId: args.notificationId ?? null,
        userId: args.userId ?? null,
        first,
        after: afterCursor,
      });

      return buildNotificationDeliveryConnection(
        result.items,
        result.hasMore,
        !!afterCursor,
      );
    },
  }),
}));
