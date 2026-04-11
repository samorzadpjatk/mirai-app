# Task: Native App Migration to URQL

**Status:** In Progress  
**Created:** 2026-04-11  
**Target Quality:** 3.5/5.0  
**Max Iterations:** 3

## Description

Complete the migration of all remaining TanStack Query hooks in the native app to urql, following the established pattern from the web app migration.

## Scope

### Phase 3: Native App Migration (complete all remaining)

#### Hooks to Migrate:

1. **hooks/challenges/** (3 hooks)
   - `useChallengeCapture.ts` - useQuery, useMutation, useQueryClient
   - `useChallenges.ts` - useQuery, useInfiniteQuery
   - `useChallengeDetails.ts` - useQuery

2. **hooks/groups/** (5 hooks)
   - `useCreateGroup.ts` - useMutation, useQueryClient
   - `useMyGroup.ts` - useQuery
   - `useGroups.ts` - useInfiniteQuery
   - `useGroupEditor.ts` - useQuery, useMutation, useQueryClient
   - `useGroupDetails.ts` - useQuery

3. **hooks/location/** (1 hook)
   - `useLocationPermissions.ts` - useQuery, useMutation, useQueryClient (DUPLICATE FUNCTION - needs fixing)

4. **hooks/map/** (3 hooks)
   - `useMapActions.ts` - useMutation (uses useTRPC, needs migration to direct GraphQL)
   - `useMapLocationStream.ts` - useQueryClient (for cache invalidation)
   - `useMapSharing.ts` - useQuery, useMutation

5. **hooks/notifications/** (2 hooks)
   - `useAutoPushSubscription.ts` - useMutation, useQueryClient
   - `useNotificationSchedules.ts` - useQuery, useMutation, useQueryClient

6. **hooks/rewards/** (1 file with 8 exports)
   - `index.ts` - useQuery, useInfiniteQuery, useMutation, useQueryClient

7. **hooks/community/** (2 hooks)
   - `useCommunityFeed.ts` - useInfiniteQuery, useMutation, useQueryClient
   - `useCommunityActivityData.ts` - useQuery

8. **hooks/trips/** (1 hook)
   - `useTripResources.ts` - useQuery

#### Components Using TanStack Query (40+ files):

- All components using the above hooks
- Stores using TanStack Query (judgement, location)

#### Tests:

- Update all test files for migrated hooks

## Migration Pattern

### Before (TanStack Query):

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const { data, isLoading } = useQuery({
  queryKey: ["challenges", tripId],
  queryFn: () => fetchChallenges(tripId),
});

const mutation = useMutation({
  mutationFn: createChallenge,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["challenges"] });
  },
});
```

### After (urql):

```typescript
import { useQuery, useMutation, useClient } from "urql";
import {
  GetChallengesDocument,
  CreateChallengeDocument,
} from "@mirai-app/graphql-client/urql";

const client = useClient();

const [{ data, fetching }] = useQuery({
  query: GetChallengesDocument,
  variables: { tripId },
});

const [, createChallenge] = useMutation(CreateChallengeDocument);

const handleCreate = async () => {
  const result = await createChallenge({ input });
  if (!result.error) {
    client.invalidate(GetChallengesDocument, { tripId });
  }
};
```

## Acceptance Criteria

- [ ] All hooks in hooks/challenges/ migrated
- [ ] All hooks in hooks/groups/ migrated
- [ ] All hooks in hooks/location/ migrated (fix duplicate function)
- [ ] All hooks in hooks/map/ migrated
- [ ] All hooks in hooks/notifications/ migrated
- [ ] All hooks in hooks/rewards/ migrated
- [ ] All hooks in hooks/community/ migrated
- [ ] All hooks in hooks/trips/ migrated
- [ ] All components updated to use new hooks
- [ ] All tests updated and passing
- [ ] Type checking passes
- [ ] Build verification passes

## Dependencies

- `@mirai-app/graphql-client` with urql hooks
- `urql` package in native app

## Notes

1. The native app uses a mix of:
   - Old `@mirai-app/graphql-client` TanStack Query hooks (deprecated)
   - Direct graphql-request usage
   - Native custom GraphQL client

2. Need to standardize on urql pattern:
   - Import hooks from `urql`
   - Use generated documents from `@mirai-app/graphql-client/urql`
   - Handle cache invalidation via `useClient().invalidate()`
   - Convert `isLoading` to `fetching`
   - Handle errors manually (no `onError` callback)

3. Known issues to fix:
   - `useLocationPermissions.ts` has DUPLICATE function exports
   - `useMapActions.ts` uses useTRPC which is deprecated

## Verification Steps

1. Run native tests: `cd apps/native && bun test`
2. Type check: `cd apps/native && bun tsc --noEmit`
3. Build verification: `cd apps/native && bun expo prebuild`
