# GraphQL Frameworks Package - Server-Agnostic

## Overview

This package provides a **server-agnostic** GraphQL schema built with Pothos. It does NOT include server setup code - that belongs in the apps.

## What This Package Provides

- **Schema**: GraphQL schema built with Pothos (types, queries, mutations, subscriptions)
- **Types**: All GraphQL types, inputs, enums
- **GQL Operations**: `.graphql` files for all queries, mutations, and subscriptions
- **Generated Client**: TypeScript types and urql hooks from the schema
- **Context Interface**: `GraphQLContext` that apps must implement
- **Resolver Helpers**: `requireAuth`, `runEffect`, `mapErrorToGraphQL`
- **Plugins**: Relay (pagination), Dataloader (N+1 prevention)

## Pothos Plugins

The builder is configured with Relay and Dataloader plugins. To fully utilize these, the `PothosTypes` interface needs to be defined with Object mappings.

### Current Configuration

```typescript
// builder.ts
export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  Scalars: { DateTime: {...}; JSON: {...}; };
  // TODO: Add Objects mapping for Relay Node pattern
}>({
  plugins: [RelayPlugin, DataloaderPlugin],
  relay: {
    clientMutationId: "omit",
    cursorType: "String",
  },
});
```

### Relay Plugin (Configured)

Provides:
- **Global IDs**: Opaque base64-encoded `Type:id` identifiers  
- **Node Interface**: Standard Relay `Node` interface with `id` field
- **Connections**: Relay-style pagination with `edges`, `nodes`, `pageInfo`

**To use Relay patterns, add Objects to PothosTypes:**

```typescript
// builder.ts - Add to SchemaBuilder generic
export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  Scalars: { ... };
  Objects: {
    User: UserDTO;
    Trip: TripDTO;
    // ... other domain objects
  };
}>({
  plugins: [RelayPlugin, DataloaderPlugin],
  relay: { ... },
});
```

Then use in types:

```typescript
// Using Relay Node pattern
export const UserType = builder.node("User", {
  id: { resolve: (user) => user.id },
  fields: (t) => ({
    firstName: t.exposeString("firstName"),
  }),
});

// Using Relay Connection
export const UserConnectionType = builder.connection(
  { name: "UserConnection", node: UserType },
  { name: "UserEdge" }
);
```

### Dataloader Plugin (Configured)

Provides automatic batching for N+1 prevention:

```typescript
builder.objectType("Trip", {
  fields: (t) => ({
    id: t.exposeID("id"),
    // Automatically batched with dataloader
    participants: t.loadable({
      type: ["User"],
      load: (ids, context) => context.loaders.participants.loadMany(ids),
      resolve: (trip) => trip.id,
    }),
  }),
});
```

### Scope Auth Plugin - NOT USED

Authorization is handled **imperatively** in resolvers:

```typescript
builder.queryFields((t) => ({
  me: t.field({
    type: UserProfileType,
    resolve: async (_parent, _args, context) => {
      const auth = requireAuth(context);  // Explicit check
      // ... proceed with use case
    },
  }),
}));
```

**Why imperative over declarative?**
- **Explicit**: Auth logic is visible in resolver code
- **Simple**: No plugin configuration, no scope definitions  
- **Flexible**: Easy to add custom logic (e.g., "owner can edit")
- **Aligned**: Matches the "thin resolver" pattern from AGENTS.md

## Directory Structure

```
packages/frameworks/src/graphql/
├── builder.ts              # Pothos builder configuration
├── schema.ts               # Schema assembly (imports all types)
├── context.ts              # GraphQL context interface and helpers
├── errors.ts               # Error handling utilities
├── generate-schema.ts      # Script to generate schema.graphql from Pothos
├── codegen.ts              # GraphQL Codegen configuration
├── index.ts                # Main exports
├── schema.graphql          # Generated SDL schema (from Pothos)
├── gql/                    # GraphQL operation files (.graphql)
│   ├── README.md           # Documentation for .gql files
│   ├── fragments/          # Reusable fragments
│   ├── operations/         # Queries and mutations by domain
│   └── subscriptions/      # Real-time subscriptions
├── client/                 # Generated client types and hooks
│   ├── index.ts            # Client exports
│   └── generated/          # Generated files (types, operations, urql.ts)
└── types/                  # Pothos type definitions by domain
    ├── user/
    ├── trip/
    ├── group/
    └── ...
```

## Workflow: Pothos → Schema → Client

