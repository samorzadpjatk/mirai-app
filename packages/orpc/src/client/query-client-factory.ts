import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        // No global polling: `requireAuth` spends two GoTrue round-trips per
        // procedure, so an interval would multiply that across every mounted
        // query. Screens that need live numbers set their own interval.
        refetchInterval: false,
        // These three are the only way a mounted screen gets back to the
        // server. With them off, an admin could award coins and every other
        // device kept rendering the balance it happened to cache -- the app
        // looked like the award never landed. `focusManager` has no native
        // signal of its own in React Native: `useAppStateRefresh` feeds it
        // `AppState`, without which `refetchOnWindowFocus` never fires here.
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,
        // Retry with exponential backoff and jitter; don't retry on 4xx client errors
        retry: (failureCount, error) => {
          const statusCode = (error as { status?: number })?.status;
          // Don't retry client errors (4xx) except 429 (rate limited)
          if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
            return false;
          }
          // Max 3 retries for network/server errors and rate limits
          return failureCount < 3;
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
