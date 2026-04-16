# Analysis: Add Cursor-Based Pagination to All Paginable Gateways

**Analysis Date:** 2026-04-16  
**Task ID:** add-cursor-pagination-to-all-gateways  
**Scope:** 15+ gateway types across 4 layers  
**Target Pattern:** Relay Connection Specification

---

## Executive Summary

This analysis identifies **16 gateway interfaces** that require cursor-based pagination (Relay Connection spec) implementation. ActivityFeedGateway serves as the **reference implementation** with existing cursor patterns in the use-cases layer and GraphQL types.

**Total Affected Files:** 80+ files  
**Estimated Effort:** 1-2 weeks (parallel implementation possible)  
**Risk Level:** Low to Medium (clear patterns, backward compatible approach)

---

## 1. Affected Files Summary

### 1.1 Domain Layer Gateway Interfaces (16 files)

| File Path                                                                 | Gateway                     | Current Pattern             | Priority  |
| ------------------------------------------------------------------------- | --------------------------- | --------------------------- | --------- |
| `packages/domain/src/activity/ports/activity-feed-gateway.ts`             | ActivityFeedGateway         | Offset (PaginatedResult)    | REFERENCE |
| `packages/domain/src/challenge/ports/challenge-gateway.ts`                | ChallengeGateway            | Offset (array)              | HIGH      |
| `packages/domain/src/challenge/ports/challenge-submission-gateway.ts`     | ChallengeSubmissionGateway  | Offset (array with orderBy) | HIGH      |
| `packages/domain/src/challenge/ports/challenge-vote-gateway.ts`           | ChallengeVoteGateway        | None (arrays)               | MEDIUM    |
| `packages/domain/src/group/ports/coin-transaction-gateway.ts`             | CoinTransactionGateway      | Offset (PaginatedResult)    | MEDIUM    |
| `packages/domain/src/event/ports/event-gateway.ts`                        | EventGateway                | None (arrays)               | LOW       |
| `packages/domain/src/group/ports/group-gateway.ts`                        | GroupGateway                | Offset (array)              | HIGH      |
| `packages/domain/src/location/ports/location-gateway.ts`                  | LocationGateway             | None (arrays)               | SKIP      |
| `packages/domain/src/notification/ports/notification-gateway.ts`          | NotificationGateway         | None (arrays)               | LOW       |
| `packages/domain/src/notification/ports/notification-delivery-gateway.ts` | NotificationDeliveryGateway | Offset required             | HIGH      |
| `packages/domain/src/notification/ports/notification-schedule-gateway.ts` | NotificationScheduleGateway | Offset (PaginatedResult)    | MEDIUM    |
| `packages/domain/src/reward/ports/reward-gateway.ts`                      | RewardGateway               | Offset (PaginatedResult)    | MEDIUM    |
| `packages/domain/src/sponsor/ports/sponsor-gateway.ts`                    | SponsorGateway              | Offset (array)              | LOW       |
| `packages/domain/src/challenge/ports/submission-report-gateway.ts`        | SubmissionReportGateway     | Offset (array)              | LOW       |
| `packages/domain/src/trip/ports/trip-gateway.ts`                          | TripGateway                 | Offset (array)              | LOW       |
| `packages/domain/src/user/ports/user-gateway.ts`                          | UserGateway                 | Offset (array)              | LOW       |

### 1.2 Use Cases Layer Gateway Ports (16 files)

| File Path                                                       | Purpose                           | Status           |
| --------------------------------------------------------------- | --------------------------------- | ---------------- |
| `packages/use-cases/src/activity/ports/gateway.ts`              | ActivityFeedGateway + Context.Tag | **CURSOR READY** |
| `packages/use-cases/src/challenge/ports/gateway.ts`             | ChallengeGateway + Context.Tag    | Needs update     |
| `packages/use-cases/src/challenge/ports/submission/gateway.ts`  | ChallengeSubmissionGateway        | Needs update     |
| `packages/use-cases/src/challenge/ports/vote/gateway.ts`        | ChallengeVoteGateway              | Needs update     |
| `packages/use-cases/src/coin/ports/gateway.ts`                  | CoinTransactionGateway            | Needs update     |
| `packages/use-cases/src/event/ports/gateway.ts`                 | EventGateway                      | Needs update     |
| `packages/use-cases/src/group/ports/gateway.ts`                 | GroupGateway                      | Needs update     |
| `packages/use-cases/src/location/ports/gateway.ts`              | LocationGateway                   | SKIP             |
| `packages/use-cases/src/notification/ports/gateway.ts`          | NotificationGateway               | Needs update     |
| `packages/use-cases/src/notification/ports/delivery/gateway.ts` | NotificationDeliveryGateway       | Needs update     |
| `packages/use-cases/src/notification/ports/schedule/gateway.ts` | NotificationScheduleGateway       | Needs update     |
| `packages/use-cases/src/reward/ports/gateway.ts`                | RewardGateway                     | Needs update     |
| `packages/use-cases/src/sponsor/ports/gateway.ts`               | SponsorGateway                    | Needs update     |
| `packages/use-cases/src/report/ports/gateway.ts`                | SubmissionReportGateway           | Needs update     |
| `packages/use-cases/src/trip/ports/gateway.ts`                  | TripGateway                       | Needs update     |
| `packages/use-cases/src/user/ports/gateway.ts`                  | UserGateway                       | Needs update     |

