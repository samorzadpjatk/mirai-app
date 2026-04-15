# GraphQL Migration Analysis

> Analysis of inline GraphQL queries that need migration to Pothos → Codegen workflow  
> Generated: 2026-04-15  
> Scope: apps/web, apps/native, apps/seed

---

## Executive Summary

This analysis identifies **35 inline GraphQL queries** across the codebase that bypass the proper Pothos → Codegen workflow. These inline queries need to be migrated to `.graphql` operation files and use generated hooks/types from `@mirai-app/graphql-client`.

### Migration Priority

- **HIGH**: 18 queries using raw string literals with urql client
- **MEDIUM**: 10 queries in seed scripts (used for data seeding)
- **LOW**: 7 queries that are already partially working but need cleanup

---

## 1. apps/web - Inline Query Analysis

### 1.1 useWebFileUpload.ts (Lines 125-146)

**File**: `apps/web/src/hooks/useWebFileUpload.ts`

| Property      | Value                                    |
| ------------- | ---------------------------------------- |
| **Type**      | Mutation + Query                         |
| **Execution** | urql client `.mutation()` and `.query()` |
| **Lines**     | 125-135, 138-146                         |

**Inline Operations**:

```typescript
// Line 125 - CREATE_UPLOAD_URL_MUTATION
mutation CreateUploadUrl($input: CreateUploadUrlInput!) {
  createUploadUrl(input: $input) {
    token
    bucket
    objectPath
    storagePath
    url
  }
}

// Line 138 - CREATE_DOWNLOAD_URL_QUERY
query CreateDownloadUrl($input: CreateDownloadUrlInput!) {
  createDownloadUrl(input: $input) {
    signedUrl
    storagePath
    expiresIn
  }
}
```

**Usage**:

- Line 280-287: `urqlClient.mutation(CREATE_UPLOAD_URL_MUTATION, ...)`
- Line 360-365: `urqlClient.query(CREATE_DOWNLOAD_URL_QUERY, ...)`

**Migration Required**:

1. Move to `packages/graphql-client/src/operations/files.operations.graphql`
2. Import generated `useCreateUploadUrlMutation` and `useCreateDownloadUrlQuery` hooks

---

### 1.2 SubmissionCard.tsx (Lines 59-66)

**File**: `apps/web/src/components/admin/challenges/SubmissionCard.tsx`

| Property      | Value                  |
| ------------- | ---------------------- |
| **Type**      | Query                  |
| **Execution** | urql client `.query()` |
| **Lines**     | 59-66                  |

**Inline Operation**:

```typescript
// Line 60 - CREATE_DOWNLOAD_URL_QUERY
query CreateDownloadUrl($input: CreateDownloadUrlInput!) {
  createDownloadUrl(input: $input) {
    signedUrl
  }
}
```

**Usage**:

- Line 95-97: `urqlClient.query(CREATE_DOWNLOAD_URL_QUERY, { input: { storagePath } })`

**Migration Required**:

- Use generated `useCreateDownloadUrlQuery` hook or import `CreateDownloadUrlDocument`

---

### 1.3 VotingCard.tsx (Lines 26-39)

**File**: `apps/web/src/components/admin/challenges/VotingCard.tsx`

| Property      | Value                                      |
| ------------- | ------------------------------------------ |
| **Type**      | Query (inline in useQuery)                 |
| **Execution** | urql `useQuery()` with inline query string |
| **Lines**     | 26-32                                      |

**Inline Operation**:

```typescript
// Line 26 - Inline useQuery
useQuery({
  query: `
    query CreateDownloadUrl($input: CreateDownloadUrlInput!) {
      createDownloadUrl(input: $input) {
        signedUrl
      }
    }
  `,
  variables: { input: { storagePath: submission.imagePath } },
  pause: !submission.imagePath,
});
```

**Migration Required**:

- Replace inline string with `CreateDownloadUrlDocument` import

---

### 1.4 ChallengeAnalyticsPanel.tsx (Lines 40-70)

