import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type { LocationDTO, FriendLocationDTO } from "@mirai-app/use-cases";
import { UserType } from "../user/types.js";

/**
 * Location Type
 *
 * GraphQL type definition for user location sharing.
 */
const LocationType = builder.objectType("Location", {
  description: "A location record for user location sharing",
  fields: (t) => ({
    id: t.exposeID("id"),
    userId: t.exposeID("userId"),
    tripId: t.exposeID("tripId"),
    latitude: t.field({
      type: "BigInt",
      resolve: (location: LocationDTO) => location.latitude,
    }),
    longitude: t.field({
      type: "BigInt",
      resolve: (location: LocationDTO) => location.longitude,
    }),
    accuracy: t.field({
      type: "BigInt",
      nullable: true,
      resolve: (location: LocationDTO) => location.accuracy,
    }),
    altitude: t.field({
      type: "BigInt",
      nullable: true,
      resolve: (location: LocationDTO) => location.altitude,
    }),
    altitudeAccuracy: t.field({
      type: "BigInt",
      nullable: true,
      resolve: (location: LocationDTO) => location.altitudeAccuracy,
    }),
    speed: t.field({
      type: "BigInt",
      nullable: true,
      resolve: (location: LocationDTO) => location.speed,
    }),
    heading: t.field({
      type: "BigInt",
      nullable: true,
      resolve: (location: LocationDTO) => location.heading,
    }),
    timestamp: t.field({
      type: "DateTime",
      resolve: (location: LocationDTO) => location.timestamp,
    }),
    isSharingLocation: t.field({
      type: "Boolean",
      resolve: (location: LocationDTO) => location.isSharingLocation,
    }),
    batteryLevel: t.field({
      type: "Int",
      nullable: true,
      resolve: (location: LocationDTO) => location.batteryLevel,
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (location: LocationDTO) => location.createdAt,
    }),
  }),
});

/**
 * FriendLocation Type
 *
 * GraphQL type definition for friend location sharing.
 */
const FriendLocationType = builder.objectType("FriendLocation", {
  description: "A friend's location for trip location sharing",
  fields: (t) => ({
    userId: t.exposeID("userId"),
    user: t.field({
      type: UserType,
      resolve: (parent: FriendLocationDTO) => parent.user,
    }),
    latitude: t.field({
      type: "BigInt",
      resolve: (location: FriendLocationDTO) => location.latitude,
    }),
    longitude: t.field({
      type: "BigInt",
      resolve: (location: FriendLocationDTO) => location.longitude,
    }),
    accuracy: t.field({
      type: "BigInt",
      nullable: true,
      resolve: (location: FriendLocationDTO) => location.accuracy,
    }),
    lastUpdated: t.field({
      type: "DateTime",
      resolve: (location: FriendLocationDTO) => location.lastUpdated,
    }),
    isSharing: t.field({
      type: "Boolean",
      resolve: (location: FriendLocationDTO) => location.isSharing,
    }),
  }),
});

/**
 * Location Edge Type
 */
const LocationEdgeType = builder.objectType("LocationEdge", {
  description: "An edge in a location connection",
  fields: (t) => ({
    node: t.field({
      type: LocationType,
      resolve: (parent: { node: LocationDTO; cursor: string }) => parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * Location Connection Type
 *
 * Relay-compliant connection type for paginated locations.
 */
const LocationConnectionType = builder.objectType("LocationConnection", {
  description: "A connection of locations for Relay pagination",
  fields: (t) => ({
    edges: t.field({
      type: [LocationEdgeType],
      resolve: (parent: {
        edges: Array<{ node: LocationDTO; cursor: string }>;
      }) => parent.edges,
    }),
    nodes: t.field({
      type: [LocationType],
      resolve: (parent: { nodes: LocationDTO[] }) => parent.nodes,
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
 * Helper to encode location cursor
 */
function encodeLocationCursor(location: LocationDTO): string {
  return encodeCursor({
    id: location.id,
    createdAt: location.createdAt.toISOString(),
    timestamp: location.timestamp.toISOString(),
  });
}

/**
 * Helper to build location connection response
 */
function buildLocationConnection(
  items: LocationDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: LocationDTO; cursor: string }>;
  nodes: LocationDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeLocationCursor(item),
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
  LocationType,
  FriendLocationType,
  LocationEdgeType,
  LocationConnectionType,
  encodeLocationCursor,
  buildLocationConnection,
};