### 1.3 Adapter Implementations (32 files - 2 per gateway)

| Drizzle Path                                                      | In-Memory Path                                                     | Gateway                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------- |
| `packages/adapters/src/activity/gateways/drizzle/gateway.ts`      | `packages/adapters/src/activity/gateways/in-memory/gateway.ts`     | ActivityFeedGateway                   |
| `packages/adapters/src/challenge/gateways/drizzle/gateway.ts`     | `packages/adapters/src/challenge/gateways/in-memory/gateway.ts`    | ChallengeGateway                      |
| `packages/adapters/src/challenge/gateways/drizzle/submission.ts`  | `packages/adapters/src/submission/gateways/in-memory/gateway.ts`   | ChallengeSubmissionGateway            |
| `packages/adapters/src/challenge/gateways/drizzle/vote.ts`        | `packages/adapters/src/challenge/gateways/in-memory/vote.ts`       | ChallengeVoteGateway                  |
| `packages/adapters/src/coin/gateways/drizzle/gateway.ts`          | `packages/adapters/src/coin/gateways/in-memory/gateway.ts`         | CoinTransactionGateway                |
| `packages/adapters/src/event/gateways/drizzle/gateway.ts`         | `packages/adapters/src/event/gateways/in-memory/gateway.ts`        | EventGateway                          |
| `packages/adapters/src/group/gateways/drizzle/gateway.ts`         | `packages/adapters/src/group/gateways/in-memory/gateway.ts`        | GroupGateway                          |
| `packages/adapters/src/location/gateways/drizzle/gateway.ts`      | `packages/adapters/src/location/gateways/in-memory/gateway.ts`     | LocationGateway (SKIP)                |
| `packages/adapters/src/notification/gateways/drizzle/gateway.ts`  | `packages/adapters/src/notification/gateways/in-memory/gateway.ts` | NotificationGateway                   |
| `packages/adapters/src/notification/gateways/drizzle/delivery.ts` | `packages/adapters/src/notification/gateways/in-memory/gateway.ts` | NotificationDeliveryGateway           |
| `packages/adapters/src/notification/gateways/drizzle/schedule.ts` | `packages/adapters/src/notification/gateways/in-memory/gateway.ts` | NotificationScheduleGateway           |
| `packages/adapters/src/reward/gateways/drizzle/gateway.ts`        | `packages/adapters/src/reward/gateways/in-memory/gateway.ts`       | RewardGateway + RewardPurchaseGateway |
| `packages/adapters/src/sponsor/gateways/drizzle/gateway.ts`       | `packages/adapters/src/sponsor/gateways/in-memory/gateway.ts`      | SponsorGateway                        |
| `packages/adapters/src/submission/gateways/drizzle/gateway.ts`    | `packages/adapters/src/submission/gateways/in-memory/gateway.ts`   | SubmissionReportGateway               |
| `packages/adapters/src/trip/gateways/drizzle/gateway.ts`          | `packages/adapters/src/trip/gateways/in-memory/gateway.ts`         | TripGateway                           |
| `packages/adapters/src/user/gateways/drizzle/gateway.ts`          | `packages/adapters/src/user/gateways/in-memory/gateway.ts`         | UserGateway                           |

### 1.4 Controllers (16 files)

