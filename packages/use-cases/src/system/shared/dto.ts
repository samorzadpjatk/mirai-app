/**
 * Shared DTO Types
 *
 * Generic types used across all use-case DTOs.
 */

/**
 * Generic paginated result for list queries
 *
 * @example
 * ```typescript
 * type UserPaginatedResult = PaginatedResult<UserDTO>;
 * type TripPaginatedResult = PaginatedResult<TripDTO>;
 * ```
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Generic cursor-based paginated result
 *
 * Used for cursor-based pagination (more efficient for large datasets).
 *
 * @example
 * ```typescript
 * type ActivityCursorResult = CursorPaginatedResult<ActivityDTO, { id: string; createdAt: Date }>;
 * ```
 */
export interface CursorPaginatedResult<T, Cursor = { id: string }> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor: Cursor | null;
}

/**
 * Generic paged result for traditional pagination
 *
 * @example
 * ```typescript
 * type RewardPagedResult = PagedResult<RewardDTO>;
 * ```
 */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Pagination options for list queries
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Cursor-based pagination options
 */
export interface CursorPaginationOptions<Cursor = { id: string }> {
  limit?: number;
  cursor?: Cursor | null;
}

/**
 * Paged pagination options
 */
export interface PagedPaginationOptions {
  page: number;
  pageSize: number;
}
