import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type { EventDTO } from "@mirai-app/use-cases";

/**
 * Event Type
 *
 * GraphQL type definition for events.
 */
const EventType = builder.objectType("Event", {
  description: "An event in the system",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    groupId: t.exposeID("groupId", { nullable: true }),
    title: t.exposeString("title"),
    description: t.exposeString("description", { nullable: true }),
    location: t.exposeString("location", { nullable: true }),
    startTime: t.field({
      type: "DateTime",
      resolve: (event: EventDTO) => event.startTime,
    }),
    endTime: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (event: EventDTO) => event.endTime,
    }),
    type: t.exposeString("type"),
    status: t.exposeString("status"),
    maxParticipants: t.field({
      type: "Int",
      nullable: true,
      resolve: (event: EventDTO) => event.maxParticipants,
    }),
    createdById: t.exposeID("createdById"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (event: EventDTO) => event.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (event: EventDTO) => event.updatedAt,
    }),
  }),
});

/**
 * Event Edge Type
 */
const EventEdgeType = builder.objectType("EventEdge", {
  description: "An edge in an event connection",
  fields: (t) => ({
    node: t.field({
      type: EventType,
      resolve: (parent: { node: EventDTO; cursor: string }) => parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * Event Connection Type
 *
 * Relay-compliant connection type for paginated events.
 */
const EventConnectionType = builder.objectType("EventConnection", {
  description: "A connection of events for Relay pagination",
  fields: (t) => ({
    edges: t.field({
      type: [EventEdgeType],
      resolve: (parent: { edges: Array<{ node: EventDTO; cursor: string }> }) =>
        parent.edges,
    }),
    nodes: t.field({
      type: [EventType],
      resolve: (parent: { nodes: EventDTO[] }) => parent.nodes,
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
});

/**
 * Helper to encode event cursor
 * Uses startTime as the primary sort field
 */
function encodeEventCursor(event: EventDTO): string {
  return encodeCursor({
    id: event.id,
    createdAt: event.startTime.toISOString(),
    startTime: event.startTime.toISOString(),
  });
}

/**
 * Helper to build event connection response
 */
function buildEventConnection(
  items: EventDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: EventDTO; cursor: string }>;
  nodes: EventDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeEventCursor(item),
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
  EventType,
  EventEdgeType,
  EventConnectionType,
  encodeEventCursor,
  buildEventConnection,
};
