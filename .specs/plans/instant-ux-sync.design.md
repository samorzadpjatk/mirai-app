# Instant UX: Local-First Data Sync Design

**Status:** Design validated  
**Last updated:** 2026-04-14  
**Approach:** TanStack Query + Persist + Smart Sync

---

## 1. Overview

This design enables instant user experience by persisting GraphQL query data locally. Users read from cache immediately. The system syncs data in the background based on network quality, battery level, and data priority.

**Key principles:**

- Reads serve from local cache instantly (no loading states for cached data)
- Writes require online connection (always hit the server)
- Smart background sync respects device conditions
- Last-write-wins conflict resolution (timestamp-based)

---

## 2. Data Architecture

### 2.1 Stack

| Layer           | Technology                                    | Purpose                      |
| --------------- | --------------------------------------------- | ---------------------------- |
| GraphQL client  | urql                                          | API communication            |
| State/cache     | TanStack Query                                | Caching, background fetching |
| Persistence     | @tanstack/query-persist-client + AsyncStorage | Offline storage              |
| Code generation | graphql-code-generator                        | Type-safe hooks              |
| Sync logic      | Effect                                        | Smart sync orchestration     |

### 2.2 Data Flow

**App launch:**

1. Hydrate TanStack Query cache from AsyncStorage (instant)
2. Render UI with cached data immediately
3. Evaluate sync conditions (network, battery, priority)
4. Trigger background refetch if conditions pass

**User reads:**

1. Query serves from cache instantly
2. Stale-while-revalidate pattern: show cached data, fetch fresh in background
3. UI updates automatically when fresh data arrives

**User writes:**

1. Optimistic update applies immediately to cache
2. GraphQL mutation executes via urql
3. On success: invalidate affected queries, trigger background refetch
4. On error: rollback optimistic update, show error

---

## 3. Component Structure

### 3.1 Generated Layer (graphql-code-generator)

```typescript
// generated/urql-hooks.ts
export function useGetTripsQuery(
  variables: GetTripsQueryVariables,
  options?: UseQueryArgs<GetTripsQueryVariables>,
) {
  return useQuery<GetTripsQuery, GetTripsQueryVariables>({
    query: GetTripsDocument,
    variables,
    ...options,
  });
}

export function useRegisterForTripMutation() {
  return useMutation<RegisterForTripMutation, RegisterForTripMutationVariables>(
    RegisterForTripDocument,
  );
}
```

### 3.2 Smart Query Wrapper

```typescript
// hooks/useSmartQuery.ts
export function useSmartQuery<T, V>(
  queryKey: string[],
  queryDocument: TypedDocumentNode<T, V>,
  variables: V,
  options: {
    priority: "critical" | "normal" | "low";
    maxAgeSeconds: number;
  },
) {
  // Hydrates from persisted cache instantly
  // Triggers smart background sync based on priority + conditions
  // Returns { data, isLoading (initial only), isFetching (background), lastSyncAt }
}
```

### 3.3 Optimistic Mutation Wrapper

```typescript
// hooks/useOptimisticMutation.ts
export function useOptimisticMutation<TData, TVariables, TCacheData>(
  mutationHook: () => ReturnType<typeof useMutation<TData, TVariables>>,
  options: {
    queryKeyToInvalidate: string[];
    optimisticUpdate: (vars: TVariables, currentData: TCacheData) => TCacheData;
    rollbackOnError: boolean;
  },
);
```

---

## 4. Smart Sync Orchestration

### 4.1 Decision Factors

The sync system evaluates four factors:

| Factor               | Values                      | Impact                                             |
| -------------------- | --------------------------- | -------------------------------------------------- |
| Network quality      | WiFi/4G/3G/2G/offline       | Skip sync on poor/no connection                    |
| Battery level        | Percentage + charging state | Skip non-critical sync when battery < 20%          |
| Data priority        | critical / normal / low     | Critical syncs always attempt; low syncs WiFi-only |
| Time since last sync | Seconds                     | Respect minimum intervals per priority             |

### 4.2 Sync Logic (Effect-based)

```typescript
// packages/adapters/src/sync/smart-sync.ts
export type SyncPriority = "critical" | "normal" | "low";

export interface SyncConditions {
  priority: SyncPriority;
  lastSyncAt: Date | null;
  minIntervalSeconds: number;
}

export const shouldSync = (conditions: SyncConditions) =>
  Effect.gen(function* () {
    const netInfo = yield* Effect.tryPromise(() => NetInfo.fetch());
    const batteryLevel = yield* Effect.tryPromise(() =>
      Battery.getBatteryLevelAsync(),
    );

    // Offline: never sync
    if (!netInfo.isConnected) {
      return { shouldSync: false, reason: "offline" };
    }

    // Check minimum interval
    if (conditions.lastSyncAt) {
      const elapsed = (Date.now() - conditions.lastSyncAt.getTime()) / 1000;
      if (elapsed < conditions.minIntervalSeconds) {
        return { shouldSync: false, reason: "recently_synced" };
      }
    }

    // Priority-based decisions
    switch (conditions.priority) {
      case "critical":
        return { shouldSync: true, reason: "critical_priority" };

      case "normal":
        if (batteryLevel < 0.2) {
          return { shouldSync: false, reason: "low_battery" };
        }
        return { shouldSync: true, reason: "normal_priority" };

      case "low":
        if (netInfo.type !== "wifi") {
          return { shouldSync: false, reason: "wifi_only_priority" };
        }
        if (batteryLevel < 0.3) {
          return { shouldSync: false, reason: "low_battery_wifi_only" };
        }
        return { shouldSync: true, reason: "low_priority_wifi" };
    }
  });
```

