# Local-First "Offline-Lite" Architecture Design

> **Status**: Draft — Phase 1 of hybrid approach
> **Scope**: MIRAI native app (`apps/native`)
> **Approach**: React Query Persistence + Offline Mutation Queue
> **Estimated Effort**: 2–4 weeks

## 1. Problem Statement

Event attendees frequently experience poor or no mobile connectivity during trips. The app currently relies entirely on server connectivity, causing:
- Users cannot view trip data offline
- Challenge submissions fail without retry
- Profile/group updates are lost when offline
- Ad-hoc AsyncStorage caching is inconsistent across screens

## 2. Goals

### Must Have
- [ ] Offline read access to active trip data (trip info, groups, challenges)
- [ ] Offline mutation queue for critical user actions (submissions, profile updates, group joins)
- [ ] Automatic sync when connectivity returns
- [ ] Clear UI indicators for pending/synced states

### Should Have
- [ ] Optimistic UI updates with rollback on failure
- [ ] Background sync via `expo-task-manager`
- [ ] Delta sync to reduce bandwidth

### Won’t Have (Phase 1)
- [ ] Full local-first for all 30+ tables
- [ ] Real-time collaborative editing
- [ ] Conflict resolution for concurrent edits
- [ ] Activity feed offline support
- [ ] Leaderboard offline computation

## 3. Architecture

### 3.1 Data Classification

| Category | Tables | Strategy |
|----------|--------|----------|
| **Offline-read** | trips, groups, challenges, tripParticipants, tripResources | Persist to SQLite via React Query |
| **Offline-write** | challengeSubmissions, groupJoinRequests, userProfiles | Queue mutations, retry on reconnect |
| **Server-only** | activityFeeds, notifications, locations, leaderboard, coinTransactions | Fetch only when online |

### 3.2 Component Diagram

```
┌─────────────────────────────────────────────────┐
│                    UI Layer                      │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐     │
│  │  Trip   │ │ Group   │ │  Challenge    │     │
│  │ Screen  │ │ Screen  │ │  Screen       │     │
│  └────┬────┘ └────┬────┘ └───────┬───────┘     │
└───────┼───────────┼──────────────┼──────────────┘
        │           │              │
        ▼           ▼              ▼
┌─────────────────────────────────────────────────┐
│              React Query Layer                   │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐     │
│  │ useQuery │ │useMutation│ │ useInfinite   │   │
│  │ (cached) │ │ (queued) │ │ Query         │   │
│  └────┬────┘ └────┬────┘ └───────┬───────┘     │
└───────┼───────────┼──────────────┼──────────────┘
        │           │              │
        ▼           ▼              ▼
┌─────────────────────────────────────────────────┐
│            Persistence Layer                     │
│  ┌─────────────────┐  ┌───────────────────┐     │
│  │  react-query-   │  │  Offline Mutation  │     │
│  │  persist-client │  │  Queue (SQLite)    │     │
│  │  (expo-sqlite)  │  │                    │     │
│  └─────────────────┘  └───────────────────┘     │
└─────────────────────────────────────────────────┘
        │                    │
        ▼                    ▼
┌─────────────────────────────────────────────────┐
│              Sync Layer                          │
│  ┌─────────────────┐  ┌───────────────────┐     │
│  │  oRPC Client    │  │  Background Sync   │     │
│  │  (existing)     │  │  (expo-task-manager)│    │
│  └─────────────────┘  └───────────────────┘     │
└─────────────────────────────────────────────────┘
```

### 3.3 Offline Mutation Queue

```typescript
// types/offlineQueue.ts
interface QueuedMutation {
  id: string;           // UUID
  type: 'challengeSubmission' | 'profileUpdate' | 'groupJoinRequest';
  input: unknown;       // Mutation payload
  endpoint: string;   // oRPC procedure path
  timestamp: number;    // When queued
  retryCount: number;   // Retry attempts
  status: 'pending' | 'retrying' | 'failed' | 'completed';
  error?: string;     // Last error message
}
```

**Storage**: SQLite table via `expo-sqlite` (or `AsyncStorage` for Phase 1)

**Queue behavior**:
1. When mutation fails (network error), store in queue
2. On connectivity recovery, process queue FIFO
3. Optimistic UI: update React Query cache immediately, rollback on permanent failure
4. Show "pending" badge in UI

### 3.4 React Query Persistence

```typescript
// config/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes
      gcTime: 1000 * 60 * 60 * 24,     // 24 hours
      retry: 2,
      networkMode: 'offlineFirst',      // NEW: serve cache first
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'rq-persist',
  throttleTime: 1000,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24 * 7,     // 7 days
});
```

### 3.5 Selective Sync

Only sync data for the **active trip**:

