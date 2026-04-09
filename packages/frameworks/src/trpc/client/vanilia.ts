import {
  createTRPCClient,
  createWSClient,
  httpLink,
  retryLink,
  splitLink,
  wsLink,
} from "@trpc/client";
import SuperJSON from "superjson";
import type { AppRouter } from "@repo/adapters/api/root";

const createWsClient = (wsUrl: string, authorizationToken?: string) => {
  console.log(
    "[WS Client] Creating WebSocket client with token:",
    authorizationToken ? "YES" : "NO",
  );
  if (authorizationToken) {
    console.log(
      "[WS Client] Token preview:",
      authorizationToken.substring(0, 20) + "...",
    );
  }

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

const getTRPCClient = (
  httpUrl: string,
  wsUrl: string,
  authorizationToken?: string,
) => {
  const ws = createWsClient(wsUrl, authorizationToken);

  const client = createTRPCClient<AppRouter>({
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

export { getTRPCClient };
