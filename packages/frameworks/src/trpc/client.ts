import {
  createTRPCClient,
  createWSClient,
  httpLink,
  retryLink,
  splitLink,
  wsLink,
  type TRPCClient,
} from "@trpc/client";
import SuperJSON from "superjson";
import type { AnyTRPCRouter } from "@trpc/server";

/**
 * Creates a WebSocket client for tRPC subscriptions
 *
 * @param wsUrl - WebSocket URL for the tRPC server
 * @param authorizationToken - Optional auth token for authenticated subscriptions
 * @returns WebSocket client instance
 */
const createWsClient = (
  wsUrl: string,
  authorizationToken?: string,
): ReturnType<typeof createWSClient> => {
  // For browser/React Native, we need to add auth via URL since WebSocket doesn't support custom headers
  // The Fastify adapter will parse the Authorization header from the upgrade request
  const wsUrlWithAuth = authorizationToken
    ? `${wsUrl}?authorization=${encodeURIComponent(`Bearer ${authorizationToken}`)}`
    : wsUrl;

  return createWSClient({
    url: wsUrlWithAuth,
    connectionParams: () => ({
      authorization: authorizationToken ?? undefined,
    }),
    lazy: { enabled: true, closeMs: 60_000 },
  });
};

/**
 * tRPC client wrapper interface
 *
 * @template TRouter - Your AppRouter type from your tRPC router definition
 */
export interface TRPCClientWrapper<TRouter extends AnyTRPCRouter> {
  client: TRPCClient<TRouter>;
  cleanup: () => Promise<void>;
}

/**
 * Creates a tRPC client with HTTP and WebSocket links
 *
 * Features:
 * - Retry logic for network errors and 5xx server errors
 * - WebSocket support for subscriptions
 * - Automatic auth token injection in headers
 * - SuperJSON transformer for complex types
 *
 * @template TRouter - Your AppRouter type from your tRPC router definition
 * @param httpUrl - HTTP endpoint URL for the tRPC server
 * @param wsUrl - WebSocket endpoint URL for subscriptions
 * @param authorizationToken - Optional auth token for authenticated requests
 * @returns Object containing the tRPC client and cleanup function
 *
 * @example
 * ```typescript
 * import type { AppRouter } from "./router"; // Your tRPC router type
 *
 * const { client, cleanup } = getTRPCClient<AppRouter>(
 *   "https://api.example.com/trpc",
 *   "wss://api.example.com/trpc",
 *   "user-auth-token"
 * );
 *
 * // Make queries
 * const result = await client.user.get.query({ id: "123" });
 *
 * // Subscribe to real-time updates
 * const subscription = client.notification.onNew.subscribe(undefined, {
 *   onData: (data) => console.log(data),
 * });
 *
 * // Cleanup when done
 * await cleanup();
 * ```
 */
export const getTRPCClient = <TRouter extends AnyTRPCRouter>(
  httpUrl: string,
  wsUrl: string,
  authorizationToken?: string,
): TRPCClientWrapper<TRouter> => {
  const ws = createWsClient(wsUrl, authorizationToken);

  const client = createTRPCClient<TRouter>({
    links: [
      retryLink({
        retry(opts) {
          const { attempts, error } = opts;
          // Retry on network errors or 5xx server errors
          const shouldRetry: boolean =
            attempts < 5 &&
            (error?.name === "FetchError" ||
              (error?.data?.httpStatus ? error.data.httpStatus >= 500 : false));
          return shouldRetry;
        },
        retryDelayMs: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 30_000),
      }),
      splitLink({
        condition(op) {
          return op.type === "subscription";
        },

        true: wsLink({
          client: ws,
          transformer: SuperJSON,
        }),

        false: httpLink({
          url: httpUrl,
          headers() {
            const headers: Record<string, string> = {};
            if (authorizationToken) {
              headers.Authorization = `Bearer ${authorizationToken}`;
            }
            return headers;
          },
          transformer: SuperJSON,
        }),
      }),
    ],
  });

  return {
    client,
    cleanup: async () => {
      await ws.close();
    },
  };
};
