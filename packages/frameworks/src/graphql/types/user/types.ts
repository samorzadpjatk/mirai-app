import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type { UserDTO } from "@mirai-app/use-cases";

/**
 * User Type
 *
 * GraphQL type definition for users.
 */
const UserType = builder.objectType("User", {
  description: "A user in the system",
  fields: (t) => ({
    id: t.exposeID("id"),
    authUserId: t.exposeID("authUserId"),
    firstName: t.exposeString("firstName", { nullable: true }),
    lastName: t.exposeString("lastName", { nullable: true }),
    nickname: t.exposeString("nickname", { nullable: true }),
    email: t.exposeString("email", { nullable: true }),
    phone: t.exposeString("phone", { nullable: true }),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    role: t.exposeString("role"),
    status: t.exposeString("status"),
    groupId: t.exposeID("groupId", { nullable: true }),
    bio: t.exposeString("bio", { nullable: true }),
    birthDate: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (user: UserDTO) => user.birthDate,
    }),
    shirtSize: t.exposeString("shirtSize", { nullable: true }),
    dietaryRequirements: t.exposeString("dietaryRequirements", {
      nullable: true,
    }),
    medicalInfo: t.exposeString("medicalInfo", { nullable: true }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (user: UserDTO) => user.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (user: UserDTO) => user.updatedAt,
    }),
  }),
});

/**
 * User Edge Type
 */
const UserEdgeType = builder.objectType("UserEdge", {
  description: "An edge in a user connection",
  fields: (t) => ({
    node: t.field({
      type: UserType,
      resolve: (parent: { node: UserDTO; cursor: string }) => parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * User Connection Type
 *
 * Relay-compliant connection type for paginated users.
 */
const UserConnectionType = builder.objectType("UserConnection", {
  description: "A connection of users for Relay pagination",
  fields: (t) => ({
    edges: t.field({
      type: [UserEdgeType],
      resolve: (parent: { edges: Array<{ node: UserDTO; cursor: string }> }) =>
        parent.edges,
    }),
    nodes: t.field({
      type: [UserType],
      resolve: (parent: { nodes: UserDTO[] }) => parent.nodes,
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
 * Helper to encode user cursor
 */
function encodeUserCursor(user: UserDTO): string {
  return encodeCursor({
    id: user.id,
    createdAt: user.createdAt.toISOString(),
  });
}

/**
 * Helper to build user connection response
 */
function buildUserConnection(
  items: UserDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: UserDTO; cursor: string }>;
  nodes: UserDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeUserCursor(item),
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
  UserType,
  UserEdgeType,
  UserConnectionType,
  encodeUserCursor,
  buildUserConnection,
};