```typescript
// services/sync/tripSync.ts
interface SyncConfig {
  tripId: string;
  tables: ('trips' | 'groups' | 'challenges' | 'tripParticipants')[];
  lastSyncAt: Date;
}

export async function syncTripData(config: SyncConfig): Promise<SyncResult> {
  // Fetch delta since lastSyncAt
  // Update local SQLite
  // Update lastSyncAt
}
```

**Pre-event sync**: Add "Download for offline" button in trip preparation screen.

## 4. Implementation Plan

### Phase 1: Foundation (Week 1)

1. **Add react-query-persist-client**
   - Install `@tanstack/react-query-persist-client` and `@tanstack/query-async-storage-persister`
   - Configure `QueryClient` with `networkMode: 'offlineFirst'`
   - Test persistence across app restarts

2. **Mark offline-read queries**
   - Add `persist: true` to trip, group, challenge queries
   - Add `staleTime: Infinity` for trip config data
   - Ensure cache keys are stable

### Phase 2: Mutation Queue (Week 2)

1. **Build queue storage**
   - Create SQLite schema for `offline_mutations` table
   - Implement CRUD operations

2. **Create useOfflineMutation hook**
   ```typescript
   // Wraps useMutation with offline queue
   function useOfflineMutation<T>(
     mutationFn: (input: T) => Promise<void>,
     options: {
       queueKey: string;
       optimisticUpdate?: (input: T) => void;
       rollback?: (input: T) => void;
     }
   )
   ```

3. **Integrate queue processor**
   - Subscribe to NetInfo connectivity changes
   - Process queue when online
   - Handle retries with exponential backoff

### Phase 3: UI & Polish (Week 3)

1. **Add pending indicators**
   - "Pending sync" badges on submissions
   - Offline status bar indicator
   - Queue count in settings

2. **Add optimistic updates**
   - Challenge submissions appear immediately
   - Profile changes reflect instantly
   - Rollback on permanent failure

### Phase 4: Background Sync (Week 4)

1. **expo-task-manager integration**
   - Periodic sync task when app is backgrounded
   - Sync on connectivity change
   - Battery-aware scheduling

## 5. Technical Details

### 5.1 Query Key Strategy

```typescript
// Consistent query keys for selective persistence
const queryKeys = {
  trip: (id: string) => ['trip', id, { persist: true }],
  groups: (tripId: string) => ['groups', tripId, { persist: true }],
  challenges: (tripId: string) => ['challenges', tripId, { persist: true }],
  activity: (tripId: string) => ['activity', tripId], // NOT persisted
  leaderboard: (tripId: string) => ['leaderboard', tripId], // NOT persisted
};
```

### 5.2 Conflict Resolution

For Phase 1, use **Last-Write-Wins** with server authority:
- Offline mutations are queued, not applied to server state
- When syncing, server state overwrites local
- User sees "Your submission is pending" until confirmed

### 5.3 Error Handling

```typescript
// Mutation error classification
enum MutationErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',      // Queue for retry
  VALIDATION_ERROR = 'VALIDATION_ERROR',  // Immediate failure
  CONFLICT_ERROR = 'CONFLICT_ERROR',      // Discard + refresh
  SERVER_ERROR = 'SERVER_ERROR',          // Retry with backoff
}
```

### 5.4 Testing Strategy

| Test Type | Scope |
|-----------|-------|
| Unit | Queue CRUD, optimistic update logic, rollback |
| Integration | Offline → online transition, queue processing, persistence |
| E2E | Complete offline flow: view trip → submit challenge → come online → verify sync |

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Queue grows unbounded | High | Max queue size (100), auto-discard oldest |
| Sync conflicts with other users | Medium | Last-write-wins for Phase 1, no concurrent edit support |
| Large SQLite database | Medium | Auto-cleanup after trip ends, max 7-day retention |
| Background sync battery drain | Medium | Only sync when charging or WiFi, max 1/hour |
| Schema mismatch after app update | Medium | Version queue entries, clear queue on breaking change |

## 7. Success Metrics

- **Offline read coverage**: % of screens usable offline (target: 80%)
- **Mutation success rate**: % of offline actions successfully synced (target: 99%)
- **Time to sync**: Median time from online to queue empty (target: <5s)
- **User satisfaction**: Reduction in "app doesn't work offline" complaints

## 8. Future Phases

### Phase 2: Delta Sync
- Implement server-side delta endpoints
- Reduce sync payload by 80%
- Support partial updates

### Phase 3: Full Local-First
- Migrate to ElectricSQL or PowerSync
- Real-time collaborative features
- Conflict resolution UI

## 9. References

- [Expo Local-First Guide](https://docs.expo.dev/guides/local-first/)
- [React Query Persistence](https://tanstack.com/query/latest/docs/framework/react/plugins/persist-query-client)
- [NetInfo Offline-First](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode)
- [MIRAI Data Retention Policy](docs/conventions/data-retention.md)