**File**: `apps/web/src/components/admin/challenges/ChallengeAnalyticsPanel.tsx`

| Property      | Value                               |
| ------------- | ----------------------------------- |
| **Type**      | 3 Placeholder Queries               |
| **Execution** | urql `useQuery()` with stub queries |
| **Lines**     | 40-70                               |

**Inline Operations**:

```typescript
// Line 42 - GetSubmissionsForAnalytics (stub)
query GetSubmissionsForAnalytics($tripId: ID!, $challengeId: ID!) {
  __typename
}

// Line 54 - GetGroupsCount (stub)
query GetGroupsCount($tripId: ID!) {
  __typename
}

// Line 64 - GetVotesCount (challengeId: ID!) {
  __typename
}
```

**Notes**:

- These are placeholder queries that return only `__typename`
- The component uses tRPC client directly for actual data
- Requires schema extension in Pothos to add these analytics queries

**Migration Required**:

- Extend GraphQL schema with proper analytics fields
- Replace stub queries with real operations

---

### 1.5 middleware.ts (Lines 8-15)

**File**: `apps/web/src/middleware.ts`

| Property      | Value              |
| ------------- | ------------------ |
| **Type**      | Query              |
| **Execution** | Raw `fetch()` call |
| **Lines**     | 8-15               |

**Inline Operation**:

```typescript
// Line 8 - GET_ME_QUERY
query GetMe {
  me {
    id
    role
  }
}
```

**Usage**:

- Line 19-28: `fetch(env.graphqlUrl, { method: "POST", body: JSON.stringify({ query: GET_ME_QUERY }) })`

**Migration Required**:

- This runs in middleware (Edge runtime) - cannot use generated hooks
- Keep as raw fetch, but import query from generated documents
- Import `GetMeDocument` from `@mirai-app/graphql-client/urql`

---

### 1.6 auth.ts (Lines 16-27)

**File**: `apps/web/src/lib/auth.ts`

| Property      | Value                  |
| ------------- | ---------------------- |
| **Type**      | Query                  |
| **Execution** | tRPC client `.query()` |
| **Lines**     | 16-27                  |

**Inline Operation**:

```typescript
// Line 16 - GET_ME_QUERY
query GetMe {
  me {
    id
    authUserId
    email
    firstName
    lastName
    role
  }
}
```

**Usage**:

- Line 38: `client.query<{ me: UserGetMyResponse }>(GET_ME_QUERY)`

**Migration Required**:

- Import `GetMeDocument` from generated client

---

### 1.7 useChallengeSubmissions.ts (Lines 39-63)

**File**: `apps/web/src/hooks/admin/useChallengeSubmissions.ts`

| Property      | Value                |
| ------------- | -------------------- |
| **Type**      | 2 Mutations          |
| **Execution** | urql `useMutation()` |
| **Lines**     | 39-52, 55-63         |

**Inline Operations**:

```typescript
// Line 39 - REVIEW_SUBMISSION_MUTATION
mutation ReviewChallengeSubmission($input: ReviewChallengeSubmissionInput!) {
  reviewChallengeSubmission(input: $input) {
    submission {
      id
      status
      rejectionReason
      awardedPoints
      bonusPoints
      ranking
    }
  }
}

// Line 55 - CREATE_SUBMISSION_REPORT_MUTATION
mutation CreateSubmissionReport($input: CreateSubmissionReportInput!) {
  createSubmissionReport(input: $input) {
    report {
      id
    }
  }
}
```

**Usage**:

- Line 137: `useMutation(REVIEW_SUBMISSION_MUTATION)`
- Line 171: `useMutation(CREATE_SUBMISSION_REPORT_MUTATION)`

**Migration Required**:

- These may already exist in generated client - verify and replace

---

### 1.8 useJudgement.ts (Lines 54-95)

**File**: `apps/web/src/hooks/admin/useJudgement.ts`

| Property      | Value                                 |
| ------------- | ------------------------------------- |
| **Type**      | Query + 2 Mutations                   |
| **Execution** | urql `useQuery()` and `useMutation()` |
| **Lines**     | 54-67, 70-83, 86-95                   |

