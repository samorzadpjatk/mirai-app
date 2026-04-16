/**
 * Pagination utility functions for use cases
 */

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION = {
  limit: 50,
  offset: 0,
  maxLimit: 100,
} as const;

/**
 * Gets pagination options with defaults
 *
 * @example
 * const { limit, offset } = getPaginationDefaults(input.pagination);
 */
export function getPaginationDefaults(
  pagination?: Partial<PaginationOptions>,
): PaginationOptions {
  const limit = Math.min(
    pagination?.limit ?? DEFAULT_PAGINATION.limit,
    DEFAULT_PAGINATION.maxLimit,
  );
  const offset = pagination?.offset ?? DEFAULT_PAGINATION.offset;

  return { limit, offset };
}

/**
 * Calculates if there are more pages
 */
export function calculateHasMore(
  total: number,
  limit: number,
  offset: number,
): boolean {
  return offset + limit < total;
}

/**
 * Creates pagination metadata for response
 */
export function createPaginationMeta(
  total: number,
  limit: number,
  offset: number,
): PaginatedResult<never>["pagination"] {
  return {
    total,
    limit,
    offset,
    hasMore: calculateHasMore(total, limit, offset),
  };
}
