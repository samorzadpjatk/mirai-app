// =============================================================================
// Relay Connection Utilities
// =============================================================================

/**
 * Relay Connection Utilities
 *
 * Helper functions for implementing Relay cursor-based pagination.
 *
 * ## Cursor Format
 *
 * Cursors are base64-encoded strings containing:
 * - `id:<entity-id>` - Simple ID-based cursor
 * - `<timestamp>:<id>` - Time-based cursor for sorted lists
 *
 * ## Usage
 *
 * ```typescript
 * // Encoding
 * const cursor = encodeCursor("user-123");
 * const timeCursor = encodeCursorWithTimestamp("user-123", new Date());
 *
 * // Decoding
 * const id = decodeCursor(cursor); // "user-123"
 * const { id, timestamp } = decodeCursorWithTimestamp(timeCursor);
 *
 * // Building connections
 * const connection = buildConnection({
 *   items: users,
 *   hasMore: true,
 *   getCursor: (user) => encodeCursor(user.id),
 * });
 * ```
 */

// =============================================================================
// Cursor Encoding/Decoding
// =============================================================================

/**
 * Encode an ID into an opaque cursor
 */
export function encodeCursor(id: string): string {
  return base64Encode(`id:${id}`);
}

/**
 * Decode a cursor to extract the ID
 */
export function decodeCursor(cursor: string): string {
  const decoded = base64Decode(cursor);
  const match = decoded.match(/^id:(.+)$/);
  if (!match || !match[1]) {
    throw new Error(`Invalid cursor format: ${cursor}`);
  }
  return match[1];
}

/**
 * Encode ID with timestamp for sorted lists
 */
export function encodeCursorWithTimestamp(id: string, timestamp: Date): string {
  return base64Encode(`${timestamp.toISOString()}:${id}`);
}

/**
 * Decode cursor with timestamp
 */
export function decodeCursorWithTimestamp(cursor: string): { id: string; timestamp: Date } {
  const decoded = base64Decode(cursor);
  const match = decoded.match(/^(.+):(.+)$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid cursor format: ${cursor}`);
  }
  return {
    timestamp: new Date(match[1]),
    id: match[2],
  };
}

// =============================================================================
// Base64 Helpers
// =============================================================================

function base64Encode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  // Browser fallback
  return btoa(str);
}

function base64Decode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64").toString("utf-8");
  }
  // Browser fallback
  return atob(str);
}

// =============================================================================
// Connection Building
// =============================================================================

/**
 * Edge type for Relay connections
 */
export interface Edge<T> {
  node: T;
  cursor: string;
}

/**
 * PageInfo type for Relay connections
 */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

/**
 * Connection type for Relay pagination
 */
export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number | null;
}

/**
 * Build a Relay connection from items with full pagination support
 */
export function buildConnection<T>({
  items,
  hasMore,
  hasPrevious,
  getCursor,
  totalCount = null,
}: {
  items: T[];
  hasMore: boolean;
  hasPrevious?: boolean;
  getCursor: (item: T) => string;
  totalCount?: number | null;
}): Connection<T> {
  const edges = items.map((item) => ({
    node: item,
    cursor: getCursor(item),
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage: hasMore,
      hasPreviousPage: hasPrevious ?? false,
      startCursor: edges.length > 0 ? edges[0]!.cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1]!.cursor : null,
    },
    totalCount,
  };
}

// =============================================================================
// Pagination Arguments
// =============================================================================

/**
 * Clamp first/last arguments to reasonable limits
 */
export function clampFirst(first: number | null | undefined, max = 100, defaultValue = 20): number {
  if (first === null || first === undefined) {
    return defaultValue;
  }
  return Math.min(Math.max(1, first), max);
}

/**
 * Clamp last argument for backward pagination
 */
export function clampLast(last: number | null | undefined, max = 100, defaultValue = 20): number {
  if (last === null || last === undefined) {
    return defaultValue;
  }
  return Math.min(Math.max(1, last), max);
}

/**
 * Pagination arguments for Relay queries
 */
export interface PaginationArgs {
  first?: number | null;
  after?: string | null;
  last?: number | null;
  before?: string | null;
}

/**
 * Normalized pagination arguments with direction
 */
export interface NormalizedPaginationArgs {
  limit: number;
  after: string | null;
  before: string | null;
  direction: "forward" | "backward";
}

/**
 * Validate and normalize pagination arguments
 * Supports both forward (first/after) and backward (last/before) pagination
 */
export function normalizePaginationArgs(args: PaginationArgs): NormalizedPaginationArgs {
  const hasForward = args.first !== null && args.first !== undefined;
  const hasBackward = args.last !== null && args.last !== undefined;

  // Cannot use both forward and backward pagination at the same time
  if (hasForward && hasBackward) {
    throw new Error("Cannot use both forward (first/after) and backward (last/before) pagination simultaneously");
  }

  if (hasBackward) {
    return {
      limit: clampLast(args.last),
      after: null,
      before: args.before ?? null,
      direction: "backward",
    };
  }

  return {
    limit: clampFirst(args.first),
    after: args.after ?? null,
    before: null,
    direction: "forward",
  };
}