**Inline Operations**:

```typescript
// Line 54 - GET_CHALLENGE_QUERY
query GetChallenge($id: ID!, $tripId: ID!) {
  challenge(id: $id, tripId: $tripId) {
    id
    name
    scoringCategory
    status
    basePoints
    firstPlacePoints
    secondPlacePoints
    thirdPlacePoints
  }
}

// Line 70 - REVIEW_SUBMISSION_MUTATION
mutation ReviewChallengeSubmission($input: ReviewChallengeSubmissionInput!) {
  reviewChallengeSubmission(input: $input) {
    submission {
      id
      status
      rejectionReason
      awardedPoints
      bonusPoints
      ranking
    }
  }
}

// Line 86 - UPDATE_CHALLENGE_MUTATION
mutation UpdateChallenge($input: UpdateChallengeInput!) {
  updateChallenge(input: $input) {
    challenge {
      id
      status
    }
  }
}
```

**Migration Required**:

- `GetChallengeDocument` likely already exists - use it
- Review and Update mutations may need generation

---

### 1.9 CreateNotificationForm.tsx (Lines 32-41)

**File**: `apps/web/src/components/admin/notifications/CreateNotificationForm.tsx`

| Property      | Value             |
| ------------- | ----------------- |
| **Type**      | Query             |
| **Execution** | urql `useQuery()` |
| **Lines**     | 32-41             |

**Inline Operation**:

```typescript
// Line 32 - GET_GROUPS_QUERY
query GetGroupsByTrip($tripId: ID!) {
  groupsByTrip(tripId: $tripId) {
    groups {
      id
      name
    }
  }
}
```

**Migration Required**:

- Check if `GetGroupsByTripDocument` exists in generated client
- May need to add to schema/operations

---

## 2. apps/native - Inline Query Analysis

### 2.1 LocationStoreProvider.tsx (Lines 8-33)

**File**: `apps/native/src/stores/location/LocationStoreProvider.tsx`

| Property      | Value                                 |
| ------------- | ------------------------------------- |
| **Type**      | Query + Mutation                      |
| **Execution** | urql `useQuery()` and `useMutation()` |
| **Lines**     | 8-19, 21-33                           |

**Inline Operations**:

```typescript
// Line 8 - GetMySharingSettingsDocument
query GetMySharingSettings {
  mySharingSettings {
    isSharingLocation
    usersToShareWith {
      id
      firstName
      lastName
    }
  }
}

// Line 21 - UpdateSharingSettingsDocument
mutation UpdateSharingSettings($input: UpdateSharingSettingsInput!) {
  updateLocationSharing(input: $input) {
    id
    isSharingLocation
    usersToShareWith {
      id
      firstName
      lastName
    }
  }
}
```

**Usage**:

- Line 62: `useQuery({ query: GetMySharingSettingsDocument })`
- Line 69: `useMutation(UpdateSharingSettingsDocument)`

**Note**: Comment says "inline until location operations are generated"

---

### 2.2 useCommunityFeed.ts (Lines 314-330)

**File**: `apps/native/src/hooks/community/useCommunityFeed.ts`

| Property      | Value                |
| ------------- | -------------------- |
| **Type**      | Mutation             |
| **Execution** | urql `useMutation()` |
| **Lines**     | 314-330              |

**Inline Operation**:

```typescript
// Line 314 - ToggleActivityReactionDocument
mutation ToggleActivityReaction($activityId: ID!, $reaction: String!) {
  toggleActivityReaction(activityId: $activityId, reaction: $reaction) {
    activityId
    reactionsSummary {
      total
      counts {
        heart
        fire
        clap
        star
      }
      myReactions
    }
  }
}
```

**Usage**:

- Line 233: `useMutation(ToggleActivityReactionDocument)`
- Line 248: `toggleHeartMutation({ activityId, reaction: "heart" })`

---

### 2.3 useJudgement.ts (Lines 14-22)

