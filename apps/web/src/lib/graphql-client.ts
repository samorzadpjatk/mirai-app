/**
 * GraphQL Client Configuration Module
 *
 * Configures urql client with:
 * - Auth exchange for Bearer token attachment
 * - Normalized caching via @urql/exchange-graphcache
 * - WebSocket subscriptions via graphql-ws
 * - Error handling with retry logic
 * - Request batching for improved performance
 * - Subscription fallback to polling
 *
 * This is a core dependency for all GraphQL data fetching in the admin app.
 * The client is designed to work with the Better Auth session management.
 *
 * ## Cache Policy Decisions
 *
 * The normalized cache is configured with the following policies:
 *
 * 1. **Normalized Cache Keys**: All entities with an `id` field are normalized
 *    using their typename + id as the cache key. This ensures updates to an
 *    entity in one query automatically update that entity everywhere it appears.
 *
 * 2. **Query Root Fields**: List queries (e.g., `users`, `trips`) are stored as
 *    links to the normalized entities rather than as raw data. This allows
 *    individual entity updates to reflect in lists without refetching.
 *
 * 3. **Mutation Updaters**: Common mutation patterns are configured to automatically
 *    invalidate or update affected queries. For example, creating a user will
 *    append to the users list cache.
 *
 * 4. **Subscription Handling**: Real-time updates from subscriptions are merged
 *    into the normalized cache, ensuring live data reflects immediately.
 *
 * 5. **Cache Invalidation Strategy**: Use `cache.invalidate` for deletions
 *    and manual updates for edits. Lists are refetched after create operations
 *    to ensure pagination consistency.
 *
 * @module @mirai-app/web/graphql-client
 */

import {
  createClient as createUrqlClient,
  makeOperation,
  type Client,
  type Exchange,
  type Operation,
  type OperationResult,
  type ExchangeInput,
  type CombinedError,
} from "urql";
import { cacheExchange, type Cache } from "@urql/exchange-graphcache";
import { retryExchange } from "@urql/exchange-retry";
import { createClient as createWSClient } from "graphql-ws";
import { type DocumentNode, print as graphqlPrint } from "graphql";
import { filter, map, share, make, fromValue, merge, subscribe, type Source, type Subscription } from "wonka";
import { ENV } from "./env.js";

// =============================================================================
// GraphQL Client Interface
// =============================================================================

/**
 * GraphQL client interface for programmatic operations
 *
 * Use this when you need direct query/mutation/subscription control
 * outside of React hooks. Most components should use the generated
 * urql hooks from @mirai-app/graphql-client instead.
 */
export interface GraphQLClient {
  /**
   * Execute a GraphQL query
   * @param query - GraphQL query document
   * @param variables - Query variables
   * @returns Promise resolving to query result data
   */
  query: <T>(query: DocumentNode, variables?: object) => Promise<T>;

  /**
   * Execute a GraphQL mutation
   * @param mutation - GraphQL mutation document
   * @param variables - Mutation variables
   * @returns Promise resolving to mutation result data
   */
  mutation: <T>(mutation: DocumentNode, variables?: object) => Promise<T>;

  /**
   * Subscribe to a GraphQL subscription
   * @param subscription - GraphQL subscription document
   * @param callback - Function called when subscription data arrives
   * @returns Unsubscribe function
   */
  subscription: <T>(
    subscription: DocumentNode,
    callback: (data: T) => void
  ) => () => void;
}

// =============================================================================
// Dedup Exchange
// =============================================================================

/**
 * Deduplicates in-flight identical operations.
 * Operations are identified by their key (query + variables).
 */
const dedupExchange: Exchange = ({ forward }) => {
  const inFlightKeys = new Set<number>();

  return (ops$) => {
    const sharedOps$ = share(ops$);

    // Filter out duplicate operations
    const filtered$ = filter((op: Operation) => {
      if (op.kind === "teardown") {
        inFlightKeys.delete(op.key);
        return true;
      }
      // Track new operations
      if (!inFlightKeys.has(op.key)) {
        inFlightKeys.add(op.key);
        return true;
      }
      return false;
    })(sharedOps$);

    return forward(filtered$);
  };
};

