/**
 * GraphQL Client for Web App
 *
 * React hooks and provider for GraphQL API communication.
 * Replaces the previous tRPC client with a lightweight GraphQL wrapper.
 *
 * ## Migration from tRPC
 *
 * ### Before (tRPC):
 * ```tsx
 * import { useTRPCClient } from "@mirai-app/frameworks/trpc/client";
 *
 * const client = useTRPCClient();
 * const result = await client.query("user.me");
 * ```
 *
 * ### After (GraphQL):
 * ```tsx
 * import { useGraphQL } from "@mirai-app/frameworks/graphql/client";
 *
 * const { query, mutate } = useGraphQL();
 * const result = await query(GET_USER);
 * ```
 *
 * @module graphql/client
 */

import { createContext, useContext, useCallback, useMemo } from "react";
import { apiLogger } from "@mirai-app/shared";

// =============================================================================
// Types
// =============================================================================

export interface GraphQLClientConfig {
  endpoint: string;
  wsEndpoint?: string;
  getAuthToken: () => string | null;
}

export interface GraphQLClient {
  query: <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;
  mutate: <T>(
    mutation: string,
    variables?: Record<string, unknown>,
  ) => Promise<T>;
  subscribe: <T>(
    subscription: string,
    variables?: Record<string, unknown>,
    onData?: (data: T) => void,
  ) => () => void;
}

interface GraphQLContextValue {
  client: GraphQLClient;
  isConnected: boolean;
}

// =============================================================================
// GraphQL Client Implementation
// =============================================================================

class GraphQLClientImpl implements GraphQLClient {
  private endpoint: string;
  private wsEndpoint: string | null;
  private getAuthToken: () => string | null;
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, (data: unknown) => void>();

  constructor(config: GraphQLClientConfig) {
    this.endpoint = config.endpoint;
    this.wsEndpoint = config.wsEndpoint ?? null;
    this.getAuthToken = config.getAuthToken;
  }

  async query<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    return this.execute<T>(query, variables, "query");
  }

  async mutate<T>(
    mutation: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    return this.execute<T>(mutation, variables, "mutation");
  }

  private async execute<T>(
    document: string,
    variables: Record<string, unknown> = {},
    operationType: "query" | "mutation",
  ): Promise<T> {
    const token = this.getAuthToken();

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        query: document,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `GraphQL ${operationType} failed: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();

    if (result.errors && result.errors.length > 0) {
      const error = result.errors[0];
      throw new Error(error.message || "GraphQL operation failed");
    }

    return result.data as T;
  }

  subscribe<T>(
    subscription: string,
    variables?: Record<string, unknown>,
    onData?: (data: T) => void,
  ): () => void {
    if (!this.wsEndpoint) {
      apiLogger.warn(
        "WebSocket endpoint not configured, subscriptions disabled",
      );
      return () => {};
    }

    // Generate unique subscription ID
    const id = crypto.randomUUID();

    // Connect WebSocket if not already connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket();
    }

    // Store callback
    if (onData) {
      this.subscriptions.set(id, onData as (data: unknown) => void);
    }

    // Send subscription start message
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "subscribe",
          id,
          payload: {
            query: subscription,
            variables,
          },
        }),
      );
    }

    // Return unsubscribe function
    return () => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "complete",
            id,
          }),
        );
      }
      this.subscriptions.delete(id);
    };
  }

  private connectWebSocket(): void {
    if (!this.wsEndpoint) return;

    const token = this.getAuthToken();
    const url = new URL(this.wsEndpoint);
    if (token) {
      url.searchParams.set("token", token);
    }

    this.ws = new WebSocket(url.toString());

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "data" && message.id) {
        const callback = this.subscriptions.get(message.id);
        if (callback) {
          callback(message.payload.data);
        }
      }
    };

    this.ws.onclose = () => {
      // Reconnect after delay
      setTimeout(() => this.connectWebSocket(), 3000);
    };
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.subscriptions.clear();
  }
}

// =============================================================================
// React Context
// =============================================================================

const GraphQLContext = createContext<GraphQLContextValue | null>(null);

/**
 * GraphQL Provider Component
 *
 * Wraps the application with GraphQL client context.
 * Replace tRPC's APIProvider with this.
 */
export function GraphQLProvider({
  children,
  endpoint,
  wsEndpoint,
  getAuthToken,
}: {
  children: React.ReactNode;
  endpoint: string;
  wsEndpoint?: string;
  getAuthToken: () => string | null;
}) {
  const client = useMemo(
    () => new GraphQLClientImpl({ endpoint, wsEndpoint, getAuthToken }),
    [endpoint, wsEndpoint, getAuthToken],
  );

  const value = useMemo(
    () => ({
      client,
      isConnected: true,
    }),
    [client],
  );

  return (
    <GraphQLContext.Provider value={value}>{children}</GraphQLContext.Provider>
  );
}

// =============================================================================
// React Hooks
// =============================================================================

/**
 * useGraphQL hook
 *
 * Returns the GraphQL client for making queries and mutations.
 * Replace useTRPCClient with this.
 *
 * @example
 * ```tsx
 * const { query, mutate, subscribe } = useGraphQL();
 *
 * // Query
 * const user = await query(GET_USER, { id: "123" });
 *
 * // Mutation
 * const result = await mutate(CREATE_USER, { name: "John" });
 *
 * // Subscription
 * const unsubscribe = subscribe(USER_UPDATES, { userId: "123" }, (data) => {
 *   clientLogger.debug("User updated", data);
 * });
 * ```
 */
export function useGraphQL(): GraphQLClient {
  const context = useContext(GraphQLContext);

  if (!context) {
    throw new Error("useGraphQL must be used within a GraphQLProvider");
  }

  return context.client;
}

/**
 * useGraphQLQuery hook
 *
 * Simplified hook for making GraphQL queries with loading/error states.
 */
export function useGraphQLQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
) {
  const client = useGraphQL();
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.query<T>(query, variables);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, query, variables]);

  return { data, loading, error, execute };
}

/**
 * useGraphQLMutation hook
 *
 * Simplified hook for making GraphQL mutations with loading/error states.
 */
export function useGraphQLMutation<T>() {
  const client = useGraphQL();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const mutate = useCallback(
    async (mutation: string, variables?: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.mutate<T>(mutation, variables);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  return { mutate, loading, error };
}

// =============================================================================
// Backward Compatibility Exports
// =============================================================================

/**
 * @deprecated Use GraphQLProvider instead
 */
export function APIProvider({
  children,
  httpUrl,
  wsUrl,
}: {
  children: React.ReactNode;
  httpUrl: string;
  wsUrl: string;
}) {
  return (
    <GraphQLProvider
      endpoint={httpUrl}
      wsEndpoint={wsUrl}
      getAuthToken={() => localStorage.getItem("auth_token")}
    >
      {children}
    </GraphQLProvider>
  );
}

/**
 * @deprecated Use useGraphQL instead
 */
export function useTRPCClient() {
  return useGraphQL();
}

/**
 * @deprecated Use GraphQLProvider with getAuthToken prop instead
 */
export function getTRPCClient(httpUrl: string, wsUrl: string, token: string) {
  const client = new GraphQLClientImpl({
    endpoint: httpUrl,
    wsEndpoint: wsUrl,
    getAuthToken: () => token,
  });

  return {
    client,
    cleanup: () => client.disconnect(),
  };
}

// React import for hooks
import * as React from "react";