**File**: `apps/native/src/stores/judgement/useJudgement.ts`

| Property      | Value             |
| ------------- | ----------------- |
| **Type**      | Query             |
| **Execution** | urql `useQuery()` |
| **Lines**     | 14-22             |

**Inline Operation**:

```typescript
// Line 14 - GetChallengeDocument
query GetChallenge($id: ID!, $tripId: ID!) {
  challenge(id: $id, tripId: $tripId) {
    id
    name
    scoringCategory
  }
}
```

**Note**: Comment says "Inline GraphQL document for GetChallenge"

---

### 2.4 useMapLocationStream.ts (Lines 8-45)

**File**: `apps/native/src/hooks/map/useMapLocationStream.ts`

| Property      | Value                  |
| ------------- | ---------------------- |
| **Type**      | Query                  |
| **Execution** | urql client `.query()` |
| **Lines**     | 8-45                   |

**Inline Operation**:

```typescript
// Line 8 - FriendsLocationsDocument
query FriendsLocations(
  $connectionId: String
  $radiusKm: Float
  $latitude: Float
  $longitude: Float
) {
  friendsLocations(
    connectionId: $connectionId
    radiusKm: $radiusKm
    latitude: $latitude
    longitude: $longitude
  ) {
    edges {
      node {
        id
        userId
        latitude
        longitude
        accuracy
        altitude
        heading
        speed
        isSharingLocation
        distanceKm
        timestamp
        user {
          id
          firstName
          lastName
          fullName
          hasAvatar
        }
      }
    }
  }
}
```

**Note**: Comment says "inline until generated"

---

### 2.5 useNotifications.ts (Lines 21-52)

**File**: `apps/native/src/hooks/notifications/useNotifications.ts`

| Property      | Value                                 |
| ------------- | ------------------------------------- |
| **Type**      | Query + 2 Mutations                   |
| **Execution** | urql `useQuery()` and `useMutation()` |
| **Lines**     | 21-32, 34-44, 46-52                   |

**Inline Operations**:

```typescript
// Line 21 - GetSubscriptionStatusDocument
query GetNotificationSubscriptionStatus {
  myNotificationSubscriptions {
    isSubscribed
    subscriptions {
      token
      platform
      createdAt
    }
  }
}

// Line 34 - SubscribeNotificationsDocument
mutation SubscribeNotifications($token: String!) {
  subscribeToNotifications(input: { token: $token }) {
    success
    subscription {
      token
      platform
    }
  }
}

// Line 46 - UnsubscribeNotificationsDocument
mutation UnsubscribeNotifications($token: String!) {
  unsubscribeFromNotifications(input: { token: $token }) {
    success
  }
}
```

**Note**: Comment says "not yet in generated hooks"

---

### 2.6 useMapSharing.ts (Lines 1-10)

**File**: `apps/native/src/hooks/map/useMapSharing.ts`

| Property      | Value                               |
| ------------- | ----------------------------------- |
| **Type**      | Uses generated documents            |
| **Execution** | urql hooks with generated documents |

**Status**: ✅ Already migrated - uses:

- `GetMySharingSettingsDocument`
- `GetAllUsersForSharingDocument`
- `UpdateLocationSharingDocument`
- `RemoveUserFromSharingDocument`

---

### 2.7 useLocationPermissions.ts (Lines 35-40)

**File**: `apps/native/src/hooks/location/useLocationPermissions.ts`

| Property      | Value                    |
| ------------- | ------------------------ |
| **Type**      | Uses generated documents |
| **Execution** | urql hooks               |

**Status**: ✅ Already migrated - uses:

- `GetMySharingSettingsDocument`
- `UpdateLocationSharingDocument`

---

### 2.8 RewardsView.tsx (Lines 28-56)

**File**: `apps/native/src/components/rewards/RewardsView.tsx`

| Property      | Value                              |
| ------------- | ---------------------------------- |
| **Type**      | 2 Queries (for cache invalidation) |
| **Execution** | urql `client.invalidate()`         |
| **Lines**     | 28-36, 38-56                       |

