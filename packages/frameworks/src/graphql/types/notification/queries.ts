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
import type { NotificationDTO } from "@mirai-app/use-cases";

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
}));
