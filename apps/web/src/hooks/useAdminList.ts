/**
 * useAdminList Hook
 *
 * Generic reusable hook for paginated admin list views.
 * Provides type-safe data fetching with loading, error, and pagination states.
 *
 * ## Usage
 *
 * ### Basic Usage (Users List)
 * ```tsx
 * import { useAdminList } from '@/hooks/useAdminList';
 * import { GetUsersDocument } from '@mirai-app/graphql-client';
 *
 * interface User {
 *   id: string;
 *   firstName: string;
 *   lastName: string;
 *   email: string;
 * }
 *
 * interface UserFilter {
 *   tripId: string;
 *   search?: string;
 * }
 *
 * function UsersPage() {
 *   const { items, loading, error, hasMore, loadMore, refetch } = useAdminList<User, UserFilter>({
 *     query: GetUsersDocument,
 *     filter: { tripId: 'trip-123', search: '' },
 *     pageSize: 20,
 *   });
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} onRetry={refetch} />;
 *
 *   return (
 *     <>
 *       {items.map(user => (
 *         <UserCard key={user.id} user={user} />
 *       ))}
 *       {hasMore && <Button onClick={loadMore}>Load More</Button>}
 *     </>
 *   );
 * }
 * ```
 *
 * ### With Custom Data Transformation
 * ```tsx
 * function GroupsPage() {
 *   const { items: groups, loading, error, refetch } = useAdminList<Group, GroupFilter>({
 *     query: GetGroupsDocument,
 *     filter: { tripId: selectedTripId },
 *     pageSize: 50,
 *   });
 *
 *   // Data is already typed as Group[]
 *   const sortedGroups = groups.sort((a, b) => a.name.localeCompare(b.name));
 *
 *   return <GroupList groups={sortedGroups} loading={loading} error={error} />;
 * }
 * ```
 *
 * ## Type Parameters
 *
 * - `T`: The type of items in the list (e.g., User, Group, Reward)
 * - `F`: The filter type passed to the query (e.g., UserFilter, GroupFilter)
 *
 * ## Pagination
 *
 * The hook supports offset-based pagination:
 * - `pageSize` controls items per page (default: 20)
 * - `loadMore()` increments page and fetches next batch
 * - `hasMore` indicates if more items are available
 *
 * Pagination state is managed internally:
 * - Current offset tracked in component state
 * - Next page loaded when loadMore() is called
 * - refetch() resets to first page
 *
 * ## Error Handling
 *
 * Errors are normalized to standard Error objects:
 * - GraphQL errors converted with user-friendly messages
 * - Network errors properly typed
 * - Original error accessible via error.cause
 *
 * ## Integration with urql
 *
 * This hook wraps urql's useQuery for consistent admin list patterns:
 * - Normalized caching via graphcache
 * - Automatic cache updates after mutations
 * - Stale-while-revalidate for loading states
 *
 * @module @mirai-app/web/hooks/useAdminList
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from 'urql';
import type { DocumentNode } from 'graphql';

// =============================================================================
// Types
// =============================================================================

/**
 * Options for the useAdminList hook.
 *
 * @template T - The type of items returned by the query
 * @template F - The filter type for the query variables
 */
export interface UseAdminListOptions<T, F> {
  /** GraphQL query document (DocumentNode) */
  query: DocumentNode;

  /** Optional filter object passed as query variables */
  filter?: F;

  /** Number of items per page (default: 20) */
  pageSize?: number;
}

/**
 * Result returned by the useAdminList hook.
 *
 * @template T - The type of items in the list
 */
export interface UseAdminListResult<T> {
  /** List of items fetched from the query */
  items: T[];

  /** Whether the query is currently loading */
  loading: boolean;

  /** Error if the query failed, null otherwise */
  error: Error | null;

  /** Whether more items are available to load */
  hasMore: boolean;

  /** Function to load the next page of items */
  loadMore: () => void;

  /** Function to refetch from the first page */
  refetch: () => void;
}

/**
 * Default page size for admin lists
 */
const DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum number of items to prevent runaway pagination
 */
const MAX_PAGE_SIZE = 100;

/**
 * Variable names used for pagination in GraphQL queries
 */
const PAGINATION_VARIABLES = {
  limit: 'limit',
  offset: 'offset',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize page size to valid range
 */
function normalizePageSize(size: number | undefined): number {
  if (size === undefined) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(1, size), MAX_PAGE_SIZE);
}

/**
 * Extract items array from GraphQL response data.
 *
 * Handles common GraphQL response patterns:
 * - Direct array: { items: [...] }
 * - Connection pattern: { items: { edges: [{ node }] } }
 * - Paginated response: { items: { data: [...] } }
 * - Nested query: { users: [...] }
 *
 * Falls back to empty array if no items found.
 */
function extractItemsFromData<T>(data: unknown): T[] {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const dataObj = data as Record<string, unknown>;

  // Try common patterns for list data
  for (const key of Object.keys(dataObj)) {
    const value = dataObj[key];

    // Direct array
    if (Array.isArray(value)) {
      return value as T[];
    }

    // Connection pattern (edges/nodes)
    if (value && typeof value === 'object' && 'edges' in value) {
      const edges = (value as { edges?: Array<{ node?: unknown }> }).edges;
      if (Array.isArray(edges)) {
        return edges
          .map(edge => edge?.node)
          .filter((node): node is T => node !== undefined && node !== null) as T[];
      }
    }

    // Paginated response with items/data
    if (value && typeof value === 'object') {
      const nested = value as Record<string, unknown>;

      if ('items' in nested && Array.isArray(nested.items)) {
        return nested.items as T[];
      }

      if ('data' in nested && Array.isArray(nested.data)) {
        return nested.data as T[];
      }

      if ('trips' in nested && Array.isArray(nested.trips)) {
        return nested.trips as T[];
      }

      if ('users' in nested && Array.isArray(nested.users)) {
        return nested.users as T[];
      }

      if ('groups' in nested && Array.isArray(nested.groups)) {
        return nested.groups as T[];
      }

      if ('rewards' in nested && Array.isArray(nested.rewards)) {
        return nested.rewards as T[];
      }

      if ('challenges' in nested && Array.isArray(nested.challenges)) {
        return nested.challenges as T[];
      }

      if ('notifications' in nested && Array.isArray(nested.notifications)) {
        return nested.notifications as T[];
      }
    }
  }

  return [];
}