**Inline Operations**:

```typescript
// Line 28 - GroupDocument
query GetGroup($tripId: String!) {
  myGroup(tripId: $tripId) {
    id
    name
    coins
  }
}

// Line 38 - RewardsDocument
query GetRewards($tripId: String!) {
  rewards(tripId: $tripId) {
    id
    name
    description
    coinCost
    originalCoinCost
    availableQuantity
    isOutOfStock
    canAfford
    isEligibleToBuy
    image
    images
    signedImageUrl
    signedImageUrls
  }
}
```

**Usage**:

- Line 98: `client.invalidate(GroupDocument)`
- Line 101: `client.invalidate(RewardsDocument)`

**Note**: Used only for cache invalidation, not data fetching

---

### 2.9 useFileDownload.ts (Lines 30-38)

**File**: `apps/native/src/hooks/files/useFileDownload.ts`

| Property      | Value                     |
| ------------- | ------------------------- |
| **Type**      | Query                     |
| **Execution** | urql client `.mutation()` |
| **Lines**     | 30-38                     |

**Inline Operation**:

```typescript
// Line 30 - CreateDownloadUrlDocument
query CreateDownloadUrl($input: CreateDownloadUrlInput!) {
  createDownloadUrl(input: $input) {
    storagePath
    signedUrl
    expiresAt
  }
}
```

**Usage**:

- Line 181-202: `urqlClient.mutation(CreateDownloadUrlDocument, ...)`

---

### 2.10 useFileUpload.ts (Lines 40-50)

**File**: `apps/native/src/hooks/files/useFileUpload.ts`

| Property      | Value                     |
| ------------- | ------------------------- |
| **Type**      | Mutation                  |
| **Execution** | urql client `.mutation()` |
| **Lines**     | 40-50                     |

**Inline Operation**:

```typescript
// Line 40 - CreateUploadUrlDocument
mutation CreateUploadUrl($input: CreateUploadUrlInput!) {
  createUploadUrl(input: $input) {
    bucket
    objectPath
    storagePath
    resumableUrl
    token
  }
}
```

**Usage**:

- Line 95-108: `urqlClient.mutation(CreateUploadUrlDocument, ...)`

---

### 2.11 useAutoPushSubscription.ts (Lines 46-56, 125-136)

**File**: `apps/native/src/hooks/notifications/useAutoPushSubscription.ts`

| Property      | Value                                          |
| ------------- | ---------------------------------------------- |
| **Type**      | Mutation + Query                               |
| **Execution** | urql `useMutation()` and `client.invalidate()` |
| **Lines**     | 46-56, 125-136                                 |

**Inline Operations**:

```typescript
// Line 46 - SubscribeToNotificationsDocument
mutation SubscribeToNotifications($token: String!) {
  subscribeToNotifications(token: $token) {
    success
    subscription {
      id
      isActive
    }
  }
}

// Line 125 - GetMyNotificationsDocument (for cache invalidation)
query GetMyNotifications {
  myNotificationSubscriptions {
    isSubscribed
    subscriptions {
      token
      platform
      createdAt
    }
  }
}
```

---

### 2.12 GroupMemberList.tsx (Lines 21-27)

**File**: `apps/native/src/components/trips/groups/details/GroupMemberList.tsx`

| Property      | Value             |
| ------------- | ----------------- |
| **Type**      | Query             |
| **Execution** | urql `useQuery()` |
| **Lines**     | 21-27             |

**Inline Operation**:

```typescript
// Line 21 - CreateDownloadUrlDocument
query CreateDownloadUrl($input: CreateDownloadUrlInput!) {
  createDownloadUrl(input: $input) {
    signedUrl
  }
}
```

**Usage**:

- Line 31: `useQuery({ query: CreateDownloadUrlDocument, ... })`

---

### 2.13 useCommunityActivityData.ts (Lines 117-141)

**File**: `apps/native/src/hooks/community/useCommunityActivityData.ts`

