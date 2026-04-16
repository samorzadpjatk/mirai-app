import { builder } from "../../builder.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type { NotificationScheduleDTO } from "@mirai-app/use-cases";

/**
 * NotificationSchedule Type
 *
 * GraphQL type definition for notification schedules.
 */
const NotificationScheduleType = builder.objectType("NotificationSchedule", {
  description: "A notification schedule in the system",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    notificationType: t.exposeString("notificationType"),
    notificationTitle: t.exposeString("notificationTitle", { nullable: true }),
    notificationBody: t.exposeString("notificationBody", { nullable: true }),
    tripId: t.exposeID("tripId", { nullable: true }),
    startDate: t.field({
      type: "DateTime",
      resolve: (schedule: NotificationScheduleDTO) => schedule.startDate,
    }),
    endDate: t.field({
      type: "DateTime",
      resolve: (schedule: NotificationScheduleDTO) => schedule.endDate,
    }),
    hour: t.field({
      type: "Int",
      resolve: (schedule: NotificationScheduleDTO) => schedule.hour,
    }),
    minute: t.field({
      type: "Int",
      resolve: (schedule: NotificationScheduleDTO) => schedule.minute,
    }),
    isActive: t.boolean({
      resolve: (schedule: NotificationScheduleDTO) => schedule.isActive,
    }),
    isRecurring: t.boolean({
      nullable: true,
      resolve: () => undefined, // Computed field - not in DTO yet
    }),
    recurrencePattern: t.string({
      nullable: true,
      resolve: () => undefined, // Computed field - not in DTO yet
    }),
    createdById: t.exposeID("createdById"),
    lastRun: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (schedule: NotificationScheduleDTO) => schedule.lastRun,
    }),
    nextRun: t.field({
      type: "DateTime",
      nullable: true,
      resolve: () => undefined, // Computed field - not in DTO yet
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (schedule: NotificationScheduleDTO) => schedule.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (schedule: NotificationScheduleDTO) => schedule.updatedAt,
    }),
  }),
});

/**
 * NotificationSchedule Edge Type
 */
const NotificationScheduleEdgeType = builder.objectType(
  "NotificationScheduleEdge",
  {
    description: "An edge in a notification schedule connection",
    fields: (t) => ({
      node: t.field({
        type: NotificationScheduleType,
        resolve: (parent: { node: NotificationScheduleDTO; cursor: string }) =>
          parent.node,
      }),
      cursor: t.exposeString("cursor"),
    }),
  },
);

/**
 * NotificationSchedule Connection Type
 *
 * Relay-compliant connection type for paginated notification schedules.
 */
const NotificationScheduleConnectionType = builder.objectType(
  "NotificationScheduleConnection",
  {
    description: "A connection of notification schedules for Relay pagination",
    fields: (t) => ({
      edges: t.field({
        type: [NotificationScheduleEdgeType],
        resolve: (parent: {
          edges: Array<{ node: NotificationScheduleDTO; cursor: string }>;
        }) => parent.edges,
      }),
      nodes: t.field({
        type: [NotificationScheduleType],
        resolve: (parent: { nodes: NotificationScheduleDTO[] }) => parent.nodes,
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
 * Helper to encode notification schedule cursor
 */
function encodeNotificationScheduleCursor(
  schedule: NotificationScheduleDTO,
): string {
  return encodeCursor({
    id: schedule.id,
    createdAt: schedule.createdAt.toISOString(),
  });
}

/**
 * Helper to build notification schedule connection response
 */
function buildNotificationScheduleConnection(
  items: NotificationScheduleDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: NotificationScheduleDTO; cursor: string }>;
  nodes: NotificationScheduleDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeNotificationScheduleCursor(item),
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
  NotificationScheduleType,
  NotificationScheduleEdgeType,
  NotificationScheduleConnectionType,
  encodeNotificationScheduleCursor,
  buildNotificationScheduleConnection,
};
