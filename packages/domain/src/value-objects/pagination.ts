/**
 * Pagination value objects for Relay Cursor Connections Specification
 *
 * These types provide standard connection-based pagination structures
 * compatible with GraphQL Relay connections and ActivityFeedGateway patterns.
 *
 * @see https://relay.dev/graphql/connections.htm
 */

/**
 * Base cursor data structure using createdAt + id as tiebreaker
 * Common pattern for entity pagination
 */
export interface CursorData {
  id: string;
  createdAt: string;
}

/**
 * Edge type containing a node and its cursor
 * Represents a single item in a connection with its position cursor
 */
export interface Edge<T> {
  /** The actual entity/node at this edge */
  node: T;
  /** Base64-encoded cursor string identifying this edge's position */
  cursor: string;
}

/**
 * PageInfo provides metadata about the current page in a connection
 * Used for determining if more pages exist in either direction
 */
export interface PageInfo {
  /** True if there are more items after the current page */
  hasNextPage: boolean;
  /** True if there are more items before the current page */
  hasPreviousPage: boolean;
  /** Cursor of the first edge in the current page (null if no edges) */
  startCursor: string | null;
  /** Cursor of the last edge in the current page (null if no edges) */
  endCursor: string | null;
}

/**
 * Connection type implementing Relay Cursor Connections Specification
 * Generic wrapper for paginated collections with edge/node structure
 */
export interface Connection<T> {
  /** Array of edges containing nodes and their cursors */
  edges: Edge<T>[];
  /** Convenience array of just the nodes (derived from edges) */
  nodes: T[];
  /** Pagination metadata */
  pageInfo: PageInfo;
  /** Optional total count of all matching items (expensive to compute) */
  totalCount?: number;
}

/**
 * Arguments for forward pagination (fetching next pages)
 * Uses 'first' to specify number of items and 'after' for cursor position
 */
export interface ForwardPaginationArgs {
  /** Maximum number of items to return (should be capped, typically 100 max) */
  first?: number;
  /** Cursor to start after (null/undefined for first page) */
  after?: string | null;
}

/**
 * Arguments for backward pagination (fetching previous pages)
 * Uses 'last' to specify number of items and 'before' for cursor position
 *
 * Note: Backward pagination is optional and not always implemented.
 * Most use cases use forward pagination only.
 */
export interface BackwardPaginationArgs {
  /** Maximum number of items to return from the end */
  last: number;
  /** Cursor to end before (null/undefined for last page) */
  before?: string | null;
}

/**
 * Combined pagination arguments for bidirectional pagination
 * Supports both forward and backward pagination
 */
export type PaginationArgs = ForwardPaginationArgs | BackwardPaginationArgs;

/**
 * Type guard to check if pagination args are forward pagination
 */
export function isForwardPagination(
  args: PaginationArgs,
): args is ForwardPaginationArgs {
  return "first" in args;
}

/**
 * Type guard to check if pagination args are backward pagination
 */
export function isBackwardPagination(
  args: PaginationArgs,
): args is BackwardPaginationArgs {
  return "last" in args;
}