| Property      | Value             |
| ------------- | ----------------- |
| **Type**      | 2 Queries         |
| **Execution** | urql `useQuery()` |
| **Lines**     | 117-132, 134-141  |

**Inline Operations**:

```typescript
// Line 117 - BatchRankingsDocument
query BatchRankings($tripIds: [ID!]!) {
  batchRankings(tripIds: $tripIds) {
    tripId
    groups {
      id
      name
      image
      coins
      participants {
        id
      }
    }
  }
}

// Line 134 - BatchAvatarsDocument
query BatchAvatars($userIds: [ID!]!) {
  batchAvatarUrls(userIds: $userIds) {
    userId
    url
  }
}
```

**Note**: Comment says "Placeholder documents - should be replaced with actual backend schema support"

---

## 3. apps/seed - Inline Query Analysis

### 3.1 trips.ts (Lines 15-83)

**File**: `apps/seed/src/trips.ts`

| Property      | Value                              |
| ------------- | ---------------------------------- |
| **Type**      | 3 Mutations                        |
| **Execution** | Custom `seedUrqlClient.mutation()` |
| **Lines**     | 15-44, 46-72, 74-83                |

**Inline Operations**:

```typescript
// Line 15 - UpsertTripDocument
mutation UpsertTrip($key: String!, $name: String!, ...) {
  upsertTrip(input: { ... }) { id, name, ... }
}

// Line 46 - UpsertUserDocument
mutation UpsertUser($authUserId: String!, $email: String!, ...) {
  upsertUser(input: { ... }) { id, authUserId, ... }
}

// Line 74 - AddTripParticipantDocument
mutation AddTripParticipant($tripId: ID!, $userId: ID!) {
  addTripParticipant(input: { ... }) { id, tripId, ... }
}
```

**Note**: Seed scripts have a different pattern - they use raw strings with a custom client

---

### 3.2 graphql-executor.ts (Lines 111-414)

**File**: `apps/seed/src/graphql-executor.ts`

| Property      | Value                               |
| ------------- | ----------------------------------- |
| **Type**      | 13 Operations (Mutations + Queries) |
| **Execution** | Raw `fetch()` to GraphQL endpoint   |
| **Lines**     | 111-414                             |

**Operations List**:

1. `UpsertTripDocument` (Lines 111-140)
2. `UpsertUserDocument` (Lines 146-172)
3. `FindUserByAuthIdDocument` (Lines 174-181)
4. `AddTripParticipantDocument` (Lines 187-196)
5. `CreateSponsorDocument` (Lines 202-227)
6. `FindSponsorByNameDocument` (Lines 229-240)
7. `LinkSponsorToTripDocument` (Lines 242-250)
8. `CreateRewardDocument` (Lines 256-288)
9. `ClearTripResourcesDocument` (Lines 294-300)
10. `CreateTripResourceDocument` (Lines 302-339)
11. `ClearTripInsuranceDocument` (Lines 341-347)
12. `CreateTripInsuranceDocument` (Lines 349-383)
13. `CreateInsuranceStepDocument` (Lines 385-414)

---

## 4. Integration Points Analysis

### 4.1 Query Execution Patterns

| Pattern                                 | Count | Files                                                                                                                     |
| --------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| urql `useQuery()` with inline string    | 12    | VotingCard, ChallengeAnalyticsPanel, CreateNotificationForm, LocationStoreProvider, RewardsView, useCommunityActivityData |
| urql `useMutation()` with inline string | 10    | useChallengeSubmissions, useJudgement, useCommunityFeed, useNotifications, LocationStoreProvider                          |
| urql client `.query()`                  | 4     | useWebFileUpload, useMapLocationStream                                                                                    |
| urql client `.mutation()`               | 5     | useWebFileUpload, useFileDownload, useFileUpload                                                                          |
| tRPC client `.query()`                  | 1     | auth.ts                                                                                                                   |
| raw `fetch()`                           | 2     | middleware.ts, graphql-executor.ts                                                                                        |
| Custom seed client                      | 3     | trips.ts                                                                                                                  |

