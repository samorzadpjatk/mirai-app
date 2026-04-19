/**
 * useAdminList Hook Tests
 *
 * Tests for the useAdminList hook including:
 * - Initial state and loading
 * - Data fetching and extraction
 * - Pagination (loadMore)
 * - Error handling
 * - Refetch functionality
 * - Filter changes
 *
 * @module @/hooks/__tests__/useAdminList.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAdminList } from '../useAdminList';

// Mock urql
vi.mock('urql', () => ({
  useQuery: vi.fn(),
}));

import { useQuery } from 'urql';

interface TestItem {
  id: string;
  name: string;
}

interface TestFilter {
  tripId: string;
  search?: string;
}

describe('[UNIT] useAdminList', () => {
  const mockUseQuery = vi.mocked(useQuery);
  const mockReexecuteQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue([
      {
        data: null,
        fetching: false,
        error: null,
        stale: false,
      },
      mockReexecuteQuery,
    ]);
  });

  describe('Initial State', () => {
    it('should initialize with empty items', () => {
      const mockQuery = {} as import('graphql').DocumentNode;

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.items).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasMore).toBe(false);
    });

    it('should initialize with loading state', () => {
      const mockQuery = {} as import('graphql').DocumentNode;

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: true,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.loading).toBe(true);
    });

    it('should use default page size', () => {
      const mockQuery = {} as import('graphql').DocumentNode;

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      // Verify query was called with default page size (20)
      expect(mockUseQuery).toHaveBeenCalled();
      const callArgs = mockUseQuery.mock.calls[0][0];
      expect(callArgs.variables).toMatchObject({
        limit: 20,
        offset: 0,
      });
    });

    it('should use custom page size', () => {
      const mockQuery = {} as import('graphql').DocumentNode;

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
          pageSize: 50,
        })
      );

      const callArgs = mockUseQuery.mock.calls[0][0];
      expect(callArgs.variables).toMatchObject({
        limit: 50,
        offset: 0,
      });
    });
  });

  describe('Data Extraction', () => {
    it('should extract items from direct array response', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const items: TestItem[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      mockUseQuery.mockReturnValue([
        {
          data: { items },
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.items).toEqual(items);
    });

    it('should extract items from edges/nodes connection pattern', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const items: TestItem[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      mockUseQuery.mockReturnValue([
        {
          data: {
            items: {
              edges: items.map(item => ({ node: item })),
            },
          },
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.items).toEqual(items);
    });

    it('should extract items from nested data property', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const items: TestItem[] = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      mockUseQuery.mockReturnValue([
        {
          data: {
            items: {
              data: items,
            },
          },
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.items).toEqual(items);
    });

    it('should extract items from entity-named fields', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const users: TestItem[] = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];

      mockUseQuery.mockReturnValue([
        {
          data: {
            users: {
              users,
            },
          },
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.items).toEqual(users);
    });
  });

  describe('Pagination', () => {
    it('should detect hasMore when items equal page size', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const items = Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 1),
        name: `Item ${i + 1}`,
      }));

      mockUseQuery.mockReturnValue([
        {
          data: { items },
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
          pageSize: 20,
        })
      );

      expect(result.current.hasMore).toBe(true);
    });

    it('should not detect hasMore when items less than page size', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const items = Array.from({ length: 15 }, (_, i) => ({
        id: String(i + 1),
        name: `Item ${i + 1}`,
      }));

      mockUseQuery.mockReturnValue([
        {
          data: { items },
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
          pageSize: 20,
        })
      );

      expect(result.current.hasMore).toBe(false);
    });

    it('should load more items when loadMore is called', async () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const firstPage = Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 1),
        name: `Item ${i + 1}`,
      }));

      mockUseQuery.mockReturnValue([
        {
          data: { items: firstPage },
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result, rerender } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
          pageSize: 20,
        })
      );

      // Mock second page
      const secondPage = Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 21),
        name: `Item ${i + 21}`,
      }));

      mockUseQuery.mockReturnValue([
        {
          data: { items: secondPage },
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      act(() => {
        result.current.loadMore();
      });

      // After loadMore, should trigger re-query with offset
      await waitFor(() => {
        const lastCall = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1];
        expect(lastCall[0].variables).toMatchObject({
          offset: 20,
          limit: 20,
        });
      });
    });

    it('should not load more when already loading', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const items = Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 1),
        name: `Item ${i + 1}`,
      }));

      mockUseQuery.mockReturnValue([
        {
          data: { items },
          fetching: true, // Currently loading
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
          pageSize: 20,
        })
      );

      act(() => {
        result.current.loadMore();
      });

      // Should not trigger another query while loading
      const lastCall = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1];
      expect(lastCall[0].variables.offset).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle GraphQL error', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const graphQLError = {
        message: 'Failed to fetch items',
        graphQLErrors: [{ message: 'Permission denied' }],
      };

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: graphQLError,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('Permission denied');
    });

    it('should handle network error', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const networkError = new Error('Network request failed');

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: {
            message: 'Network error',
            networkError,
          },
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('Network error');
    });

    it('should handle string error', () => {
      const mockQuery = {} as import('graphql').DocumentNode;

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: 'Something went wrong',
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Something went wrong');
    });

    it('should handle unknown error type', () => {
      const mockQuery = {} as import('graphql').DocumentNode;

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: 12345, // Invalid error type
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('An unknown error occurred');
    });

    it('should handle null error', () => {
      const mockQuery = {} as import('graphql').DocumentNode;

      mockUseQuery.mockReturnValue([
        {
          data: { items: [] },
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.error).toBeNull();
    });
  });

  describe('Refetch', () => {
    it('should reset and refetch when refetch is called', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const items = [{ id: '1', name: 'Item 1' }];

      mockUseQuery.mockReturnValue([
        {
          data: { items },
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      act(() => {
        result.current.refetch();
      });

      expect(mockReexecuteQuery).toHaveBeenCalledWith({ requestPolicy: 'network-only' });
    });
  });

  describe('Filter Integration', () => {
    it('should pass filter to query variables', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const filter: TestFilter = {
        tripId: 'trip-123',
        search: 'test',
      };

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
          filter,
        })
      );

      const callArgs = mockUseQuery.mock.calls[0][0];
      expect(callArgs.variables).toMatchObject({
        tripId: 'trip-123',
        search: 'test',
        limit: 20,
        offset: 0,
      });
    });

    it('should refetch when filter changes', () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const initialFilter: TestFilter = { tripId: 'trip-123' };

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { rerender } = renderHook(
        ({ filter }) =>
          useAdminList<TestItem, TestFilter>({
            query: mockQuery,
            filter,
          }),
        {
          initialProps: { filter: initialFilter },
        }
      );

      const newFilter: TestFilter = { tripId: 'trip-456' };
      rerender({ filter: newFilter });

      const lastCall = mockUseQuery.mock.calls[mockUseQuery.mock.calls.length - 1];
      expect(lastCall[0].variables.tripId).toBe('trip-456');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data response', () => {
      const mockQuery = {} as import('graphql').DocumentNode;

      mockUseQuery.mockReturnValue([
        {
          data: {},
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.items).toEqual([]);
    });

    it('should handle null data response', () => {
      const mockQuery = {} as import('graphql').DocumentNode;

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
        })
      );

      expect(result.current.items).toEqual([]);
    });

    it('should cap page size at maximum', () => {
      const mockQuery = {} as import('graphql').DocumentNode;

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
          pageSize: 200, // Exceeds max of 100
        })
      );

      const callArgs = mockUseQuery.mock.calls[0][0];
      expect(callArgs.variables.limit).toBe(100);
    });

    it('should enforce minimum page size of 1', () => {
      const mockQuery = {} as import('graphql').DocumentNode;

      mockUseQuery.mockReturnValue([
        {
          data: null,
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
          pageSize: 0, // Below minimum
        })
      );

      const callArgs = mockUseQuery.mock.calls[0][0];
      expect(callArgs.variables.limit).toBe(1);
    });

    it('should avoid duplicate items on pagination', async () => {
      const mockQuery = {} as import('graphql').DocumentNode;
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ];

      // Same items returned (simulating overlap)
      mockUseQuery.mockReturnValue([
        {
          data: { items },
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      const { result, rerender } = renderHook(() =>
        useAdminList<TestItem, TestFilter>({
          query: mockQuery,
          pageSize: 2,
        })
      );

      // Trigger page change
      mockUseQuery.mockReturnValue([
        {
          data: { items: [...items] }, // Same items
          fetching: false,
          error: null,
          stale: false,
        },
        mockReexecuteQuery,
      ]);

      act(() => {
        result.current.loadMore();
      });

      // Should not have duplicates
      await waitFor(() => {
        const ids = result.current.items.map(item => item.id);
        const uniqueIds = [...new Set(ids)];
        expect(ids.length).toBe(uniqueIds.length);
      });
    });
  });
});
