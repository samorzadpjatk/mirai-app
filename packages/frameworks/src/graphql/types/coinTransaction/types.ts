import { builder } from "../../builder.js";
import {
  decodeCursorWithDate,
  clampFirst,
  type CursorDataWithDate,
} from "../../utils/connections.js";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
import type { CoinTransactionDTO } from "@mirai-app/domain";

/**
 * CoinTransaction Group Info Type
 * Embedded group information for coin transactions
 */
const CoinTransactionGroupType = builder.objectType("CoinTransactionGroup", {
  description: "Group information for a coin transaction",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    coins: t.exposeInt("coins"),
  }),
});

/**
 * CoinTransaction Admin Info Type
 * Embedded admin information for coin transactions
 */
const CoinTransactionAdminType = builder.objectType("CoinTransactionAdmin", {
  description: "Admin information for a coin transaction",
  fields: (t) => ({
    id: t.exposeID("id"),
    firstName: t.exposeString("firstName", { nullable: true }),
    lastName: t.exposeString("lastName", { nullable: true }),
  }),
});

/**
 * CoinTransaction Type
 *
 * GraphQL type definition for coin transactions.
 */
const CoinTransactionType = builder.objectType("CoinTransaction", {
  description: "A coin transaction in the system",
  fields: (t) => ({
    id: t.exposeID("id"),
    groupId: t.exposeID("groupId"),
    amount: t.exposeInt("amount"),
    reason: t.exposeString("reason", { nullable: true }),
    adminId: t.exposeID("adminId"),
    createdAt: t.field({
      type: "DateTime",
      resolve: (transaction: CoinTransactionDTO) => transaction.createdAt,
    }),
    updatedAt: t.field({
      type: "DateTime",
      resolve: (transaction: CoinTransactionDTO) => transaction.updatedAt,
    }),
    group: t.field({
      type: CoinTransactionGroupType,
      nullable: true,
      resolve: (transaction: CoinTransactionDTO) => transaction.group,
    }),
    admin: t.field({
      type: CoinTransactionAdminType,
      nullable: true,
      resolve: (transaction: CoinTransactionDTO) => transaction.admin,
    }),
  }),
});

/**
 * CoinTransaction Edge Type
 */
const CoinTransactionEdgeType = builder.objectType("CoinTransactionEdge", {
  description: "An edge in a coin transaction connection",
  fields: (t) => ({
    node: t.field({
      type: CoinTransactionType,
      resolve: (parent: { node: CoinTransactionDTO; cursor: string }) =>
        parent.node,
    }),
    cursor: t.exposeString("cursor"),
  }),
});

/**
 * CoinTransaction Connection Type
 *
 * Relay-compliant connection type for paginated coin transactions.
 */
const CoinTransactionConnectionType = builder.objectType(
  "CoinTransactionConnection",
  {
    description: "A connection of coin transactions for Relay pagination",
    fields: (t) => ({
      edges: t.field({
        type: [CoinTransactionEdgeType],
        resolve: (parent: {
          edges: Array<{ node: CoinTransactionDTO; cursor: string }>;
        }) => parent.edges,
      }),
      nodes: t.field({
        type: [CoinTransactionType],
        resolve: (parent: { nodes: CoinTransactionDTO[] }) => parent.nodes,
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
 * Helper to encode coin transaction cursor
 * Uses createdAt as the primary sort field
 */
function encodeCoinTransactionCursor(transaction: CoinTransactionDTO): string {
  return encodeCursor({
    id: transaction.id,
    createdAt: transaction.createdAt.toISOString(),
  });
}

/**
 * Helper to build coin transaction connection response
 */
function buildCoinTransactionConnection(
  items: CoinTransactionDTO[],
  hasMore: boolean,
  hasPreviousPage: boolean,
): {
  edges: Array<{ node: CoinTransactionDTO; cursor: string }>;
  nodes: CoinTransactionDTO[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
} {
  const edges = items.map((item) => ({
    node: item,
    cursor: encodeCoinTransactionCursor(item),
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
  CoinTransactionType,
  CoinTransactionConnectionType,
  CoinTransactionEdgeType,
  CoinTransactionGroupType,
  CoinTransactionAdminType,
  encodeCoinTransactionCursor,
  buildCoinTransactionConnection,
};
