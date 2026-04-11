# GraphQL Hooks Usage Guide

This guide explains how to use the generated GraphQL hooks in the Mirai web application.

## Overview

The `@mirai-app/graphql-client` package provides TypeScript types and React Query hooks generated from the GraphQL schema. These hooks integrate seamlessly with TanStack Query for data fetching, caching, and state management.

## Setup

### 1. Provider Setup

First, ensure your application is wrapped with the `QueryProvider` component:

```tsx
// src/components/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnReconnect: true, // Refetch on network reconnect
        retry: 1, // Retry once on failure
        gcTime: 10 * 60 * 1000, // Cache for 10 minutes
      },
    },
  });

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
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

### 2. GraphQL Client Setup

The generated hooks require a `GraphQLClient` instance from `graphql-request`:

```tsx
import { GraphQLClient } from "graphql-request";

const client = new GraphQLClient("https://your-api.com/graphql", {
  headers: () => {
    const token = getAuthToken(); // Your auth logic
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
```

## Importing Hooks

Import hooks from the `@mirai-app/graphql-client` package:

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
} from "@mirai-app/graphql-client";
```

## Using Query Hooks

### Basic Usage

All query hooks follow this pattern:

```typescript
const { data, isLoading, error, refetch } = useGetUserQuery(
  client, // GraphQLClient instance (required)
  variables, // Query variables (required if query has parameters)
  options, // TanStack Query options (optional)
  headers, // Additional headers (optional)
);
```

### Example: Fetching a User

```tsx
import { useGetUserQuery } from "@mirai-app/graphql-client";
import { GraphQLClient } from "graphql-request";

function UserProfile({ userId }: { userId: string }) {
  const client = new GraphQLClient("/graphql");

  const { data, isLoading, error } = useGetUserQuery(
    client,
    { id: userId },
    {
      staleTime: 60000, // Override default stale time
      enabled: !!userId, // Only run when userId exists
    },
  );

  if (isLoading) return <p>Loading...</p>;
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
import { useGetTripsQuery } from "@mirai-app/graphql-client";

function TripList() {
  const client = new GraphQLClient("/graphql");

  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
  });

  const { data, isLoading, isFetching } = useGetTripsQuery(
    client,
    { pagination },
    {
      placeholderData: (previousData) => previousData, // Keep old data while fetching
    },
  );

  const trips = data?.trips?.trips ?? [];
  const hasMore = data?.trips?.pagination?.hasMore;

  return (
    <div>
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}

      {isFetching && <p>Loading more...</p>}

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
import { useGetCurrentUserQuery } from "@mirai-app/graphql-client";

function UserMenu() {
  const client = new GraphQLClient("/graphql");

  const { data } = useGetCurrentUserQuery(
    client,
    undefined, // No variables required
    { staleTime: 30000 },
  );

  if (!data?.me) return <p>Not logged in</p>;

  return <p>Welcome, {data.me.fullName}!</p>;
}
```

## Using Mutation Hooks

Mutation hooks follow a similar pattern:

```typescript
const { mutate, mutateAsync, isPending, error } = useCreateTripMutation(
  client, // GraphQLClient instance (required)
  options, // TanStack Query mutation options (optional)
);
```

### Example: Creating a Trip

```tsx
import { useCreateTripMutation } from "@mirai-app/graphql-client";
import { useQueryClient } from "@tanstack/react-query";

function CreateTripForm() {
  const client = new GraphQLClient("/graphql");
  const queryClient = useQueryClient();

  const { mutate, isPending } = useCreateTripMutation(client, {
    onSuccess: () => {
      // Invalidate and refetch trips list
      queryClient.invalidateQueries({ queryKey: ["GetTrips"] });
    },
  });

  const handleSubmit = (formData: CreateTripInput) => {
    mutate(
      { input: formData },
      {
        onSuccess: (data) => {
          console.log("Created trip:", data.createTrip.id);
        },
        onError: (error) => {
          console.error("Failed to create trip:", error);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button disabled={isPending}>
        {isPending ? "Creating..." : "Create Trip"}
      </button>
    </form>
  );
}
```

## Query Keys

Each generated hook provides a `getKey` function for cache management:

```typescript
// Get the query key for a specific user
const userQueryKey = useGetUserQuery.getKey({ id: "user-123" });
// Result: ['GetUser', { id: 'user-123' }]

// Invalidate specific user cache
queryClient.invalidateQueries({ queryKey: userQueryKey });

// Or invalidate all user queries
queryClient.invalidateQueries({ queryKey: ["GetUser"] });
```

## Common Patterns

### Conditional Queries

```tsx
const { data } = useGetUserQuery(
  client,
  { id: userId },
  { enabled: !!userId }, // Only fetch when userId exists
);
```

### Polling/Refetching

```tsx
const { data } = useGetTripsQuery(client, variables, {
  refetchInterval: 30000, // Refetch every 30 seconds
  refetchIntervalInBackground: true,
});
```

### Optimistic Updates

```tsx
const { mutate } = useUpdateTripMutation(client, {
  onMutate: async (newTrip) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["GetTrips"] });

    // Snapshot previous value
    const previousTrips = queryClient.getQueryData(["GetTrips"]);

    // Optimistically update
    queryClient.setQueryData(["GetTrips"], (old) => ({
      ...old,
      trips: old.trips.map((t) =>
        t.id === newTrip.id ? { ...t, ...newTrip } : t,
      ),
    }));

    // Return context for rollback
    return { previousTrips };
  },
  onError: (err, newTrip, context) => {
    // Rollback on error
    queryClient.setQueryData(["GetTrips"], context?.previousTrips);
  },
});
```

## Adding New GraphQL Operations

### 1. Define the Operation

Add your GraphQL operation to the appropriate file in `packages/graphql-types/src/graphql/operations/`:

```graphql
# packages/graphql-types/src/graphql/operations/my-feature.queries.graphql

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
cd packages/graphql-types
bun run generate
```

### 3. Use the Generated Hook

```tsx
import { useGetMyFeaturesQuery } from "@mirai-app/graphql-client";
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

> **Note:** More hooks are generated as GraphQL operations are added. Check the generated file at `packages/graphql-types/src/generated/graphql.ts` for the complete list.

## Troubleshooting

### Hook returns undefined data

Ensure:

1. The `QueryProvider` is properly set up
2. The GraphQL client has the correct endpoint
3. Authentication headers are properly configured

### Type errors

If you see type errors:

1. Run `bun run generate` in `packages/graphql-types`
2. Restart your TypeScript server
3. Check that you're importing from `@mirai-app/graphql-client`

### Caching issues

To debug cache issues:

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <YourApp />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>;
```

## Best Practices

1. **Use Query Keys Wisely**: Leverage `getKey` functions for cache invalidation
2. **Set Appropriate staleTime**: Balance between fresh data and network requests
3. **Handle Loading States**: Always show loading indicators for better UX
4. **Error Boundaries**: Wrap components in error boundaries for graceful failures
5. **Pagination**: Use `placeholderData` for smooth pagination experiences
