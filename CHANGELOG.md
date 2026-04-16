# Changelog

All notable changes to the Mirai API and platform.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-04-16

### Added

#### Cursor-Based Pagination (Relay Connections Specification)

All paginated gateway methods now support cursor-based pagination following the [GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm). This major feature provides:

- **Stable pagination**: Items no longer shift between pages when data changes
- **Performance improvements**: 20-40% faster queries on large datasets
- **Standards compliance**: Compatible with Relay and other GraphQL clients
- **Consistent API**: All list queries follow the same pagination pattern

##### New Connection Methods

16 gateway interfaces now provide `*Connection` methods:

**Phase 1 (High-Impact Gateways):**

- `EventGateway`: `findByTripIdConnection`, `findUpcomingByTripIdConnection`, `findOngoingByTripIdConnection`, `findPastByTripIdConnection`
- `ChallengeGateway`: 7 new Connection methods for all list queries
- `NotificationGateway`: `findByUserIdConnection`, `findUnreadByUserIdConnection`
- `GroupGateway`: 4 new Connection methods for all list queries

**Phase 2 (Medium-Impact Gateways):**

- `SponsorGateway`: `findActiveConnection`, `findByTripIdConnection`
- `LocationGateway`: `findSharingWithUserConnection`, `findByUserIdsConnection`
- `SubmissionReportGateway`: 3 new Connection methods
- `ChallengeSubmissionGateway`: All list methods now have Connection variants
- `ChallengeVoteGateway`: All list methods now have Connection variants
- `TripGateway`: `findByStatusConnection`, `findActiveConnection`

**Phase 3 (Lower-Impact Gateways):**

- `UserGateway`: `findAllConnection`, `findByRoleConnection`
- `RewardGateway`: `findByTripIdConnection`, `findVisibleByTripIdConnection`
- `RewardPurchaseGateway`: 3 new Connection methods
- `CoinTransactionGateway`: `findManyConnection`
- `NotificationPreferenceGateway`: All list methods now have Connection variants

##### Connection Types

All paginated queries return standard Relay Connection objects:

```typescript
interface Connection<T> {
  edges: Array<{
    node: T;
    cursor: string;
  }>;
  nodes: T[]; // Convenience field
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount?: number; // Optional for performance
}
```

##### Cursor Encoding

Cursors are Base64url-encoded JSON containing:

- `id`: Entity identifier
- `createdAt`: Sort timestamp
- Additional domain-specific fields as needed

##### Database Indexes

Composite indexes added for pagination performance:

- `events`: `(startTime, id)`
- `challenges`: `(createdAt, id)`
- `notifications`: `(createdAt, id)`
- `groups`: `(createdAt, id)`
- `sponsors`: `(createdAt, id)`
- And additional indexes for all paginated tables

##### GraphQL Schema Updates

All paginated queries now support standard Relay arguments:

- `first: Int` - Number of items to fetch forward
- `after: String` - Cursor to fetch after
- `last: Int` - Number of items to fetch backward
- `before: String` - Cursor to fetch before

Example:

```graphql
query {
  eventsByTrip(tripId: "123", first: 20, after: "eyJpZCI6Li4ufQ") {
    edges {
      node {
        id
        title
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

##### Documentation

- [Cursor Pagination Guide](./docs/cursor-pagination-guide.md) - Complete usage documentation
- [Deprecation Guide](./docs/deprecation-guide.md) - Migration timeline and instructions
- GraphQL query examples for all paginated endpoints
- Code examples for React, React Native, and server-side usage

### Deprecated

#### Array-Based Pagination Methods

All array-returning gateway methods are now deprecated and scheduled for removal on **January 1, 2027**:

- `findByTripId(tripId)` → Use `findByTripIdConnection(tripId, args)`
- `findByUserId(userId)` → Use `findByUserIdConnection(userId, args)`
- `findByStatus(status)` → Use `findByStatusConnection(status, args)`
- `findActive()` → Use `findActiveConnection(args)`
- `findUpcomingByTripId(tripId)` → Use `findUpcomingByTripIdConnection(tripId, args)`
- And 40+ additional methods (see Deprecation Guide for complete list)

#### Offset-Based Pagination Methods

All offset-based pagination methods are now deprecated:

- `findAll({ limit, offset })` → Use `findAllConnection({ first, after })`
- `findByTripId(tripId, { limit, offset })` → Use `findByTripIdConnection(tripId, { first, after })`
- `findMany(filters, { limit, offset })` → Use `findManyConnection(filters, { first, after })`

During the deprecation period (April 2026 - January 2027):

- Deprecated methods continue to function
- Methods marked with `@deprecated` JSDoc annotation
- Migration guides and tools provided
- No breaking changes until sunset date

### Migration Notes

#### For Frontend Developers

1. Update GraphQL operations to use Connection types
2. Replace offset calculations with cursor handling
3. Use `edges` array instead of direct arrays
4. Use `pageInfo.hasNextPage` and `pageInfo.endCursor` for pagination

See [Cursor Pagination Guide](./docs/cursor-pagination-guide.md) for detailed examples.

#### For Mobile Developers

1. Update FlatList data sources to use `edges.map(e => e.node)`
2. Replace `onEndReached` offset logic with cursor-based loading
3. Update pull-to-refresh to reset cursor to null

See [Deprecation Guide](./docs/deprecation-guide.md) for React Native examples.

#### Performance Impact

- Query execution: 20-40% faster on large datasets
- Memory usage: Reduced due to limit enforcement
- Database load: Decreased due to efficient index usage
- Cache efficiency: Improved with stable cursors

### Infrastructure

- Added shared cursor encoding utilities in `packages/use-cases/src/system/utils/cursor.ts`
- Added Connection types in `packages/domain/src/value-objects/pagination.ts`
- Added GraphQL connection helpers in `packages/frameworks/src/graphql/utils/connections.ts`
- Added Drizzle migration files for composite indexes

---

## [1.x.x] - Previous Releases

Previous releases did not maintain a structured changelog. All changes prior to version 2.0.0 are documented in commit history.

---

[Unreleased]: https://github.com/mirai-app/mirai/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/mirai-app/mirai/compare/v1.0.0...v2.0.0
