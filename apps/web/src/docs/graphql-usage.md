# GraphQL Hooks Usage Guide

This guide explains how to use the generated GraphQL hooks with urql in the Mirai web application.

## Overview

The `@mirai-app/graphql-client` package provides TypeScript types and urql hooks generated from the GraphQL schema. These hooks integrate seamlessly with urql for data fetching, caching, and state management.

## Setup

### 1. Provider Setup

First, ensure your application is wrapped with the `QueryProvider` component (which uses urql's Provider internally):

```tsx
// src/components/QueryProvider.tsx
import { Provider as UrqlProvider } from "urql";
import { urqlClient } from "../lib/urql-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <UrqlProvider value={urqlClient}>{children}</UrqlProvider>;
}
```

Wrap your app with the provider:

```tsx
// In your root component
import { QueryProvider } from "@/components/QueryProvider";

function App() {
  return (
    <QueryProvider>
      <YourApp />
    </QueryProvider>
  );
}
```

### 2. Urql Client Setup

The urql client is pre-configured in `src/lib/urql-client.ts` with:

- Automatic authentication via cookies
- Cache normalization with graphcache
- WebSocket subscription support
- Retry logic for failed requests

No manual client setup is needed - just import and use the hooks!

## Importing Hooks

Import hooks from the `@mirai-app/graphql-client/urql` subpath:

```typescript
import {
  // Query hooks
  useGetUserQuery,
  useGetTripsQuery,
  useGetCurrentUserQuery,
  useGetTripQuery,

  // Mutation hooks
  useCreateTripMutation,
  useUpdateTripMutation,
  useDeleteTripMutation,

  // Types
  type GetUserQuery,
  type GetTripsQuery,
  type CreateTripMutation,
} from "@mirai-app/graphql-client/urql";
```

## Using Query Hooks

### Basic Usage

All query hooks follow urql's standard pattern:

```typescript
const [{ data, fetching, error }, reexecute] = useGetUserQuery({
  variables, // Query variables
  pause, // Disable the query (optional)
  requestPolicy, // Cache policy: 'cache-first', 'cache-and-network', etc.
});
```

### Example: Fetching a User

```tsx
import { useGetUserQuery } from "@mirai-app/graphql-client/urql";

function UserProfile({ userId }: { userId: string }) {
  const [{ data, fetching, error }] = useGetUserQuery({
    variables: { id: userId },
    pause: !userId, // Only run when userId exists
  });

  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>{data?.user?.fullName}</h1>
      <p>Role: {data?.user?.role}</p>
    </div>
  );
}
```

### Example: Fetching Trips with Pagination

```tsx
import { useGetTripsQuery } from "@mirai-app/graphql-client/urql";
import { useState } from "react";

function TripList() {
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
  });

  const [{ data, fetching }] = useGetTripsQuery({
    variables: { pagination },
    requestPolicy: "cache-and-network",
  });

  const trips = data?.trips?.trips ?? [];
  const hasMore = data?.trips?.pagination?.hasMore;

  return (
    <div>
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}

      {fetching && <p>Loading more...</p>}

      {hasMore && (
        <button
          onClick={() =>
            setPagination((p) => ({ ...p, offset: p.offset + p.limit }))
          }
        >
          Load More
        </button>
      )}
    </div>
  );
}
```

### Example: Current User (No Variables)

```tsx
import { useGetCurrentUserQuery } from "@mirai-app/graphql-client/urql";

function UserMenu() {
  const [{ data }] = useGetCurrentUserQuery({
    requestPolicy: "cache-and-network",
  });

  if (!data?.me) return <p>Not logged in</p>;

  return <p>Welcome, {data.me.fullName}!</p>;
}
```

## Using Mutation Hooks

Mutation hooks follow urql's pattern:

```typescript
const [{ data, fetching, error }, execute] = useCreateTripMutation();
```

### Example: Creating a Trip

```tsx
import { useCreateTripMutation } from "@mirai-app/graphql-client/urql";
import { useClient } from "urql";

function CreateTripForm() {
  const urqlClient = useClient();
  const [{ fetching }, createTrip] = useCreateTripMutation();

  const handleSubmit = async (formData: CreateTripInput) => {
    const result = await createTrip({ input: formData });

    if (result.error) {
      console.error("Failed to create trip:", result.error);
      return;
    }

    console.log("Created trip:", result.data?.createTrip.id);

    // Invalidate cache to refresh trips list
    await urqlClient.invalidate("GetTrips");
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={fetching}>
        {fetching ? "Creating..." : "Create Trip"}
      </button>
    </form>
  );
}
```

## Cache Invalidation

Urql provides cache invalidation methods on the client:

```typescript
import { useClient } from "urql";

function MyComponent() {
  const client = useClient();

  // Invalidate specific query
  const refreshTrips = () => {
    client.invalidate("GetTrips");
  };

  // Invalidate with variables
  const refreshUser = (userId: string) => {
    client.invalidate("GetUser", { id: userId });
  };

  return <button onClick={refreshTrips}>Refresh</button>;
}
```

## Common Patterns

### Conditional Queries

```tsx
const [{ data }] = useGetUserQuery({
  variables: { id: userId },
  pause: !userId, // Only fetch when userId exists
});
```

### Polling/Refetching

```tsx
const [{ data }, reexecute] = useGetTripsQuery({
  variables,
  requestPolicy: "cache-and-network",
});

// Manual refetch
const refresh = () => reexecute({ requestPolicy: "network-only" });
```

### Imperative Queries (Outside of Components)

For raw GraphQL queries outside of React hooks:

```tsx
import { urqlClient } from "../lib/urql-client";

const result = await urqlClient
  .query(
    `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`,
    { id: "user-123" },
  )
  .toPromise();
```

## Adding New GraphQL Operations

### 1. Define the Operation

Add your GraphQL operation to the appropriate file in `packages/graphql-client/src/generated/graphql/operations/`:

```graphql
# packages/graphql-client/src/generated/graphql/operations/my-feature.queries.graphql

fragment MyFeatureFields on MyFeature {
  id
  name
  createdAt
}

query GetMyFeatures($filter: MyFeatureFilterInput) {
  myFeatures(filter: $filter) {
    ...MyFeatureFields
  }
}

mutation CreateMyFeature($input: CreateMyFeatureInput!) {
  createMyFeature(input: $input) {
    ...MyFeatureFields
  }
}
```

### 2. Regenerate Hooks

Run the codegen command:

```bash
cd packages/graphql-client
bun run generate
```

### 3. Use the Generated Hook

```tsx
import { useGetMyFeaturesQuery } from "@mirai-app/graphql-client/urql";
```

## Available Hooks

### User Queries

- `useGetUserQuery` - Get user by ID
- `useGetCurrentUserQuery` - Get current authenticated user

### Trip Queries

- `useGetTripQuery` - Get trip by ID
- `useGetTripsQuery` - Get all trips (with pagination)

### Trip Mutations

- `useCreateTripMutation` - Create a new trip
- `useUpdateTripMutation` - Update an existing trip
- `useDeleteTripMutation` - Delete a trip

> **Note:** More hooks are generated as GraphQL operations are added. Check the generated file at `packages/graphql-client/src/generated/urql.ts` for the complete list.

## Troubleshooting

### Hook returns undefined data

Ensure:

1. The `QueryProvider` is properly set up with urql's Provider
2. The urql client has the correct endpoint configured
3. Authentication is handled via cookies (automatic)

### Type errors

If you see type errors:

1. Run `bun run generate` in `packages/graphql-client`
2. Restart your TypeScript server
3. Check that you're importing from `@mirai-app/graphql-client/urql`

### Caching issues

To debug cache issues:

```tsx
// Enable urql devtools in urql-client.ts
import { devtoolsExchange } from "@urql/devtools";

// Add to exchanges array
exchanges: [devtoolsExchange, cacheExchange, fetchExchange];
```

## Best Practices

1. **Use requestPolicy Wisely**: Use `cache-and-network` for fresh data, `cache-first` for performance
2. **Use pause for Conditional Queries**: Instead of `enabled`, use urql's `pause` option
3. **Handle Loading States**: Use `fetching` state for loading indicators
4. **Error Boundaries**: Wrap components in error boundaries for graceful failures
5. **Cache Invalidation**: Use `client.invalidate()` for manual cache invalidation
6. **Subscriptions**: Use `useSubscription` for real-time updates via WebSocket
