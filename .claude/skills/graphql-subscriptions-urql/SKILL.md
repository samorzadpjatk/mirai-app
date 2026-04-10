---
name: graphql-subscriptions-urql
description: GraphQL Subscriptions with urql, graphql-ws, and Pothos - patterns and best practices for real-time APIs
tags: [graphql, subscriptions, urql, pothos, websockets, realtime]
---

# GraphQL Subscriptions with urql and Pothos

## Overview

This skill covers implementing GraphQL subscriptions end-to-end: from Pothos schema definition through Bun WebSocket server to urql clients in React/React Native.

## Technology Stack

### Backend

- **Bun** - Native WebSocket support via `Bun.serve()` with `websocket` handler
- **Hono** - Lightweight framework with `hono/bun` WebSocket helpers
- **graphql-ws** - GraphQL over WebSocket protocol implementation
- **Pothos** - Code-first schema builder with subscription support
- **graphql-yoga** - GraphQL server with WebSocket integration

### Frontend

- **urql** - Lightweight GraphQL client with excellent subscription support
- **@urql/exchange-graphcache** - Normalized cache with optimistic updates
- **wonka** - Push-based streams (used internally by urql)

### Code Generation

- **typescript-urql** - Generates typed urql hooks
- **typescript-graphql-request** - Generates typed SDK for backend apps

## Backend Implementation

### 1. Bun Native WebSocket Server

```typescript
// apps/backend-server/src/websocket-server.ts
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { makeHandler } from "graphql-ws/lib/use/ws";
import { schema } from "./graphql/schema";

// For Bun, use native WebSocket
export function createBunWebSocketServer(port: number) {
  return Bun.serve({
    port,
    fetch(req, server) {
      // Handle HTTP requests
      if (req.url?.includes("/graphql")) {
        return yoga.handle(req);
      }

      // Handle WebSocket upgrade
      if (req.url?.includes("/graphql/ws")) {
        const success = server.upgrade(req, {
          data: { authContext: extractAuthFromRequest(req) },
        });
        return success
          ? undefined
          : new Response("WebSocket upgrade failed", { status: 400 });
      }

      return new Response("Not found", { status: 404 });
    },
    websocket: {
      async open(ws) {
        // Subscribe to PubSub events for this connection
      },
      async message(ws, message) {
        // Handle GraphQL WS protocol messages
      },
      async close(ws) {
        // Cleanup subscriptions
      },
    },
  });
}
```

### 2. Pothos Subscription Types

```typescript
// apps/backend-server/src/graphql/types/subscriptions.ts
import { builder } from "../builder";

// Define subscription type
builder.subscriptionType({
  authScopes: {
    authenticated: true,
  },
});

// Activity feed subscription
builder.subscriptionField("activityFeedUpdated", (t) =>
  t.field({
    type: "Activity",
    args: {
      tripId: t.arg.id({ required: true }),
    },
    subscribe: async function* (parent, args, context) {
      const pubsub = context.container.resolve("pubSubService");
      const channel = `activity:feed:${args.tripId}`;

      for await (const activity of pubsub.subscribe(channel)) {
        yield activity;
      }
    },
    resolve: (activity) => activity,
  }),
);

// Location updates subscription
builder.subscriptionField("locationUpdated", (t) =>
  t.field({
    type: "FriendLocation",
    args: {
      userIds: t.arg.idList({ required: true }),
    },
    subscribe: async function* (parent, args, context) {
      const pubsub = context.container.resolve("pubSubService");

      // Subscribe to multiple user channels
      const channels = args.userIds.map((id) => `location:${id}`);

      for await (const location of pubsub.subscribeMany(channels)) {
        yield location;
      }
    },
    resolve: (location) => location,
  }),
);

// Challenge voting updates
builder.subscriptionField("challengeVotingUpdated", (t) =>
  t.field({
    type: "VotingProgress",
    args: {
      challengeId: t.arg.id({ required: true }),
    },
    subscribe: async function* (parent, args, context) {
      const pubsub = context.container.resolve("pubSubService");

      for await (const progress of pubsub.subscribe(
        `voting:${args.challengeId}`,
      )) {
        yield progress;
      }
    },
    resolve: (progress) => progress,
  }),
);
```

### 3. PubSub Service Port (Use Cases Layer)

