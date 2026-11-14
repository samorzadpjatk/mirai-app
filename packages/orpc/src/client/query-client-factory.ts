import { QueryClient } from "@tanstack/react-query";

const RETRY_BASE_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 10_000;

/**
 * The backend's per-user limiter answers 429 with `data.retryAfter` in seconds.
 * Anything else (including the IP limiter's plain-text 429) yields 0.
 */
export function getRetryAfterMs(error: unknown): number {
  const retryAfter = (error as { data?: { retryAfter?: unknown } } | null)?.data?.retryAfter;
  if (typeof retryAfter !== "number" || !Number.isFinite(retryAfter) || retryAfter <= 0) {
    return 0;
  }
  return retryAfter * 1000;
}

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
          // A 429 used to start at a flat 5 s (then 10 s, 20 s) while the server
          // asks for one second: the bucket refills a token every few dozen ms. A
          // screen that brushed the limit sat on a spinner for half a minute. Back
          // off from one second like any other failure, and never retry sooner
          // than the `retryAfter` the server sent.
          const exponential = RETRY_BASE_DELAY_MS * 2 ** attemptIndex;
          const jittered = exponential * (0.5 + Math.random() * 0.5);
          return Math.min(Math.max(jittered, getRetryAfterMs(error)), MAX_RETRY_DELAY_MS);
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
