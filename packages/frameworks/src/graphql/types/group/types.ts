import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type {
  GroupDTO,
  GroupMemberDTO,
  GroupJoinRequestDTO,
} from "@mirai-app/use-cases";

/**
 * GroupRole Enum
 *
 * Defines the roles a member can have within a group.
 */
const GroupRoleEnum = builder.enumType("GroupRole", {
  description: "Role of a member within a group",
  values: {
    MEMBER: { value: "MEMBER" },
    ORGANIZER: { value: "ORGANIZER" },
  },
});

/**
 * JoinRequestStatus Enum
 *
 * Defines the status of a group join request.
 */
const JoinRequestStatusEnum = builder.enumType("JoinRequestStatus", {
  description: "Status of a group join request",
  values: {
    PENDING: { value: "PENDING" },
    APPROVED: { value: "APPROVED" },
    REJECTED: { value: "REJECTED" },
  },
});

/**
 * Group Type
 *
 * GraphQL type definition for groups.
 */
const GroupType = builder.objectType("Group", {
  description: "A group within a trip",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    imageUrl: t.exposeString("imageUrl", { nullable: true }),
    organizerId: t.exposeID("organizerId"),
    coins: t.field({
      type: "Int",
      resolve: (group: GroupDTO) => group.coins,
    }),
    memberCount: t.field({
      type: "Int",
      resolve: (group: GroupDTO) => group.memberCount,
    }),
    isActive: t.field({
      type: "Boolean",
      resolve: (group: GroupDTO) => group.isActive,
    }),
    createdAt: t.field({
      type: "DateTime",
      resolve: (group: GroupDTO) => group.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (group: GroupDTO) => group.updatedAt,
    }),
  }),
});

/**
 * Group Edge Type
 */
