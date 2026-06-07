# Offline-First Architecture

## Overview

The MIRAI native app implements a two-layer offline-first architecture:

1. **Offline Read Layer**: React Query cache is persisted to AsyncStorage, allowing users to view active trip data even when offline.
2. **Offline Write Layer**: Safe mutations are queued when offline and automatically synced when connectivity returns.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ OfflineStatus│  │ PendingBadge │  │ CacheWarning │   │
│  │    Bar       │  │              │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
├─────────────────────────────────────────────────────────┤
│                 React Query Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  useQuery    │  │ useMutation  │  │ PersistCache │   │
│  │  (offlineFirst)│  │ (offline)  │  │ (AsyncStorage)│   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
├─────────────────────────────────────────────────────────┤
│                  Sync Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Queue      │  │  Processor   │  │   NetInfo    │   │
│  │  (Storage)   │  │  (FIFO)      │  │  (Listener)  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Offline Read

### Query Persistence

Active trip data is persisted to AsyncStorage using `@tanstack/react-query-persist-client`:

- **Trips**: `useTrips`, `useTripDetails`
- **Groups**: `useGroups`
- **Challenges**: `useChallenges`

Queries are marked with `{ persist: true }` in their query key to enable selective persistence.

### Cache Configuration

```typescript
// QueryClient defaults
{
  networkMode: 'offlineFirst',
  gcTime: 24 * 60 * 60 * 1000, // 24 hours
  staleTime: 5 * 60 * 1000,     // 5 minutes
}
```

### Cache Age Warning

When cached data is older than 7 days, a warning banner appears:
- **Offline**: "Data is X days old — may be outdated"
- **Online**: "Data is X days old — refreshing..."

## Offline Write

### Safe Mutations (Queued)

The following mutations are wrapped with `useOfflineMutation` and can be queued when offline:

- `challengeSubmission.create` (image, video, QR, location, text)
- `group.create`
- `group.update`
- `group.assignUserToGroup`
- `group.removeUserFromGroup`
- `user.updateMyProfile`
- `user.updateAvatar`

### Unsafe Mutations (Blocked)

The following mutations are blocked when offline and never queued:

- `user.banUserUntil` (admin action)
- `user.deleteUser` (admin action)
- `user.forceEndJudgedStaffVoting` (admin action)
- `purchaseReward` (financial)
- `addCoins` (financial)
- `submitVotes` (peer voting)
- `respondToJoinRequest` (atomic operation)
- `updateWristNumber` (external system)

### Queue Behavior

- **Max size**: 100 entries (FIFO discard of oldest)
- **Retry policy**: Exponential backoff (1s, 2s, 4s) with max 3 retries
- **Validation errors**: Removed from queue, user notified immediately
- **Server errors**: Retried with backoff
- **Network errors**: Queued for later sync

### Queue Status

The queue status is visible in the Profile screen under "Sync Issues":
- Pending count
- Failed mutations with error details
- Clear queue button (discards all pending mutations)

## UI Indicators

### Offline Status Bar

A global status bar at the top of the app shows:
- **Red**: "Offline — some features may be limited"
- **Blue**: "Syncing..."
- **Yellow**: "Sync failed — some changes couldn't be saved"

### Pending Badge

Individual mutation states are shown with colored badges:
- **Yellow**: Pending
- **Green**: Synced
- **Red**: Failed

## Download for Offline

Users can proactively cache all active trip data by tapping the "Download for offline" button on the trip details screen. This pre-fetches:
- Trip details
- Groups
- Challenges
- Participants
- Resources

## Background Sync

A background task (registered via `expo-task-manager`) attempts to process the queue periodically (1 hour interval). Note: iOS background fetch is not guaranteed and depends on OS scheduling.

## Developer Usage

### Wrapping a Mutation

```typescript
import { useOfflineMutation } from "~/hooks/offline/useOfflineMutation";

const mutation = useOfflineMutation({
  mutationFn: (variables) => orpc.some.mutation.mutate(variables),
  mutationKey: "some.mutation",
  onSuccess: () => {
    // Invalidate queries
  },
});

// Use mutation.mutateAsync() instead of mutation.mutate()
```

### Marking a Query for Persistence

```typescript
useQuery({
  queryKey: ["myData", id, { persist: true }],
  // ...
});
```

### Checking Network Status

```typescript
import { useNetworkStatus } from "~/hooks/offline/useNetworkStatus";

const { isConnected, isInternetReachable } = useNetworkStatus();
```

## Testing

Unit tests are provided for:
- `storage.ts` — CRUD operations, queue limits, schema versioning
- `errorClassifier.ts` — Error classification logic
- `offlineQueueStore.ts` — Store state transitions
- `queueProcessor.ts` — FIFO processing, retry logic

Run tests with:
```bash
bun test apps/native/src/services/offline
```

## Performance

- **Cache read**: <100ms from AsyncStorage
- **Queue processing**: <5s for typical queue
- **Memory footprint**: Zustand store only (no persistence)
- **Storage**: Max 6MB on Android (AsyncStorage limit)

## Limitations

- **AsyncStorage**: 6MB limit on Android, unencrypted
- **Background sync**: iOS not guaranteed
- **Conflict resolution**: Last-write-wins only (Phase 1)
- **No optimistic UI**: Cache rollback only
- **Selective sync**: Active trip data only
