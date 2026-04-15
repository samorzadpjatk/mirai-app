/**
 * Web urql Client Configuration
 *
 * Configured for Next.js/Astro with:
 * - SSR support via ssrExchange
 * - WebSocket subscription support
 * - Cache normalization with graphcache
 * - Retry logic for failed requests
 * - Cookie-based authentication
 *
 * @module urql-client
 */

import {
  createClient,
  cacheExchange,
  fetchExchange,
  ssrExchange,
  subscriptionExchange,
  retryExchange,
  type Client,
  type SSRExchange,
} from "@urql/core";
import { createClient as createWSClient } from "graphql-ws";
import { env } from "./env";

// =============================================================================
// Environment Configuration
// =============================================================================

const HTTP_ENDPOINT = env.graphqlUrl;
const WS_ENDPOINT = env.graphqlWsUrl ?? "ws://localhost:4000/graphql/ws";

// =============================================================================
// SSR Exchange (server-side rendering support)
// =============================================================================

let ssr: SSRExchange | null = null;

/**
 * Get or create SSR exchange for server-side rendering
 * Must be called on both server and client for hydration to work
 */
export const getSSRExchange = (): SSRExchange => {
  if (!ssr) {
    ssr = ssrExchange({
      isClient: typeof window !== "undefined",
      // Initial state for client-side hydration
      initialState:
        typeof window !== "undefined" ? window.__URQL_DATA__ : undefined,
    });
  }
  return ssr;
};

// Extend Window interface for SSR data
declare global {
  interface Window {
    __URQL_DATA__?: unknown;
  }
}

// =============================================================================
// WebSocket Client
// =============================================================================

/**
 * Create WebSocket client for subscriptions
 * Uses cookie-based authentication (same-domain cookies sent automatically)
 */
let wsClient: ReturnType<typeof createWSClient> | null = null;

const getWSClient = (): ReturnType<typeof createWSClient> => {
  if (!wsClient) {
    wsClient = createWSClient({
      url: WS_ENDPOINT,
      // Cookie-based auth - cookies sent automatically via WebSocket handshake
      retryAttempts: Infinity,
      retryWait: async (retries) => {
        // Exponential backoff with max 5 seconds
        const delay = Math.min(1000 * Math.pow(2, retries), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      },
      connectionParams: () => {
        // No need to pass auth token - WebSocket uses cookies
        return {};
      },
    });
  }
  return wsClient;
};

// =============================================================================
// urql Client Factory
// =============================================================================

let client: Client | null = null;

/**
 * Get or create urql client instance
 * Configured with all required exchanges
 */
export const getUrqlClient = (): Client => {
  if (client) {
    return client;
  }

  const ssrCache = getSSRExchange();
  const ws = getWSClient();

  client = createClient({
    url: HTTP_ENDPOINT,
    fetchOptions: () => ({
      credentials: "include", // Send cookies for auth
    }),
    exchanges: [
      cacheExchange({
        // Schema-aware cache configuration
        schema: {
          Activity: {
            keyFields: ["id"],
          },
          User: {
            keyFields: ["id"],
          },
          Trip: {
            keyFields: ["id"],
          },
          Group: {
            keyFields: ["id"],
          },
          Challenge: {
            keyFields: ["id"],
          },
          ChallengeSubmission: {
            keyFields: ["id"],
          },
          Reward: {
            keyFields: ["id"],
          },
        },
        updates: {
          // Cache update resolvers
          Mutation: {
            // Update activity feed when new activity created
            createCustomActivity: (result, args, cache, info) => {
              cache.invalidate("Query", "activitiesByTrip", {
                input: { tripId: (args.input as { tripId: string }).tripId },
              });
            },
            // Update challenge cache on submission
            createChallengeSubmission: (result, args, cache, info) => {
              const { challengeId } = args.input as { challengeId: string };
              cache.invalidate({ __typename: "Challenge", id: challengeId });
            },
            // Update vote progress on vote submission
            submitVote: (result, args, cache, info) => {
              const { challengeId } = args.input as { challengeId: string };
              cache.invalidate({ __typename: "VotingProgress", challengeId });
            },
          },
        },
      }),
      ssrCache, // SSR exchange before fetch
      fetchExchange,
      retryExchange({
        // Retry failed requests with exponential backoff
        maxDelayMs: 5000,
        initialDelayMs: 300,
        maxNumberAttempts: 3,
        retryIf: (error) => {
          // Retry on network errors or 5xx server errors
          if (error.networkError) return true;
          if (
            error.graphQLErrors?.some(
              (e) => e.extensions?.code === "INTERNAL_SERVER_ERROR",
            )
          ) {
            return true;
          }
          return false;
        },
      }),
      subscriptionExchange({
        forwardSubscription: (operation) => ({
          subscribe: (sink) => ({
            unsubscribe: ws.subscribe(operation, sink),
          }),
        }),
      }),
    ],
    // Default request policy
    requestPolicy: "cache-and-network",
  });

  return client;
};

/**
 * Preconfigured urql client for direct import
 * Same as getUrqlClient() for convenience
 */
export const urqlClient = getUrqlClient();

// =============================================================================
// Client Management
// =============================================================================

/**
 * Reset the urql client and close WebSocket connection
 * Call on logout to clear cache and connections
 */
export const resetUrqlClient = (): void => {
  if (wsClient) {
    wsClient.dispose();
    wsClient = null;
  }
  client = null;
  ssr = null;
};

/**
 * Get SSR data for hydration
 * Call this on server to extract cache state for client
 */
export const extractSSRData = (): unknown => {
  return ssr?.extractData();
};