| Controller Path                                                         | Associated Gateways                  |
| ----------------------------------------------------------------------- | ------------------------------------ |
| `packages/adapters/src/activity/controllers/controller.ts`              | ActivityFeedGateway                  |
| `packages/adapters/src/challenge/controllers/controller.ts`             | ChallengeGateway                     |
| `packages/adapters/src/challenge/controllers/submission-controller.ts`  | ChallengeSubmissionGateway           |
| `packages/adapters/src/challenge/controllers/vote-controller.ts`        | ChallengeVoteGateway                 |
| `packages/adapters/src/coin/controllers/transaction-controller.ts`      | CoinTransactionGateway               |
| `packages/adapters/src/event/controllers/controller.ts`                 | EventGateway                         |
| `packages/adapters/src/group/controllers/controller.ts`                 | GroupGateway                         |
| `packages/adapters/src/location/controllers/controller.ts`              | LocationGateway (SKIP)               |
| `packages/adapters/src/notification/controllers/controller.ts`          | NotificationGateway                  |
| `packages/adapters/src/notification/controllers/delivery-controller.ts` | NotificationDeliveryGateway          |
| `packages/adapters/src/notification/controllers/schedule-controller.ts` | NotificationScheduleGateway          |
| `packages/adapters/src/reward/controllers/controller.ts`                | RewardGateway, RewardPurchaseGateway |
| `packages/adapters/src/sponsor/controllers/controller.ts`               | SponsorGateway                       |
| `packages/adapters/src/submission/controllers/controller.ts`            | SubmissionReportGateway              |
| `packages/adapters/src/trip/controllers/controller.ts`                  | TripGateway                          |
| `packages/adapters/src/user/controllers/controller.ts`                  | UserGateway                          |

### 1.5 GraphQL Type Files (17 files)

| File Path                                                       | Connection Types Needed                                                    |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `packages/frameworks/src/graphql/types/activityFeed.ts`         | **EXISTS** - ActivityConnection, ActivityEdge                              |
| `packages/frameworks/src/graphql/types/challenge.ts`            | ChallengeConnection, ChallengeEdge                                         |
| `packages/frameworks/src/graphql/types/challengeSubmission.ts`  | ChallengeSubmissionConnection, ChallengeSubmissionEdge                     |
| `packages/frameworks/src/graphql/types/challengeVote.ts`        | ChallengeVoteConnection, ChallengeVoteEdge                                 |
| `packages/frameworks/src/graphql/types/coinTransaction.ts`      | CoinTransactionConnection, CoinTransactionEdge                             |
| `packages/frameworks/src/graphql/types/event.ts`                | EventConnection, EventEdge                                                 |
| `packages/frameworks/src/graphql/types/group.ts`                | GroupConnection, GroupEdge                                                 |
| `packages/frameworks/src/graphql/types/location.ts`             | SKIP                                                                       |
| `packages/frameworks/src/graphql/types/notifications.ts`        | NotificationConnection, NotificationEdge                                   |
| `packages/frameworks/src/graphql/types/notificationDelivery.ts` | NotificationDeliveryConnection, NotificationDeliveryEdge                   |
| `packages/frameworks/src/graphql/types/notificationSchedule.ts` | NotificationScheduleConnection, NotificationScheduleEdge                   |
| `packages/frameworks/src/graphql/types/reward.ts`               | RewardConnection, RewardEdge, RewardPurchaseConnection, RewardPurchaseEdge |
| `packages/frameworks/src/graphql/types/sponsor.ts`              | SponsorConnection, SponsorEdge                                             |
| `packages/frameworks/src/graphql/types/submissionReport.ts`     | SubmissionReportConnection, SubmissionReportEdge                           |
| `packages/frameworks/src/graphql/types/trip.ts`                 | TripConnection, TripEdge                                                   |
| `packages/frameworks/src/graphql/types/User.ts`                 | UserConnection, UserEdge                                                   |
| `packages/frameworks/src/graphql/builder.ts`                    | **EXISTS** - RelayPlugin configured                                        |

### 1.6 GraphQL Resolvers (17 files)

| File Path                                                           | Updates Needed           |
| ------------------------------------------------------------------- | ------------------------ |
| `packages/frameworks/src/graphql/resolvers/activityFeed.ts`         | Reference implementation |
| `packages/frameworks/src/graphql/resolvers/challenge.ts`            | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/challengeSubmission.ts`  | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/challengeVote.ts`        | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/coinTransaction.ts`      | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/event.ts`                | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/group.ts`                | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/location.ts`             | SKIP                     |
| `packages/frameworks/src/graphql/resolvers/notifications.ts`        | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/notificationDelivery.ts` | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/notificationSchedule.ts` | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/reward.ts`               | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/sponsor.ts`              | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/submissionReport.ts`     | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/trip.ts`                 | Add connection queries   |
| `packages/frameworks/src/graphql/resolvers/User.ts`                 | Add connection queries   |

### 1.7 Database Schema Files (15 files)

