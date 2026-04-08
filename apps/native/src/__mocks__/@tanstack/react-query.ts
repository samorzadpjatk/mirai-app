// Mock for @tanstack/react-query
import { jest } from "@jest/globals";

// Mock QueryClient
export class QueryClient {
  cache = new Map();

  fetchQuery = jest.fn(
    (options: { queryKey: string[]; queryFn: () => Promise<unknown> }) =>
      options.queryFn(),
  );

  prefetchQuery = jest.fn(() => Promise.resolve());

  invalidateQueries = jest.fn(() => Promise.resolve());

  refetchQueries = jest.fn(() => Promise.resolve());

  cancelQueries = jest.fn(() => Promise.resolve());

  removeQueries = jest.fn();

  resetQueries = jest.fn(() => Promise.resolve());

  setQueryData = jest.fn();

  getQueryData = jest.fn((key: string[]) => this.cache.get(key.join(",")));

  clear = jest.fn();

  isFetching = jest.fn(() => 0);

  isMutating = jest.fn(() => 0);

  getQueryCache = jest.fn(() => ({
    find: jest.fn(),
    findAll: jest.fn(() => []),
    subscribe: jest.fn(() => jest.fn()),
    clear: jest.fn(),
  }));

  subscribe = jest.fn(() => jest.fn());
}

// Mock hooks
export const useQuery = jest.fn(
  (options: { queryKey: string[]; queryFn?: () => Promise<unknown> }) => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    isSuccess: true,
    isError: false,
    error: null,
    refetch: jest.fn(() => Promise.resolve({ data: undefined })),
  }),
);

export const useMutation = jest.fn(() => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(() => Promise.resolve()),
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null,
  reset: jest.fn(),
}));

export const useInfiniteQuery = jest.fn(() => ({
  data: {
    pages: [],
    pageParams: [],
  },
  isLoading: false,
  isFetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  hasPreviousPage: false,
  fetchNextPage: jest.fn(() => Promise.resolve()),
  fetchPreviousPage: jest.fn(() => Promise.resolve()),
  refetch: jest.fn(() => Promise.resolve({ data: undefined })),
}));

export const useQueryClient = jest.fn(() => new QueryClient());

export const useIsFetching = jest.fn(() => 0);

export const useIsMutating = jest.fn(() => 0);

// Mock QueryClientProvider
export const QueryClientProvider = jest.fn(
  ({ children }: { children: React.ReactNode }) => children,
);

// Mock Hydrate
export const Hydrate = jest.fn(
  ({ children }: { children: React.ReactNode }) => children,
);

// Mock Devtools (should be null in tests)
export const ReactQueryDevtools = jest.fn(() => null);

// FocusManager
export const focusManager = {
  setEventListener: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
  setFocused: jest.fn(),
  isFocused: jest.fn(() => true),
};

// OnlineManager
export const onlineManager = {
  setEventListener: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
  setOnline: jest.fn(),
  isOnline: jest.fn(() => true),
};

// Default export
export default {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  useIsFetching,
  useIsMutating,
  Hydrate,
  ReactQueryDevtools,
  focusManager,
  onlineManager,
};