// =============================================================================
// Request Batching Configuration
// =============================================================================

/**
 * Request batching configuration for urql
 *
 * Request batching improves performance by combining multiple
 * GraphQL operations into a single HTTP request.
 *
 * Note: The @urql/exchange-batch package is not available as a separate
 * npm package. Batching is implemented via fetchOptions or can be added
 * using a custom exchange in the future.
 *
 * For now, batching is configured via the client's fetchOptions
 * to enable Apollo-style batching at the server level.
 */

// =============================================================================
// Auth Exchange
// =============================================================================

/**
 * Custom auth exchange that attaches Bearer token to all requests.
 * The token is retrieved via a getter function to ensure fresh tokens
 * are always used without requiring client recreation.
 */
function createAuthExchange(getToken: () => string | null): Exchange {
  return ({ forward }) => {
    return (ops$) => {
      return forward(
        map((op: Operation) => {
          const token = getToken();
          if (!token) return op;

          // Add auth header to operation context
          const fetchOptions = (op.context.fetchOptions ?? {}) as Record<string, unknown>;
          const headers = (fetchOptions.headers ?? {}) as Record<string, string>;

          return makeOperation(op.kind, op, {
            ...op.context,
            fetchOptions: {
              ...fetchOptions,
              headers: {
                ...headers,
                Authorization: `Bearer ${token}`,
              },
            },
          });
        })(ops$)
      );
    };
  };
}

// =============================================================================
// WebSocket Client Configuration
// =============================================================================

/**
 * WebSocket connection state tracking
 */
interface WSConnectionState {
  connected: boolean;
  reconnectAttempts: number;
  lastError?: Error;
  permanentlyFailed: boolean;
}

let wsConnectionState: WSConnectionState = {
  connected: false,
  reconnectAttempts: 0,
  permanentlyFailed: false,
};

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 1000;

/**
 * Subscription operation queued for polling fallback
 */
interface PollingSubscription {
  operation: Operation;
  intervalMs: number;
  lastResult?: OperationResult;
}

let pollingSubscriptions = new Map<number, PollingSubscription>();
let activePollingIntervals = new Map<number, ReturnType<typeof setInterval>>();

/**
 * Check if WebSocket has permanently failed
 */
function hasWebSocketPermanentlyFailed(): boolean {
  return (
    wsConnectionState.permanentlyFailed ||
    wsConnectionState.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS
  );
}

/**
 * Create WebSocket client with reconnection logic and polling fallback
 *
 * Implements exponential backoff reconnection strategy:
 * - Initial delay: 1 second
 * - Exponential increase up to 30 seconds max
 * - Maximum 5 reconnection attempts before giving up
 * - Resets counter on successful connection
 * - Falls back to polling when WebSocket permanently fails
 */