All schema files in `packages/frameworks/src/drizzle/schema/`:

- `activityFeed.ts` - has createdAt, isPinned (composite sort)
- `challenge.ts` - has createdAt
- `challenge.ts` (submissions embedded) - has createdAt, voteScore
- `coinTransaction.ts` - has createdAt
- `event.ts` - has startTime, endTime, createdAt
- `group.ts` - has createdAt, coins
- `location.ts` - SKIP
- `notification.ts` - has createdAt
- `notificationDelivery.ts` - has deliveryStartedAt, createdAt
- `notification.ts` (schedules embedded) - has createdAt, startDate
- `reward.ts` - has createdAt
- `reward.ts` (purchases embedded) - has createdAt
- `sponsor.ts` - has createdAt
- `submissionReport.ts` - has createdAt
- `trip.ts` - has createdAt, startDate
- `user.ts` - has createdAt

---

## 2. Gateway Interfaces Requiring New \*Connection Methods

### 2.1 ActivityFeedGateway

**File:** `packages/domain/src/activity/ports/activity-feed-gateway.ts`

**Existing Methods (keep for backward compatibility):**

```typescript
findByTripId(tripId: string, options?: PaginationOptions): Effect.Effect<PaginatedResult<ActivityFeed>, ...>
findByUserId(userId: string, options?: PaginationOptions): Effect.Effect<PaginatedResult<ActivityFeed>, ...>
findByGroupId(groupId: string, options?: PaginationOptions): Effect.Effect<PaginatedResult<ActivityFeed>, ...>
```

**New Methods to Add:**

```typescript
findByTripIdConnection(tripId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<ActivityFeed>, ...>
findByUserIdConnection(userId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<ActivityFeed>, ...>
findByGroupIdConnection(groupId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<ActivityFeed>, ...>
```

**Sort Fields:** `isPinned` (DESC), `createdAt` (DESC), `id` (tie-breaker)

---

### 2.2 ChallengeGateway

**File:** `packages/domain/src/challenge/ports/challenge-gateway.ts`

**Existing Method:**

```typescript
findAll(options?: { limit?: number; offset?: number }): Effect.Effect<Challenge[], ...>
```

**New Methods:**

```typescript
findAllConnection(options?: ConnectionOptions & { sortBy?: "createdAt" | "status" | "name" }): Effect.Effect<ConnectionResult<Challenge>, ...>
findByTripIdConnection(tripId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<Challenge>, ...>
findByStatusConnection(status: ChallengeStatus, options?: ConnectionOptions): Effect.Effect<ConnectionResult<Challenge>, ...>
```

**Sort Fields:** `createdAt`, `status`, `name`

---

### 2.3 ChallengeSubmissionGateway

**File:** `packages/domain/src/challenge/ports/challenge-submission-gateway.ts`

**Existing Method:**

```typescript
findMany(params: { ..., limit?: number; offset?: number }): Effect.Effect<ChallengeSubmission[], ...>
```

**New Method:**

```typescript
findManyConnection(params: { ..., first?: number; after?: string }): Effect.Effect<ConnectionResult<ChallengeSubmission>, ...>
```

**Sort Fields:** `createdAt`, `voteScore` (special handling needed)

---

### 2.4 ChallengeVoteGateway

**File:** `packages/domain/src/challenge/ports/challenge-vote-gateway.ts`

**No existing pagination - add new methods alongside:**

```typescript
// Keep existing:
findBySubmissionId(submissionId: string): Effect.Effect<ChallengeVote[], ...>

// Add new:
findBySubmissionIdConnection(submissionId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<ChallengeVote>, ...>
findByUserIdConnection(userId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<ChallengeVote>, ...>
findByChallengeIdConnection(challengeId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<ChallengeVote>, ...>
```

---

### 2.5 CoinTransactionGateway

**File:** `packages/domain/src/group/ports/coin-transaction-gateway.ts`

**Existing Methods:**

```typescript
findByGroupId(groupId: string, options?: PaginationOptions): Effect.Effect<PaginatedResult<CoinTransaction>, ...>
findMany(filters: CoinTransactionFilters, options?: PaginationOptions): Effect.Effect<PaginatedResult<CoinTransaction>, ...>
```

**New Methods:**

```typescript
findByGroupIdConnection(groupId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<CoinTransaction>, ...>
findManyConnection(filters: CoinTransactionFilters, options?: ConnectionOptions): Effect.Effect<ConnectionResult<CoinTransaction>, ...>
```

---

### 2.6 EventGateway

