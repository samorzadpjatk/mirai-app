import { builder } from "../builder";
import {
  decodeCursorWithDate,
  buildConnectionResponse,
  clampFirst,
  type CursorDataWithDate,
} from "../utils/connections";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type { NotificationDTO } from "@mirai-app/use-cases";

/**
 * Notification Type
 *
 * GraphQL type definition for notifications.
 */
const NotificationType = builder.objectType("Notification", {
  description: "A notification in the system",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId", { nullable: true }),
    title: t.exposeString("title"),
    content: t.exposeString("content"),
    type: t.exposeString("type"),
    status: t.exposeString("status"),
    priority: t.exposeString("priority"),
    scheduledAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (notification: NotificationDTO) => notification.scheduledAt,
    }),
    sentAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (notification: NotificationDTO) => notification.sentAt,
    }),
    createdById: t.exposeID("createdById"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (notification: NotificationDTO) => notification.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (notification: NotificationDTO) => notification.updatedAt,
    }),
  }),
});

/**
 * Notification Edge Type
 */
const NotificationEdgeType = builder.objectType("NotificationEdge", {
  description: "An edge in a notification connection",
  fields: (t) => ({
    node: t.field({
      type: NotificationType,
      resolve: (parent: { node: NotificationDTO; cursor: string }) =>
        parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * Notification Connection Type
 *
 * Relay-compliant connection type for paginated notifications.
 */
const NotificationConnectionType = builder.objectType(
  "NotificationConnection",
  {
    description: "A connection of notifications for Relay pagination",
    fields: (t) => ({
      edges: t.field({
        type: [NotificationEdgeType],
        resolve: (parent: {
          edges: Array<{ node: NotificationDTO; cursor: string }>;
        }) => parent.edges,
      }),
      nodes: t.field({
        type: [NotificationType],
        resolve: (parent: { nodes: NotificationDTO[] }) => parent.nodes,
      }),
      pageInfo: t.field({
        type: "PageInfo",
        resolve: (parent: {
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor: string | null;
            endCursor: string | null;
          };
        }) => parent.pageInfo,
      }),
      totalCount: t.field({
        type: "Int",
        nullable: true,
        resolve: () => undefined, // Not implemented for performance
      }),
    }),
  },
);

/**
 * Helper to encode notification cursor
 */
function encodeNotificationCursor(notification: NotificationDTO): string {
  return encodeCursor({
    id: notification.id,
    createdAt: notification.createdAt.toISOString(),
  });
}

/**
 * Helper to build notification connection response
 */
function buildNotificationConnection(
  items: NotificationDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: NotificationDTO; cursor: string }>;
  nodes: NotificationDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeNotificationCursor(item),
  }));

  return {
    edges,
    nodes: items,
    pageInfo: {
      hasNextPage: hasMore,
      hasPreviousPage,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
    },
  };
}

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

/**
 * Export notification types for use in other modules
 */
export { NotificationType, NotificationConnectionType, NotificationEdgeType };