### 4.2 Dependencies on Generated Types

Files importing from `@mirai-app/graphql-client`:

- `JudgingPage.tsx` - Uses `GetChallengeDocument`, `GetChallengeSubmissionsDocument`, etc.
- `StaffVotingPage.tsx` - Uses multiple generated documents
- `ChallengeForm.tsx` - Uses `GetChallengeDocument`, `CreateChallengeDocument`, etc.
- `useChallengeSubmissions.ts` - Uses `GetChallengeSubmissionsDocument`
- `useJudgement.ts` - Uses `GetChallengeSubmissionsDocument`, `GetVotesByChallengeDocument`
- `CreateNotificationForm.tsx` - Uses `CreateNotificationDocument`, `SendMobileNotificationsDocument`
- `useCommunityFeed.ts` - Uses `useGetActivitiesByTripQuery`
- `useJudgement.ts` (native) - Uses `GetChallengeSubmissionsDocument`, `UpdateChallengeSubmissionDocument`
- `useMapSharing.ts` - Uses `GetMySharingSettingsDocument`, etc.
- `useLocationPermissions.ts` - Uses `GetMySharingSettingsDocument`

### 4.3 Effect-Based or Async Patterns

**Effect Patterns**:

- `useWebFileUpload.ts` - Async upload with progress tracking
- `useFileDownload.ts` (native) - Async download with cache management
- `useFileUpload.ts` (native) - TUS resumable upload with retry logic
- `useMapLocationStream.ts` - Polling effect with 10s interval
- `useAutoPushSubscription.ts` - Effect-based automatic subscription

---

## 5. File Impact Assessment

### 5.1 Files Requiring Modification

| File                                                                     | Changes Required                                  | Priority |
| ------------------------------------------------------------------------ | ------------------------------------------------- | -------- |
| `apps/web/src/hooks/useWebFileUpload.ts`                                 | Replace 2 inline queries with generated hooks     | HIGH     |
| `apps/web/src/components/admin/challenges/SubmissionCard.tsx`            | Import `CreateDownloadUrlDocument`                | HIGH     |
| `apps/web/src/components/admin/challenges/VotingCard.tsx`                | Import `CreateDownloadUrlDocument`                | HIGH     |
| `apps/web/src/components/admin/challenges/ChallengeAnalyticsPanel.tsx`   | Extend schema + create proper queries             | MEDIUM   |
| `apps/web/src/middleware.ts`                                             | Import `GetMeDocument`                            | HIGH     |
| `apps/web/src/lib/auth.ts`                                               | Import `GetMeDocument`                            | HIGH     |
| `apps/web/src/hooks/admin/useChallengeSubmissions.ts`                    | Import generated mutation documents               | HIGH     |
| `apps/web/src/hooks/admin/useJudgement.ts`                               | Import generated query/mutation documents         | HIGH     |
| `apps/web/src/components/admin/notifications/CreateNotificationForm.tsx` | Import or create `GetGroupsByTripDocument`        | MEDIUM   |
| `apps/native/src/stores/location/LocationStoreProvider.tsx`              | Import location operation documents               | HIGH     |
| `apps/native/src/hooks/community/useCommunityFeed.ts`                    | Import or create `ToggleActivityReactionDocument` | HIGH     |
| `apps/native/src/stores/judgement/useJudgement.ts`                       | Import `GetChallengeDocument`                     | HIGH     |
| `apps/native/src/hooks/map/useMapLocationStream.ts`                      | Import or create `FriendsLocationsDocument`       | MEDIUM   |
| `apps/native/src/hooks/notifications/useNotifications.ts`                | Import notification operation documents           | HIGH     |
| `apps/native/src/components/rewards/RewardsView.tsx`                     | Import documents for cache invalidation           | MEDIUM   |
| `apps/native/src/hooks/files/useFileDownload.ts`                         | Import `CreateDownloadUrlDocument`                | HIGH     |
| `apps/native/src/hooks/files/useFileUpload.ts`                           | Import `CreateUploadUrlDocument`                  | HIGH     |
| `apps/native/src/hooks/notifications/useAutoPushSubscription.ts`         | Import generated documents                        | HIGH     |
| `apps/native/src/components/trips/groups/details/GroupMemberList.tsx`    | Import `CreateDownloadUrlDocument`                | HIGH     |
| `apps/native/src/hooks/community/useCommunityActivityData.ts`            | Implement or remove batch queries                 | LOW      |
| `apps/seed/src/trips.ts`                                                 | Consider using generated client                   | LOW      |
| `apps/seed/src/graphql-executor.ts`                                      | Consider using generated client                   | LOW      |

