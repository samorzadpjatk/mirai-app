"use client";

import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../api/root";
import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  retryLink,
  splitLink,
  wsLink,
} from "@trpc/client";
import SuperJSON from "superjson";

const trpcContext = createTRPCContext<AppRouter>();

export const TRPCProvider = trpcContext.TRPCProvider;
export const useTRPC = trpcContext.useTRPC;
export const useTRPCClient = trpcContext.useTRPCClient;

const wsClient = (wsUrl: string, authorizationToken?: string) =>
  createWSClient({
    url: wsUrl,
    connectionParams: () =>
      authorizationToken ? { authToken: authorizationToken } : null,
    lazy: { enabled: true, closeMs: 60_000 },
  });

const getTRPCClient = (
  httpUrl: string,
  wsUrl: string,
  authorizationToken?: string,
) =>
  createTRPCClient<AppRouter>({
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
          client: wsClient(wsUrl, authorizationToken),
          transformer: SuperJSON,
        }),

        false: httpBatchLink({
          url: httpUrl,
          headers() {
            if (!authorizationToken) {
              return {};
            }
            return {
              Authorization: `Bearer ${authorizationToken}`,
            };
          },
          transformer: SuperJSON,
        }),
      }),
    ],
  });

export { getTRPCClient };