const GroupEdgeType = builder.objectType("GroupEdge", {
  description: "An edge in a group connection",
  fields: (t) => ({
    node: t.field({
      type: GroupType,
      resolve: (parent: { node: GroupDTO; cursor: string }) => parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * Group Connection Type
 *
 * Relay-compliant connection type for paginated groups.
 */
const GroupConnectionType = builder.objectType("GroupConnection", {
  description: "A connection of groups for Relay pagination",
  fields: (t) => ({
    edges: t.field({
      type: [GroupEdgeType],
      resolve: (parent: { edges: Array<{ node: GroupDTO; cursor: string }> }) =>
        parent.edges,
    }),
    nodes: t.field({
      type: [GroupType],
      resolve: (parent: { nodes: GroupDTO[] }) => parent.nodes,
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
 * GroupMember Type
 *
 * GraphQL type definition for group members.
 */
const GroupMemberType = builder.objectType("GroupMember", {
  description: "A member of a group",
  fields: (t) => ({
    id: t.exposeID("id"),
    groupId: t.exposeID("groupId"),
    userId: t.exposeID("userId"),
    role: t.field({
      type: GroupRoleEnum,
      resolve: (member: GroupMemberDTO) => member.role,
    }),
    joinedAt: t.field({
      type: "DateTime",
      resolve: (member: GroupMemberDTO) => member.joinedAt,
    }),
    // user field is resolved via dataloader in parent resolver
    user: t.field({
      type: "User",
      nullable: true,
      resolve: (member: GroupMemberDTO) => member.user,
    }),
  }),
});

/**
 * GroupMember Edge Type
 */
const GroupMemberEdgeType = builder.objectType("GroupMemberEdge", {
  description: "An edge in a group member connection",
  fields: (t) => ({
    node: t.field({
      type: GroupMemberType,
      resolve: (parent: { node: GroupMemberDTO; cursor: string }) =>
        parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * GroupMember Connection Type
 *
 * Relay-compliant connection type for paginated group members.
 */
const GroupMemberConnectionType = builder.objectType("GroupMemberConnection", {
  description: "A connection of group members for Relay pagination",
  fields: (t) => ({
    edges: t.field({
      type: [GroupMemberEdgeType],
      resolve: (parent: {
        edges: Array<{ node: GroupMemberDTO; cursor: string }>;
      }) => parent.edges,
    }),
    nodes: t.field({
      type: [GroupMemberType],
      resolve: (parent: { nodes: GroupMemberDTO[] }) => parent.nodes,
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
 * GroupJoinRequest Type
 *
 * GraphQL type definition for group join requests.
 */
const GroupJoinRequestType = builder.objectType("GroupJoinRequest", {
  description: "A request to join a group",
  fields: (t) => ({
    id: t.exposeID("id"),
    groupId: t.exposeID("groupId"),
    userId: t.exposeID("userId"),
    status: t.field({
      type: JoinRequestStatusEnum,
      resolve: (request: GroupJoinRequestDTO) => request.status,
    }),
    requestedAt: t.field({
      type: "DateTime",
      resolve: (request: GroupJoinRequestDTO) => request.requestedAt,
    }),
    message: t.exposeString("message", { nullable: true }),
  }),
});

/**
 * GroupJoinRequest Edge Type
 */
const GroupJoinRequestEdgeType = builder.objectType("GroupJoinRequestEdge", {
  description: "An edge in a group join request connection",
  fields: (t) => ({
    node: t.field({
      type: GroupJoinRequestType,
      resolve: (parent: { node: GroupJoinRequestDTO; cursor: string }) =>
        parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * GroupJoinRequest Connection Type
 *
 * Relay-compliant connection type for paginated group join requests.
 */
const GroupJoinRequestConnectionType = builder.objectType(
  "GroupJoinRequestConnection",
  {
    description: "A connection of group join requests for Relay pagination",
    fields: (t) => ({
      edges: t.field({
        type: [GroupJoinRequestEdgeType],
        resolve: (parent: {
          edges: Array<{ node: GroupJoinRequestDTO; cursor: string }>;
        }) => parent.edges,
      }),
      nodes: t.field({
        type: [GroupJoinRequestType],
        resolve: (parent: { nodes: GroupJoinRequestDTO[] }) => parent.nodes,
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
 * Helper to encode group cursor
 */
function encodeGroupCursor(group: GroupDTO): string {
  return encodeCursor({
    id: group.id,
    createdAt: group.createdAt.toISOString(),
  });
}

/**
 * Helper to encode group member cursor
 */
function encodeGroupMemberCursor(member: GroupMemberDTO): string {
  return encodeCursor({
    id: member.id,
    createdAt: member.joinedAt.toISOString(),
  });
}

/**
 * Helper to encode group join request cursor
 */
function encodeGroupJoinRequestCursor(request: GroupJoinRequestDTO): string {
  return encodeCursor({
    id: request.id,
    createdAt: request.requestedAt.toISOString(),
  });
}

/**
 * Helper to build group connection response
 */
function buildGroupConnection(
  items: GroupDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: GroupDTO; cursor: string }>;
  nodes: GroupDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeGroupCursor(item),
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
 * Helper to build group member connection response
 */
function buildGroupMemberConnection(
  items: GroupMemberDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: GroupMemberDTO; cursor: string }>;
  nodes: GroupMemberDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeGroupMemberCursor(item),
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
 * Helper to build group join request connection response
 */
function buildGroupJoinRequestConnection(
  items: GroupJoinRequestDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: GroupJoinRequestDTO; cursor: string }>;
  nodes: GroupJoinRequestDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeGroupJoinRequestCursor(item),
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
  // Enums
  GroupRoleEnum,
  JoinRequestStatusEnum,
  // Types
  GroupType,
  GroupEdgeType,
  GroupConnectionType,
  GroupMemberType,
  GroupMemberEdgeType,
  GroupMemberConnectionType,
  GroupJoinRequestType,
  GroupJoinRequestEdgeType,
  GroupJoinRequestConnectionType,
  // Helpers
  encodeGroupCursor,
  encodeGroupMemberCursor,
  encodeGroupJoinRequestCursor,
  buildGroupConnection,
  buildGroupMemberConnection,
  buildGroupJoinRequestConnection,
};
