# Design: Fix All NOTEs in apps/native

**Approach:** Full Implementation Pipeline (Approach 1)  
**Scope:** Complete backend feature implementation to eliminate all 5 NOTE markers  
**Estimated Duration:** ~4.5 hours  
**Status:** Draft

---

## 1. Overview

This design implements the missing backend features referenced by NOTE comments in `apps/native`. All 5 NOTEs will be resolved through proper GraphQL schema extensions, resolver implementations, and frontend hook refactoring.

### 1.1 Current State

| File                     | Line | NOTE Text                                               | Root Cause                                               |
| ------------------------ | ---- | ------------------------------------------------------- | -------------------------------------------------------- |
| `useGroupEditor.ts`      | 20   | Member assignment/removal mutations not yet implemented | Missing GraphQL mutations                                |
| `useChallengeDetails.ts` | 8    | Challenge data via submission lookup (workaround)       | Using indirect query instead of direct `challenge` query |
| `_layout.tsx`            | 169  | Email verification not yet implemented in backend       | Missing `emailVerified` field on User type               |
| `useChallenges.ts`       | 12   | Challenges fetched via trip data                        | Not using existing `challengesByTrip` query              |
| `useChallenges.ts`       | 25   | Pagination not yet implemented                          | Need cursor-based pagination support                     |

### 1.2 Target State

All NOTEs replaced with clean implementations:

- Group member management through proper mutations
- Direct challenge queries with proper pagination
- Email verification field exposed in GraphQL schema
- Clean frontend hooks without workarounds

---

## 2. Backend Architecture Changes

### 2.1 GraphQL Schema Extensions

#### 2.1.1 User Type Enhancement

**File:** `apps/backend-server/src/graphql/types/User.ts`

Add `emailVerified` field:

```typescript
emailVerified: t.field({
  type: "DateTime",
  description: "When the user's email was verified (null if unverified)",
  nullable: true,
  resolve: async (user, _args, context) => {
    // Fetch from Supabase Auth metadata
    const supabase = context.supabase;
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(user.authUserId);
    return authUser?.email_confirmed_at ?? null;
  },
}),
```

#### 2.1.2 Group Member Mutations

**File:** `apps/backend-server/src/graphql/types/group.ts`

Add input types:

```typescript
export const AssignUserToGroupInput = builder.inputType(
  "AssignUserToGroupInput",
  {
    description: "Input for assigning a user to a group",
    fields: (t) => ({
      userId: t.id({ description: "ID of the user to assign", required: true }),
      groupId: t.id({ description: "ID of the group", required: true }),
      tripId: t.id({ description: "ID of the trip", required: true }),
    }),
  },
);

export const RemoveUserFromGroupInput = builder.inputType(
  "RemoveUserFromGroupInput",
  {
    description: "Input for removing a user from a group",
    fields: (t) => ({
      userId: t.id({ description: "ID of the user to remove", required: true }),
      groupId: t.id({ description: "ID of the group", required: true }),
      tripId: t.id({ description: "ID of the trip", required: true }),
    }),
  },
);
```

Add payload types:

```typescript
export const AssignUserToGroupPayload = builder.objectType(
  "AssignUserToGroupPayload",
  {
    description: "Result of assigning a user to a group",
    fields: (t) => ({
      group: t.field({ type: "Group", nullable: false }),
      user: t.field({ type: "User", nullable: false }),
      assignedAt: t.field({ type: "DateTime", nullable: false }),
    }),
  },
);

export const RemoveUserFromGroupPayload = builder.objectType(
  "RemoveUserFromGroupPayload",
  {
    description: "Result of removing a user from a group",
    fields: (t) => ({
      success: t.boolean({ nullable: false }),
      groupId: t.id({ nullable: false }),
      userId: t.id({ nullable: false }),
    }),
  },
);
```

#### 2.1.3 Challenge Pagination Enhancement

**File:** `apps/backend-server/src/graphql/types/challenge.ts`

Update existing `ChallengesConnection` (already defined) to add cursor support:

```typescript
export const ChallengeEdge = builder.objectType("ChallengeEdge", {
  description: "Edge type for challenge pagination",
  fields: (t) => ({
    node: t.field({ type: "Challenge", nullable: false }),
    cursor: t.string({ nullable: false }),
  }),
});

export const PageInfo = builder.objectType("PageInfo", {
  description: "Pagination info for cursor-based pagination",
  fields: (t) => ({
    hasNextPage: t.boolean({ nullable: false }),
    hasPreviousPage: t.boolean({ nullable: false }),
    startCursor: t.string({ nullable: true }),
    endCursor: t.string({ nullable: true }),
  }),
});
```