```
┌─────────────────────────────────────────┐
│         1. Pothos Schema               │
│    (packages/frameworks/graphql)        │
│                                         │
│  - builder.objectType("User", {...})    │
│  - builder.queryFields({...})           │
│  - builder.mutationFields({...})        │
└──────────────────┬──────────────────────┘
                   │
                   │ bun run sync:schema
                   ▼
┌─────────────────────────────────────────┐
│         2. schema.graphql               │
│                                         │
│  Generated SDL file used by codegen     │
└──────────────────┬──────────────────────┘
                   │
                   │
                   ▼
┌─────────────────────────────────────────┐
│         3. .gql Operations               │
│    (packages/frameworks/graphql/gql)    │
│                                         │
│  - fragments/user.graphql               │
│  - operations/user/queries.graphql      │
│  - subscriptions/location.graphql       │
└──────────────────┬──────────────────────┘
                   │
                   │ graphql-codegen
                   ▼
┌─────────────────────────────────────────┐
│         4. Generated Client             │
│  (packages/frameworks/graphql/client)   │
│                                         │
│  - types.ts     (TypeScript types)      │
│  - operations.ts (operation types)      │
│  - urql.ts      (typed hooks)           │
└──────────────────┬──────────────────────┘
                   │
                   │ Apps import from:
                   │ @mirai-app/frameworks/graphql/client
                   ▼
┌─────────────────────────────────────────┐
│              5. Apps                    │
│    (apps/web, apps/native)              │
│                                         │
│  import { useGetUserQuery } from        │
│    "@mirai-app/frameworks/graphql/client"│
└─────────────────────────────────────────┘
```

## Regenerating Client Types

When you modify the Pothos schema or `.graphql` files:

```bash
# Regenerate schema and client types
bun run --filter=@mirai-app/frameworks sync:schema
```

This will:
1. Generate `schema.graphql` from Pothos
2. Generate TypeScript types from the schema
3. Generate urql hooks from the `.gql` files

## What This Package Does NOT Provide

- ❌ HTTP server setup
- ❌ Auth token validation
- ❌ Effect Runtime creation
- ❌ WebSocket handling

## Architecture

```
┌─────────────────────────────────────────┐
│              App Layer                  │
│  (apps/backend-server, etc.)              │
│                                         │
│  ┌─────────────────────────────────┐      │
│  │  1. Extract auth token        │      │
│  │  2. Validate (AuthN)          │      │
│  │  3. Build AuthContext         │      │
│  │  4. Create Effect Runtime     │      │
│  │  5. Provide to GraphQL        │      │
│  └─────────────────────────────────┘      │
│                  │                      │
└──────────────────┼──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│       GraphQL Frameworks Package        │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  - Schema (Pothos)              │    │
│  │  - Types & Enums                │    │
│  │  - GQL Operations               │    │
│  │  - Generated Client             │    │
│  │  - Context Interface            │    │
│  │  - Resolver Helpers             │    │
│  └─────────────────────────────────┘    │
│                  │                      │
└──────────────────┼──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         Use Cases (Effect)              │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  - GetMyProfileUseCase          │    │
│  │  - CreateTripUseCase            │    │
│  │  - etc.                         │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Quick Start (For Apps)

### 1. Install Dependencies

```bash
# In your app (e.g., apps/backend-server)
bun add @mirai-app/frameworks graphql-yoga graphql
```

### 2. Setup GraphQL Router

```typescript
// apps/backend-server/src/graphql.ts
import { Hono } from "hono";
import { createYoga } from "graphql-yoga";
import { schema, type GraphQLContext } from "@mirai-app/frameworks/graphql";
import { makeAppLayer } from "@mirai-app/frameworks";
import { Effect, Layer } from "effect";

const app = new Hono();

// Build dependencies
const appLayer = makeAppLayer({ db, supabase });
const runtime = await Effect.runPromise(Layer.toRuntime(appLayer));

// Create Yoga
const yoga = createYoga({
  schema,
  context: async ({ request }): Promise<GraphQLContext> => {
    // App handles AuthN
    const token = extractToken(request);
    const authUser = await validateToken(token); // Your auth logic
    
    return {
      request,
      authContext: authUser ? {
        userId: authUser.id,
        role: authUser.role,  // "USER" | "ADMIN" | "MODERATOR"
      } : undefined,
      runtime,  // Pre-built with all deps
    };
  },
});

