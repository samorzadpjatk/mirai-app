/**
 * GraphQL Connection Helpers for Relay Cursor Pagination
 *
 * These utilities help build Relay-compliant Connection responses
 * from gateway paginated results. Compatible with Pothos Relay plugin.
 *
 * @see https://relay.dev/graphql/connections.htm
 */

import type { CursorData } from "@mirai-app/use-cases/system/utils/cursor";
import type {
  Connection,
  Edge,
  PageInfo,
} from "@mirai-app/domain/value-objects/pagination";

/**
 * Cursor data with Date object for createdAt
 * Used after decoding a cursor string
 */
export interface CursorDataWithDate extends Omit<CursorData, "createdAt"> {
  createdAt: Date;
}

/**
 * Decodes a cursor string and converts createdAt to a Date object
 *
 * This helper is used in GraphQL resolvers to decode the 'after' argument
 * into a cursor data object with a proper Date instance.
 *
 * @param cursor - Base64url encoded cursor string, or null/undefined
 * @returns CursorData with createdAt as Date, or null if invalid/missing
 *
 * @example
 * ```typescript
 * const afterCursor = decodeCursorWithDate(args.after);
 * if (afterCursor) {
 *   // Use afterCursor.createdAt as Date
 *   const date = afterCursor.createdAt; // Date object
 * }
 * ```
 */
export function decodeCursorWithDate(
  cursor: string | null | undefined,
): CursorDataWithDate | null {
  if (!cursor) {
    return null;
  }

  try {
    const json = Buffer.from(cursor, "base64url").toString("utf-8");
    const data = JSON.parse(json) as unknown;

    // Validate that data has required fields
    if (
      typeof data !== "object" ||
      data === null ||
      typeof (data as Record<string, unknown>).id !== "string" ||
      typeof (data as Record<string, unknown>).createdAt !== "string"
    ) {
      return null;
    }

    const cursorData = data as CursorData;

    // Convert createdAt string to Date object
    return {
      ...cursorData,
      createdAt: new Date(cursorData.createdAt),
    };
  } catch {
    return null;
  }
}

/**
 * Generic item interface for connection building
 * Used by buildConnectionResponse to handle any entity with id and createdAt
 */
export interface ConnectionItem {
  id: string;
  createdAt: Date;
  [key: string]: unknown;
}

/**
 * Gateway result structure for cursor pagination
 * Returned by gateway *Connection methods
 */
export interface GatewayConnectionResult<T> {
  items: T[];
  hasMore: boolean;
  nextCursor?: { id: string; createdAt: Date } | null;
}

/**
 * Type for cursor encoding function
 */
export type EncodeCursorFn<T> = (item: T) => string;

/**
 * Builds a complete Connection result from gateway paginated data
 *
 * This helper transforms gateway results into a Relay-compliant Connection
 * structure with edges, nodes, and pageInfo.
 *
 * @param result - Gateway result with items, hasMore flag, and optional nextCursor
 * @param hasPreviousPage - Whether there are items before this page (based on args.after)
 * @param encodeFn - Function to encode an item into a cursor string
 * @returns Relay-compliant Connection structure
 *
 * @example
 * ```typescript
 * // In resolver:
 * const result = await gateway.findByTripIdConnection(tripId, { limit: 20, after: cursor });
 *
 * return buildConnectionResponse(
 *   result,
 *   !!args.after,
 *   (event) => encodeCursor({ id: event.id, createdAt: event.startTime.toISOString() })
 * );
 * ```
 */
export function buildConnectionResponse<T extends ConnectionItem>(
  result: GatewayConnectionResult<T>,
  hasPreviousPage: boolean,
  encodeFn: EncodeCursorFn<T>,
): Connection<T> {
  const { items, hasMore } = result;

  // Build edges with cursors
  const edges = buildEdges(items, encodeFn);

  // Extract nodes from edges for convenience
  const nodes = items;

  // Build pageInfo
  const pageInfo = buildPageInfo(edges, hasMore, hasPreviousPage);

  return {
    edges,
    nodes,
    pageInfo,
  };
}

/**
 * Builds edges array from items using an encoding function
 *
 * @param items - Array of items to convert to edges
 * @param encodeFn - Function that takes an item and returns a cursor string
 * @returns Array of edges with node and cursor
 *
 * @example
 * ```typescript
 * const edges = buildEdges(events, (event) =>
 *   encodeCursor({ id: event.id, createdAt: event.startTime.toISOString() })
 * );
 * ```
 */
export function buildEdges<T>(
  items: T[],
  encodeFn: EncodeCursorFn<T>,
): Edge<T>[] {
  return items.map((item) => ({
    node: item,
    cursor: encodeFn(item),
  }));
}

/**
 * Builds a PageInfo object from edges and pagination flags
 *
 * @param edges - Array of edges (used to extract start/end cursors)
 * @param hasNextPage - Whether there are more items after this page
 * @param hasPreviousPage - Whether there are more items before this page
 * @returns PageInfo object per Relay spec
 *
 * @example
 * ```typescript
 * const pageInfo = buildPageInfo(edges, true, false);
 * // Returns: { hasNextPage: true, hasPreviousPage: false, startCursor: "...", endCursor: "..." }
 * ```
 */
export function buildPageInfo<T>(
  edges: Edge<T>[],
  hasNextPage: boolean,
  hasPreviousPage: boolean,
): PageInfo {
  const firstEdge = edges[0] ?? null;
  const lastEdge = edges[edges.length - 1] ?? null;

  return {
    hasNextPage,
    hasPreviousPage,
    startCursor: firstEdge?.cursor ?? null,
    endCursor: lastEdge?.cursor ?? null,
  };
}

/**
 * Creates an empty connection for cases with no results
 *
 * @returns Empty Connection with empty edges and hasNextPage/hasPreviousPage set to false
 *
 * @example
 * ```typescript
 * if (items.length === 0) {
 *   return createEmptyConnection();
 * }
 * ```
 */
export function createEmptyConnection<T>(): Connection<T> {
  return {
    edges: [],
    nodes: [],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
  };
}

/**
 * Default page size limits for pagination
 */
export const PAGINATION_LIMITS = {
  /** Default number of items per page */
  DEFAULT_FIRST: 20,
  /** Maximum allowed items per page */
  MAX_FIRST: 100,
  /** Minimum allowed items per page */
  MIN_FIRST: 1,
} as const;

/**
 * Validates and clamps the 'first' parameter to valid range
 *
 * @param first - Requested page size (may be undefined)
 * @returns Clamped page size between MIN_FIRST and MAX_FIRST
 *
 * @example
 * ```typescript
 * const limit = clampFirst(args.first); // Returns 20 if args.first is undefined
 * const limit = clampFirst(200); // Returns 100 (capped at max)
 * ```
 */
export function clampFirst(first: number | undefined | null): number {
  if (first === undefined || first === null) {
    return PAGINATION_LIMITS.DEFAULT_FIRST;
  }

  // Clamp to valid range
  return Math.max(
    PAGINATION_LIMITS.MIN_FIRST,
    Math.min(first, PAGINATION_LIMITS.MAX_FIRST),
  );
}