### 2.2 Resolver Implementations

#### 2.2.1 Group Member Mutations

**File:** `apps/backend-server/src/graphql/resolvers/group.ts`

Add after existing mutations (around line 506):

```typescript
/**
 * Mutation: assignUserToGroup - Assign a user to a group
 *
 * Requires moderator role. Assigns user to group within trip context.
 */
builder.mutationField("assignUserToGroup", (t) =>
  t.field({
    description: "Assign a user to a group",
    type: "AssignUserToGroupPayload",
    nullable: false,
    args: {
      input: t.arg({
        type: "AssignUserToGroupInput",
        description: "Assignment data",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      await requireModerator(context);

      const controller =
        context.container.resolve<GroupController>("groupController");

      const result = await controller.assignUser({
        userId: args.input.userId,
        groupId: args.input.groupId,
        tripId: args.input.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        group: result.data.group,
        user: result.data.user,
        assignedAt: new Date(),
      };
    },
  }),
);

/**
 * Mutation: removeUserFromGroup - Remove a user from a group
 *
 * Requires moderator role. Removes user from group within trip context.
 */
builder.mutationField("removeUserFromGroup", (t) =>
  t.field({
    description: "Remove a user from a group",
    type: "RemoveUserFromGroupPayload",
    nullable: false,
    args: {
      input: t.arg({
        type: "RemoveUserFromGroupInput",
        description: "Removal data",
        required: true,
      }),
    },
    authScopes: {
      moderator: true,
    },
    resolve: async (_root, args, context) => {
      await requireModerator(context);

      const controller =
        context.container.resolve<GroupController>("groupController");

      const result = await controller.removeUser({
        userId: args.input.userId,
        groupId: args.input.groupId,
        tripId: args.input.tripId,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      return {
        success: true,
        groupId: args.input.groupId,
        userId: args.input.userId,
      };
    },
  }),
);
```

#### 2.2.2 Challenge Pagination in Resolver

**File:** `apps/backend-server/src/graphql/resolvers/challenge.ts`

Update `challengesByTrip` resolver to support cursor pagination:

```typescript
builder.queryField("challengesByTrip", (t) =>
  t.field({
    description: "Get challenges for a specific trip",
    type: "ChallengesConnection",
    args: {
      tripId: t.arg.id({ description: "ID of the trip", required: true }),
      first: t.arg.int({
        description: "Number of items to fetch",
        required: false,
      }),
      after: t.arg.string({
        description: "Cursor to fetch after",
        required: false,
      }),
    },
    authScopes: { authenticated: true },
    resolve: async (_root, args, context) => {
      await requireAuth(context);

      const controller = context.container.resolve<ChallengeController>(
        "challengeController",
      );

      // Decode cursor if provided
      let cursor: { createdAt: Date; id: string } | undefined;
      if (args.after) {
        const decoded = Buffer.from(args.after, "base64").toString("utf-8");
        const [timestamp, id] = decoded.split(":");
        cursor = { createdAt: new Date(parseInt(timestamp, 10)), id };
      }

      const result = await controller.getByTripIdCursor({
        tripId: args.tripId,
        first: args.first ?? 30,
        after: cursor,
      });

      if (!result.success) {
        throw mapErrorToGraphQL(new Error(result.error));
      }

      const edges = result.data.map((challenge) => ({
        node: challenge,
        cursor: Buffer.from(
          `${challenge.createdAt.getTime()}:${challenge.id}`,
        ).toString("base64"),
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: result.hasNextPage,
          hasPreviousPage: false,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    },
  }),
);
```

---

## 3. Frontend Architecture Changes

### 3.1 Hook Refactoring

#### 3.1.1 useGroupEditor.ts

**File:** `apps/native/src/hooks/groups/useGroupEditor.ts`

Replace stub implementations:

```typescript
import { useCallback } from "react";
import { useQuery, useMutation, useClient } from "urql";
import {
  GetGroupDocument,
  UpdateGroupDocument,
  GetGroupsByTripDocument,
  AssignUserToGroupDocument,
  RemoveUserFromGroupDocument,
} from "@mirai-app/graphql-client";

export function useGroupEditor(groupId?: string | null) {
  const client = useClient();

  const [{ data: groupData, fetching: isLoading }] = useQuery({
    query: GetGroupDocument,
    variables: { id: groupId ?? "" },
    pause: !groupId,
  });

  const [, updateMutation] = useMutation(UpdateGroupDocument);
  const [, assignMutation] = useMutation(AssignUserToGroupDocument);
  const [, removeMutation] = useMutation(RemoveUserFromGroupDocument);

  // Implemented: Assign user to group
  const assignUser = useCallback(
    async (userId: string, tripId: string) => {
      if (!groupId) throw new Error("Group ID required");

      const result = await assignMutation({
        input: { userId, groupId, tripId },
      });

      if (result.error) {
        throw result.error;
      }

      // Invalidate relevant queries
      client.invalidate(GetGroupDocument, { id: groupId });
      client.invalidate(GetGroupsByTripDocument, {
        tripId,
        limit: 30,
        offset: 0,
      });

      return result.data;
    },
    [groupId, assignMutation, client],
  );

  // Implemented: Remove user from group
  const removeUser = useCallback(
    async (userId: string) => {
      if (!groupId) throw new Error("Group ID required");

      const tripId = groupData?.group?.trip?.id;
      if (!tripId) throw new Error("Trip ID not available");

      const result = await removeMutation({
        input: { userId, groupId, tripId },
      });

      if (result.error) {
        throw result.error;
      }

      // Invalidate relevant queries
      client.invalidate(GetGroupDocument, { id: groupId });
      client.invalidate(GetGroupsByTripDocument, {
        tripId,
        limit: 30,
        offset: 0,
      });

      return result.data;
    },
    [groupId, groupData, removeMutation, client],
  );

  // ... rest of the hook
}
```

#### 3.1.2 useChallengeDetails.ts

**File:** `apps/native/src/hooks/challenges/useChallengeDetails.ts`

Use direct challenge query:

```typescript
import { useMemo } from "react";
import { useQuery } from "urql";
import {
  GetChallengeDocument,
  GetCurrentUserDocument,
} from "@mirai-app/graphql-client";

export function useChallengeDetails(
  challengeId?: string | null,
  tripId?: string | null,
) {
  const [{ data: currentUserData }] = useQuery({
    query: GetCurrentUserDocument,
  });

  // Using direct challenge query instead of submission lookup
  const [{ data: challengeData, fetching }] = useQuery({
    query: GetChallengeDocument,
    variables: {
      id: challengeId ?? "",
      tripId: tripId ?? "",
    },
    pause: !challengeId || !tripId,
  });

  const challenge = useMemo(() => {
    return challengeData?.challenge ?? null;
  }, [challengeData]);

  const isAssignedToUser = useMemo(() => {
    // Check if current user is assigned to this challenge
    if (!currentUserData?.me || !challenge) return false;
    // Assignment logic based on user's group participation
    return false; // To be implemented based on business rules
  }, [currentUserData, challenge]);

  return {
    challenge,
    isLoading: fetching,
    isAssignedToUser,
  };
}
```

#### 3.1.3 useChallenges.ts

**File:** `apps/native/src/hooks/challenges/useChallenges.ts`

Migrate to `challengesByTrip` with pagination:

