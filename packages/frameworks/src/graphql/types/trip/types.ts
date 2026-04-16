import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type { TripDTO, TripParticipantDTO } from "@mirai-app/use-cases";

/**
 * TripStatus Enum
 *
 * Represents the various states a trip can be in throughout its lifecycle.
 */
const TripStatusType = builder.enumType("TripStatus", {
  description: "The status of a trip",
  values: {
    PLANNING: { value: "PLANNING" },
    ACTIVE: { value: "ACTIVE" },
    COMPLETED: { value: "COMPLETED" },
    CANCELLED: { value: "CANCELLED" },
  },
});

/**
 * TripParticipantRole Enum
 *
 * Represents the role of a participant in a trip.
 */
const TripParticipantRoleType = builder.enumType("TripParticipantRole", {
  description: "The role of a trip participant",
  values: {
    MEMBER: { value: "MEMBER" },
    LEADER: { value: "LEADER" },
  },
});

/**
 * Trip Type
 *
 * GraphQL type definition for trips.
 */
const TripType = builder.objectType("Trip", {
  description: "A trip in the system",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    destination: t.exposeString("destination"),
    startDate: t.field({
      type: "DateTime",
      resolve: (trip: TripDTO) => trip.startDate,
    }),
    endDate: t.field({
      type: "DateTime",
      resolve: (trip: TripDTO) => trip.endDate,
    }),
    status: t.field({
      type: TripStatusType,
      resolve: (trip: TripDTO) => trip.status,
    }),
    imageUrl: t.exposeString("imageUrl", { nullable: true }),
    basePrice: t.field({
      type: "Int",
      nullable: true,
      resolve: (trip: TripDTO) => trip.basePrice,
    }),
    totalSpots: t.field({
      type: "Int",
      nullable: true,
      resolve: (trip: TripDTO) => trip.totalSpots,
    }),
    availableSpots: t.field({
      type: "Int",
      nullable: true,
      resolve: (trip: TripDTO) => trip.availableSpots,
    }),
    registrationDeadline: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (trip: TripDTO) => trip.registrationDeadline,
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (trip: TripDTO) => trip.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (trip: TripDTO) => trip.updatedAt,
    }),
  }),
});

/**
 * Trip Edge Type
 */
const TripEdgeType = builder.objectType("TripEdge", {
  description: "An edge in a trip connection",
  fields: (t) => ({
    node: t.field({
      type: TripType,
      resolve: (parent: { node: TripDTO; cursor: string }) => parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * Trip Connection Type
 *
 * Relay-compliant connection type for paginated trips.
 */
const TripConnectionType = builder.objectType("TripConnection", {
  description: "A connection of trips for Relay pagination",
  fields: (t) => ({
    edges: t.field({
      type: [TripEdgeType],
      resolve: (parent: { edges: Array<{ node: TripDTO; cursor: string }> }) =>
        parent.edges,
    }),
    nodes: t.field({
      type: [TripType],
      resolve: (parent: { nodes: TripDTO[] }) => parent.nodes,
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
      resolve: () => undefined,
    }),
  }),
});

/**
 * TripParticipant Type
 *
 * GraphQL type definition for trip participants.
 */
const TripParticipantType = builder.objectType("TripParticipant", {
  description: "A participant of a trip",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    userId: t.exposeID("userId"),
    groupId: t.exposeID("groupId", { nullable: true }),
    role: t.field({
      type: TripParticipantRoleType,
      resolve: (participant: TripParticipantDTO) => participant.role,
    }),
    status: t.exposeString("status"),
    joinedAt: t.field({
      type: "DateTime",
      resolve: (participant: TripParticipantDTO) => participant.joinedAt,
    }),
    leftAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (participant: TripParticipantDTO) => participant.leftAt,
    }),
    invitedById: t.exposeID("invitedById", { nullable: true }),
  }),
});

/**
 * TripParticipant Edge Type
 */
const TripParticipantEdgeType = builder.objectType("TripParticipantEdge", {
  description: "An edge in a trip participant connection",
  fields: (t) => ({
    node: t.field({
      type: TripParticipantType,
      resolve: (parent: { node: TripParticipantDTO; cursor: string }) =>
        parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * TripParticipant Connection Type
 *
 * Relay-compliant connection type for paginated trip participants.
 */
const TripParticipantConnectionType = builder.objectType(
  "TripParticipantConnection",
  {
    description: "A connection of trip participants for Relay pagination",
    fields: (t) => ({
      edges: t.field({
        type: [TripParticipantEdgeType],
        resolve: (parent: {
          edges: Array<{ node: TripParticipantDTO; cursor: string }>;
        }) => parent.edges,
      }),
      nodes: t.field({
        type: [TripParticipantType],
        resolve: (parent: { nodes: TripParticipantDTO[] }) => parent.nodes,
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
        resolve: () => undefined,
      }),
    }),
  },
);

/**
 * Helper to encode trip cursor
 */
function encodeTripCursor(trip: TripDTO): string {
  return encodeCursor({
    id: trip.id,
    createdAt: trip.createdAt.toISOString(),
  });
}

/**
 * Helper to encode trip participant cursor
 */
function encodeTripParticipantCursor(participant: TripParticipantDTO): string {
  return encodeCursor({
    id: participant.id,
    createdAt: participant.joinedAt.toISOString(),
  });
}

/**
 * Helper to build trip connection response
 */
function buildTripConnection(
  items: TripDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: TripDTO; cursor: string }>;
  nodes: TripDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeTripCursor(item),
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
 * Helper to build trip participant connection response
 */
function buildTripParticipantConnection(
  items: TripParticipantDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: TripParticipantDTO; cursor: string }>;
  nodes: TripParticipantDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeTripParticipantCursor(item),
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
  TripType,
  TripEdgeType,
  TripConnectionType,
  TripParticipantType,
  TripParticipantEdgeType,
  TripParticipantConnectionType,
  TripStatusType,
  TripParticipantRoleType,
  encodeTripCursor,
  encodeTripParticipantCursor,
  buildTripConnection,
  buildTripParticipantConnection,
};
