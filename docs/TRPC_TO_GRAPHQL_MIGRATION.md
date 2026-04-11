# tRPC to GraphQL Migration Guide

## Overview

This guide documents the migration from tRPC to GraphQL with TanStack Query across all apps.

## Migration Pattern

### Before (tRPC)

```typescript
import { trpc } from "@/utils/trpc";

// Query
const { data, isLoading } = trpc.user.getById.useQuery({ id: "123" });

// Mutation
const mutation = trpc.trip.create.useMutation({
  onSuccess: () => {
    utils.trip.getAll.invalidate();
  },
});

// Usage
mutation.mutate({ name: "Trip", description: "Desc" });
```

### After (GraphQL + TanStack Query)

```typescript
import {
  useGetUserQuery,
  useCreateTripMutation,
} from "@mirai-app/graphql-client";
import { useQueryClient } from "@tanstack/react-query";

// Query
const { data, isLoading } = useGetUserQuery(
  graphqlClient,
  { id: "123" },
  { staleTime: 60000 },
);

// Mutation
const queryClient = useQueryClient();
const mutation = useCreateTripMutation(graphqlClient, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["GetTrips"] });
  },
});

// Usage
mutation.mutate({ input: { name: "Trip", description: "Desc" } });
```

## Common Mappings

### User Operations

| tRPC                             | GraphQL                    |
| -------------------------------- | -------------------------- |
| `trpc.user.getById.useQuery()`   | `useGetUserQuery()`        |
| `trpc.user.me.useQuery()`        | `useGetCurrentUserQuery()` |
| `trpc.user.create.useMutation()` | `useCreateUserMutation()`  |
| `trpc.user.update.useMutation()` | `useUpdateUserMutation()`  |

### Trip Operations

| tRPC                             | GraphQL                   |
| -------------------------------- | ------------------------- |
| `trpc.trip.getById.useQuery()`   | `useGetTripQuery()`       |
| `trpc.trip.getAll.useQuery()`    | `useGetTripsQuery()`      |
| `trpc.trip.create.useMutation()` | `useCreateTripMutation()` |
| `trpc.trip.update.useMutation()` | `useUpdateTripMutation()` |
| `trpc.trip.delete.useMutation()` | `useDeleteTripMutation()` |

### Group Operations

| tRPC                              | GraphQL                     |
| --------------------------------- | --------------------------- |
| `trpc.group.getById.useQuery()`   | `useGetGroupQuery()`        |
| `trpc.group.getByCode.useQuery()` | `useGetGroupByCodeQuery()`  |
| `trpc.group.getAll.useQuery()`    | `useGetGroupsQuery()`       |
| `trpc.group.getByTrip.useQuery()` | `useGetGroupsByTripQuery()` |
| `trpc.group.create.useMutation()` | `useCreateGroupMutation()`  |
| `trpc.group.update.useMutation()` | `useUpdateGroupMutation()`  |
| `trpc.group.delete.useMutation()` | `useDeleteGroupMutation()`  |

### Challenge Operations

| tRPC                                             | GraphQL                                  |
| ------------------------------------------------ | ---------------------------------------- |
| `trpc.challenge.submission.getById.useQuery()`   | `useGetChallengeSubmissionQuery()`       |
| `trpc.challenge.submission.getAll.useQuery()`    | `useGetChallengeSubmissionsQuery()`      |
| `trpc.challenge.submission.create.useMutation()` | `useCreateChallengeSubmissionMutation()` |
| `trpc.challenge.submission.update.useMutation()` | `useUpdateChallengeSubmissionMutation()` |
| `trpc.challenge.vote.submit.useMutation()`       | `useSubmitVoteMutation()`                |
| `trpc.challenge.vote.getMyVotes.useQuery()`      | `useGetMyVotesQuery()`                   |

### Activity Operations

| tRPC                                 | GraphQL                             |
| ------------------------------------ | ----------------------------------- |
| `trpc.activity.getById.useQuery()`   | `useGetActivityQuery()`             |
| `trpc.activity.getByTrip.useQuery()` | `useGetActivitiesByTripQuery()`     |
| `trpc.activity.create.useMutation()` | `useCreateCustomActivityMutation()` |
| `trpc.activity.update.useMutation()` | `useUpdateActivityMutation()`       |
| `trpc.activity.delete.useMutation()` | `useDeleteActivityMutation()`       |
| `trpc.activity.hide.useMutation()`   | `useHideActivityMutation()`         |

