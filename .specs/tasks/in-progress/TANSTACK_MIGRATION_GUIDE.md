# TanStack Query to urql Migration Guide

## Status

### ✅ Completed (Core Infrastructure)
- **Hooks migrated**: challenges, groups, location, map, rewards, trips, notifications, admin, community, sponsors
- **urql client**: Configured with WebSocket support, cache exchange, SecureStore auth
- **Package.json**: Updated with urql dependencies

### 🔄 Remaining (49 page components)
Files in `apps/native/src/app/(tabs)/` need migration:
- Admin pages: activity, challenges, rewards, coins, groups, schedules, transactions, users
- Tab pages: challenges, community, map, profile, trips

## Migration Patterns

### 1. Import Changes
```typescript
// Before
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"

// After  
import { useQuery, useMutation, useClient } from "urql"
```

### 2. useQuery Migration
```typescript
// Before
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["GetTrip", tripId],
  queryFn: async () => {
    const client = await createGraphQLClient()
    return useGetTripQuery.fetcher(client, { id: tripId })()
  },
  enabled: !!tripId,
})

// After
const [{ data, fetching, error }, refetch] = useQuery({
  query: GetTripDocument,
  variables: { id: tripId },
  pause: !tripId,
})
```

### 3. useMutation Migration
```typescript
// Before
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: async (input) => {
    const client = await createGraphQLClient()
    return useCreateTripMutation.fetcher(client, { input })()
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["GetTrips"] })
  },
})

// After
const client = useClient()
const [, createTrip] = useMutation(CreateTripDocument)
const handleCreate = async (input) => {
  const result = await createTrip({ input })
  if (result.error) throw result.error
  client.invalidate(GetTripsDocument)
  return result.data
}
```

### 4. useInfiniteQuery Migration
```typescript
// Before
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ["GetTrips", "infinite"],
  queryFn: async ({ pageParam }) => { /* ... */ },
  getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.offset + PAGE_SIZE : undefined,
})

// After
const [offset, setOffset] = useState(0)
const [{ data, fetching }] = useQuery({
  query: GetTripsDocument,
  variables: { limit: PAGE_SIZE, offset },
})
const hasNextPage = (data?.trips?.length ?? 0) === PAGE_SIZE
const fetchNextPage = () => hasNextPage && setOffset(o => o + PAGE_SIZE)
```

### 5. Cache Invalidation
```typescript
// Before
const queryClient = useQueryClient()
queryClient.invalidateQueries({ queryKey: ["GetTrips"] })
queryClient.setQueryData(["GetTrip", id], newData)

// After
const client = useClient()
client.invalidate(GetTripsDocument) // Invalidate all GetTrips queries
client.invalidate(GetTripDocument, { id }) // Invalidate specific query
// Note: setQueryData equivalent requires direct cache access or re-fetch
```

## Remaining Files Checklist

### Admin Pages
- [ ] app/(tabs)/admin/index.tsx - Partially migrated
- [ ] app/(tabs)/admin/activity/index.tsx
- [ ] app/(tabs)/admin/activity/edit/[activityId].tsx
- [ ] app/(tabs)/admin/activity/new.tsx
- [ ] app/(tabs)/admin/challenges/index.tsx
- [ ] app/(tabs)/admin/challenges/staff-vote.tsx
- [ ] app/(tabs)/admin/challenges/submissions.tsx
- [ ] app/(tabs)/admin/challenges/new.tsx
- [ ] app/(tabs)/admin/challenges/[id].tsx
- [ ] app/(tabs)/admin/challenges/judgement.tsx
- [ ] app/(tabs)/admin/rewards/index.tsx
- [ ] app/(tabs)/admin/rewards/edit/[rewardId].tsx
- [ ] app/(tabs)/admin/rewards/new.tsx
- [ ] app/(tabs)/admin/coins/index.tsx
- [ ] app/(tabs)/admin/groups/index.tsx
- [ ] app/(tabs)/admin/groups/edit/[groupId].tsx
- [ ] app/(tabs)/admin/groups/new.tsx
- [ ] app/(tabs)/admin/schedules/index.tsx
- [ ] app/(tabs)/admin/transactions/index.tsx
- [ ] app/(tabs)/admin/users/index.tsx
- [ ] app/(tabs)/admin/users/edit/[userId].tsx

### User Pages
- [ ] app/(tabs)/challenges/
- [ ] app/(tabs)/community/
- [ ] app/(tabs)/map/
- [ ] app/(tabs)/profile/
- [ ] app/(tabs)/trips/

## Verification Steps

After each migration:
1. Update imports
2. Replace hook calls
3. Handle error states (urql uses `error` instead of separate states)
4. Update loading checks (urql uses `fetching`)
5. Test component renders
6. Test data fetching
7. Test mutations

## Running Tests

```bash
cd apps/native
bun test
bun typecheck
```