```typescript
import { useCallback, useMemo } from "react";
import { useQuery } from "urql";
import {
  GetChallengesByTripDocument,
  GetCurrentUserDocument,
} from "@mirai-app/graphql-client";
import { colors } from "~/styles";
import type { ChallengeListItem } from "~/components/trips/challenges/types";

const PAGE_SIZE = 30;

export function useChallenges(tripId?: string | null) {
  const [{ data: challengesData, fetching: challengesLoading }] = useQuery({
    query: GetChallengesByTripDocument,
    variables: {
      tripId: tripId ?? "",
      first: PAGE_SIZE,
    },
    pause: !tripId,
  });

  const [{ data: currentUserData }] = useQuery({
    query: GetCurrentUserDocument,
  });

  const currentUser = currentUserData?.me;

  // Cursor-based pagination state
  const [after, setAfter] = useState<string | null>(null);

  const hasNextPage =
    challengesData?.challengesByTrip?.pageInfo?.hasNextPage ?? false;
  const endCursor =
    challengesData?.challengesByTrip?.pageInfo?.endCursor ?? null;

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || !endCursor) return;
    setAfter(endCursor);
  }, [hasNextPage, endCursor]);

  // Map challenges from connection edges
  const challenges: ChallengeListItem[] = useMemo(() => {
    const edges = challengesData?.challengesByTrip?.edges ?? [];

    return edges.map((edge) => {
      const challenge = edge.node;
      // ... mapping logic from current implementation
      return {
        id: challenge.id,
        title: challenge.name,
        // ... rest of mapping
      } as ChallengeListItem;
    });
  }, [challengesData]);

  const refresh = useCallback(async () => {
    setAfter(null);
  }, []);

  return {
    challenges,
    completedChallengesCount: challenges.filter(
      (c) => c.status === "solved" || c.status === "submitted",
    ).length,
    isLoading: challengesLoading,
    isRefreshing: false,
    hasNextPage,
    isFetchingNextPage: false,
    fetchNextPage,
    refresh,
  };
}
```

#### 3.1.4 \_layout.tsx Email Verification

**File:** `apps/native/src/app/_layout.tsx`

Update user mapping to include emailVerified:

```typescript
// In the user mapping logic around line 169:
const currentUser: User = {
  id: user.id,
  authUserId: user.authUserId,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  name:
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || null,
  emailVerified: user.emailVerified ?? null, // Now available from GraphQL
  role: user.role,
};
```

---

## 4. Implementation Phases

### Phase 1: Backend Schema & Types (1.5 hours)

**Order matters - dependencies exist between these tasks:**

1. **User.emailVerified field** (30 min)
   - [ ] Add field to `types/User.ts`
   - [ ] Implement resolver with Supabase Auth lookup
   - [ ] Regenerate GraphQL client types (`bun run generate` in graphql-client package)

2. **Group mutation types** (30 min)
   - [ ] Add input types: `AssignUserToGroupInput`, `RemoveUserFromGroupInput`
   - [ ] Add payload types: `AssignUserToGroupPayload`, `RemoveUserFromGroupPayload`
   - [ ] Regenerate GraphQL client types

3. **Challenge pagination types** (30 min)
   - [ ] Add `ChallengeEdge` type
   - [ ] Add `PageInfo` type
   - [ ] Regenerate GraphQL client types

### Phase 2: Backend Resolvers (1.5 hours)

1. **Group member mutations** (45 min)
   - [ ] Implement `assignUserToGroup` resolver
   - [ ] Implement `removeUserFromGroup` resolver
   - [ ] Add controller methods: `assignUser`, `removeUser`
   - [ ] Add use case implementations

2. **Challenge pagination resolver** (45 min)
   - [ ] Update `challengesByTrip` with cursor support
   - [ ] Implement cursor encoding/decoding
   - [ ] Add controller method: `getByTripIdCursor`
   - [ ] Add use case with cursor-based repository queries

### Phase 3: Frontend Hook Refactoring (1 hour)

1. **useGroupEditor.ts** (20 min)
   - [ ] Add mutation imports
   - [ ] Implement `assignUser` with mutation
   - [ ] Implement `removeUser` with mutation
   - [ ] Add cache invalidation

2. **useChallengeDetails.ts** (15 min)
   - [ ] Switch to `GetChallengeDocument` query
   - [ ] Remove submission-based lookup
   - [ ] Update hook signature if needed

3. **useChallenges.ts** (20 min)
   - [ ] Migrate to `challengesByTrip` query
   - [ ] Add cursor pagination state
   - [ ] Implement `fetchNextPage`
   - [ ] Update challenge mapping from edges

4. **\_layout.tsx** (5 min)
   - [ ] Add `emailVerified` to user mapping

### Phase 4: Testing & Verification (30 min)

1. **Type checking** (10 min)
   - [ ] Run `bun run typecheck` in all affected packages
   - [ ] Fix any type errors

2. **Integration testing** (20 min)
   - [ ] Test group member assignments in UI
   - [ ] Test challenge pagination
   - [ ] Verify email verification field appears in queries

---

## 5. Error Handling Strategy

### 5.1 Backend Errors

All resolvers follow existing error handling patterns:

```typescript
if (!result.success) {
  // Map domain errors to GraphQL errors
  throw mapErrorToGraphQL(new Error(result.error));
}
```

