/**
 * Native urql Client Configuration
 *
 * Configured for React Native with:
 * - SecureStore integration for auth tokens
 * - WebSocket subscription support
 * - Cache normalization with graphcache
 * - Network reconnection logic
 *
 * @module urql-client
 */

import {
  createClient,
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
  type Client,
} from "@urql/core";
import { createClient as createWSClient } from "graphql-ws";
import * as SecureStore from "expo-secure-store";

// =============================================================================
// Configuration
// =============================================================================

const HTTP_ENDPOINT =
  process.env.EXPO_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

const WS_ENDPOINT =
  process.env.EXPO_PUBLIC_GRAPHQL_WS_URL ?? "ws://localhost:4000/graphql/ws";

// =============================================================================
// Auth Token Management
// =============================================================================

/**
 * Get auth token from SecureStore
 * Used for HTTP requests (WebSocket uses cookies)
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("sb-access-token");
  } catch {
    return null;
  }
};

/**
 * Create a custom fetch function that includes auth headers
 */
const customFetch = async (
  url: string,
  options: RequestInit,
): Promise<Response> => {
  const token = await getAuthToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

// =============================================================================
// WebSocket Client
// =============================================================================

/**
 * Create WebSocket client for subscriptions
 * Uses native WebSocket implementation with cookie-based auth
 */
const wsClient = createWSClient({
  url: WS_ENDPOINT,
  retryAttempts: Infinity,
});

// =============================================================================
// urql Client
// =============================================================================

let client: Client | null = null;

/**
 * Get or create urql client instance
 * Singleton pattern to ensure single client across app
 */
export const getUrqlClient = (): Client => {
  if (client) {
    return client;
  }

  client = createClient({
    url: HTTP_ENDPOINT,
    fetch: customFetch,
    exchanges: [
      cacheExchange({
        // Mobile-appropriate cache configuration
        schema: {
          // Key patterns for cache updates
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
        },
        updates: {
          // Automatically update cache on mutations
          Mutation: {
            createCustomActivity: (result, args, cache) => {
              // Invalidate activity feed cache when new activity created
              cache.invalidate("Query", "activitiesByTrip", {
                input: { tripId: (args.input as { tripId: string }).tripId },
              });
            },
          },
        },
      }),
      fetchExchange,
      subscriptionExchange({
        forwardSubscription: (operation) => ({
          subscribe: (sink) => ({
            unsubscribe: wsClient.subscribe(operation, sink),
          }),
        }),
      }),
    ],
    // Request policy: prefer cache but refetch in background
    requestPolicy: "cache-and-network",
  });

  return client;
};

/**
 * Reset the urql client
 * Call on logout to clear cache and connections
 */
export const resetUrqlClient = (): void => {
  if (client) {
    // Close WebSocket connection
    wsClient.dispose();
    client = null;
  }
};

/**
 * Preconfigured urql client for direct import
 */
export const urqlClient = getUrqlClient();

// =============================================================================
// React Integration
// =============================================================================

/**
 * Hook to get urql client with proper cleanup
 */
export const useUrqlClient = (): Client => {
  return getUrqlClient();
};

/**
 * Helper to handle background/foreground transitions
 * Call this from app state change handlers
 */
export const handleAppStateChange = (isActive: boolean): void => {
  if (!isActive) {
    // App going to background - WebSocket will auto-reconnect
    // urql handles this gracefully
  } else {
    // App returning to foreground - ensure connection is active
    if (wsClient.status !== 1) {
      // 1 = OPEN
      wsClient.reconnect();
    }
  }
};

// =============================================================================
// Subscription Helpers
// =============================================================================

/**
 * Create a subscription handler with automatic cleanup
 * Usage in React components:
 * ```tsx
 * const [{ data, error }] = useSubscription({
 *   query: ActivityFeedUpdatedDocument,
 *   variables: { tripId },
 * });
 * ```
 */
export type SubscriptionHandler<T> = {
  data?: T;
  error?: Error;
  unsubscribe: () => void;
};