**File:** `packages/domain/src/event/ports/event-gateway.ts`

**No existing pagination - add new methods:**

```typescript
findByTripIdConnection(tripId: string, options?: ConnectionOptions & { sortBy?: "startTime" | "createdAt" }): Effect.Effect<ConnectionResult<Event>, ...>
findUpcomingByTripIdConnection(tripId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<Event>, ...>
findOngoingByTripIdConnection(tripId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<Event>, ...>
findPastByTripIdConnection(tripId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<Event>, ...>
```

---

### 2.7 GroupGateway

**File:** `packages/domain/src/group/ports/group-gateway.ts`

**Existing Method:**

```typescript
findAll(options?: { limit?: number; offset?: number }): Effect.Effect<Group[], ...>
```

**New Methods:**

```typescript
findAllConnection(options?: ConnectionOptions & { sortBy?: "createdAt" | "coins" | "name" }): Effect.Effect<ConnectionResult<Group>, ...>
findByTripIdConnection(tripId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<Group>, ...>
```

**Special Consideration:** `coins` sort needs tie-breaker (id)

---

### 2.8 NotificationGateway

**File:** `packages/domain/src/notification/ports/notification-gateway.ts`

**No existing pagination:**

```typescript
findByUserIdConnection(userId: string, options?: ConnectionOptions & { unreadOnly?: boolean }): Effect.Effect<ConnectionResult<Notification>, ...>
```

---

### 2.9 NotificationDeliveryGateway

**File:** `packages/domain/src/notification/ports/notification-delivery-gateway.ts`

**Existing Methods (pagination REQUIRED):**

```typescript
findMany(filters: Partial<DeliveryFilters>, pagination: PaginationOptions): Effect.Effect<NotificationDelivery[], ...>
findFailed(tripId: string, pagination: PaginationOptions): Effect.Effect<NotificationDelivery[], ...>
```

**New Methods:**

```typescript
findManyConnection(filters: Partial<DeliveryFilters>, options?: ConnectionOptions): Effect.Effect<ConnectionResult<NotificationDelivery>, ...>
findFailedConnection(tripId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<NotificationDelivery>, ...>
```

---

### 2.10 NotificationScheduleGateway

**File:** `packages/domain/src/notification/ports/notification-schedule-gateway.ts`

**Existing Method:**

```typescript
findAllPaginated(options?: { filter?; pagination? }): Effect.Effect<PaginatedResult<NotificationSchedule>, ...>
```

**New Method:**

```typescript
findAllConnection(options?: { filter?; first?: number; after?: string }): Effect.Effect<ConnectionResult<NotificationSchedule>, ...>
```

---

### 2.11 RewardGateway

**File:** `packages/domain/src/reward/ports/reward-gateway.ts`

**Existing Methods:**

```typescript
findByTripId(tripId: string, options?: { includeHidden?: boolean } & PaginationOptions): Effect.Effect<PaginatedResult<Reward>, ...>
findVisibleByTripId(tripId: string, options?: PaginationOptions): Effect.Effect<PaginatedResult<Reward>, ...>
```

**New Methods:**

```typescript
findByTripIdConnection(tripId: string, options?: ConnectionOptions & { includeHidden?: boolean }): Effect.Effect<ConnectionResult<Reward>, ...>
findVisibleByTripIdConnection(tripId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<Reward>, ...>
```

---

### 2.12 RewardPurchaseGateway

**File:** `packages/domain/src/reward/ports/reward-gateway.ts` (lines 95-150)

**Existing Methods:**

```typescript
findByRewardId(rewardId: RewardId, options?: PaginationOptions): Effect.Effect<PaginatedResult<RewardPurchase>, ...>
findByGroupId(groupId: string, options?: PaginationOptions): Effect.Effect<PaginatedResult<RewardPurchase>, ...>
findByTripId(tripId: string, options?: { groupId?: string } & PaginationOptions): Effect.Effect<PaginatedResult<RewardPurchase>, ...>
```

**New Methods:**

```typescript
findByRewardIdConnection(rewardId: RewardId, options?: ConnectionOptions): Effect.Effect<ConnectionResult<RewardPurchase>, ...>
findByGroupIdConnection(groupId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<RewardPurchase>, ...>
findByTripIdConnection(tripId: string, options?: ConnectionOptions & { groupId?: string }): Effect.Effect<ConnectionResult<RewardPurchase>, ...>
```

---

### 2.13 SponsorGateway

**File:** `packages/domain/src/sponsor/ports/sponsor-gateway.ts`

**Existing Method:**