### 5.2 New .graphql Operation Files to Create

| Operation                           | Location                                                                 | Purpose                          |
| ----------------------------------- | ------------------------------------------------------------------------ | -------------------------------- |
| `CreateUploadUrl`                   | `packages/graphql-client/src/operations/files.operations.graphql`        | File upload URL generation       |
| `CreateDownloadUrl`                 | `packages/graphql-client/src/operations/files.operations.graphql`        | File download URL generation     |
| `GetMySharingSettings`              | `packages/graphql-client/src/operations/location.operations.graphql`     | Location sharing settings        |
| `UpdateLocationSharing`             | `packages/graphql-client/src/operations/location.operations.graphql`     | Update location sharing          |
| `ToggleActivityReaction`            | `packages/graphql-client/src/operations/activity.operations.graphql`     | Activity reaction toggle         |
| `GetNotificationSubscriptionStatus` | `packages/graphql-client/src/operations/notification.operations.graphql` | Notification subscription status |
| `SubscribeNotifications`            | `packages/graphql-client/src/operations/notification.operations.graphql` | Subscribe to notifications       |
| `UnsubscribeNotifications`          | `packages/graphql-client/src/operations/notification.operations.graphql` | Unsubscribe from notifications   |
| `FriendsLocations`                  | `packages/graphql-client/src/operations/location.operations.graphql`     | Friends location tracking        |
| `GetGroupsByTrip`                   | `packages/graphql-client/src/operations/group.operations.graphql`        | Groups by trip query             |

### 5.3 Missing Schema Types in Pothos

| Type/Field                   | Required In              | Status                                |
| ---------------------------- | ------------------------ | ------------------------------------- |
| `GetSubmissionsForAnalytics` | ChallengeAnalyticsPanel  | Needs schema extension                |
| `GetGroupsCount`             | ChallengeAnalyticsPanel  | Needs schema extension                |
| `GetVotesCount`              | ChallengeAnalyticsPanel  | Needs schema extension                |
| `BatchRankings`              | useCommunityActivityData | Optional - can use individual queries |
| `BatchAvatars`               | useCommunityActivityData | Optional - can use individual queries |

---

## 6. Migration Strategy

### Phase 1: HIGH Priority (Core File Operations)

1. Create `files.operations.graphql` with `CreateUploadUrl` and `CreateDownloadUrl`
2. Update all file-related hooks in web and native
3. Verify upload/download functionality

### Phase 2: HIGH Priority (Auth & Location)

1. Create `location.operations.graphql` with sharing settings operations
2. Migrate LocationStoreProvider and useLocationPermissions
3. Update middleware.ts and auth.ts to use imported documents

### Phase 3: MEDIUM Priority (Notifications & Activities)

1. Create `notification.operations.graphql`
2. Migrate notification hooks
3. Create `activity.operations.graphql` with `ToggleActivityReaction`

### Phase 4: LOW Priority (Seed Scripts & Analytics)

1. Consider seed script migration separately
2. Implement proper analytics queries in schema

---

## 7. Verification Checklist

- [ ] All inline queries identified and documented
- [ ] Corresponding `.graphql` operation files created
- [ ] Generated hooks/types imported in all affected files
- [ ] Type safety verified with `tsc --noEmit`
- [ ] Integration tests pass for file upload/download
- [ ] Integration tests pass for location sharing
- [ ] Integration tests pass for notifications
- [ ] No runtime errors from missing documents
