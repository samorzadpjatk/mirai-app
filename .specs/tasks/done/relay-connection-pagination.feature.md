---
title: Implement Relay Connection Pattern for GraphQL Pagination
type: feature
depends_on: []
---

## Initial User Prompt

Implement the Relay connection pattern everywhere pagination in GraphQL is used - not only Trip.

## Description

Replace legacy offset-based pagination with Relay cursor-based Connection pattern across all GraphQL queries:

### Domains requiring migration:
1. **Trip** - `PaginatedTrips` → `TripConnection`
2. **User** - `PaginatedUsers` → `UserConnection`
3. **Group** - `PaginatedGroups` → `GroupConnection`
4. **Challenge** - `PaginatedChallenges` → `ChallengeConnection`
5. **ChallengeSubmission** - `PaginatedSubmissions` → `SubmissionConnection`
6. **Reward** - `PaginatedRewards` → `RewardConnection`
7. **Notification** - `PaginatedNotifications` → `NotificationConnection`
8. **Coin** - `PaginatedTransactions` → `CoinTransactionConnection`
9. **ActivityFeed** - `PaginatedActivityFeed` → `ActivityFeedConnection`

### Implementation Plan

1. **Create Relay connection utilities** - Helper functions for cursor encoding/decoding and connection building
2. **Update use-cases DTOs** - Replace offset pagination with cursor-based pagination
3. **Update GraphQL types** - Use `builder.connection()` to create Connection/Edge types
4. **Update GraphQL queries** - Use `first`/`after` arguments instead of `limit`/`offset`
5. **Update builder.ts** - Add connection-related utility exports

### Relay Connection Pattern

```graphql
type Query {
  trips(first: Int = 20, after: String): TripConnection!
}

type TripConnection {
  edges: [TripEdge!]!
  pageInfo: PageInfo!
  totalCount: Int
}

type TripEdge {
  node: Trip!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Acceptance Criteria

- [ ] All paginated queries use Relay Connection pattern
- [ ] Cursor-based pagination works with `first`/`after` arguments
- [ ] `PageInfo` type provides `hasNextPage`, `hasPreviousPage`, `startCursor`, `endCursor`
- [ ] Existing offset-based types are deprecated (backward compatibility)
- [ ] Schema generates correctly with Pothos Relay plugin
- [ ] All tests pass

## Notes

- The Relay plugin is already configured in `builder.ts`
- Pothos supports `builder.connection()` for automatic Connection/Edge type creation
- Cursors should be opaque (base64-encoded)
- Consider edge-specific metadata (e.g., `joinedAt` for group participants)