app.use("/graphql", yoga);
```

### 3. Using Generated Hooks in Frontend Apps

```typescript
// apps/web/src/components/UserProfile.tsx
import { useGetUserQuery } from "@mirai-app/frameworks/graphql/client";

export function UserProfile({ userId }: { userId: string }) {
  const [{ data, fetching, error }] = useGetUserQuery({
    variables: { id: userId },
  });

  if (fetching) return <Loading />;
  if (error) return <Error message={error.message} />;
  if (!data?.user) return <NotFound />;

  return (
    <div>
      <h1>{data.user.firstName} {data.user.lastName}</h1>
      <p>{data.user.email}</p>
    </div>
  );
}
```

### 4. Using Subscriptions

```typescript
// apps/native/src/hooks/useNotifications.ts
import { useNotificationReceivedSubscription } from "@mirai-app/frameworks/graphql/client";

export function useNotifications() {
  const [{ data, error }] = useNotificationReceivedSubscription();
  
  return {
    notification: data?.notificationReceived,
    error,
  };
}
```

### 5. Resolver Pattern

```typescript
// In @mirai-app/frameworks/graphql (this package)
import { builder } from "@mirai-app/frameworks/graphql";
import { GetMyProfileUseCase } from "@mirai-app/use-cases/user";
import { requireAuth, runEffect } from "@mirai-app/frameworks/graphql";

builder.queryFields((t) => ({
  me: t.field({
    type: UserProfileType,
    resolve: async (_parent, _args, context) => {
      // AuthZ: Check authentication
      const auth = requireAuth(context);
      
      // Use case execution
      const useCase = new GetMyProfileUseCase();
      const effect = useCase.execute({ userId: auth.userId });
      
      // Execute with app's runtime
      return runEffect(context, effect);
    },
  }),
}));
```

## AuthN vs AuthZ

### AuthN (Authentication) - App Responsibility

**Where**: In the app's context factory  
**What**: Validating tokens, identifying users

```typescript
context: async ({ request }) => {
  // AuthN: Who is this user?
  const token = extractToken(request);
  const user = await validateToken(token); // Uses AuthNPort
  
  return {
    authContext: user ? { userId: user.id, role: user.role } : undefined,
    // ...
  };
}
```

### AuthZ (Authorization) - Resolver Responsibility

**Where**: In GraphQL resolvers  
**What**: Checking permissions, role-based access

```typescript
resolve: async (_parent, args, context) => {
  // AuthZ: Is this user allowed?
  const auth = requireAdmin(context);  // Throws if not admin
  
  // Proceed with use case...
}
```

## API Reference

### Client Imports (For Frontend Apps)

```typescript
// Main client exports
import { 
  useGetUserQuery,
  useUpdateMyProfileMutation,
  useNotificationReceivedSubscription,
  type User,
  type Trip,
} from "@mirai-app/frameworks/graphql/client";

// Specific exports
import type { User, Trip } from "@mirai-app/frameworks/graphql/client/types";
import type { GetUserQuery } from "@mirai-app/frameworks/graphql/client/operations";
```

### Context Interface (For Backend Apps)

```typescript
interface GraphQLContext {
  request: Request;                    // Original HTTP request
  authContext?: AuthContext;           // From app's AuthN
  runtime: Runtime.Runtime<unknown>;   // Effect runtime from app
}

interface AuthContext {
  userId: string;
  role: "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
  email?: string | null;
}
```

### Resolver Helpers

```typescript
// AuthZ helpers
requireAuth(context)       // Throws if no auth context
requireAdmin(context)      // Throws if not admin
requireModerator(context)  // Throws if not moderator/admin
getOptionalAuth(context)   // Returns null if no auth

// Effect execution
runEffect(context, effect)  // Execute Effect with app's runtime

// Error handling
mapErrorToGraphQL(error)    // Convert errors to GraphQL format
```

## Full Example

See `example-app-setup.ts` in this directory for a complete working example including:
- Token extraction
- AuthN with use cases
- AuthZ in resolvers
- WebSocket subscriptions
- Testing setup

## Exports

```typescript
// Schema and types
import { schema, builder } from "@mirai-app/frameworks/graphql";

// Client (generated types and hooks)
import { useGetUserQuery, type User } from "@mirai-app/frameworks/graphql/client";

// Context helpers
import { requireAuth, requireAdmin, runEffect } from "@mirai-app/frameworks/graphql";

// Error handling
import { mapErrorToGraphQL } from "@mirai-app/frameworks/graphql";

// Subscriptions
import { pubsub } from "@mirai-app/frameworks/graphql";
```
