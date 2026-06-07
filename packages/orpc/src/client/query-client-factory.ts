import { QueryClient } from "@tanstack/react-query";

function isNetworkError(error: unknown): boolean {
  const statusCode = (error as { status?: number })?.status;
  if (statusCode === undefined || statusCode === 0) {
    return true;
  }
  return statusCode >= 500;
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
        networkMode: "offlineFirst",
        // Disable aggressive polling; rely on staleTime + manual invalidation
        refetchInterval: false,
        // Disable window focus refetch (mobile apps don't have "windows")
        refetchOnWindowFocus: false,
        // Retry with exponential backoff and jitter; don't retry on 4xx client errors
        retry: (failureCount, error) => {
          const statusCode = (error as { status?: number })?.status;
          // Don't retry client errors (4xx) except 429 (rate limited)
          if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
            return false;
          }
          // Max 3 retries for network/server errors and rate limits
          return failureCount < 3 && isNetworkError(error);
        },
        retryDelay: (attemptIndex, error) => {
          const statusCode = (error as { status?: number })?.status;
          // For 429 rate limit errors, use longer delays
          const baseDelay = statusCode === 429 ? 5000 : 1000;
          const exponential = baseDelay * 2 ** attemptIndex;
          const jitter = exponential * (0.5 + Math.random() * 0.5);
          return Math.min(jitter, 30000);
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof globalThis === "undefined" || !("window" in globalThis)) {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export const queryClient = getQueryClient();