### 4.3 Sync Triggers

Sync runs on three events:

1. **App launch/foreground:** Evaluate all query priorities
2. **Explicit refresh:** User pulls to refresh (always syncs)
3. **Mutation success:** Invalidate and refetch affected queries

---

## 5. Persistence Setup

```typescript
// lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Never stale until we say so
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days garbage collection
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "mirai-query-cache",
  throttleTime: 1000, // Debounce writes
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days max cache age
  buster: "v1", // Cache version for breaking changes
});
```

---

## 6. Cache Invalidation Strategy

| Action                 | Invalidates                                                 |
| ---------------------- | ----------------------------------------------------------- |
| Register for trip      | `['trips', tripId]`, `['my-registrations']`                 |
| Update profile         | `['profile']`, `['user', userId]`                           |
| Mark notification read | `['notifications']`                                         |
| Submit payment         | `['trips', tripId]`, `['payments']`, `['my-registrations']` |
| Admin publishes news   | `['news']` (all clients refetch on next sync)               |

---

## 7. Error Handling

| Scenario                       | Behavior                                                |
| ------------------------------ | ------------------------------------------------------- |
| Read with no cache, offline    | Show offline state, queue sync for when online          |
| Read with stale cache, offline | Show cached data, "offline mode" indicator              |
| Background sync fails          | Silent failure, retry on next trigger                   |
| Mutation network error         | Rollback optimistic update, show "You're offline" toast |
| Mutation server error          | Rollback optimistic update, show GraphQL error message  |

---

## 8. Priority Guidelines

Define data priority by feature:

| Feature          | Priority | Max Age      | Rationale                  |
| ---------------- | -------- | ------------ | -------------------------- |
| My registrations | critical | 60 seconds   | User needs accurate status |
| Trip list        | normal   | 300 seconds  | Changes occasionally       |
| Trip details     | normal   | 300 seconds  | Reference data             |
| News feed        | low      | 3600 seconds | Nice-to-have fresh         |
| User profile     | normal   | 600 seconds  | Changes rarely             |
| Notifications    | critical | 120 seconds  | Time-sensitive             |

---

## 9. Implementation Phases

### Phase 1: Foundation

1. Add @tanstack/query-persist-client and async storage persister
2. Configure QueryClient with infinite stale time
3. Set up persistQueryClient in app entry
4. Test: kill app, relaunch, verify data appears instantly

### Phase 2: Smart Sync

1. Create shouldSync Effect in adapters package
2. Build useSmartQuery wrapper hook
3. Replace useQuery with useSmartQuery in key screens
4. Add NetInfo and Battery dependencies
5. Test: verify sync respects network/battery conditions

### Phase 3: Optimistic Writes

1. Create useOptimisticMutation wrapper hook
2. Define optimistic update functions for key mutations
3. Define cache invalidation mappings
4. Test: verify optimistic updates and rollbacks

### Phase 4: Code Generation

1. Configure graphql-code-generator for urql hooks
2. Generate type-safe query/mutation hooks
3. Migrate manual hooks to generated ones
4. Test: verify type safety and runtime behavior

---

## 10. Testing Strategy

| Test Type   | What to test                                          |
| ----------- | ----------------------------------------------------- |
| Unit        | shouldSync logic with mocked NetInfo/Battery          |
| Unit        | optimisticUpdate functions                            |
| Integration | Cache hydration and persistence                       |
| Integration | Background sync triggers on app foreground            |
| E2E         | Kill app offline, relaunch, verify data visible       |
| E2E         | Optimistic update → success → cache invalidation flow |

---

## 11. Open Questions

1. Cache size limits: AsyncStorage has 6MB limit. Monitor cache size, implement eviction strategy if needed.
2. Schema migrations: When GraphQL schema changes, bump buster version to invalidate old cache.
3. Multi-device: User on phone + tablet. Last-write-wins means device with later timestamp wins. Acceptable?

---

## 12. References

- [TanStack Query Persistence](https://tanstack.com/query/latest/docs/framework/react/plugins/persist-query-client)
- [urql React bindings](https://formidable.com/open-source/urql/docs/basics/react-preact/)
- [graphql-code-generator](https://the-guild.dev/graphql/codegen)
