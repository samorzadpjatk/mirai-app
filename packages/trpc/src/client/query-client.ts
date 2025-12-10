import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

/**
 * Configuration options for creating a Query Client.
 */
export interface QueryClientConfig {
  /**
   * Time in milliseconds that data is considered fresh.
   * @default 60000 (1 minute)
   */
  staleTime?: number;
  
  /**
   * Time in milliseconds that unused data is kept in cache.
   * @default 300000 (5 minutes)
   */
  gcTime?: number;
  
  /**
   * Number of retry attempts for failed queries.
   * @default 2
   */
  retry?: number;
  
  /**
   * Whether to refetch on window focus.
   * @default false for mobile, true for web
   */
  refetchOnWindowFocus?: boolean;
  
  /**
   * Whether to refetch when network reconnects.
   * @default true
   */
  refetchOnReconnect?: boolean;
}

/**
 * Create a new QueryClient instance for React Query.
 * 
 * @param config - Optional configuration to override defaults
 * @returns A configured QueryClient instance
 * 
 * @example
 * ```tsx
 * const queryClient = createQueryClient({
 *   staleTime: 30000, // 30 seconds
 *   refetchOnWindowFocus: true
 * });
 * ```
 */
export function createQueryClient(config: QueryClientConfig = {}) {
  const {
    staleTime = 60 * 1000, // 1 minute
    gcTime = 5 * 60 * 1000, // 5 minutes
    retry = 2,
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
  } = config;
  
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime,
        gcTime,
        retry,
        refetchOnWindowFocus,
        refetchOnReconnect,
      },
      mutations: {
        retry: 1,
      },
      dehydrate: { 
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
}
