# React Query Persistence + Offline Mutation Queue for Expo/React Native

> **Related Task**: `.specs/tasks/draft/implement-react-query-persistence.feature.md`

## When to Use

Use this skill when implementing offline-first data access in Expo/React Native apps using React Query v5. Covers:
- Persisting query cache to AsyncStorage for offline read access
- Queueing mutations when offline and retrying on reconnect
- Optimistic UI updates with rollback on permanent failure
- Selective sync for active context data

## Prerequisites

- React Query v5+ (`@tanstack/react-query`)
- Expo React Native or React Native with AsyncStorage
- Any API client (REST, GraphQL, tRPC, oRPC, etc.)

## Pattern Overview

### Architecture

```
UI Layer (Screens/Components)
    |
    v
React Query Layer (useQuery/useMutation)
    |
    v
Persistence Layer (react-query-persist-client + AsyncStorage)
    |
    v
Offline Mutation Queue (AsyncStorage/SQLite)
    |
    v
Sync Layer (API client + NetInfo + expo-task-manager)
```

### Data Classification

| Category | Strategy | Example |
|----------|----------|---------|
| **Offline-read** | Persist to AsyncStorage via RQ | user profiles, lists, config data |
| **Offline-write** | Queue mutations, retry on reconnect | form submissions, updates, joins |
| **Server-only** | Fetch only when online | activity feeds, real-time data |

## Resource Constraints & Considerations

### AsyncStorage Limits

- **Android**: 6MB default limit per app. Exceeding throws `SQLITE_FULL` errors.
- **iOS**: No hard limit, but large writes block the JS thread.
- **Mitigation**: Use `expo-sqlite` or `react-native-mmkv` for large caches. Monitor cache size with `AsyncStorage.getItem` length checks.
- **Cleanup**: Set `maxAge` on persisted queries and implement a periodic cache purge for stale data.

### Encryption for Sensitive Data

- AsyncStorage is **unencrypted** on both platforms (plain text in app sandbox).
- **Do NOT persist**: auth tokens, passwords, payment info, PII.
- **Options**:
  - Use `react-native-encrypted-storage` or `expo-secure-store` for sensitive tokens.
  - Encrypt the persister payload with a device-bound key (e.g., `react-native-keychain`) before writing to AsyncStorage.
  - Exclude sensitive queries from persistence via `shouldDehydrateQuery`.

### Local-First Alternatives

If React Query persistence proves insufficient, consider:

| Library | Use Case | Trade-off |
|---------|----------|-----------|
| **WatermelonDB** | Large relational datasets, complex queries | Heavier setup, SQLite-backed |
| **PowerSync** | Real-time sync, conflict resolution | Requires backend integration |
| **ElectricSQL** | Postgres sync, multi-client | Self-hosted or cloud service |
| **react-native-mmkv** | Fast key-value, binary data | No structured query support |

### iOS Background Fetch Reliability

- `expo-background-fetch` on iOS is **not guaranteed**. The OS schedules based on app usage patterns, battery, and device state.
- **Minimum interval**: iOS enforces ~15 minutes minimum in practice, regardless of `minimumInterval` config.
- **Do NOT rely on background fetch for critical sync**. Always process queue on foreground `NetInfo` change and app state resume.
- **Test**: Use Xcode "Simulate Background Fetch" to verify behavior; do not assume production scheduling matches simulator.

## Implementation Guidelines

### 1. Install Dependencies

```bash
bun add @tanstack/react-query-persist-client @tanstack/query-async-storage-persister
bun add @react-native-community/netinfo
# Optional for Phase 2+:
# bun add expo-sqlite
```

### 2. Configure QueryClient with Persistence

**File**: Your query client factory (e.g., `src/lib/query-client.ts`)

```typescript
import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,        // 5 minutes
        gcTime: 1000 * 60 * 60 * 24,     // 24 hours
        networkMode: "offlineFirst",       // Serve cache first
        refetchOnWindowFocus: false,     // Mobile apps don't have windows
        retry: (failureCount, error) => {
          const statusCode = (error as { status?: number })?.status;
          if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
            return false;
          }
          return failureCount < 3;
        },
      },
    },
  });
}

// Persistence setup (run once on app init)
export function initQueryPersistence(queryClient: QueryClient) {
  const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: "rq-persist",
    throttleTime: 1000,
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24 * 7,     // 7 days
    buster: process.env.APP_VERSION || "1", // Clear cache on app update
  });
}
```

### 3. Wrap App with PersistQueryClientProvider

**File**: Your query provider component (e.g., `src/providers/query-provider.tsx`)

```typescript
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "rq-persist",
  throttleTime: 1000,
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
```

### 4. Mark Queries for Selective Persistence

Use `queryKey` structure to control what gets persisted:

```typescript
const queryKeys = {
  userProfile: (id: string) => ["user", id, { persist: true }],
  groups: (contextId: string) => ["groups", contextId, { persist: true }],
  config: (key: string) => ["config", key, { persist: true }],
  // NOT persisted:
  activity: (contextId: string) => ["activity", contextId],
  leaderboard: (contextId: string) => ["leaderboard", contextId],
};
```