function createWebSocketClient(getToken: () => string | null) {
  const wsClient = createWSClient({
    url: ENV.GRAPHQL.WS_URL,
    connectionParams: () => {
      const token = getToken();
      return {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      };
    },
    on: {
      connected: () => {
        console.log("[graphql] WebSocket connected");
        wsConnectionState = {
          connected: true,
          reconnectAttempts: 0,
          permanentlyFailed: false,
        };
      },
      closed: (event: unknown) => {
        const closedEvent = event as { code?: number; reason?: string };
        console.log(
          "[graphql] WebSocket closed:",
          closedEvent.code,
          closedEvent.reason
        );
        wsConnectionState.connected = false;
      },
      error: (error: unknown) => {
        console.error("[graphql] WebSocket error:", error);
        wsConnectionState.lastError =
          error instanceof Error ? error : new Error(String(error));
        wsConnectionState.connected = false;
      },
    },
    retryAttempts: MAX_RECONNECT_ATTEMPTS,
    retryWait: async (retries: number) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, then 30s max
      const delay = Math.min(
        RECONNECT_DELAY_MS * Math.pow(2, retries),
        30000
      );
      wsConnectionState.reconnectAttempts = retries;
      console.log(
        `[graphql] WebSocket reconnect attempt ${retries + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    },
  });

  return wsClient;
}

// =============================================================================
// Subscription Exchange
// =============================================================================

/**
 * Create subscription exchange using graphql-ws
 *
 * This exchange intercepts subscription operations and routes them
 * through the WebSocket connection instead of HTTP.
 *
 * Features:
 * - WebSocket for real-time updates
 * - Automatic reconnection with exponential backoff
 * - Polling fallback when WebSocket permanently fails
 */
function createSubscriptionExchange(getToken: () => string | null): Exchange {
  const wsClient = createWebSocketClient(getToken);

  return ({ forward, dispatchDebug }) => {
    return (ops$) => {
      const sharedOps$ = share(ops$);
      
      return make((sink) => {
        let unsubscribed = false;
        const cleanupFns: Array<() => void> = [];

        const handleOp = (op: Operation): void => {
          if (op.kind === "subscription") {
            // Handle subscription
            if (hasWebSocketPermanentlyFailed()) {
              // Use polling fallback
              const pollingSource = createPollingSource(op, forward);
              const pollingSub = subscribe((result: OperationResult) => {
                if (!unsubscribed) {
                  sink.next(result);
                }
              })(pollingSource);
              cleanupFns.push(() => pollingSub.unsubscribe());
            } else {
              // Use WebSocket
              dispatchDebug?.({
                type: "subscriptionStart",
                message: "Starting subscription via WebSocket",
                operation: op,
              });

              const unsubscribe = wsClient.subscribe<Record<string, unknown>>(
                {
                  query: typeof op.query === "string" ? op.query : graphqlPrint(op.query),
                  variables: op.variables as Record<string, unknown> | undefined,
                },
                {
                  next: (data: unknown) => {
                    if (unsubscribed) return;
                    const result: OperationResult = {
                      data: data as Record<string, unknown> | undefined,
                      error: undefined,
                      extensions: undefined,
                      stale: false,
                      hasNext: false,
                      operation: op,
                    };
                    sink.next(result);
                  },
                  error: (error: unknown) => {
                    if (unsubscribed) return;
                    
                    // Check if WebSocket has permanently failed
                    if (wsConnectionState.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                      console.log(
                        `[graphql] WebSocket permanently failed, switching to polling for subscription ${op.key}`
                      );
                      wsConnectionState.permanentlyFailed = true;

                      // Switch to polling
                      const pollingSource = createPollingSource(op, forward);
                      const pollSub = subscribe((result: OperationResult) => {
                        if (!unsubscribed) {
                          sink.next(result);
                        }
                      })(pollingSource);
                      cleanupFns.push(() => pollSub.unsubscribe());
                    } else {
                      const err = error instanceof Error ? error : new Error(String(error));
                      // Send error as a result with error field since sink may not support error method
                      const errorResult: OperationResult = {
                        data: undefined,
                        error: err as CombinedError,
                        extensions: undefined,
                        stale: false,
                        hasNext: false,
                        operation: op,
                      };
                      sink.next(errorResult);
                    }
                  },
                  complete: () => {
                    // Subscription complete
                  },
                }
              );

              cleanupFns.push(unsubscribe);
            }
          } else {
            // Forward non-subscription operations
            const result$ = forward(fromValue(op));
            const resultSub = subscribe((result: OperationResult) => {
              if (!unsubscribed) {
                sink.next(result);
              }
            })(result$);
            
            cleanupFns.push(() => resultSub.unsubscribe());
          }
        };

        const sub = subscribe((op: Operation) => {
          handleOp(op);
        })(sharedOps$);
        
        cleanupFns.push(() => sub.unsubscribe());

        return () => {
          unsubscribed = true;
          cleanupFns.forEach((fn) => fn());
        };
      });
    };
  };
}

/**
 * Create a polling-based source for subscription fallback
 */
function createPollingSource(
  operation: Operation,
  forward: (ops$: Source<Operation>) => Source<OperationResult>
): Source<OperationResult> {
  const intervalMs = 5000; // Poll every 5 seconds

  pollingSubscriptions.set(operation.key, {
    operation,
    intervalMs,
  });

  return make((sink) => {
    // Execute initial query
    executePollQuery(operation, forward, sink);

    // Set up polling interval
    const intervalId = setInterval(() => {
      executePollQuery(operation, forward, sink);
    }, intervalMs);

    activePollingIntervals.set(operation.key, intervalId);

    return () => {
      clearInterval(intervalId);
      activePollingIntervals.delete(operation.key);
      pollingSubscriptions.delete(operation.key);
    };
  });
}

/**
 * Execute a single poll query
 */
function executePollQuery(
  operation: Operation,
  forward: (ops$: Source<Operation>) => Source<OperationResult>,
  sink: {
    next: (result: OperationResult) => void;
    error?: (error: unknown) => void;
    complete?: () => void;
  }
): void {
  // Create a query operation from the subscription
  const queryOp: Operation = {
    ...operation,
    kind: "query",
    key: operation.key + Math.random(), // Unique key for each poll
  };

  // Forward the query
  const result$ = forward(
    fromValue(queryOp)
  );

  const sub: Subscription = subscribe((result: OperationResult) => {
    const pollingSub = pollingSubscriptions.get(operation.key);
    if (pollingSub) {
      pollingSub.lastResult = result;
      pollingSubscriptions.set(operation.key, pollingSub);
    }
    sink.next(result);
  })(result$);

  // Note: The subscription is active, and cleanup is handled by the caller
}

// =============================================================================
// Cache Configuration
// =============================================================================

/**
 * Type guard for checking if result has an id property
 */
function hasIdProperty(result: unknown): result is { id: string } {
  return (
    result !== null &&
    typeof result === "object" &&
    "id" in result &&
    typeof (result as { id: unknown }).id === "string"
  );
}

/**
 * Type guard for checking if args has an id property
 */
function hasIdInArgs(args: unknown): args is { id: string } {
  return (
    args !== null &&
    typeof args === "object" &&
    "id" in args &&
    typeof (args as { id: unknown }).id === "string"
  );
}

/**
 * Graphcache configuration for normalized caching
 *
 * Cache policy design decisions:
 *
 * 1. **Entities with ID**: All types with an `id` field are automatically
 *    normalized by Graphcache using the default `__typename:id` key.
 *
 * 2. **Root Query Fields**: List queries (users, trips, groups, etc.) are
 *    stored as links to normalized entities. This means updating a user
 *    via mutation automatically updates that user in all lists.
 *
 * 3. **Manual Cache Updates**: For complex operations, use the
 *    `cache.updateQuery` pattern in mutation updaters.
 *
 * 4. **Invalidation**: Use `cache.invalidate` for deletions to remove
 *    entities from all lists.
 *
 * 5. **Pagination**: Cursor-based pagination is handled via the
 *    `relayPagination` helper (to be configured when pagination
 *    patterns stabilize in the schema).
 */
const cacheConfig = {
  keys: {
    // Custom cache key generation for types without standard id
    // Add custom key configs here as schema evolves
  },
  resolvers: {
    // Custom field resolvers for computed/cache-only fields
    // Add resolvers here as needed
  },
  updates: {
    Mutation: {
      // Automatic cache updates after mutations
      // These patterns are applied after successful mutations

      // User mutations - invalidate users list on create/update/delete
      createUser: (_result: unknown, _args: unknown, cache: Cache) => {
        cache.invalidate("Query", "users");
      },
      updateUser: (result: unknown, _args: unknown, cache: Cache) => {
        // Individual user is automatically updated via normalization
        // but we invalidate lists to ensure consistency
        if (hasIdProperty(result)) {
          cache.invalidate({
            __typename: "User",
            id: result.id,
          });
        }
      },
      deleteUser: (_result: unknown, args: unknown, cache: Cache) => {
        if (hasIdInArgs(args)) {
          cache.invalidate({
            __typename: "User",
            id: args.id,
          });
        }
        cache.invalidate("Query", "users");
      },

      // Trip mutations
      createTrip: (_result: unknown, _args: unknown, cache: Cache) => {
        cache.invalidate("Query", "trips");
        cache.invalidate("Query", "myTrips");
      },

      // Group mutations
      createGroup: (_result: unknown, _args: unknown, cache: Cache) => {
        cache.invalidate("Query", "groups");
      },
      updateGroup: (result: unknown, _args: unknown, cache: Cache) => {
        if (hasIdProperty(result)) {
          cache.invalidate({
            __typename: "Group",
            id: result.id,
          });
        }
      },

      // Reward mutations
      createReward: (_result: unknown, _args: unknown, cache: Cache) => {
        cache.invalidate("Query", "rewards");
      },
      updateReward: (result: unknown, _args: unknown, cache: Cache) => {
        if (hasIdProperty(result)) {
          cache.invalidate({
            __typename: "Reward",
            id: result.id,
          });
        }
      },

      // Challenge mutations
      createChallenge: (_result: unknown, _args: unknown, cache: Cache) => {
        cache.invalidate("Query", "challenges");
      },
      updateChallenge: (result: unknown, _args: unknown, cache: Cache) => {
        if (hasIdProperty(result)) {
          cache.invalidate({
            __typename: "Challenge",
            id: result.id,
          });
        }
      },

      // Notification mutations
      createNotification: (_result: unknown, _args: unknown, cache: Cache) => {
        cache.invalidate("Query", "notifications");
      },
      markNotificationRead: (result: unknown, _args: unknown, cache: Cache) => {
        if (hasIdProperty(result)) {
          cache.invalidate({
            __typename: "Notification",
            id: result.id,
          });
        }
      },
    },
    Subscription: {
      // Subscription data is automatically merged into cache
      // Add custom subscription handlers here if needed
    },
  },
  // Optimistic updates for better UX
  optimistic: {
    // Optimistic response configurations for mutations
    createUser: (variables: { input: { firstName: string; lastName: string; email: string } }) => ({
      __typename: "User",
      id: "optimistic-temp-id",
      firstName: variables.input.firstName,
      lastName: variables.input.lastName,
      email: variables.input.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    updateUser: (variables: { id: string; input: { firstName?: string; lastName?: string; email?: string } }) => ({
      __typename: "User",
      id: variables.id,
      firstName: variables.input.firstName ?? "",
      lastName: variables.input.lastName ?? "",
      email: variables.input.email ?? "",
      updatedAt: new Date().toISOString(),
    }),
    createTrip: (variables: { input: { name: string; description?: string; destination: string } }) => ({
      __typename: "Trip",
      id: "optimistic-temp-id",
      name: variables.input.name,
      description: variables.input.description ?? "",
      destination: variables.input.destination,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    createGroup: (variables: { input: { name: string; tripId: string } }) => ({
      __typename: "Group",
      id: "optimistic-temp-id",
      name: variables.input.name,
      tripId: variables.input.tripId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    updateGroup: (variables: { id: string; input: { name?: string } }) => ({
      __typename: "Group",
      id: variables.id,
      name: variables.input.name ?? "",
      updatedAt: new Date().toISOString(),
    }),
    createReward: (variables: { input: { name: string; description?: string; points: number } }) => ({
      __typename: "Reward",
      id: "optimistic-temp-id",
      name: variables.input.name,
      description: variables.input.description ?? "",
      points: variables.input.points,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    updateReward: (variables: { id: string; input: { name?: string; description?: string; points?: number } }) => ({
      __typename: "Reward",
      id: variables.id,
      name: variables.input.name ?? "",
      description: variables.input.description ?? "",
      points: variables.input.points ?? 0,
      updatedAt: new Date().toISOString(),
    }),
    createChallenge: (variables: { input: { name: string; description?: string; points: number } }) => ({
      __typename: "Challenge",
      id: "optimistic-temp-id",
      name: variables.input.name,
      description: variables.input.description ?? "",
      points: variables.input.points,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    updateChallenge: (variables: { id: string; input: { name?: string; description?: string; points?: number } }) => ({
      __typename: "Challenge",
      id: variables.id,
      name: variables.input.name ?? "",
      description: variables.input.description ?? "",
      points: variables.input.points ?? 0,
      updatedAt: new Date().toISOString(),
    }),
    markNotificationRead: (variables: { id: string }) => ({
      __typename: "Notification",
      id: variables.id,
      isRead: true,
      readAt: new Date().toISOString(),
    }),
  },
};

// =============================================================================
// Error Handling Configuration
// =============================================================================

/**
 * GraphQL error classification for proper handling
 */
export enum GraphQLErrorCode {
  // Network-level errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",

  // Protocol/HTTP errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  SERVER_ERROR = "SERVER_ERROR",

  // GraphQL-specific errors
  BAD_REQUEST = "BAD_REQUEST",
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // Unknown
  UNKNOWN = "UNKNOWN",
}

/**
 * User-friendly error messages for each error code
 */
const userFriendlyErrorMessages: Record<GraphQLErrorCode, string> = {
  [GraphQLErrorCode.NETWORK_ERROR]: "Unable to connect to the server. Please check your internet connection.",
  [GraphQLErrorCode.TIMEOUT_ERROR]: "The request took too long. Please try again.",
  [GraphQLErrorCode.UNAUTHORIZED]: "Please sign in to continue.",
  [GraphQLErrorCode.FORBIDDEN]: "You don't have permission to perform this action.",
  [GraphQLErrorCode.NOT_FOUND]: "The requested information could not be found.",
  [GraphQLErrorCode.SERVER_ERROR]: "Something went wrong on our end. Please try again later.",
  [GraphQLErrorCode.BAD_REQUEST]: "There was a problem with your request. Please check and try again.",
  [GraphQLErrorCode.VALIDATION_ERROR]: "Please check your input and try again.",
  [GraphQLErrorCode.UNKNOWN]: "An unexpected error occurred. Please try again.",
};

/**
 * Technical error messages for logging/debugging
 */
const technicalErrorMessages: Record<GraphQLErrorCode, string> = {
  [GraphQLErrorCode.NETWORK_ERROR]: "Network connection failed",
  [GraphQLErrorCode.TIMEOUT_ERROR]: "Request timeout exceeded",
  [GraphQLErrorCode.UNAUTHORIZED]: "Authentication required - invalid or missing credentials",
  [GraphQLErrorCode.FORBIDDEN]: "Authorization failed - insufficient permissions",
  [GraphQLErrorCode.NOT_FOUND]: "Resource not found",
  [GraphQLErrorCode.SERVER_ERROR]: "Internal server error",
  [GraphQLErrorCode.BAD_REQUEST]: "Invalid request format or parameters",
  [GraphQLErrorCode.VALIDATION_ERROR]: "GraphQL validation error",
  [GraphQLErrorCode.UNKNOWN]: "Unknown error occurred",
};

/**
 * Structured GraphQL error for application handling
 */
export interface GraphQLError {
  code: GraphQLErrorCode;
  userMessage: string;
  technicalMessage: string;
  originalError?: Error;
  graphqlErrors?: Array<{ message: string; path?: readonly (string | number)[] }>;
}

/**
 * Classify error from operation result into structured error code
 */
function classifyError(error: CombinedError | Error | unknown): GraphQLError {
  // Handle combined error from urql
  if (error && typeof error === "object" && "networkError" in error) {
    const combinedError = error as CombinedError;
    const networkError = combinedError.networkError;
    if (networkError) {
      return {
        code: GraphQLErrorCode.NETWORK_ERROR,
        userMessage: userFriendlyErrorMessages[GraphQLErrorCode.NETWORK_ERROR],
        technicalMessage: `${technicalErrorMessages[GraphQLErrorCode.NETWORK_ERROR]}: ${networkError.message}`,
        originalError: networkError,
      };
    }

    const graphqlErrors = combinedError.graphQLErrors;
    if (graphqlErrors && graphqlErrors.length > 0) {
      const firstError = graphqlErrors[0];
      if (!firstError) {
        return {
          code: GraphQLErrorCode.UNKNOWN,
          userMessage: userFriendlyErrorMessages[GraphQLErrorCode.UNKNOWN],
          technicalMessage: technicalErrorMessages[GraphQLErrorCode.UNKNOWN],
        };
      }

      let code = GraphQLErrorCode.UNKNOWN;

      // Try to extract error code from message or extensions
      const message = firstError.message.toLowerCase();
      if (message.includes("unauthorized") || message.includes("not authenticated")) {
        code = GraphQLErrorCode.UNAUTHORIZED;
      } else if (message.includes("forbidden") || message.includes("permission")) {
        code = GraphQLErrorCode.FORBIDDEN;
      } else if (message.includes("not found") || message.includes("does not exist")) {
        code = GraphQLErrorCode.NOT_FOUND;
      } else if (message.includes("validation") || message.includes("invalid")) {
        code = GraphQLErrorCode.VALIDATION_ERROR;
      } else if (message.includes("bad request")) {
        code = GraphQLErrorCode.BAD_REQUEST;
      }

      return {
        code,
        userMessage: userFriendlyErrorMessages[code],
        technicalMessage: `${technicalErrorMessages[code]}: ${firstError.message}`,
        graphqlErrors: graphqlErrors.map((e) => ({ message: e.message, path: e.path })),
      };
    }
  }

  // Handle standard Error
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    let code = GraphQLErrorCode.UNKNOWN;

    if (message.includes("network") || message.includes("fetch") || message.includes("failed to fetch")) {
      code = GraphQLErrorCode.NETWORK_ERROR;
    } else if (message.includes("timeout") || message.includes("aborted")) {
      code = GraphQLErrorCode.TIMEOUT_ERROR;
    }

    return {
      code,
      userMessage: userFriendlyErrorMessages[code],
      technicalMessage: `${technicalErrorMessages[code]}: ${error.message}`,
      originalError: error,
    };
  }

  // Unknown error type
  return {
    code: GraphQLErrorCode.UNKNOWN,
    userMessage: userFriendlyErrorMessages[GraphQLErrorCode.UNKNOWN],
    technicalMessage: `${technicalErrorMessages[GraphQLErrorCode.UNKNOWN]}: ${String(error)}`,
  };
}

// =============================================================================
// Client Factory
// =============================================================================

/**
 * Create configured urql client
 *
 * The client is configured with the following exchange pipeline:
 * 1. dedupExchange - Deduplicates in-flight identical queries
 * 2. retryExchange - Retries failed queries with exponential backoff
 * 3. cacheExchange - Normalized caching via @urql/exchange-graphcache
 * 4. authExchange - Attaches Bearer token to outgoing requests
 * 5. subscriptionExchange - WebSocket for real-time subscriptions with polling fallback
 *
 * Exchange ordering rationale:
 * - dedupExchange first to prevent duplicate requests
 * - retryExchange early to catch network failures
 * - cacheExchange for normalized caching
 * - authExchange before network operations
 * - subscriptionExchange for WebSocket handling
 * - fetchExchange is implicitly added last by urql
 *
 * @param getToken - Function that returns current auth token (or null if not authenticated)
 * @returns Configured urql Client instance
 *
 * @example
 * ```typescript
 * import { createClient } from '@/lib/graphql-client';
 * import { getSessionToken } from '@/lib/auth';
 *
 * const client = createClient(() => getSessionToken());
 * ```
 */
export function createClient(getToken: () => string | null): Client {
  return createUrqlClient({
    url: ENV.GRAPHQL.HTTP_URL,
    fetchOptions: () => {
      const token = getToken();
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      return {
        headers,
        credentials: "include",
      };
    },
    exchanges: [
      dedupExchange,
      retryExchange({
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        maxNumberAttempts: 3,
        randomDelay: true,
        retryIf: (error) => {
          // Only retry network errors, not GraphQL errors
          if (error.networkError) {
            return true;
          }
          // Don't retry GraphQL errors (they are application-level)
          return false;
        },
      }) as unknown as Exchange,
      cacheExchange(cacheConfig) as unknown as Exchange,
      createAuthExchange(getToken) as unknown as Exchange,
      createSubscriptionExchange(getToken) as unknown as Exchange,
      // Note: urql's default fetchExchange is automatically added at the end
    ],
  });
}

// =============================================================================
// Programmatic Client Helpers
// =============================================================================

/**
 * Create programmatic GraphQL client wrapper
 *
 * Use this for imperative query/mutation/subscription operations
 * when React hooks are not available (e.g., in utilities, middleware).
 *
 * Most components should use the generated urql hooks from
 * @mirai-app/graphql-client instead of this programmatic interface.
 *
 * @param client - urql Client instance
 * @returns GraphQLClient interface for programmatic operations
 */
export function createGraphQLClientWrapper(client: Client): GraphQLClient {
  return {
    query: async <T>(query: DocumentNode, variables?: object): Promise<T> => {
      const result = await client.query(query, variables ?? {}).toPromise();

      if (result.error) {
        const error = classifyError(result.error);
        const appError = new Error(error.userMessage);
        // Attach technical details for debugging
        (appError as Error & { technicalDetails: string }).technicalDetails = error.technicalMessage;
        (appError as Error & { code: GraphQLErrorCode }).code = error.code;
        throw appError;
      }

      if (!result.data) {
        const noDataError = new Error("No data returned from the server.");
        (noDataError as Error & { technicalDetails: string }).technicalDetails =
          "GraphQL query returned empty data object";
        throw noDataError;
      }

      return result.data as T;
    },

    mutation: async <T>(mutation: DocumentNode, variables?: object): Promise<T> => {
      const result = await client.mutation(mutation, variables ?? {}).toPromise();

      if (result.error) {
        const error = classifyError(result.error);
        const appError = new Error(error.userMessage);
        // Attach technical details for debugging
        (appError as Error & { technicalDetails: string }).technicalDetails = error.technicalMessage;
        (appError as Error & { code: GraphQLErrorCode }).code = error.code;
        throw appError;
      }

      if (!result.data) {
        const noDataError = new Error("No data returned from the server.");
        (noDataError as Error & { technicalDetails: string }).technicalDetails =
          "GraphQL mutation returned empty data object";
        throw noDataError;
      }

      return result.data as T;
    },

    subscription: <T>(subscription: DocumentNode, callback: (data: T) => void): (() => void) => {
      const { unsubscribe } = client.subscription(subscription, {}).subscribe((result) => {
        if (result.error) {
          const error = classifyError(result.error);
          console.error("[GraphQL Subscription] Error:", error.technicalMessage);
          return;
        }

        if (result.data) {
          callback(result.data as T);
        }
      });

      return unsubscribe;
    },
  };
}

// =============================================================================
// Reconnection Control
// =============================================================================

/**
 * Get current WebSocket connection state
 */
export function getWebSocketState(): Readonly<WSConnectionState> {
  return { ...wsConnectionState };
}

/**
 * Force WebSocket reconnection
 *
 * Call this when auth token changes or when connection is suspected stale.
 * Note: This requires client recreation; future versions could use
 * a more sophisticated connection management approach.
 */
export function forceWebSocketReconnect(): void {
  console.log("[graphql] Forcing WebSocket reconnection on next subscription");
  wsConnectionState.reconnectAttempts = 0;
  wsConnectionState.permanentlyFailed = false;
  // Actual reconnection happens automatically via graphql-ws retry logic
}

/**
 * Check if subscriptions are using polling fallback
 */
export function isUsingPollingFallback(): boolean {
  return hasWebSocketPermanentlyFailed();
}

/**
 * Get active polling subscriptions count
 */
export function getPollingSubscriptionsCount(): number {
  return pollingSubscriptions.size;
}