```typescript
// packages/use-cases/src/ports/PubSubService.ts
export interface PubSubService {
  /** Subscribe to a single channel */
  subscribe<T>(channel: string): AsyncIterableIterator<T>;

  /** Subscribe to multiple channels */
  subscribeMany<T>(channels: string[]): AsyncIterableIterator<T>;

  /** Publish event to channel */
  publish<T>(channel: string, payload: T): Promise<void>;

  /** Unsubscribe from channel */
  unsubscribe(channel: string): Promise<void>;
}

// Implementation using EventEmitter or Redis
// packages/adapters/src/services/EventEmitterPubSub.ts
import { EventEmitter } from "node:events";

export class EventEmitterPubSub implements PubSubService {
  private emitter = new EventEmitter();

  async *subscribe<T>(channel: string): AsyncIterableIterator<T> {
    const queue: T[] = [];
    let resolveNext: ((value: T) => void) | null = null;

    const handler = (data: T) => {
      if (resolveNext) {
        resolveNext(data);
        resolveNext = null;
      } else {
        queue.push(data);
      }
    };

    this.emitter.on(channel, handler);

    try {
      while (true) {
        if (queue.length > 0) {
          yield queue.shift()!;
        } else {
          yield new Promise<T>((resolve) => {
            resolveNext = resolve;
          });
        }
      }
    } finally {
      this.emitter.off(channel, handler);
    }
  }

  async publish<T>(channel: string, payload: T): Promise<void> {
    this.emitter.emit(channel, payload);
  }
}
```

### 4. WebSocket Authentication

```typescript
// apps/backend-server/src/graphql/auth/websocket-auth.ts
import type { Context } from "graphql-ws";

export async function handleWebSocketAuth(
  ctx: Context,
  msg: ConnectionInitMessage,
) {
  // Extract token from connection params or cookie
  const token = extractToken(ctx.request);

  if (!token) {
    throw new Error("Unauthorized: No authentication token");
  }

  // Verify with Supabase or auth service
  const user = await verifyToken(token);

  if (!user) {
    throw new Error("Unauthorized: Invalid token");
  }

  // Return auth context for all operations
  return {
    userId: user.id,
    role: user.role,
    tripIds: user.accessibleTrips,
  };
}

// Cookie extraction for same-domain setup
function extractToken(request: Request): string | null {
  // First check cookies (for same-domain WebSocket)
  const cookie = request.headers.get("cookie");
  if (cookie) {
    const match = cookie.match(/auth-token=([^;]+)/);
    if (match) return match[1];
  }

  // Fallback to connection params
  const url = new URL(request.url);
  return url.searchParams.get("token");
}
```

## Frontend Implementation (urql)

### 1. Web Client Setup

```typescript
// apps/web/src/lib/urql-client.ts
import {
  createClient,
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
} from "@urql/core";
import { createGraphQLErrorHandler } from "@urql/core exchanges";
import { retryExchange } from "@urql/exchange-retry";

// For WebSocket, use native WebSocket with graphql-ws protocol
const wsClient = createWSClient({
  url: `${window.location.origin.replace("http", "ws")}/graphql/ws`,
  connectionParams: () => {
    // Cookies are sent automatically for same-domain
    return {};
  },
});

export const urqlClient = createClient({
  url: "/graphql",
  exchanges: [
    cacheExchange,
    retryExchange({
      initialDelayMs: 1000,
      maxDelayMs: 15000,
      randomDelay: true,
      maxNumberAttempts: 3,
      retryWith(error, operation) {
        if (error.networkError) {
          return operation;
        }
        return null;
      },
    }),
    fetchExchange,
    subscriptionExchange({
      forwardSubscription: (request) => ({
        subscribe: (sink) => ({
          unsubscribe: wsClient.subscribe(request, sink),
        }),
      }),
    }),
  ],
  fetchOptions: {
    credentials: "include", // Send cookies
  },
});
```

### 2. Native Client Setup

```typescript
// apps/native/src/lib/urql-client.ts
import {
  createClient,
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
} from "@urql/core";
import * as SecureStore from "expo-secure-store";
import { WebSocket } from "react-native-websocket"; // or native WebSocket

async function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync("sb-access-token");
}

const wsUrl =
  process.env.EXPO_PUBLIC_GRAPHQL_WS_URL || "ws://localhost:4000/graphql/ws";

export const createNativeClient = async () => {
  const token = await getAuthToken();

  return createClient({
    url: process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
    exchanges: [
      cacheExchange,
      fetchExchange,
      subscriptionExchange({
        forwardSubscription: (request) => {
          const ws = new WebSocket(wsUrl, "graphql-transport-ws", {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });

          return {
            subscribe: (sink) => {
              ws.onopen = () => {
                ws.send(JSON.stringify({ type: "connection_init" }));
              };

              ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === "next") {
                  sink.next(message.payload);
                } else if (message.type === "error") {
                  sink.error(message.payload);
                } else if (message.type === "complete") {
                  sink.complete();
                }
              };

              ws.onerror = (error) => sink.error(error);
              ws.onclose = () => sink.complete();

              // Send subscription request
              ws.send(
                JSON.stringify({
                  type: "subscribe",
                  id: request.key,
                  payload: {
                    query: request.query,
                    variables: request.variables,
                  },
                }),
              );
            },
            unsubscribe: () => {
              ws.send(JSON.stringify({ type: "complete", id: request.key }));
              ws.close();
            },
          };
        },
      }),
    ],
    fetchOptions: async () => {
      const token = await getAuthToken();
      return {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      };
    },
  });
};
```