Specific error cases:

- **NotFoundError**: User, group, or challenge doesn't exist
- **AuthorizationError**: User lacks moderator/admin permissions
- **ConflictError**: User already assigned to group

### 5.2 Frontend Error Handling

Hooks follow existing patterns from other mutations:

```typescript
const assignUser = useCallback(
  async (userId: string, tripId: string) => {
    if (!groupId) throw new Error("Group ID required");

    const result = await assignMutation({ input: { userId, groupId, tripId } });

    if (result.error) {
      // Error propagates to caller (component handles UI feedback)
      throw result.error;
    }

    return result.data;
  },
  [groupId, assignMutation],
);
```

---

## 6. Testing Approach

### 6.1 Backend Tests

Follow existing test patterns in `apps/backend-server/src/graphql/__tests__/`:

1. **Resolver tests** for new mutations
   - Success case: user assigned/removed from group
   - Auth failure: non-moderator cannot assign users
   - Not found: invalid user/group IDs

2. **Type tests** for new fields
   - Verify `emailVerified` field resolves correctly
   - Test nullable behavior for unverified users

### 6.2 Frontend Tests

Update or add tests in `apps/native/test/`:

1. **Hook tests** for refactored hooks
   - Test `useGroupEditor` assign/remove flows
   - Test `useChallenges` pagination
   - Test `useChallengeDetails` direct query

---

## 7. Dependencies & Prerequisites

### 7.1 Required Controller Methods

The adapters layer needs these new controller methods:

```typescript
// GroupController
assignUser(input: { userId: string; groupId: string; tripId: string }): Promise<Result<{ group: Group; user: User }, string>>;
removeUser(input: { userId: string; groupId: string; tripId: string }): Promise<Result<void, string>>;

// ChallengeController
getByTripIdCursor(input: { tripId: string; first: number; after?: Cursor }): Promise<Result<Challenge[], string> & { hasNextPage: boolean }>;
```

### 7.2 Required Use Cases

The use-cases layer needs:

```typescript
// Group Use Cases
AssignUserToGroupUseCase: Execute(input: { userId: UserId; groupId: GroupId; tripId: TripId; moderatorId: UserId }): Effect<Success, NotFoundError | AuthorizationError | ConflictError>;
RemoveUserFromGroupUseCase: Execute(input: { userId: UserId; groupId: GroupId; tripId: TripId; moderatorId: UserId }): Effect<Success, NotFoundError | AuthorizationError>;

// Challenge Use Cases
GetChallengesByTripCursorUseCase: Execute(input: { tripId: TripId; first: number; after?: Cursor }): Effect<PaginatedResult<Challenge>, never>;
```

### 7.3 Database Requirements

No schema changes required - existing tables support:

- Group membership via `trip_participants` table (group_id column)
- Email verification tracked in Supabase Auth (metadata)
- Challenge ordering by `created_at` field

---

## 8. Risk Assessment

| Risk                                                     | Likelihood | Impact | Mitigation                                                            |
| -------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------- |
| Supabase Auth rate limits for email verification lookups | Medium     | Medium | Cache results in resolver, refresh on auth events only                |
| Cursor pagination breaks with many challenges            | Low        | High   | Test with 1000+ challenges, consider offset fallback                  |
| Group member mutations conflict with existing logic      | Medium     | High   | Extensive testing of join/leave flow, ensure no duplicate assignments |
| GraphQL client generation breaks                         | Low        | High   | Run generation separately, commit types, test before frontend changes |

---

## 9. Success Criteria

All NOTEs will be considered "fixed" when:

1. [ ] All 5 NOTE comments removed from source code
2. [ ] Group member assignment/removal works through UI
3. [ ] Challenge details load via direct query (not submission lookup)
4. [ ] Challenges list paginates properly with cursor-based pagination
5. [ ] Email verification field available in user queries
6. [ ] All type checks pass (`bun run typecheck`)
7. [ ] Integration tests verify each feature works end-to-end

---

## 10. Rollback Plan

If issues arise:

1. **GraphQL schema changes**: Schema additions are backward compatible (nullable fields, new mutations)
2. **Frontend changes**: Old hooks kept with deprecation warnings until new implementation stable
3. **Database**: No migrations required - rollback is code-only

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-15  
**Author:** AI Assistant  
**Review Status:** Ready for Implementation