With `dehydrateOptions` to filter:

```typescript
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        const lastKey = query.queryKey[query.queryKey.length - 1];
        return typeof lastKey === "object" && lastKey?.persist === true;
      },
    },
  }}
>
```

### 5. Offline Mutation Queue

**Types** (e.g., `src/services/offline-queue/types.ts`):

```typescript
export interface QueuedMutation {
  id: string;
  type: string; // e.g., "profileUpdate", "formSubmission" — any string key
  input: unknown;
  endpoint: string;
  timestamp: number;
  retryCount: number;
  status: "pending" | "retrying" | "failed" | "completed";
  error?: string;
}
```

**Storage** (e.g., `src/services/offline-queue/storage.ts`):

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QueuedMutation } from "./types";

const QUEUE_KEY = "offline-mutation-queue";
const MAX_QUEUE_SIZE = 100;

export async function getQueue(): Promise<QueuedMutation[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addToQueue(mutation: QueuedMutation): Promise<void> {
  const queue = await getQueue();
  queue.push(mutation);
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.shift(); // Discard oldest
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function updateMutation(
  id: string,
  updates: Partial<QueuedMutation>,
): Promise<void> {
  const queue = await getQueue();
  const index = queue.findIndex((m) => m.id === id);
  if (index >= 0) {
    queue[index] = { ...queue[index], ...updates };
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((m) => m.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}
```

**Hook** (e.g., `src/hooks/use-offline-mutation.ts`):

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { addToQueue, removeFromQueue, updateMutation } from "~/services/offline-queue/storage";
import type { QueuedMutation } from "~/services/offline-queue/types";

interface UseOfflineMutationOptions<TInput, TOutput> {
  mutationFn: (input: TInput) => Promise<TOutput>;
  queueType: string;
  endpoint: string;
  optimisticUpdate?: (queryClient: QueryClient, input: TInput) => void;
  rollback?: (queryClient: QueryClient, input: TInput) => void;
}

export function useOfflineMutation<TInput, TOutput>({
  mutationFn,
  queueType,
  endpoint,
  optimisticUpdate,
  rollback,
}: UseOfflineMutationOptions<TInput, TOutput>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onMutate: async (input) => {
      if (optimisticUpdate) {
        optimisticUpdate(queryClient, input);
      }
      return { input };
    },
    onError: (error, input, context) => {
      // Check if network error
      const isNetworkError =
        error instanceof Error &&
        (error.message.includes("Network") || error.message.includes("fetch"));

      if (isNetworkError) {
        // Queue for retry
        const queued: QueuedMutation = {
          id: crypto.randomUUID(),
          type: queueType,
          input,
          endpoint,
          timestamp: Date.now(),
          retryCount: 0,
          status: "pending",
        };
        void addToQueue(queued);
      }

      if (rollback && context) {
        rollback(queryClient, context.input);
      }
    },
  });

  return mutation;
}
```

### 6. Queue Processor with NetInfo

**File**: e.g., `src/services/offline-queue/processor.ts`

```typescript
import NetInfo from "@react-native-community/netinfo";
import { getQueue, removeFromQueue, updateMutation } from "./storage";

let isProcessing = false;
let unsubscribeNetInfo: (() => void) | null = null;

export function initQueueProcessor(processMutation: (mutation: QueuedMutation) => Promise<void>) {
  // Prevent duplicate listeners on hot reload / fast refresh
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
  }

  unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    if (state.isConnected && !isProcessing) {
      void processQueue(processMutation);
    }
  });
}

export function destroyQueueProcessor() {
  if (unsubscribeNetInfo) {
    unsubscribeNetInfo();
    unsubscribeNetInfo = null;
  }
}

async function processQueue(
  processMutation: (mutation: QueuedMutation) => Promise<void>,
): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const queue = await getQueue();
    const pending = queue.filter((m) => m.status === "pending" || m.status === "retrying");

    for (const mutation of pending) {
      await updateMutation(mutation.id, { status: "retrying" });
      try {
        await processMutation(mutation);
        await removeFromQueue(mutation.id);
      } catch (error) {
        const retryCount = mutation.retryCount + 1;
        if (retryCount >= 3) {
          await updateMutation(mutation.id, {
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        } else {
          await updateMutation(mutation.id, {
            status: "pending",
            retryCount,
          });
        }
      }
    }
  } finally {
    isProcessing = false;
  }
}
```

### 7. Background Sync with expo-task-manager

**File**: e.g., `src/services/background/offline-sync-task.ts`

```typescript
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";

const OFFLINE_SYNC_TASK = "offline-sync-task";

TaskManager.defineTask(OFFLINE_SYNC_TASK, async () => {
  try {
    await processQueue(/* ... */);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerOfflineSyncTask(): Promise<void> {
  await BackgroundFetch.registerTaskAsync(OFFLINE_SYNC_TASK, {
    minimumInterval: 60 * 60, // 1 hour (iOS may enforce ~15 min minimum)
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
```

### 8. UI Indicators

**Pending badge**:

```typescript
const queue = useOfflineQueue(); // zustand store or context
const isPending = queue.some(
  (m) => m.type === "formSubmission" && m.status === "pending"
);
```

**Offline status bar**:

```typescript
const netInfo = useNetInfo();
const isOffline = !netInfo.isConnected;
```

## Known Issues & Mitigations

### Race Condition: Online Mutation vs Queue Processing

**Problem**: User submits mutation while online, but queue processor simultaneously runs a queued mutation for the same resource. Both mutate server state concurrently.

**Mitigation**:
- Use a global `isProcessing` flag (shown above) to block new online mutations while the queue is draining.
- Alternatively, tag resources with a `syncLock` in your state store and skip online mutations for locked keys.

### App Kill During Queue Processing

**Problem**: App is killed (OS memory pressure, user swipe) while a mutation is in flight. The mutation may have succeeded on the server but not been removed from the queue. On restart, it retries, causing a duplicate.

**Mitigation**:
- Make mutations **idempotent** where possible (use client-generated UUIDs as idempotency keys).
- Update queue status to `"retrying"` **before** calling `processMutation`, and remove from queue **only after** confirmed success.
- On app startup, scan queue for `"retrying"` entries and reset them to `"pending"` to re-attempt safely.

### Memory Leak with NetInfo Listeners

**Problem**: `NetInfo.addEventListener` returns an unsubscribe function. If not cleaned up, listeners accumulate across fast refreshes or navigation, causing duplicate queue processing.

**Mitigation**:
- Store the unsubscribe function (shown in `destroyQueueProcessor` above).
- Call `destroyQueueProcessor()` in `useEffect` cleanup or app teardown.
- Use a singleton pattern to ensure only one listener exists at a time.

### Permanent Mutation Failure Notification

**Problem**: After max retries, a mutation is marked `"failed"`. The user never knows unless they check a settings screen.

**Mitigation**:
- Surface failed mutations in a persistent in-app banner or toast on next app open.
- Add a "Sync Issues" section in settings showing failed items with retry/discard actions.
- Use local notifications (e.g., `expo-notifications`) for critical failures if the app is backgrounded.

### Query Key Serialization with Complex Objects

**Problem**: React Query serializes query keys for cache lookup. If keys contain `Date`, `Map`, `Set`, or class instances, serialization is inconsistent between dehydrate (persist) and hydrate (restore), causing cache misses or collisions.

**Mitigation**:
- Use only **JSON-serializable** primitives in query keys: `string`, `number`, `boolean`, `null`, and plain objects.
- Convert `Date` to ISO strings before using in keys.
- Avoid `Map`/`Set` in keys; convert to arrays or object hashes.
- Test hydration by simulating an app restart and verifying cache hit rates.

## Rollback Plan

If persistence causes issues:

1. **Immediate**: Set `networkMode: "always"` to disable offline-first behavior
2. **Short-term**: Clear AsyncStorage keys `rq-persist` and `offline-mutation-queue`
3. **Nuclear**: Remove `PersistQueryClientProvider`, revert to plain `QueryClientProvider`

## Expected Impact

| Metric | Expected Improvement |
|--------|---------------------|
| Offline screen usability | 80% of primary screens usable offline |
| Mutation success rate | 99% of offline actions sync successfully |
| Time to sync | < 5s from online to queue empty |
| Cache hit rate | 90%+ for previously viewed data |
| User complaints | Reduction in "app doesn't work offline" |

## Decision Matrix

| If you need to... | Change this file |
|-------------------|------------------|
| Adjust cache lifetime | Edit `maxAge` / `gcTime` in query client factory |
| Add new offline-read data | Add `{ persist: true }` to query key |
| Add new offline-write mutation | Add type string to your `QueuedMutation` consumer |
| Change queue size limit | Edit `MAX_QUEUE_SIZE` constant |
| Adjust retry behavior | Edit retry logic in `useOfflineMutation` |
| Disable offline features | Set `networkMode: "always"` |

## Conflict Resolution Strategy

For Phase 1, use **Last-Write-Wins** with server authority:
- Offline mutations are queued, not applied to server state
- When syncing, server state overwrites local
- User sees "Your submission is pending" until confirmed
- Do NOT support concurrent offline edits on same data

## Testing Strategy

| Test Type | Scope |
|-----------|-------|
| Unit | Queue CRUD, optimistic update logic, rollback |
| Integration | Offline -> online transition, queue processing, persistence |
| E2E | Complete offline flow: view data -> submit mutation -> come online -> verify sync |

## References

- [React Query Persistence](https://tanstack.com/query/latest/docs/framework/react/plugins/persist-query-client)
- [React Query Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode)
- [Expo Local-First Guide](https://docs.expo.dev/guides/local-first/)
- [NetInfo Documentation](https://github.com/react-native-netinfo/react-native-netinfo)
- [WatermelonDB](https://watermelondb.dev/)
- [PowerSync](https://www.powersync.com/)