### 3. Using Subscriptions in Components

```typescript
// apps/native/src/hooks/useActivityFeedSubscription.ts
import { useSubscription } from "urql";
import { useActivityFeedUpdatedSubscription } from "@mirai-app/graphql-types";

export function useActivityFeedSubscription(tripId: string) {
  const [{ data, error }] = useSubscription(
    {
      query: `
        subscription ActivityFeedUpdated($tripId: ID!) {
          activityFeedUpdated(tripId: $tripId) {
            id
            title
            description
            activityType
            createdAt
          }
        }
      `,
      variables: { tripId },
    },
    (prev, next) => {
      // Merge new activity into existing list
      return prev
        ? [next.activityFeedUpdated, ...prev]
        : [next.activityFeedUpdated];
    },
  );

  return { newActivity: data?.activityFeedUpdated, error };
}
```

## Code Generation Configuration

```typescript
// packages/graphql-types/codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/graphql/schema.graphql",
  documents: "src/graphql/**/*.graphql",
  generates: {
    // For frontend apps (urql hooks)
    "src/generated/urql.ts": {
      plugins: ["typescript", "typescript-operations", "typescript-urql"],
      config: {
        withHooks: true,
        urqlImportFrom: "@urql/core",
      },
    },
    // For backend apps (graphql-request SDK)
    "src/generated/sdk.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-graphql-request",
      ],
      config: {
        rawRequest: false,
        documentMode: "documentNode",
      },
    },
  },
};

export default config;
```

## GraphQL Subscription Operations

```graphql
# packages/graphql-types/src/graphql/subscriptions/activity.subscriptions.graphql
subscription ActivityFeedUpdated($tripId: ID!) {
  activityFeedUpdated(tripId: $tripId) {
    id
    tripId
    activityType
    title
    description
    imageUrl
    isPinned
    createdAt
    admin {
      id
      firstName
      lastName
    }
  }
}

subscription LocationUpdated($userIds: [ID!]!) {
  locationUpdated(userIds: $userIds) {
    id
    userId
    latitude
    longitude
    accuracy
    heading
    speed
    timestamp
  }
}

subscription ChallengeVotingUpdated($challengeId: ID!) {
  challengeVotingUpdated(challengeId: $challengeId) {
    challengeId
    totalVotes
    remainingVotes
    isComplete
    rankings {
      submissionId
      rank
      voteCount
    }
  }
}
```

## Migration Strategy from TanStack Query

### 1. Gradual Migration

- Keep existing TanStack Query for queries/mutations
- Add urql only for subscriptions initially
- Migrate queries/mutations incrementally

### 2. Full Migration

- Replace all TanStack Query hooks with urql
- Use `useQuery`, `useMutation`, `useSubscription` from urql
- Update cache policies to use graphcache

### Cache Migration

```typescript
// Before (TanStack Query)
const { data } = useGetActivitiesByTripQuery({ tripId });

// After (urql)
const [{ data }] = useGetActivitiesByTripQuery({ variables: { tripId } });
```

## Testing Subscriptions

```typescript
// Test setup for subscription resolvers
describe("[UNIT] ActivityFeed Subscription", () => {
  it("publishes new activities to subscribers", async () => {
    const pubsub = new EventEmitterPubSub();
    const results: Activity[] = [];

    // Subscribe
    const subscription = pubsub.subscribe<Activity>("activity:feed:trip-1");

    // Collect results
    (async () => {
      for await (const activity of subscription) {
        results.push(activity);
      }
    })();

    // Publish
    await pubsub.publish("activity:feed:trip-1", {
      id: "1",
      title: "New Activity",
    });

    // Verify
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("New Activity");
  });
});
```

## Common Pitfalls

1. **WebSocket Auth Timing** - Send auth before subscriptions, handle reconnects
2. **Memory Leaks** - Always unsubscribe in cleanup functions
3. **Backpressure** - Handle slow consumers in high-frequency updates
4. **Connection Recovery** - Implement exponential backoff for reconnects
5. **SSR Compatibility** - Disable subscriptions during server-side rendering

## References

- [graphql-ws Protocol](https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md)
- [urql Subscriptions](https://formidable.com/open-source/urql/docs/advanced/subscriptions/)
- [Pothos Subscriptions](https://pothos-graphql.dev/docs/guide/subscriptions)
- [Bun WebSocket Docs](https://bun.sh/docs/api/websockets)