```typescript
findAll(options?: { limit?: number; offset?: number }): Effect.Effect<Sponsor[], ...>
```

**New Method:**

```typescript
findAllConnection(options?: ConnectionOptions): Effect.Effect<ConnectionResult<Sponsor>, ...>
findByTripIdConnection(tripId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<Sponsor>, ...>
```

---

### 2.14 SubmissionReportGateway

**File:** `packages/domain/src/challenge/ports/submission-report-gateway.ts`

**Existing Method:**

```typescript
findAll(options?: { limit?: number; offset?: number }): Effect.Effect<SubmissionReport[], ...>
```

**New Methods:**

```typescript
findAllConnection(options?: ConnectionOptions): Effect.Effect<ConnectionResult<SubmissionReport>, ...>
findBySubmissionIdConnection(submissionId: string, options?: ConnectionOptions): Effect.Effect<ConnectionResult<SubmissionReport>, ...>
```

---

### 2.15 TripGateway

**File:** `packages/domain/src/trip/ports/trip-gateway.ts`

**Existing Method:**

```typescript
findAll(options?: { limit?: number; offset?: number }): Effect.Effect<Trip[], ...>
```

**New Methods:**

```typescript
findAllConnection(options?: ConnectionOptions & { sortBy?: "createdAt" | "startDate" | "status" }): Effect.Effect<ConnectionResult<Trip>, ...>
findByStatusConnection(status: TripStatus, options?: ConnectionOptions): Effect.Effect<ConnectionResult<Trip>, ...>
```

---

### 2.16 UserGateway

**File:** `packages/domain/src/user/ports/user-gateway.ts`

**Existing Method:**

```typescript
findAll(options?: { limit?: number; offset?: number }): Effect.Effect<User[], ...>
```

**New Methods:**

```typescript
findAllConnection(options?: ConnectionOptions & { sortBy?: "createdAt" | "name" }): Effect.Effect<ConnectionResult<User>, ...>
findByRoleConnection(role: UserRole, options?: ConnectionOptions): Effect.Effect<ConnectionResult<User>, ...>
```

---

## 3. Implementation Files Requiring Updates

### 3.1 Drizzle Implementations (16 files)

All files in `packages/adapters/src/{domain}/gateways/drizzle/` need:

1. Import cursor encoding utilities
2. Implement `*Connection` methods with proper WHERE clauses
3. Handle composite sort fields

### 3.2 In-Memory Implementations (16 files)

All files in `packages/adapters/src/{domain}/gateways/in-memory/` need:

1. Cursor parsing and filtering logic
2. In-memory sorting by cursor fields
3. Next cursor generation

---

## 4. GraphQL Files Needing Relay Connection Types

### 4.1 Types to Add Per Entity

```typescript
// For each entity X:

// 1. Edge Type
export const XEdgeType = builder.objectType("XEdge", {
  fields: (t) => ({
    node: t.field({ type: XType, nullable: false }),
    cursor: t.exposeString("cursor", { nullable: false }),
  }),
});

// 2. Connection Type
export const XConnectionType = builder.objectType("XConnection", {
  fields: (t) => ({
    edges: t.field({ type: [XEdgeType], nullable: false }),
    pageInfo: t.field({ type: PageInfoType, nullable: false }),
    totalCount: t.exposeInt("totalCount", { nullable: true }),
  }),
});
```

### 4.2 Global PageInfo Type (REUSABLE)

Add to `packages/frameworks/src/graphql/types/common.ts` (create if needed):

```typescript
export const PageInfoType = builder.objectType("PageInfo", {
  fields: (t) => ({
    hasNextPage: t.exposeBoolean("hasNextPage", { nullable: false }),
    hasPreviousPage: t.exposeBoolean("hasPreviousPage", { nullable: false }),
    startCursor: t.exposeString("startCursor", { nullable: true }),
    endCursor: t.exposeString("endCursor", { nullable: true }),
  }),
});
```

---

## 5. Risk Assessment

### 5.1 High Risk

**NONE** - All gateways have clear migration paths with existing patterns to follow.

### 5.2 Medium Risk (4 gateways)

| Gateway                         | Risk Factor                                                | Mitigation                                   |
| ------------------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| **ChallengeGateway**            | Complex status-based sorting, multiple filter combinations | Add comprehensive tests for each sort option |
| **ChallengeSubmissionGateway**  | Multiple orderBy options (voteScore, createdAt)            | Implement separate cursor encodings per sort |
| **GroupGateway**                | Ranking by coins requires tie-breaker handling             | Ensure id is always included in cursor       |
| **NotificationDeliveryGateway** | Existing pagination is required (not optional)             | Careful API contract migration               |

