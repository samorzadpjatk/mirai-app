import { builder } from "./builder";
import type { GraphQLObjectType, GraphQLInterfaceType } from "graphql";

/**
 * Node interface type ref
 * Types implementing this interface are Relay-compatible
 */
export const NodeInterface = builder.nodeInterfaceRef;

/**
 * PageInfo type name reference
 */
export const PageInfoType = "PageInfo";

/**
 * PageInfo type for pagination - defined per Relay spec
 * https://relay.dev/graphql/connections.htm#sec-undefined.PageInfo
 */
builder.objectType("PageInfo", {
  description: "PageInfo for Relay-compliant pagination",
  fields: (t) => ({
    hasNextPage: t.exposeBoolean("hasNextPage"),
    hasPreviousPage: t.exposeBoolean("hasPreviousPage"),
    startCursor: t.exposeString("startCursor", { nullable: true }),
    endCursor: t.exposeString("endCursor", { nullable: true }),
  }),
});

/**
 * Relay Node type reference
 */
export type NodeType<T extends { id: string } = { id: string }> = T;

/**
 * Relay Connection type structure
 */
export interface ConnectionType<T> {
  edges: EdgeType<T>[];
  pageInfo: PageInfo;
  totalCount?: number;
}

/**
 * Relay Edge type structure
 */
export interface EdgeType<T> {
  node: T;
  cursor: string;
}

/**
 * PageInfo structure for pagination
 */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

/**
 * Create a connection type for a node type
 *
 * @param name - Base name for the type (e.g., "User" creates "UserConnection")
 * @param nodeType - The node type reference
 * @returns Connection type name
 */
export function createConnectionType<T>(
  name: string,
  nodeType: string | GraphQLObjectType | GraphQLInterfaceType,
): string {
  const connectionName = `${name}Connection`;
  const edgeName = `${name}Edge`;

  (
    builder as unknown as { objectType: (name: string, config: object) => void }
  ).objectType(edgeName, {
    fields: (t: {
      field: (config: object) => unknown;
      exposeString: (name: string) => unknown;
    }) => ({
      node: t.field({
        type: nodeType,
        resolve: (parent: EdgeType<T>) => parent.node,
      }),
      cursor: t.exposeString("cursor"),
    }),
  });

  (
    builder as unknown as { objectType: (name: string, config: object) => void }
  ).objectType(connectionName, {
    fields: (t: {
      field: (config: object) => unknown;
      exposeString: (name: string) => unknown;
    }) => ({
      edges: t.field({
        type: [edgeName],
        resolve: (parent: ConnectionType<T>) => parent.edges,
      }),
      pageInfo: t.field({
        type: PageInfoType,
        resolve: (parent) => parent.pageInfo,
      }),
      totalCount: t.field({
        type: "Int",
        nullable: true,
        resolve: (parent) => parent.totalCount,
      }),
    }),
  });

  return connectionName;
}

/**
 * Create an edge type for a node type
 *
 * @param name - Base name for the type (e.g., "User" creates "UserEdge")
 * @param nodeType - The node type reference
 * @returns Edge type name
 */
export function createEdgeType<T>(
  name: string,
  nodeType: string | GraphQLObjectType | GraphQLInterfaceType,
): string {
  const edgeName = `${name}Edge`;

  (
    builder as unknown as { objectType: (name: string, config: object) => void }
  ).objectType(edgeName, {
    fields: (t: {
      field: (config: object) => unknown;
      exposeString: (name: string) => unknown;
    }) => ({
      node: t.field({
        type: nodeType,
        resolve: (parent: EdgeType<T>) => parent.node,
      }),
      cursor: t.exposeString("cursor"),
    }),
  });

  return edgeName;
}

/**
 * Encode a database ID to a Relay global ID
 *
 * @param typeName - GraphQL type name
 * @param id - Database ID
 * @returns Base64 encoded global ID
 */
export function toGlobalId(typeName: string, id: string): string {
  return Buffer.from(`${typeName}:${id}`).toString("base64");
}

/**
 * Decode a Relay global ID to type name and database ID
 *
 * @param globalId - Base64 encoded global ID
 * @returns Object with typeName and id
 */
export function fromGlobalId(globalId: string): {
  typeName: string;
  id: string;
} {
  const decoded = Buffer.from(globalId, "base64").toString("utf-8");
  const [typeName, id] = decoded.split(":");
  return { typeName, id };
}

/**
 * Validate a global ID format
 *
 * @param globalId - ID to validate
 * @returns True if valid
 */
export function isValidGlobalId(globalId: string): boolean {
  try {
    const decoded = Buffer.from(globalId, "base64").toString("utf-8");
    const parts = decoded.split(":");
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  } catch {
    return false;
  }
}

/**
 * Create an empty connection for error cases
 */
export function createEmptyConnection<T>(): ConnectionType<T> {
  return {
    edges: [],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
    totalCount: 0,
  };
}

/**
 * Create connection args builder helper
 * Returns an args object for Relay pagination
 */
export function createConnectionArgs() {
  return {
    first: {
      type: "Int",
      description: "Returns the first n elements from the list",
    },
    after: {
      type: "String",
      description: "Returns elements after this cursor",
    },
    last: {
      type: "Int",
      description: "Returns the last n elements from the list",
    },
    before: {
      type: "String",
      description: "Returns elements before this cursor",
    },
  };
}