/**
 * Determine if more items are available based on returned count
 */
function calculateHasMore<T>(
  items: T[],
  pageSize: number,
  currentOffset: number
): boolean {
  // If we got exactly pageSize items, assume there might be more
  // This is a heuristic - the server should ideally return hasMore flag
  return items.length >= pageSize;
}

/**
 * Convert urql error to standard Error object
 */
function normalizeError(error: unknown): Error | null {
  if (!error) return null;

  // Already an Error instance
  if (error instanceof Error) {
    return error;
  }

  // urql CombinedError structure
  if (typeof error === 'object' && error !== null) {
    const errObj = error as {
      message?: string;
      networkError?: Error;
      graphQLErrors?: Array<{ message: string }>;
    };

    // Use network error if present
    if (errObj.networkError) {
      return new Error(
        `Network error: ${errObj.networkError.message}`,
        { cause: errObj.networkError }
      );
    }

    // Use first GraphQL error
    if (errObj.graphQLErrors && errObj.graphQLErrors.length > 0) {
      const firstError = errObj.graphQLErrors[0];
      if (firstError) {
        return new Error(
          firstError.message || 'GraphQL error occurred',
          { cause: error }
        );
      }
    }

    // Generic message property
    if (errObj.message) {
      return new Error(errObj.message, { cause: error });
    }
  }

  // Fallback for string errors
  if (typeof error === 'string') {
    return new Error(error);
  }

  // Unknown error type
  return new Error('An unknown error occurred', { cause: error });
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Generic hook for paginated admin list views.
 *
 * Wraps urql's useQuery with standardized pagination, loading, and error handling
 * suitable for CRUD list pages across all admin entities.
 *
 * @template T - The type of items in the list (e.g., User, Group, Reward)
 * @template F - The filter type passed to the query (e.g., { tripId: string, search?: string })
 *
 * @param options - Configuration options for the list
 * @returns List state with items, loading status, error, and pagination controls
 *
 * @example
 * ```tsx
 * const { items, loading, error, hasMore, loadMore, refetch } = useAdminList<User, UserFilter>({
 *   query: GetUsersDocument,
 *   filter: { tripId: '123' },
 *   pageSize: 20,
 * });
 * ```
 */
export function useAdminList<T, F>(options: UseAdminListOptions<T, F>): UseAdminListResult<T> {
  const { query, filter, pageSize: rawPageSize } = options;

  // Normalize page size
  const pageSize = normalizePageSize(rawPageSize);

  // Track pagination state
  const [offset, setOffset] = useState(0);
  const [allItems, setAllItems] = useState<T[]>([]);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  // Build query variables with pagination
  const variables = useMemo(() => {
    const baseVars: Record<string, unknown> = {};

    // Add filter properties
    if (filter) {
      Object.assign(baseVars, filter);
    }

    // Add pagination
    baseVars[PAGINATION_VARIABLES.limit] = pageSize;
    baseVars[PAGINATION_VARIABLES.offset] = offset;

    return baseVars;
  }, [filter, pageSize, offset]);

  // Execute query with urql
  const [result, reexecuteQuery] = useQuery({
    query,
    variables,
  });

  // Extract data from result
  const { data, fetching: loading, error: rawError } = result;

  // Normalize error
  const error = useMemo(() => normalizeError(rawError), [rawError]);

  // Extract items from response data
  const currentItems = useMemo(() => {
    return extractItemsFromData<T>(data);
  }, [data]);

  // Update accumulated items when data changes
  useMemo(() => {
    if (loading) return;

    if (offset === 0) {
      // First page - replace all items
      setAllItems(currentItems);
    } else {
      // Subsequent page - append new items
      setAllItems(prev => {
        // Avoid duplicates by checking IDs
        const existingIds = new Set(prev.map(item => {
          const idObj = item as unknown as { id?: string };
          return idObj.id;
        }).filter(Boolean));

        const newItems = currentItems.filter(item => {
          const idObj = item as unknown as { id?: string };
          return idObj.id && !existingIds.has(idObj.id);
        });

        return [...prev, ...newItems];
      });
    }

    setHasLoadedInitial(true);
  }, [currentItems, offset, loading]);

  // Calculate hasMore based on current items
  const hasMore = useMemo(() => {
    if (!hasLoadedInitial) return false;
    return calculateHasMore(currentItems, pageSize, offset);
  }, [currentItems, pageSize, offset, hasLoadedInitial]);

  // Load more items (next page)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setOffset(prev => prev + pageSize);
    }
  }, [loading, hasMore, pageSize]);

  // Refetch from beginning
  const refetch = useCallback(() => {
    setOffset(0);
    setAllItems([]);
    setHasLoadedInitial(false);
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, [reexecuteQuery]);

  return {
    items: allItems,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}

// =============================================================================
// Default Export
// =============================================================================

export default useAdminList;
