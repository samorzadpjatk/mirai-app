/**
 * Pagination types for Use Cases layer
 *
 * Provides cursor-based pagination interfaces that bridge between
 * Domain Connection types and gateway implementations.
 *
 * These types use CursorData from the cursor utility for consistent
 * cursor encoding/decoding across the use cases layer.
 */

import type { CursorData } from "../utils/cursor";

/**
 * Options for cursor-based pagination queries
 *
 * Used by gateway methods to specify pagination parameters
 * when fetching data with cursor-based pagination.
 */
export interface CursorPaginationOptions {
  /** Maximum number of items to return (typically capped at 100) */
  limit: number;
  /** Optional cursor to resume pagination from a specific position */
  cursor?: CursorData;
}

/**
 * Result of a cursor-based paginated query
 *
 * Contains the paginated items along with metadata for fetching
 * the next page. This type bridges Domain Connection types
 * with gateway implementation patterns.
 */
export interface CursorPaginatedResult<T> {
  /** Array of items for the current page */
  items: T[];
  /** Cursor for fetching the next page (null if no more items) */
  nextCursor?: CursorData;
  /** True if there are more items available beyond this page */
  hasMore: boolean;
}