### 5.3 Low Risk (12 gateways)

All other gateways have straightforward timestamp-based pagination with clear patterns.

---

## 6. Estimated Complexity

### 6.1 By Gateway

| Gateway              | Complexity | Files | Lines (est) | Notes                  |
| -------------------- | ---------- | ----- | ----------- | ---------------------- |
| ActivityFeed         | LOW        | 5     | ~100        | Reference exists       |
| Challenge            | MEDIUM     | 5     | ~150        | Multiple sorts         |
| ChallengeSubmission  | MEDIUM     | 5     | ~200        | orderBy variants       |
| ChallengeVote        | LOW        | 5     | ~50         | No existing pagination |
| CoinTransaction      | LOW        | 5     | ~100        | Standard pattern       |
| Event                | LOW        | 5     | ~50         | No existing pagination |
| Group                | MEDIUM     | 5     | ~100        | Coins ranking          |
| Location             | SKIP       | -     | -           | Not needed             |
| Notification         | LOW        | 5     | ~50         | No existing pagination |
| NotificationDelivery | MEDIUM     | 5     | ~150        | Required pagination    |
| NotificationSchedule | LOW        | 5     | ~100        | PaginatedResult exists |
| Reward               | LOW        | 5     | ~150        | PaginatedResult exists |
| RewardPurchase       | LOW        | 5     | ~150        | PaginatedResult exists |
| Sponsor              | LOW        | 5     | ~50         | Standard pattern       |
| SubmissionReport     | LOW        | 5     | ~50         | Standard pattern       |
| Trip                 | LOW        | 5     | ~50         | Standard pattern       |
| User                 | LOW        | 5     | ~50         | Standard pattern       |

### 6.2 Total Effort Estimate

- **Total Files:** ~80 files (16 gateways × 5 files each)
- **Total Lines:** ~1,750 lines of implementation code
- **Testing:** Additional ~800 lines of tests
- **Estimated Duration:** 1-2 weeks with parallel workstreams

### 6.3 Parallel Work Streams

**Stream A (Low Complexity - 3 days):**

- UserGateway, TripGateway, SponsorGateway, EventGateway, NotificationGateway

**Stream B (Low-Medium Complexity - 4 days):**

- CoinTransactionGateway, RewardGateway, RewardPurchaseGateway, NotificationScheduleGateway, SubmissionReportGateway

**Stream C (Medium Complexity - 5 days):**

- ChallengeGateway, ChallengeSubmissionGateway, ChallengeVoteGateway, GroupGateway, NotificationDeliveryGateway

**Stream D (Reference + Integration - 3 days):**

- ActivityFeedGateway (complete drizzle migration), shared utilities, integration testing

---

## 7. Integration Points

### 7.1 Layer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ GraphQL Layer (frameworks)                                      │
│ - Connection types (XConnection, XEdge)                       │
│ - Relay-compatible resolvers                                    │
│ - Input types with first/after arguments                        │
└──────────────────────┬────────────────────────────────────────┘
                       │ calls
┌──────────────────────▼────────────────────────────────────────┐
│ Controller Layer (adapters)                                     │
│ - Validate input                                                │
│ - Call use cases                                                │
│ - Return Result types                                           │
└──────────────────────┬────────────────────────────────────────┘
                       │ uses
┌──────────────────────▼────────────────────────────────────────┐
│ Use Cases Layer (use-cases)                                     │
│ - Effect.gen orchestration                                      │
│ - Context.Tag for DI                                            │
│ - Business logic                                                │
└──────────────────────┬────────────────────────────────────────┘
                       │ calls
┌──────────────────────▼────────────────────────────────────────┐
│ Domain Gateway Ports (domain)                                   │
│ - Interface definitions                                         │
│ - ConnectionOptions, ConnectionResult types                     │
└──────────────────────┬────────────────────────────────────────┘
                       │ implemented by
┌──────────────────────▼────────────────────────────────────────┐
│ Adapter Implementations (adapters)                              │
│ - Drizzle: SQL with WHERE cursor clauses                        │
│ - In-Memory: Array filtering + sorting                          │
└──────────────────────┬────────────────────────────────────────┘
                       │ queries
┌──────────────────────▼────────────────────────────────────────┐
│ Database (via frameworks/drizzle)                             │
│ - PostgreSQL with composite indexes                             │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Shared Utilities Needed

**File:** `packages/domain/src/ports/connection.ts` (create)

