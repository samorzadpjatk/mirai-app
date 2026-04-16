import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";

/**
 * RewardStatus Enum
 *
 * Represents the current availability status of a reward.
 */
const RewardStatusEnum = builder.enumType("RewardStatus", {
  description: "Status of a reward",
  values: {
    ACTIVE: { value: "ACTIVE" },
    INACTIVE: { value: "INACTIVE" },
    SOLD_OUT: { value: "SOLD_OUT" },
  },
});

/**
 * PurchaseStatus Enum
 *
 * Represents the status of a reward purchase transaction.
 */
const PurchaseStatusEnum = builder.enumType("PurchaseStatus", {
  description: "Status of a reward purchase",
  values: {
    PENDING: { value: "PENDING" },
    COMPLETED: { value: "COMPLETED" },
    CANCELLED: { value: "CANCELLED" },
    REFUNDED: { value: "REFUNDED" },
  },
});

/**
 * Reward DTO Interface
 *
 * TypeScript interface representing the Reward data transfer object.
 */
export interface RewardDTO {
  id: string;
  tripId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pointsCost: number;
  quantityAvailable: number;
  quantityTotal: number;
  status: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * RewardPurchase DTO Interface
 *
 * TypeScript interface representing the RewardPurchase data transfer object.
 */
export interface RewardPurchaseDTO {
  id: string;
  rewardId: string;
  userId: string;
  groupId: string | null;
  pointsSpent: number;
  status: string;
  purchasedAt: Date;
  redeemedAt: Date | null;
  notes: string | null;
}

/**
 * Reward Type
 *
 * GraphQL type definition for rewards that users can purchase with points.
 */
const RewardType = builder.objectType("Reward", {
  description: "A reward that users can purchase with points",
  fields: (t) => ({
    id: t.exposeID("id"),
    tripId: t.exposeID("tripId"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    imageUrl: t.exposeString("imageUrl", { nullable: true }),
    pointsCost: t.field({
      type: "Int",
      resolve: (reward: RewardDTO) => reward.pointsCost,
    }),
    quantityAvailable: t.field({
      type: "Int",
      resolve: (reward: RewardDTO) => reward.quantityAvailable,
    }),
    quantityTotal: t.field({
      type: "Int",
      resolve: (reward: RewardDTO) => reward.quantityTotal,
    }),
    status: t.field({
      type: RewardStatusEnum,
      resolve: (reward: RewardDTO) => reward.status,
    }),
    createdById: t.exposeID("createdById"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (reward: RewardDTO) => reward.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (reward: RewardDTO) => reward.updatedAt,
    }),
  }),
});

/**
 * Reward Edge Type
 *
 * An edge in a reward connection for Relay pagination.
 */
const RewardEdgeType = builder.objectType("RewardEdge", {
  description: "An edge in a reward connection",
  fields: (t) => ({
    node: t.field({
      type: RewardType,
      resolve: (parent: { node: RewardDTO; cursor: string }) => parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * Reward Connection Type
 *
 * Relay-compliant connection type for paginated rewards.
 */
const RewardConnectionType = builder.objectType("RewardConnection", {
  description: "A connection of rewards for Relay pagination",
  fields: (t) => ({
    edges: t.field({
      type: [RewardEdgeType],
      resolve: (parent: {
        edges: Array<{ node: RewardDTO; cursor: string }>;
      }) => parent.edges,
    }),
    nodes: t.field({
      type: [RewardType],
      resolve: (parent: { nodes: RewardDTO[] }) => parent.nodes,
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
 * RewardPurchase Type
 *
 * GraphQL type definition for reward purchase records.
 */
const RewardPurchaseType = builder.objectType("RewardPurchase", {
  description: "A record of a reward purchase by a user",
  fields: (t) => ({
    id: t.exposeID("id"),
    rewardId: t.exposeID("rewardId"),
    userId: t.exposeID("userId"),
    groupId: t.exposeID("groupId", { nullable: true }),
    pointsSpent: t.field({
      type: "Int",
      resolve: (purchase: RewardPurchaseDTO) => purchase.pointsSpent,
    }),
    status: t.field({
      type: PurchaseStatusEnum,
      resolve: (purchase: RewardPurchaseDTO) => purchase.status,
    }),
    purchasedAt: t.field({
      type: "DateTime",
      resolve: (purchase: RewardPurchaseDTO) => purchase.purchasedAt,
    }),
    redeemedAt: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (purchase: RewardPurchaseDTO) => purchase.redeemedAt,
    }),
    notes: t.exposeString("notes", { nullable: true }),
  }),
});

/**
 * RewardPurchase Edge Type
 *
 * An edge in a reward purchase connection for Relay pagination.
 */
const RewardPurchaseEdgeType = builder.objectType("RewardPurchaseEdge", {
  description: "An edge in a reward purchase connection",
  fields: (t) => ({
    node: t.field({
      type: RewardPurchaseType,
      resolve: (parent: { node: RewardPurchaseDTO; cursor: string }) =>
        parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * RewardPurchase Connection Type
 *
 * Relay-compliant connection type for paginated reward purchases.
 */
const RewardPurchaseConnectionType = builder.objectType(
  "RewardPurchaseConnection",
  {
    description: "A connection of reward purchases for Relay pagination",
    fields: (t) => ({
      edges: t.field({
        type: [RewardPurchaseEdgeType],
        resolve: (parent: {
          edges: Array<{ node: RewardPurchaseDTO; cursor: string }>;
        }) => parent.edges,
      }),
      nodes: t.field({
        type: [RewardPurchaseType],
        resolve: (parent: { nodes: RewardPurchaseDTO[] }) => parent.nodes,
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
 * Helper to encode reward cursor
 * Uses createdAt as the primary sort field
 */
function encodeRewardCursor(reward: RewardDTO): string {
  return encodeCursor({
    id: reward.id,
    createdAt: reward.createdAt.toISOString(),
  });
}

/**
 * Helper to encode reward purchase cursor
 * Uses purchasedAt as the primary sort field
 */
function encodeRewardPurchaseCursor(purchase: RewardPurchaseDTO): string {
  return encodeCursor({
    id: purchase.id,
    createdAt: purchase.purchasedAt.toISOString(),
  });
}

/**
 * Helper to build reward connection response
 */
function buildRewardConnection(
  items: RewardDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: RewardDTO; cursor: string }>;
  nodes: RewardDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeRewardCursor(item),
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
 * Helper to build reward purchase connection response
 */
function buildRewardPurchaseConnection(
  items: RewardPurchaseDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: RewardPurchaseDTO; cursor: string }>;
  nodes: RewardPurchaseDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeRewardPurchaseCursor(item),
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
  RewardStatusEnum,
  PurchaseStatusEnum,
  RewardType,
  RewardEdgeType,
  RewardConnectionType,
  RewardPurchaseType,
  RewardPurchaseEdgeType,
  RewardPurchaseConnectionType,
  encodeRewardCursor,
  encodeRewardPurchaseCursor,
  buildRewardConnection,
  buildRewardPurchaseConnection,
};
