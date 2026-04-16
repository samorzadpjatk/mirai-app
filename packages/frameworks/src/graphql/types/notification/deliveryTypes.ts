import { builder } from "../../builder.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type { NotificationDeliveryDTO } from "@mirai-app/use-cases";

/**
 * NotificationDelivery Type
 *
 * GraphQL type definition for notification deliveries.
 */
const NotificationDeliveryType = builder.objectType("NotificationDelivery", {
  description: "A notification delivery record in the system",
  fields: (t) => ({
    id: t.exposeID("id"),
    notificationId: t.exposeID("notificationId"),
    userId: t.exposeID("userId"),
    status: t.exposeString("status"),
    errorMessage: t.string({
      nullable: true,
      resolve: (delivery: NotificationDeliveryDTO) => delivery.failureReason,
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (delivery: NotificationDeliveryDTO) => {
        // Use deliveredAt or sentAt as proxy for createdAt if not available
        return delivery.deliveredAt ?? delivery.sentAt ?? new Date();
      },
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (delivery: NotificationDeliveryDTO) => {
        // Use failedAt or deliveredAt as proxy for updatedAt if not available
        return (
          delivery.failedAt ??
          delivery.deliveredAt ??
          delivery.sentAt ??
          new Date()
        );
      },
    }),
    sentAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (delivery: NotificationDeliveryDTO) => delivery.sentAt,
    }),
    deliveredAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (delivery: NotificationDeliveryDTO) => delivery.deliveredAt,
    }),
    failedAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (delivery: NotificationDeliveryDTO) => delivery.failedAt,
    }),
    channel: t.exposeString("channel"),
    retryCount: t.field({
      type: "Int",
      resolve: (delivery: NotificationDeliveryDTO) => delivery.retryCount,
    }),
  }),
});

/**
 * NotificationDelivery Edge Type
 */
const NotificationDeliveryEdgeType = builder.objectType(
  "NotificationDeliveryEdge",
  {
    description: "An edge in a notification delivery connection",
    fields: (t) => ({
      node: t.field({
        type: NotificationDeliveryType,
        resolve: (parent: { node: NotificationDeliveryDTO; cursor: string }) =>
          parent.node,
      }),
      cursor: t.exposeString("cursor"),
    }),
  },
);

/**
 * NotificationDelivery Connection Type
 *
 * Relay-compliant connection type for paginated notification deliveries.
 */
const NotificationDeliveryConnectionType = builder.objectType(
  "NotificationDeliveryConnection",
  {
    description: "A connection of notification deliveries for Relay pagination",
    fields: (t) => ({
      edges: t.field({
        type: [NotificationDeliveryEdgeType],
        resolve: (parent: {
          edges: Array<{ node: NotificationDeliveryDTO; cursor: string }>;
        }) => parent.edges,
      }),
      nodes: t.field({
        type: [NotificationDeliveryType],
        resolve: (parent: { nodes: NotificationDeliveryDTO[] }) => parent.nodes,
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
 * Helper to encode notification delivery cursor
 */
function encodeNotificationDeliveryCursor(
  delivery: NotificationDeliveryDTO,
): string {
  return encodeCursor({
    id: delivery.id,
    createdAt: new Date().toISOString(), // Delivery DTO doesn't have createdAt
  });
}

/**
 * Helper to build notification delivery connection response
 */
function buildNotificationDeliveryConnection(
  items: NotificationDeliveryDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: NotificationDeliveryDTO; cursor: string }>;
  nodes: NotificationDeliveryDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeNotificationDeliveryCursor(item),
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

export {
  NotificationDeliveryType,
  NotificationDeliveryEdgeType,
  NotificationDeliveryConnectionType,
  encodeNotificationDeliveryCursor,
  buildNotificationDeliveryConnection,
};