### Reward Operations

| tRPC                                 | GraphQL                       |
| ------------------------------------ | ----------------------------- |
| `trpc.reward.getById.useQuery()`     | `useGetRewardQuery()`         |
| `trpc.reward.getByTrip.useQuery()`   | `useGetRewardsByTripQuery()`  |
| `trpc.reward.create.useMutation()`   | `useCreateRewardMutation()`   |
| `trpc.reward.update.useMutation()`   | `useUpdateRewardMutation()`   |
| `trpc.reward.delete.useMutation()`   | `useDeleteRewardMutation()`   |
| `trpc.reward.purchase.useMutation()` | `usePurchaseRewardMutation()` |

### Coin Operations

| tRPC                                   | GraphQL                         |
| -------------------------------------- | ------------------------------- |
| `trpc.coin.getStatistics.useQuery()`   | `useGetCoinStatisticsQuery()`   |
| `trpc.coin.getTransactions.useQuery()` | `useGetCoinTransactionsQuery()` |
| `trpc.coin.add.useMutation()`          | `useAddCoinsMutation()`         |
| `trpc.coin.remove.useMutation()`       | `useRemoveCoinsMutation()`      |

### Notification Operations

| tRPC                                              | GraphQL                                   |
| ------------------------------------------------- | ----------------------------------------- |
| `trpc.notification.getById.useQuery()`            | `useGetNotificationQuery()`               |
| `trpc.notification.getMy.useQuery()`              | `useGetMyNotificationsQuery()`            |
| `trpc.notification.create.useMutation()`          | `useCreateNotificationMutation()`         |
| `trpc.notification.update.useMutation()`          | `useUpdateNotificationMutation()`         |
| `trpc.notification.schedule.getAll.useQuery()`    | `useGetNotificationSchedulesQuery()`      |
| `trpc.notification.schedule.create.useMutation()` | `useCreateNotificationScheduleMutation()` |

## Setup Required

### 1. GraphQL Client Setup

**File: `apps/web/src/lib/graphql-client.ts`**

```typescript
import { GraphQLClient } from "graphql-request";

export const graphqlClient = new GraphQLClient(
  process.env.PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
  {
    headers: () => {
      const token = localStorage.getItem("token");
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  },
);
```

**File: `apps/native/src/lib/graphql-client.ts`**

```typescript
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";

const getToken = async () => {
  return await SecureStore.getItemAsync("token");
};

export const graphqlClient = new GraphQLClient(
  process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
  {
    headers: async () => {
      const token = await getToken();
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  },
);
```

### 2. Query Provider Setup

Already exists in:

- `apps/web/src/components/QueryProvider.tsx`
- `apps/native/src/components/QueryProvider.tsx` (needs creation)

## Key Differences

### 1. Query Keys

- **tRPC**: Automatic cache invalidation via router paths
- **GraphQL**: Manual using `queryClient.invalidateQueries({ queryKey: ["OperationName"] })`

### 2. Input/Output Types

- **tRPC**: Inferred from router definitions
- **GraphQL**: Explicit types from generated code (e.g., `GetUserQueryVariables`, `GetUserQuery`)

### 3. Error Handling

- **tRPC**: Uses tRPC error format
- **GraphQL**: Uses standard HTTP/GraphQL errors

### 4. Loading States

- **tRPC**: `isLoading`, `isFetching`
- **GraphQL**: Same (`isLoading`, `isFetching` from TanStack Query)

## Migration Steps

1. **Setup GraphQL client** in the app
2. **Replace imports** from tRPC utils to graphql-types
3. **Replace hooks** following the mapping tables above
4. **Update cache invalidation** to use query keys
5. **Test** each component after migration
6. **Remove tRPC** dependencies once all migrated

## Example Full Component Migration

See migrated examples in:

- `apps/web/src/components/examples/GraphQLExample.tsx`

## Notes

- All hooks are typed with full TypeScript support
- GraphQL operations are in `packages/graphql-types`
- 106 hooks available covering all entities
- No subscriptions (backend doesn't support them)