```typescript
export interface ConnectionOptions {
  first?: number;
  after?: string | null;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface ConnectionResult<T> {
  edges: Array<{ node: T; cursor: string }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount?: number;
}
```

**File:** `packages/adapters/src/system/shared/cursor.ts` (create)

```typescript
export function encodeCursor(fields: Record<string, unknown>): string;
export function decodeCursor(cursor: string): Record<string, unknown>;
```

---

## 8. Existing Pagination Patterns

### 8.1 ActivityFeed (Reference)

**Use-Cases Layer (BEST PRACTICE):**

- Cursor: `{ id: string; createdAt: Date; isPinned: boolean }`
- Returns: `{ activities, nextCursor, hasMore }`

**GraphQL Types:**

- `ActivityCursorInput` - Input type for cursor
- `ActivityCursorType` - Output type with id, createdAt, isPinned
- `GetByTripInput` - Includes optional cursor field

### 8.2 Offset Pagination (To Migrate)

**Common Pattern Found:**

```typescript
interface PaginationOptions {
  limit?: number;
  offset?: number;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
```

**Used By:**

- ActivityFeedGateway
- CoinTransactionGateway
- NotificationScheduleGateway
- RewardGateway
- RewardPurchaseGateway

### 8.3 Array Return (To Add Pagination)

**Pattern Found:**

```typescript
findAll(options?: { limit?: number; offset?: number }): Effect.Effect<T[], ...>
```

**Gateways Using:**

- ChallengeGateway
- ChallengeSubmissionGateway (findMany)
- EventGateway
- GroupGateway
- SponsorGateway
- SubmissionReportGateway
- TripGateway
- UserGateway

---

## 9. Key Recommendations

### 9.1 Implementation Order

1. **Phase 1 (Week 1):** Shared utilities + Low-risk gateways
   - Create Connection types and cursor utilities
   - Implement User, Trip, Sponsor, Event, Notification
   - Add GraphQL connection types

2. **Phase 2 (Week 1-2):** Medium-risk gateways
   - Implement Challenge, ChallengeSubmission, ChallengeVote
   - Implement Group, NotificationDelivery
   - Implement Reward, RewardPurchase, CoinTransaction

3. **Phase 3 (Week 2):** Reference completion + Integration
   - Complete ActivityFeed drizzle cursor migration
   - Full integration testing
   - Documentation updates

### 9.2 Backward Compatibility

- **Keep existing offset methods** (mark as @deprecated in GraphQL)
- **Add \*Connection methods** alongside existing
- **GraphQL schema:** Add connection fields to existing types without removing offset fields

### 9.3 Cursor Encoding

**Standard Format:**

```typescript
// Base64-encoded JSON
interface CursorPayload {
  id: string; // Always included (tie-breaker)
  sortValue: unknown; // Primary sort field value
  secondaryValue?: unknown; // For composite sorts
}

// Examples:
// { id: "uuid", createdAt: "2024-01-01T00:00:00Z" }
// { id: "uuid", isPinned: true, createdAt: "2024-01-01T00:00:00Z" }
// { id: "uuid", voteScore: 100, createdAt: "2024-01-01T00:00:00Z" }
```

### 9.4 Database Indexes

**Recommended composite indexes for cursor pagination:**

```sql
-- Standard pattern (createdAt, id)
CREATE INDEX idx_x_created_at_id ON "X" ("createdAt", "id");

-- ActivityFeed pattern (isPinned, createdAt, id)
CREATE INDEX idx_activity_is_pinned_created_at_id ON "ActivityFeed" ("isPinned", "createdAt", "id");

-- Ranking pattern (coins DESC, id)
CREATE INDEX idx_group_coins_id ON "Group" ("coins" DESC, "id");
```

---

## 10. Conclusion

The codebase is **well-positioned** for cursor-based pagination migration:

1. **Reference Implementation Exists:** ActivityFeed has cursor patterns in use-cases and GraphQL layers
2. **Relay Plugin Configured:** Pothos builder already has RelayPlugin with String cursor type
3. **Clear Architecture:** 4-layer separation makes systematic updates feasible
4. **Type Safety:** Effect-based error handling provides robust contracts

**Total Scope:** 16 gateways, ~80 files, 1-2 weeks effort  
**Risk Level:** Low to Medium  
**Recommended Approach:** Parallel work streams by complexity level

The migration will provide:

- Consistent Relay Connection spec across all paginated APIs
- Better performance for large datasets (no offset overhead)
- Real-time safe pagination (cursors don't shift)
- Mobile-friendly pagination (next/previous page support)
