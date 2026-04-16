import { mock } from "bun:test";

/**
 * Creates a mock GraphQL client for testing hooks.
 * Returns a mock client with common methods that can be customized per test.
 */
export function createMockGraphQLClient() {
  return {
    challenge: {
      getById: {
        query: mock(() => Promise.resolve(null)),
      },
      update: {
        mutate: mock(() => Promise.resolve({ success: true })),
      },
    },
    challengeSubmission: {
      getByChallengeForAdmin: {
        query: mock(() => Promise.resolve([])),
      },
      review: {
        mutate: mock(() => Promise.resolve({ success: true })),
      },
    },
    submissionReport: {
      create: {
        mutate: mock(() => Promise.resolve({ success: true })),
      },
    },
    storage: {
      createUploadUrl: {
        mutate: mock(() =>
          Promise.resolve({
            token: "mock-token",
            bucket: "mock-bucket",
            objectPath: "mock/path",
            storagePath: "mock/storage/path",
          }),
        ),
      },
      createDownloadUrl: {
        query: mock(() =>
          Promise.resolve({ signedUrl: "https://example.com/download" }),
        ),
      },
    },
    user: {
      getMy: {
        query: mock(() => Promise.resolve(null)),
      },
    },
  };
}

/**
 * Mock module for @mirai-app/frameworks/graphql/client
 * Call this at the top of your test file before importing hooks
 */
export function mockGraphQLClient(
  mockClient?: ReturnType<typeof createMockGraphQLClient>,
) {
  const client = mockClient ?? createMockGraphQLClient();

  mock.module("@mirai-app/frameworks/graphql/client", () => ({
    useGraphQL: () => client,
    getGraphQLClient: () => ({ client, cleanup: () => Promise.resolve() }),
  }));

  return client;
}

/**
 * Creates mock React Query hooks for testing
 */
export function mockReactQuery() {
  const queryCache = new Map<string, unknown>();
  const mutationCache = new Map<string, unknown>();

  const invalidateQueries = mock((args: { queryKey: string[] }) => {
    // In a real implementation, this would invalidate the cache
    return Promise.resolve();
  });

  const useQuery = mock(
    (options: { queryKey: unknown[]; queryFn: () => Promise<unknown> }) => {
      const key = JSON.stringify(options.queryKey);
      const cached = queryCache.get(key);

      if (cached) {
        return {
          data: cached,
          isLoading: false,
          isRefetching: false,
          refetch: () => Promise.resolve({ data: cached }),
        };
      }

      return {
        data: undefined,
        isLoading: true,
        isRefetching: false,
        refetch: () =>
          options.queryFn().then((data) => {
            queryCache.set(key, data);
            return { data };
          }),
      };
    },
  );

  const useMutation = mock(
    (options: {
      mutationFn: (input: unknown) => Promise<unknown>;
      onSuccess?: () => void;
    }) => {
      const mutateAsync = async (input: unknown) => {
        const result = await options.mutationFn(input);
        if (options.onSuccess) {
          await options.onSuccess();
        }
        return result;
      };

      const mutate = (input: unknown) => {
        mutateAsync(input).catch(() => {});
      };

      return {
        mutate,
        mutateAsync,
        isPending: false,
      };
    },
  );

  const useQueryClient = mock(() => ({
    invalidateQueries,
    setQueryData: (key: string[], data: unknown) => {
      queryCache.set(JSON.stringify(key), data);
    },
    getQueryData: (key: string[]) => {
      return queryCache.get(JSON.stringify(key));
    },
  }));

  mock.module("@tanstack/react-query", () => ({
    useQuery,
    useMutation,
    useQueryClient,
    QueryClient: class QueryClient {
      invalidateQueries = invalidateQueries;
    },
  }));

  return {
    queryCache,
    mutationCache,
    invalidateQueries,
    useQuery,
    useMutation,
    useQueryClient,
  };
}
