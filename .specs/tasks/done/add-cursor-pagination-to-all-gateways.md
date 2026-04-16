# Add Cursor-Based Pagination to All Paginable Gateways

**Status:** Draft  
**Created:** 2026-04-16  
**Priority:** High  
**Type:** Technical Enhancement / API Standardization

---

## Overview

**WHAT:** Extend Relay cursor-based pagination (per GraphQL Cursor Connections Specification) to all gateway interfaces that currently return unbounded arrays or use offset-based pagination.

**WHY:**

- Large datasets (events, challenges, notifications, groups) currently return all records in a single query, creating memory pressure and slow response times as the platform scales
- Offset pagination causes unstable results when data changes during user navigation (items shift between pages, duplicates appear)
- Relay cursor pagination provides stable, performant pagination suitable for real-time data and is the GraphQL industry standard
- All list queries should follow a consistent pagination pattern to reduce API consumer confusion and maintenance burden

**SCOPE SUMMARY:**

- **Phase 1:** Add Relay Connection methods to 8 gateways currently returning raw arrays (40+ methods)
- **Phase 2:** Migrate 12 gateways from offset pagination to cursor pagination (20+ methods)
- **Out of Scope:** Frontend consumption, offset pagination removal (methods will be deprecated only), subscription pagination

---

## Motivation

### Current Problems

1. **Unbounded Array Returns:** Gateways like `findByTripId(tripId)` return all records without limits, risking memory exhaustion and poor performance on large datasets
2. **Inconsistent Pagination:** Mix of raw arrays, offset pagination, and (in some areas) cursor pagination creates confusion
3. **Real-Time Data Instability:** Offset pagination breaks when new items are added during browsing—users see duplicates or miss items
4. **API Consumer Complexity:** Different pagination patterns require different handling logic in clients

### Business Benefits

- **Scalability:** Handle 1000+ item datasets without performance degradation
- **Reliability:** Stable pagination even when underlying data changes
- **Standards Compliance:** Follow GraphQL Relay specification for broader ecosystem compatibility
- **User Experience:** Faster initial loads, smooth infinite scroll, no missing/duplicate items

---

## Architecture Overview

### Solution Strategy

This migration implements **Relay Cursor Connections Specification** across all paginated gateway interfaces using a **layer-by-layer approach** with strict backward compatibility. The solution follows the existing ActivityFeedGateway reference implementation and leverages:

1. **Pothos Relay Plugin** - Provides `t.connection()` field builder for declarative GraphQL connection types
2. **Effect-based Gateways** - Context.Tag dependency injection with `Effect.tryPromise` for async operations
3. **Base64url Cursor Encoding** - Opaque, URL-safe cursors containing composite sort keys
4. **Composite Sort Keys** - Multi-field ordering (e.g., `(createdAt, id)`) ensuring stable pagination
5. **Dual-Method Gateways** - New `*Connection` methods added alongside existing (deprecated) methods

### Key Decisions

| Decision                                | Rationale                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Base64url encoding**                  | URL-safe without padding; opaque to clients; JSON payload allows flexible cursor structure |
| **Composite (sortField, id) sort keys** | `id` as tie-breaker prevents unstable ordering when timestamps collide                     |
| **`*Connection` method suffix**         | Clear naming convention; backward compatible; easy to identify cursor-based methods        |
| **Keep existing methods**               | Zero breaking changes; `@deprecated` JSDoc guides consumers to new methods                 |
| **ActivityFeed as reference**           | Proven pattern in codebase; use-cases layer already has cursor implementation              |
| **Effect at all layers**                | Consistent error handling; composable with `Effect.gen` and `Context.Tag`                  |
| **Make `totalCount` optional**          | Avoid expensive `COUNT(*)` queries on large tables                                         |
| **Fetch limit+1 pattern**               | Query one extra record to determine `hasNextPage` without separate count query             |

### System Architecture

#### Layer-by-Layer Breakdown

```
┌─────────────────────────────────────────────────────────────────────┐
│ GraphQL Layer (packages/frameworks/src/graphql/)                    │
│ ─────────────────────────────────────────────────────────────────── │
│ • Pothos builder with RelayPlugin (configured in builder.ts)        │
│ • Connection types: XConnection, XEdge using builder.node()         │
│ • Resolvers using t.connection() with cursor encode/decode        │
│ • Input: first/after arguments; Output: edges, pageInfo, nodes    │
└────────────────────────────┬────────────────────────────────────────┘
                             │ calls
┌────────────────────────────▼────────────────────────────────────────┐
│ Controller Layer (packages/adapters/src/*/controllers/)           │
│ ─────────────────────────────────────────────────────────────────── │
│ • Validate input, decode cursors from GraphQL args                  │
│ • Call use case interactors via Effect.runPromise                   │
│ • Transform domain results to GraphQL-compatible structures         │
│ • Encode cursors for response                                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │ uses
┌────────────────────────────▼────────────────────────────────────────┐
│ Use Cases Layer (packages/use-cases/src/)                           │
│ ─────────────────────────────────────────────────────────────────── │
│ • Context.Tag for gateway dependency injection                      │
│ • Orchestrate business logic with Effect.gen                        │
│ • Define CursorPaginationOptions, CursorPaginatedResult<T> types    │
│ • Re-export cursor encode/decode utilities                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │ calls
┌────────────────────────────▼────────────────────────────────────────┐
│ Domain Gateway Ports (packages/domain/src/*/ports/)                 │
│ ─────────────────────────────────────────────────────────────────── │
│ • Interface contracts: *Connection methods                          │
│ • ConnectionResult<T> return type definition                          │
│ • Pure interfaces - no implementation details                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │ implemented by
┌────────────────────────────▼────────────────────────────────────────┐
│ Adapter Implementations (packages/adapters/src/*/gateways/)       │
│ ─────────────────────────────────────────────────────────────────── │
│ • Drizzle: SQL with WHERE (sortField, id) > (cursor.value, id)     │
│ • Drizzle: ORDER BY sortField, id; LIMIT limit + 1                 │
│ • In-Memory: Array filtering + sorting + slicing                    │
│ • Both return { items, nextCursor, hasMore }                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │ queries
┌────────────────────────────▼────────────────────────────────────────┐
│ Database (PostgreSQL via Drizzle)                                   │
│ ─────────────────────────────────────────────────────────────────── │
│ • Composite indexes on (sortField, id) for performance            │
│ • ActivityFeed: (isPinned DESC, createdAt DESC, id DESC)            │
│ • Standard: (createdAt DESC, id DESC)                             │
│ • Group ranking: (coins DESC, id)                                 │
└─────────────────────────────────────────────────────────────────────┘
```

#### Data Flow

**Forward Pagination Query Flow:**

```
1. GraphQL Query: eventsByTrip(tripId: "123", first: 20, after: "eyJpZCI6...")

2. Resolver decodes cursor:
   afterCursor = decodeCursorWithDate("eyJpZCI6...")
   // Returns: { id: "abc", createdAt: Date("2024-01-15T10:00:00Z") }

3. Controller calls use case:
   controller.getByTrip({ tripId: "123", first: 20, after: afterCursor })

4. Use case accesses gateway via Context.Tag:
   const gateway = yield* EventGatewayTag
   const result = yield* gateway.findByTripIdConnection("123", { limit: 20, cursor: afterCursor })

5. Drizzle gateway executes SQL:
   SELECT * FROM events
   WHERE trip_id = '123'
     AND (start_time, id) > ('2024-01-15T10:00:00Z', 'abc')
   ORDER BY start_time ASC, id ASC
   LIMIT 21  -- +1 to detect hasNextPage

6. Gateway builds result:
   - items = records.slice(0, 20).map(mapper.toDomain)
   - hasMore = records.length > 20
   - nextCursor = hasMore ? { id: items[19].id, createdAt: items[19].startTime } : null

7. Response flows back through layers with encoded cursors

8. GraphQL returns:
   {
     edges: [{ node: Event, cursor: "eyJpZCI6..." }, ...],
     pageInfo: { hasNextPage: true, hasPreviousPage: true, startCursor: "...", endCursor: "..." },
     nodes: [Event, Event, ...]
   }
```

### Component Design

#### Shared Utilities

**Cursor Encoding/Decoding** (`packages/use-cases/src/system/utils/cursor.ts`):

```typescript
export interface CursorData {
  id: string;
  createdAt: string; // ISO 8601
  // Extend per-entity: isPinned?: boolean; voteScore?: number; etc.
}

export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

export function decodeCursor(cursor: string): CursorData | null {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf-8");
    const data = JSON.parse(json);
    if (typeof data.id !== "string") return null;
    return data;
  } catch {
    return null;
  }
}
```

**Connection Types** (`packages/domain/src/ports/connection.ts`):

```typescript
export interface ConnectionResult<T> {
  edges: Array<{ node: T; cursor: string }>;
  nodes: T[]; // Convenience field
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount?: number; // Optional - expensive to compute
}
```

#### Entity-Specific Patterns

**Standard Pattern (most entities):**

- Sort: `createdAt DESC, id DESC`
- Cursor: `{ id: string; createdAt: string }`

**ActivityFeed Special Pattern:**

- Sort: `isPinned DESC, createdAt DESC, id DESC`
- Cursor: `{ id: string; createdAt: string; isPinned: boolean }`

**ChallengeSubmission Special Pattern:**

- Sort variants: `createdAt` or `voteScore`
- Separate cursor types per sort option

### Interface Contracts

#### Domain Layer (Port Interfaces)

```typescript
// packages/domain/src/event/ports/event-gateway.ts
export interface EventGateway {
  // Existing (deprecated)
  /** @deprecated Use findByTripIdConnection instead */
  findByTripId(tripId: string): Effect.Effect<Event[], DatabaseError, never>;

  // New cursor-based method
  findByTripIdConnection(
    tripId: string,
    args: { first?: number; after?: string | null },
  ): Effect.Effect<ConnectionResult<Event>, DatabaseError, never>;
}
```

#### Use Cases Layer (Context.Tag)

```typescript
// packages/use-cases/src/event/ports/gateway.ts
export class EventGatewayTag extends Context.Tag("EventGateway")<
  EventGatewayTag,
  EventGateway
>() {}

// Re-export cursor utilities for convenience
export { encodeCursor, decodeCursor } from "../../system/utils/cursor";
```

#### Adapter Layer (Drizzle Implementation)

```typescript
// packages/adapters/src/event/gateways/drizzle/gateway.ts
findByTripIdConnection(
  tripId: string,
  args: { first?: number; after?: { id: string; createdAt: Date } | null }
): Effect.Effect<ConnectionResult<Event>, DatabaseError, never> {
  return Effect.tryPromise({
    try: async () => {
      const limit = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      const conditions = [eq(this.table.tripId, tripId)];

      if (cursor) {
        conditions.push(
          sql`(${this.table.startTime}, ${this.table.id}) > (${cursor.createdAt}, ${cursor.id})`
        );
      }

      const records = await this.db
        .select()
        .from(this.table)
        .where(and(...conditions))
        .orderBy(asc(this.table.startTime), asc(this.table.id))
        .limit(limit + 1);

      const hasMore = records.length > limit;
      const items = records.slice(0, limit).map(r => this.mapper.toDomain(r));
      const lastItem = items[items.length - 1];

      return {
        edges: items.map(item => ({
          node: item,
          cursor: encodeCursor({ id: item.id, createdAt: item.startTime.toISOString() })
        })),
        nodes: items,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: items[0] ? encodeCursor({ id: items[0].id, createdAt: items[0].startTime.toISOString() }) : null,
          endCursor: lastItem ? encodeCursor({ id: lastItem.id, createdAt: lastItem.startTime.toISOString() }) : null
        }
      };
    },
    catch: (error) => new DatabaseError({ operation: "findByTripIdConnection", cause: error })
  });
}
```

#### Framework Layer (GraphQL Resolver)

```typescript
// packages/frameworks/src/graphql/resolvers/event.ts
builder.queryField("eventsByTrip", (t) =>
  t.connection({
    type: EventType,
    args: {
      tripId: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const controller = ctx.controllers.eventController;
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.getByTrip({
        tripId: args.tripId,
        first: args.first ?? 20,
        after: afterCursor,
      });

      return {
        edges: result.items.map((item) => ({
          node: item,
          cursor: encodeCursor({
            id: item.id,
            createdAt: item.startTime.toISOString(),
          }),
        })),
        pageInfo: {
          hasNextPage: result.hasMore,
          hasPreviousPage: !!args.after,
          startCursor: result.items[0]
            ? encodeCursor({
                id: result.items[0].id,
                createdAt: result.items[0].startTime.toISOString(),
              })
            : null,
          endCursor: result.nextCursor
            ? encodeCursor({
                id: result.nextCursor.id,
                createdAt: result.nextCursor.createdAt.toISOString(),
              })
            : null,
        },
      };
    },
  }),
);
```

---

## Scope Definition

### In Scope

| Category            | Items                                                                                |
| ------------------- | ------------------------------------------------------------------------------------ |
| **Domain Layer**    | `Connection<T>`, `Edge<T>`, `PageInfo` interfaces; `CursorEncoder` utility           |
| **Use Case Layer**  | Add `*Connection` methods to all gateway ports; mark existing methods `@deprecated`  |
| **Adapter Layer**   | Implement cursor pagination in all Drizzle and in-memory gateways                    |
| **Framework Layer** | Update Pothos GraphQL schema with `builder.connectionObject()` and `t.connection()`  |
| **Testing**         | Unit tests for each gateway pagination method; integration tests for GraphQL queries |

### Out of Scope

| Item                                          | Reason                                                       |
| --------------------------------------------- | ------------------------------------------------------------ |
| Frontend/Mobile pagination consumption        | Separate feature requiring UI/UX design                      |
| Removing existing offset/array methods        | Will be deprecated only; removal is future breaking change   |
| Real-time subscription pagination             | Future enhancement requiring WebSocket considerations        |
| Complex multi-field filtering with pagination | Basic filters only; complex cases need separate analysis     |
| Cursor expiration/invalidation logic          | Basic error handling only; advanced retry logic out of scope |

---

## Acceptance Criteria

### AC1: Relay Spec Compliance

**Given** a gateway method that returns a list of entities  
**When** called with Relay pagination arguments (`first`, `after`, `last`, `before`)  
**Then** it returns a `Connection<T>` containing:

- `edges[]` array where each edge has:
  - `node`: The entity itself
  - `cursor`: Base64-encoded string containing sort field values
- `nodes[]` array for convenient direct access to entities
- `pageInfo` object with:
  - `hasNextPage`: Boolean indicating if more items exist after this page
  - `hasPreviousPage`: Boolean indicating if more items exist before this page
  - `startCursor`: Cursor of the first edge (null if no edges)
  - `endCursor`: Cursor of the last edge (null if no edges)
- `totalCount`: Optional total count of all matching items

### AC2: Cursor Stability

**Given** a user has paginated to a specific page using a cursor  
**When** new items are added to or removed from the underlying dataset  
**Then** the cursor remains valid and returns the same relative position in the dataset

### AC3: Sort Stability

**Given** any paginated query  
**When** items have identical sort field values  
**Then** the sort must use a unique field (e.g., `id`) as a tiebreaker to ensure consistent ordering

### AC4: Backward Compatibility

**Given** existing API consumers using current methods  
**When** new `*Connection` methods are added  
**Then** existing methods remain functional and are marked with `@deprecated` JSDoc annotation

### AC5: Empty Result Handling

**Given** a query that matches no items  
**When** paginated  
**Then** return empty `edges[]`, `nodes[]`, `pageInfo.hasNextPage=false`, `pageInfo.hasPreviousPage=false`, and null cursors

### AC6: Invalid Cursor Handling

**Given** an invalid or corrupted cursor string  
**When** used in pagination query  
**Then** return a clear error indicating invalid cursor format

### AC7: Page Size Limits

**Given** a pagination request  
**When** `first` or `last` exceeds maximum page size (default: 100)  
**Then** cap the result to maximum page size and include warning in response

---

## User Scenarios

### Scenario 1: Event Feed Browsing

**Persona:** Trip participant using mobile app  
**Context:** User opens a trip with 150+ events scheduled

```gherkin
Given the user is viewing a trip detail screen
And the trip has 150 events over 7 days
When the events section loads
Then only the first 20 events are fetched and displayed
And the UI shows a "Load more" indicator based on hasNextPage

Given the user has scrolled to the bottom of the first 20 events
When they tap "Load more"
Then the next 20 events are fetched using the endCursor from the previous page
And the events are appended to the list without duplicates

Given a new event is added to the trip by an admin
When the user loads the next page
Then the cursor-based pagination ensures no events are skipped or duplicated
```

### Scenario 2: Notification Center

**Persona:** Active user with 500+ notifications  
**Context:** User checks notification history regularly

```gherkin
Given the user opens the notification center
When the notification list loads
Then only the most recent 30 notifications are fetched initially
And the page responds in under 200ms

Given the user has many unread notifications
When they scroll through the history
Then older notifications load on-demand via cursor pagination
And the read/unread status updates don't affect pagination position
```

### Scenario 3: Admin Challenge Management

**Persona:** Trip administrator reviewing submissions  
**Context:** Admin is reviewing 80 challenges with active submission flow

```gherkin
Given an admin is browsing challenges on the management dashboard
And new challenges are being created by other admins
When the admin navigates through challenge pages
Then cursor pagination ensures consistent view without items shifting between pages

Given the admin filters challenges by status
When paginating through filtered results
Then the cursor includes both filter state and sort position
And the results remain stable during the browsing session
```

### Scenario 4: Sponsor Discovery

**Persona:** User exploring trip sponsors  
**Context:** Trip has 50+ sponsor tiers with varying content

```gherkin
Given a user views the sponsors section
When the page loads
Then sponsors load in batches of 10
And premium tier sponsors appear first per sort configuration

Given the user is browsing on a slow connection
When pagination requests are made
Then smaller page sizes (5-10) can be requested via the `first` parameter
And the experience remains responsive
```

---

## Gateways to Migrate

### Phase 1: Gateways Without Any Pagination (Arrays Returned)

These gateways return raw arrays that could grow unbounded:

1. **Event Gateway**
   - `findByTripId(tripId)` - All events for a trip
   - `findUpcomingByTripId(tripId)` - Upcoming events
   - `findOngoingByTripId(tripId)` - Ongoing events
   - `findPastByTripId(tripId)` - Past events

2. **Challenge Gateway**
   - `findByTripId(tripId)` - All challenges for a trip
   - `findByStatus(status)` - Challenges by status
   - `findByTripIdAndStatus(tripId, status)` - Filtered by trip + status
   - `findBySubmissionType(type)` - By submission type
   - `findByScoringCategory(category)` - By scoring category
   - `findActive()` - Active challenges
   - `findOpenForSubmission()` - Open challenges
   - `findRecurring()` - Recurring challenges

3. **Notification Gateway**
   - `findByUserId(userId)` - All notifications for a user
   - `findUnreadByUserId(userId)` - Unread notifications

4. **Sponsor Gateway**
   - `findActive()` - Active sponsors
   - `findByTripId(tripId)` - Sponsors for a trip

5. **Group Gateway**
   - `findByTripId(tripId)` - Groups in a trip
   - `findByStatus(status)` - Groups by status
   - `findByTripIdAndStatus(tripId, status)` - Filtered groups
   - `findByOrganizerId(organizerId)` - Groups by organizer

6. **Trip Gateway**
   - `findByStatus(status)` - Trips by status
   - `findActive()` - Active trips

7. **Location Gateway**
   - `findSharingWithUser(userId)` - Locations sharing with user
   - `findByUserIds(userIds[])` - Locations by user IDs

8. **SubmissionReport Gateway**
   - `findBySubmissionId(submissionId)` - Reports for a submission
   - `findByReporterId(reporterId)` - Reports by a user
   - `findByReason(reason)` - Reports by reason

### Phase 2: Gateways With Offset Pagination (Upgrade to Cursor)

These gateways have offset pagination that needs migration:

1. **User Gateway**
   - `findAll(options)` - All users with offset pagination
   - `findByRole(role)` - Users by role (add pagination)

2. **Trip Gateway**
   - `findAll(options)` - All trips with offset pagination

3. **Group Gateway**
   - `findAll(options)` - All groups with offset pagination

4. **Sponsor Gateway**
   - `findAll(options)` - All sponsors with offset pagination

5. **Challenge Gateway**
   - `findAll(options)` - All challenges with offset pagination

6. **Location Gateway**
   - `findAll(options)` - All locations with offset pagination

7. **SubmissionReport Gateway**
   - `findAll(options)` - All reports with offset pagination

8. **CoinTransaction Gateway**
   - `findMany(filters, pagination)` - Transactions with offset pagination

9. **Reward Gateway**
   - `findByTripId(tripId, options)` - Rewards with PaginatedResult
   - `findVisibleByTripId(tripId, options)` - Visible rewards with PaginatedResult

10. **RewardPurchase Gateway**
    - `findByRewardId(rewardId, options)` - Purchases by reward
    - `findByGroupId(groupId, options)` - Purchases by group
    - `findByTripId(tripId, options)` - Purchases by trip

11. **ChallengeSubmission Gateway** (check if paginated)
12. **ChallengeVote Gateway** (check if paginated)

---

## Files to Modify

### Domain Layer (packages/domain/src)

Add to `value-objects/pagination.ts`:

- `Connection<T>` interface
- `Edge<T>` interface
- `PageInfo` interface
- `ForwardPaginationArgs` interface
- `BackwardPaginationArgs` interface
- `CursorEncoder` utility

### Use Cases Layer (packages/use-cases/src)

For each gateway port:

- Add `*Connection` methods returning `Connection<T>`
- Mark old methods as `@deprecated`

### Adapters Layer (packages/adapters/src)

For each gateway implementation:

- **In-memory gateways:** Add `*Connection` methods with array slicing
- **Drizzle gateways:** Add `*Connection` methods with cursor-based WHERE clauses

### Frameworks Layer (packages/frameworks/src/graphql)

Update Pothos types:

- Add `builder.node()` and `builder.connectionObject()` for each entity
- Update Query fields to use `t.connection()`
- Map Connection results to Relay format

---

## Example Implementation

### Domain Types

```typescript
// packages/domain/src/value-objects/pagination.ts
export interface Connection<T> {
  edges: Edge<T>[];
  nodes: T[];
  pageInfo: PageInfo;
  totalCount?: number;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export class CursorEncoder {
  static encode(data: { id: string; [key: string]: unknown }): string {
    return btoa(JSON.stringify(data));
  }

  static decode(cursor: string): { id: string; [key: string]: unknown } {
    return JSON.parse(atob(cursor));
  }
}
```

### Gateway Interface Update (Example: EventGateway)

```typescript
// packages/use-cases/src/event/ports/gateway.ts

export interface EventGateway {
  // Existing methods (marked @deprecated)
  /** @deprecated Use findByTripIdConnection instead */
  findByTripId(tripId: string): Effect.Effect<Event[], DatabaseError, never>;

  // New Relay Connection method
  findByTripIdConnection(
    tripId: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<Connection<Event>, DatabaseError, never>;
}
```

### Gateway Implementation (Example: DrizzleEventGateway)

```typescript
findByTripIdConnection(
  tripId: string,
  args: ForwardPaginationArgs,
): Effect.Effect<Connection<Event>, DatabaseError, never> {
  return Effect.tryPromise({
    try: async () => {
      const limit = args.first;
      const cursor = args.after ? CursorEncoder.decode(args.after) : null;

      // Build WHERE conditions
      const conditions = [eq(this.table.tripId, tripId)];

      // Add cursor pagination
      if (cursor) {
        conditions.push(
          sql`(${this.table.startTime}, ${this.table.id}) >
              (${cursor.startTime}, ${cursor.id})`
        );
      }

      // Fetch limit + 1 for hasNextPage detection
      const records = await this.db
        .select()
        .from(this.table)
        .where(and(...conditions))
        .orderBy(asc(this.table.startTime), asc(this.table.id))
        .limit(limit + 1);

      const hasNextPage = records.length > limit;
      const items = records.slice(0, limit).map(r => this.mapper.toDomain(r));

      const edges = items.map(item => ({
        node: item,
        cursor: CursorEncoder.encode({
          id: item.id,
          startTime: item.startTime,
        }),
      }));

      return {
        edges,
        nodes: items,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    },
    catch: (error) => new DatabaseError({ operation: "findByTripIdConnection", cause: error }),
  });
}
```

### GraphQL Schema Update (Pothos)

```typescript
// packages/frameworks/src/graphql/types/event.ts

export const EventType = builder.node(
  builder.objectType("Event", {
    description: "A trip event",
    interfaces: [builder.nodeInterface],
    id: { resolve: (event) => event.id },
    fields: (t) => ({
      title: t.exposeString("title"),
      description: t.exposeString("description", { nullable: true }),
      startTime: t.field({ type: "DateTime", resolve: (e) => e.startTime }),
      endTime: t.field({ type: "DateTime", resolve: (e) => e.endTime }),
    }),
  }),
);

builder.connectionObject({
  name: "EventConnection",
  type: EventType,
});
```

```typescript
// packages/frameworks/src/graphql/types/Query.ts

builder.queryField("eventsByTrip", (t) =>
  t.connection({
    type: EventType,
    args: {
      tripId: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const controller = ctx.controllers.eventController;
      return await controller.getByTripConnection({
        tripId: args.tripId,
        first: args.first,
        after: args.after,
      });
    },
  }),
);
```

---

## Testing Strategy

### Unit Tests for Each Gateway

```typescript
describe("DrizzleEventGateway.findByTripIdConnection", () => {
  it("returns first page with hasNextPage=true when more items exist", async () => {
    // Seed 25 events
    // Request first: 10
    // Expect 10 edges, hasNextPage=true
  });

  it("returns subsequent page using cursor", async () => {
    // Get first page
    // Use endCursor to fetch second page
    // Expect next 10 items
  });

  it("returns hasNextPage=false on last page", async () => {
    // Fetch all items
    // Expect hasNextPage=false
  });

  it("handles empty result", async () => {
    // Query trip with no events
    // Expect empty edges, hasNextPage=false
  });

  it("handles invalid cursor gracefully", async () => {
    // Pass invalid cursor
    // Expect appropriate error
  });
});
```

### Integration Tests (GraphQL)

```typescript
describe("Event Queries", () => {
  it("returns Relay Connection from GraphQL", async () => {
    const query = `
      query GetEvents($tripId: ID!, $first: Int!, $after: String) {
        eventsByTrip(tripId: $tripId, first: $first, after: $after) {
          edges {
            node { id title }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
    // Execute and verify structure
  });
});
```

---

## Migration Order

1. **Foundation** (Domain layer)
   - Add `Connection<T>`, `Edge<T>`, `PageInfo` interfaces
   - Add `CursorEncoder` utility

2. **Phase 1: High-Impact Gateways**
   - Event Gateway (trips can have many events)
   - Challenge Gateway (high query volume)
   - Group Gateway (can have many groups per trip)
   - Sponsor Gateway (grows over time)

3. **Phase 2: Medium-Impact Gateways**
   - Notification Gateway (user-specific, grows over time)
   - Report Gateway (moderation queries)
   - Location Gateway (can have many entries)

4. **Phase 3: Lower-Impact Gateways**
   - Trip Gateway (typically fewer trips)
   - User Gateway (admin-only queries)
   - Coin/Reward/Purchase Gateways (upgrade existing offset)

---

## Risks and Mitigations

| Risk                           | Mitigation                                           |
| ------------------------------ | ---------------------------------------------------- |
| Breaking GraphQL API changes   | Keep old resolvers during migration, use @deprecated |
| Cursor encoding issues         | Validate cursor format, return clear error messages  |
| Database performance           | Add composite indexes on (sort_field, id)            |
| Sort order instability         | Always include id as final sort field                |
| Complex filtering + pagination | Test edge cases with combined filters                |

---

## Success Criteria

1. All list-returning gateway methods have `*Connection` variant
2. All cursors are base64-encoded and contain sort fields
3. All Relay Connection responses include proper `pageInfo`
4. GraphQL schema uses standard Relay connection types
5. 100% test coverage for new pagination methods
6. No breaking changes to existing queries (during migration)
7. Performance tests confirm cursor pagination is efficient

---

## Related Documents

- `.specs/plans/relay-cursor-pagination.design.md` - Base design document
- GraphQL Relay specification: https://relay.dev/graphql/connections.htm
- **Business Analysis:** `.specs/scratchpad/business-analysis-cursor-pagination.md`

---

## Notes

- **Estimated effort:** 3-4 days for foundation + 1-2 days per gateway
- **Total gateways:** ~15 gateway implementations
- **New methods to add:** ~40-50 `*Connection` methods across all gateways
- **Tests to write:** Unit tests for each gateway + integration tests for GraphQL queries

---

## Implementation Process

This section provides detailed implementation steps for migrating all gateways to cursor-based pagination.

### Phase Overview

| Phase                        | Steps  | Purpose                                                  |
| ---------------------------- | ------ | -------------------------------------------------------- |
| **Setup**                    | S1-S3  | Prepare environment, verify tooling, document patterns   |
| **Foundational**             | F1-F5  | Create shared utilities and types used by all gateways   |
| **Entity Gateway Migration** | E1-E16 | Migrate each gateway following priority order            |
| **Polish**                   | P1-P3  | Final integration, performance validation, documentation |

---

### Setup Phase

#### S1: Verify Schema Sync Tooling

**Goal:** Ensure Pothos schema generation and GraphQL client synchronization works correctly  
**Size:** Tiny  
**Agent:** haiku  
**Depends On:** None  
**Parallel With:** S2, S3  
**Output:**

- Verified `bun sync-schema` works without errors
- Verified `bun generate:client` produces expected output
- Documented any issues found

**Success Criteria:**

- `bun sync-schema` completes without errors
- `bun generate:client` completes without errors
- Generated files exist at `packages/graphql-client/src/generated/`

**Blockers:** None  
**Risks:** Schema tooling may have existing issues requiring fixes  
**Resolution:** Document issues, create separate fix tasks if needed

### Verification

- **Level:** Per-Item
- **Type:** sdd:qa-engineer
- **Threshold:** 3.5/5.0

#### Rubric

| Criterion                             | Weight | Description                                       |
| ------------------------------------- | ------ | ------------------------------------------------- |
| bun sync-schema runs successfully     | 0.30   | Command completes without errors                  |
| bun generate:client runs successfully | 0.30   | GraphQL client generation works                   |
| Generated files exist at correct path | 0.25   | packages/graphql-client/src/generated/ has output |
| Issues are documented if found        | 0.15   | Any issues clearly documented                     |

---

#### S2: Ensure Test Coverage Baseline

**Goal:** Verify all tests pass before making changes  
**Size:** Tiny  
**Agent:** sdd:test-specialist  
**Depends On:** None  
**Parallel With:** S1, S3  
**Output:**

- Green test suite baseline
- Document any existing test failures

**Success Criteria:**

- `bun test` passes with 0 failures
- Test output shows coverage metrics

**Blockers:** None  
**Risks:** Existing test failures may block migration  
**Resolution:** Fix existing failures or document as known issues

### Verification

- **Level:** Per-Item
- **Type:** sdd:test-specialist
- **Threshold:** 3.5/5.0

#### Rubric

| Criterion                          | Weight | Description                        |
| ---------------------------------- | ------ | ---------------------------------- |
| bun test passes with 0 failures    | 0.40   | Test suite is green                |
| Test output shows coverage metrics | 0.30   | Coverage information visible       |
| Any failures are documented        | 0.20   | Known issues clearly listed        |
| Baseline is reproducible           | 0.10   | Tests pass consistently on re-runs |

---

#### S3: Document ActivityFeedGateway Reference Patterns

**Goal:** Analyze and document the existing cursor pagination implementation in ActivityFeedGateway  
**Size:** Small  
**Agent:** sdd:tech-lead  
**Depends On:** None  
**Parallel With:** S1, S2  
**Output:**

- Documented pattern analysis in scratchpad
- Identified reusable code snippets
- List of patterns to replicate across other gateways

**Success Criteria:**

- Review `packages/domain/src/activity-feed/ports/gateway.ts`
- Review `packages/use-cases/src/activity-feed/ports/gateway.ts`
- Review `packages/adapters/src/activity-feed/gateways/drizzle/gateway.ts`
- Document cursor encoding pattern, SQL structure, Connection result building
- Identify any gaps or inconsistencies in reference implementation

**Blockers:** None  
**Risks:** Reference implementation may be incomplete or inconsistent  
**Resolution:** Document gaps, fix reference implementation if critical

### Verification

- **Level:** Per-Item
- **Type:** sdd:tech-lead
- **Threshold:** 3.5/5.0

#### Rubric

| Criterion                               | Weight | Description                                |
| --------------------------------------- | ------ | ------------------------------------------ |
| ActivityFeedGateway patterns documented | 0.25   | Cursor encoding pattern described          |
| SQL structure documented                | 0.25   | WHERE clause and ORDER BY pattern captured |
| Connection result building documented   | 0.25   | Result transformation explained            |
| Reusable code snippets identified       | 0.15   | Extractable patterns listed                |
| Gaps or inconsistencies noted           | 0.10   | Any issues clearly flagged                 |

---

### Foundational Phase

#### F1: Add Domain Connection Types

**Goal:** Create shared Connection, Edge, PageInfo interfaces in Domain layer  
**Size:** Small  
**Agent:** opus  
**Depends On:** None  
**Parallel With:** F2, F4  
\*\*Output:

- `packages/domain/src/value-objects/pagination.ts` with Connection, Edge, PageInfo interfaces
- ForwardPaginationArgs, BackwardPaginationArgs interfaces

**Success Criteria:**

- File exists at `packages/domain/src/value-objects/pagination.ts`
- `Connection<T>` interface defined with edges, nodes, pageInfo, totalCount?
- `Edge<T>` interface defined with node, cursor
- `PageInfo` interface defined with hasNextPage, hasPreviousPage, startCursor, endCursor
- `ForwardPaginationArgs` with first, after fields
- All types exported from package

**Blockers:** None (can be done in parallel with F2-F5)  
**Risks:** Type definitions may not match ActivityFeedGateway patterns  
**Resolution:** Cross-reference with existing implementation, adjust as needed

### Verification

- **Level:** Panel
- **Type:** sdd:tech-lead
- **Threshold:** 4.5/5.0

#### Rubric

| Criterion                                                      | Weight | Description                                              |
| -------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| File exists at packages/domain/src/value-objects/pagination.ts | 0.15   | Correct file path                                        |
| Connection<T> interface defined correctly                      | 0.15   | Has edges, nodes, pageInfo, totalCount?                  |
| Edge<T> interface defined correctly                            | 0.15   | Has node, cursor fields                                  |
| PageInfo interface defined correctly                           | 0.15   | Has hasNextPage, hasPreviousPage, startCursor, endCursor |
| ForwardPaginationArgs interface defined                        | 0.15   | Has first, after fields                                  |
| All types exported from package                                | 0.15   | Exports visible at package level                         |
| Types compatible with ActivityFeedGateway                      | 0.10   | Cross-reference with existing implementation             |

---

#### F2: Create CursorEncoder Utility

**Goal:** Implement shared cursor encoding/decoding utility  
**Size:** Small  
**Agent:** opus  
**Depends On:** None  
**Parallel With:** F1, F4  
\*\*Output:

- `packages/use-cases/src/system/utils/cursor.ts`
- encodeCursor() and decodeCursor() functions
- Unit tests for encoding/decoding

**Success Criteria:**

- File exists at `packages/use-cases/src/system/utils/cursor.ts`
- `encodeCursor(data: CursorData): string` using base64url encoding
- `decodeCursor(cursor: string): CursorData | null` with error handling
- Interface `CursorData { id: string; createdAt: string; [key: string]: unknown }`
- Unit tests pass:
  - Encoding/decoding round-trip
  - Invalid cursor returns null (not throws)
  - Malformed base64 handled gracefully
  - JSON parsing errors handled gracefully

**Blockers:** None (can be done in parallel with F1, F3-F5)  
**Risks:** Base64url encoding choice may have edge cases  
**Resolution:** Follow ActivityFeedGateway pattern exactly

### Verification

- **Level:** Panel
- **Type:** sdd:qa-engineer
- **Threshold:** 4.5/5.0

#### Rubric

| Criterion                                                    | Weight | Description                                               |
| ------------------------------------------------------------ | ------ | --------------------------------------------------------- |
| File exists at packages/use-cases/src/system/utils/cursor.ts | 0.15   | Correct file path                                         |
| encodeCursor() uses base64url encoding                       | 0.15   | Proper encoding algorithm                                 |
| decodeCursor() has error handling                            | 0.20   | Returns null for invalid cursors, not throws              |
| CursorData interface defined                                 | 0.10   | Has id: string, createdAt: string, [key: string]: unknown |
| Unit tests for encoding/decoding round-trip                  | 0.15   | Tests verify correct encode/decode                        |
| Invalid cursor returns null                                  | 0.10   | Malformed base64 handled gracefully                       |
| JSON parsing errors handled                                  | 0.10   | Graceful error handling                                   |
| Malformed input handled gracefully                           | 0.05   | Edge cases covered                                        |

---

#### F3: Add Use Case Pagination Types

**Goal:** Add pagination argument types and re-export cursor utilities  
**Size:** Small  
**Agent:** sonnet  
**Depends On:** F1, F2  
**Parallel With:** None  
**Output:**

- `packages/use-cases/src/system/ports/pagination.ts` with pagination types
- Re-export of cursor utilities from use-cases index

**Success Criteria:**

- File exists at `packages/use-cases/src/system/ports/pagination.ts`
- `CursorPaginationOptions` interface with limit, cursor?
- `CursorPaginatedResult<T>` interface with items, nextCursor?, hasMore
- Re-export encodeCursor, decodeCursor from use-cases
- Types compatible with Domain Connection types

**Blockers:** F1, F2  
**Risks:** Type mismatches between layers  
**Resolution:** Verify type compatibility across layers

### Verification

- **Level:** Panel
- **Type:** sdd:tech-lead
- **Threshold:** 4.5/5.0

#### Rubric

| Criterion                                                        | Weight | Description                                         |
| ---------------------------------------------------------------- | ------ | --------------------------------------------------- |
| File exists at packages/use-cases/src/system/ports/pagination.ts | 0.15   | Correct file path                                   |
| CursorPaginationOptions interface defined                        | 0.20   | Has limit, cursor? fields                           |
| CursorPaginatedResult<T> interface defined                       | 0.20   | Has items, nextCursor?, hasMore                     |
| Cursor utilities re-exported                                     | 0.15   | encodeCursor, decodeCursor available from use-cases |
| Types compatible with Domain Connection types                    | 0.20   | Type compatibility verified                         |
| Layer bridge works correctly                                     | 0.10   | Domain -> Use Cases -> Adapters types align         |

---

#### F4: Create Database Composite Indexes

**Goal:** Add database indexes for cursor pagination performance  
**Size:** Small  
**Agent:** sdd:database-specialist  
**Depends On:** None  
**Parallel With:** F1, F2  
\*\*Output:

- Drizzle migration files for composite indexes
- Indexes on `(createdAt, id)`, `(startTime, id)`, etc.

**Success Criteria:**

- Migration file created for each table needing index
- Events table: index on `(startTime, id)`
- Challenges table: index on `(createdAt, id)`
- Notifications table: index on `(createdAt, id)`
- Groups table: index on `(createdAt, id)`
- Sponsors table: index on `(createdAt, id)`
- Other tables as needed per entity
- Migration applies successfully with `bun migrate`

**Blockers:** None (database change, can be done early)  
**Risks:** Index creation on large tables may be slow  
**Resolution:** Plan for off-peak deployment, use CONCURRENTLY if needed

### Verification

- **Level:** Panel
- **Type:** sdd:database-specialist
- **Threshold:** 4.5/5.0

#### Rubric

| Criterion                                      | Weight | Description                      |
| ---------------------------------------------- | ------ | -------------------------------- |
| Migration file created for events table        | 0.15   | Index on (startTime, id) exists  |
| Migration file created for challenges table    | 0.15   | Index on (createdAt, id) exists  |
| Migration file created for notifications table | 0.15   | Index on (createdAt, id) exists  |
| Migration file created for groups table        | 0.15   | Index on (createdAt, id) exists  |
| Migration file created for sponsors table      | 0.15   | Index on (createdAt, id) exists  |
| Migration applies with bun migrate             | 0.15   | No errors on migration execution |
| Other paginated tables have indexes            | 0.10   | Comprehensive index coverage     |

---

#### F5: Create GraphQL Connection Helpers

**Goal:** Add shared helpers for GraphQL connection resolvers  
**Size:** Small  
**Agent:** opus  
**Depends On:** F1, F2  
**Parallel With:** F3  
**Output:**

- `packages/frameworks/src/graphql/utils/connections.ts`
- Helper functions for encoding/decoding cursors in resolvers
- PageInfo builder

**Success Criteria:**

- File exists at `packages/frameworks/src/graphql/utils/connections.ts`
- `decodeCursorWithDate(cursor: string | null | undefined): CursorData | null`
- `buildConnectionResponse(items, hasMore, encodeFn): ConnectionResult`
- `buildPageInfo(edges, hasNextPage, hasPreviousPage): PageInfo`
- Functions tested and working

**Blockers:** F1, F2  
**Risks:** GraphQL utility patterns may conflict with Pothos Relay plugin  
**Resolution:** Verify compatibility with existing Pothos configuration

### Verification

- **Level:** Panel
- **Type:** sdd:tech-lead
- **Threshold:** 4.5/5.0

#### Rubric

| Criterion                                                           | Weight | Description                                            |
| ------------------------------------------------------------------- | ------ | ------------------------------------------------------ | ---- | --------- |
| File exists at packages/frameworks/src/graphql/utils/connections.ts | 0.15   | Correct file path                                      |
| decodeCursorWithDate() function defined                             | 0.20   | Handles cursor: string                                 | null | undefined |
| buildConnectionResponse() helper defined                            | 0.20   | Builds Connection result from items, hasMore, encodeFn |
| buildPageInfo() helper defined                                      | 0.20   | Creates PageInfo with correct fields                   |
| Functions tested and working                                        | 0.15   | Unit tests pass                                        |
| Compatible with Pothos Relay plugin                                 | 0.10   | No conflicts with existing Pothos config               |

---

### Entity Gateway Migration - Phase 1: High-Impact

#### E1: EventGateway Cursor Pagination

**Goal:** Add cursor-based pagination to EventGateway (findByTripId, findUpcomingByTripId, findOngoingByTripId, findPastByTripId)  
**Size:** Medium  
**Agent:** opus  
**Depends On:** F1, F2, F3, F5  
**Parallel With:** E2, E3, E4  
\*\*Subtasks:

1. **Domain:** Add Connection methods to EventGateway interface
2. **Use Cases:** Update Context.Tag, re-export utilities
3. **Adapter (Drizzle):** Implement \*Connection methods with SQL
4. **Adapter (In-Memory):** Implement \*Connection methods with array slicing
5. **GraphQL:** Add EventConnection type, update resolvers
6. **Tests:** Unit tests for all pagination methods, integration tests

**Output:**

- `packages/domain/src/event/ports/gateway.ts` with \*Connection methods
- `packages/use-cases/src/event/ports/gateway.ts` updated
- `packages/adapters/src/event/gateways/drizzle/gateway.ts` with implementations
- `packages/adapters/src/event/gateways/in-memory/gateway.ts` with implementations
- `packages/frameworks/src/graphql/types/event.ts` with connection types
- `packages/frameworks/src/graphql/resolvers/event.ts` with updated queries
- Test files with comprehensive coverage

**Success Criteria:**

- Domain port has `findByTripIdConnection`, `findUpcomingByTripIdConnection`, `findOngoingByTripIdConnection`, `findPastByTripIdConnection`
- Each method returns `Effect<ConnectionResult<Event>, DatabaseError, never>`
- Existing methods marked with `@deprecated`
- Drizzle implementation uses `(startTime, id) > (cursor.startTime, cursor.id)` WHERE clause
- Drizzle implementation uses `ORDER BY startTime, id` with `LIMIT first + 1`
- In-memory implementation sorts by startTime, then id, then slices
- GraphQL schema has EventConnection type
- GraphQL resolver uses `t.connection()` field builder
- Unit tests pass:
  - Empty result returns empty edges, hasNextPage=false
  - First page with more items has hasNextPage=true
  - Subsequent page uses cursor correctly
  - Last page has hasNextPage=false
  - Invalid cursor handled gracefully
- Integration test: GraphQL query returns proper Connection structure

**Blockers:** F1, F2, F3, F5  
**Risks:** Event sorting may be complex (startTime vs createdAt)  
**Resolution:** Use startTime as primary sort field (matches business logic)

### Verification

- **Level:** Panel
- **Type:** opus
- **Threshold:** 4.5/5.0

#### Rubric

| Criterion                                                                 | Weight | Description                                                                                                       |
| ------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| Domain port has 4 Connection methods                                      | 0.15   | findByTripIdConnection, findUpcomingByTripIdConnection, findOngoingByTripIdConnection, findPastByTripIdConnection |
| Each method returns Effect<ConnectionResult<Event>, DatabaseError, never> | 0.15   | Correct return type signature                                                                                     |
| Existing methods marked @deprecated                                       | 0.10   | JSDoc @deprecated annotation present                                                                              |
| Drizzle uses (startTime, id) WHERE clause                                 | 0.15   | Correct cursor comparison pattern                                                                                 |
| Drizzle uses ORDER BY startTime, id with LIMIT first + 1                  | 0.15   | Correct pagination query pattern                                                                                  |
| In-memory sorts by startTime, then id, then slices                        | 0.10   | Array-based pagination works                                                                                      |
| GraphQL schema has EventConnection type                                   | 0.10   | Pothos connection type defined                                                                                    |
| GraphQL resolver uses t.connection()                                      | 0.05   | Field builder pattern correct                                                                                     |
| All unit tests pass                                                       | 0.05   | 6 test scenarios pass                                                                                             |

---

#### E2: ChallengeGateway Cursor Pagination

**Goal:** Add cursor-based pagination to ChallengeGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** F1, F2, F3, F5  
**Parallel With:** E1, E3, E4  
\*\*Subtasks:

1. **Domain:** Add Connection methods to interface (findByTripIdConnection, findByStatusConnection, findActiveConnection, etc.)
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement with (createdAt, id) sorting
4. **Adapter (In-Memory):** Implement array pagination
5. **GraphQL:** ChallengeConnection type and resolvers
6. **Tests:** Unit and integration tests

**Output:**

- Domain port with 7+ new Connection methods
- Full adapter implementations
- GraphQL schema updates
- Comprehensive tests

**Success Criteria:**

- All list-returning methods have Connection variants
- Methods: findByTripIdConnection, findByStatusConnection, findByTripIdAndStatusConnection, findBySubmissionTypeConnection, findByScoringCategoryConnection, findActiveConnection, findOpenForSubmissionConnection, findRecurringConnection
- Uses `(createdAt, id)` sort pattern
- Existing methods marked `@deprecated`
- All tests pass

**Blockers:** F1, F2, F3, F5  
**Risks:** Challenge filtering may be complex combined with pagination  
**Resolution:** Implement basic pagination first, filtering as separate concern

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                             | Weight | Description                                         |
| ------------------------------------- | ------ | --------------------------------------------------- |
| Domain port has 7+ Connection methods | 0.20   | All list-returning methods have Connection variants |
| findByTripIdConnection exists         | 0.10   | Correct method name and signature                   |
| findByStatusConnection exists         | 0.10   | Status filter with pagination                       |
| findActiveConnection exists           | 0.10   | Active filter with pagination                       |
| Uses (createdAt, id) sort pattern     | 0.15   | Composite sort with id tiebreaker                   |
| Existing methods marked @deprecated   | 0.10   | Backward compatibility preserved                    |
| Tests pass for all 7 methods          | 0.15   | Unit and integration tests green                    |
| GraphQL types updated                 | 0.10   | ChallengeConnection type defined                    |

---

#### E3: NotificationGateway Cursor Pagination

**Goal:** Add cursor-based pagination to NotificationGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** F1, F2, F3, F5  
**Parallel With:** E1, E2, E4  
**Subtasks:**

1. **Domain:** Add findByUserIdConnection, findUnreadByUserIdConnection
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement with (createdAt, id) sorting
4. **Adapter (In-Memory):** Implement array pagination
5. **GraphQL:** NotificationConnection type and resolvers
6. **Tests:** Unit and integration tests

**Output:**

- Domain port with Connection methods
- Adapter implementations
- GraphQL updates
- Tests

**Success Criteria:**

- Methods: findByUserIdConnection, findUnreadByUserIdConnection
- Unread filter works with pagination
- Uses `(createdAt, id)` sort
- Existing methods marked `@deprecated`
- Tests cover unread + pagination combination

**Blockers:** F1, F2, F3, F5  
**Risks:** Unread filter combined with pagination needs careful testing  
**Resolution:** Test edge case where unread status changes during pagination

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                    | Weight | Description                         |
| -------------------------------------------- | ------ | ----------------------------------- |
| Domain port has findByUserIdConnection       | 0.20   | Correct method signature            |
| Domain port has findUnreadByUserIdConnection | 0.20   | Unread filter with pagination       |
| Unread filter works with pagination          | 0.15   | Combined filter + cursor works      |
| Uses (createdAt, id) sort                    | 0.15   | Standard sort pattern               |
| Existing methods marked @deprecated          | 0.10   | Backward compatibility              |
| Tests cover unread + pagination              | 0.15   | Edge cases tested                   |
| GraphQL types updated                        | 0.05   | NotificationConnection type defined |

---

#### E4: GroupGateway Cursor Pagination

**Goal:** Add cursor-based pagination to GroupGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** F1, F2, F3, F5  
**Parallel With:** E1, E2, E3  
**Subtasks:**

1. **Domain:** Add findByTripIdConnection, findByStatusConnection, findByTripIdAndStatusConnection, findByOrganizerIdConnection
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement with (createdAt, id) sorting
4. **Adapter (In-Memory):** Implement array pagination
5. **GraphQL:** GroupConnection type and resolvers
6. **Tests:** Unit and integration tests

**Output:**

- Domain port with Connection methods
- Adapter implementations
- GraphQL updates
- Tests

**Success Criteria:**

- Methods: findByTripIdConnection, findByStatusConnection, findByTripIdAndStatusConnection, findByOrganizerIdConnection
- Status filter works with pagination
- Uses `(createdAt, id)` sort
- Existing methods marked `@deprecated`
- All tests pass

**Blockers:** F1, F2, F3, F5  
**Risks:** Multiple filter combinations may create complexity  
**Resolution:** Test each filter + pagination combination separately

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                   | Weight | Description                      |
| ------------------------------------------- | ------ | -------------------------------- |
| Domain port has findByTripIdConnection      | 0.20   | Correct method signature         |
| Domain port has findByStatusConnection      | 0.20   | Status filter with pagination    |
| Domain port has findByOrganizerIdConnection | 0.15   | Organizer filter with pagination |
| Status filter works with pagination         | 0.15   | Combined filter + cursor works   |
| Uses (createdAt, id) sort                   | 0.15   | Standard sort pattern            |
| Existing methods marked @deprecated         | 0.10   | Backward compatibility           |
| Tests pass                                  | 0.05   | Unit and integration tests green |

---

### Entity Gateway Migration - Phase 2: Medium-Impact

#### E5: SponsorGateway Cursor Pagination

**Goal:** Add cursor-based pagination to SponsorGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** E1, E2, E3, E4  
**Parallel With:** E6, E7, E8, E9, E10  
**Subtasks:**

1. **Domain:** Add findActiveConnection, findByTripIdConnection
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement
4. **Adapter (In-Memory):** Implement
5. **GraphQL:** SponsorConnection type and resolvers
6. **Tests:** Unit and integration tests

**Success Criteria:**

- Methods: findActiveConnection, findByTripIdConnection
- Active filter works with pagination
- Uses `(createdAt, id)` sort
- Existing methods marked `@deprecated`
- Tests pass

**Blockers:** E1-E4 (recommended to complete Phase 1 first for pattern stability)  
**Risks:** Lower priority entity, may have unique requirements  
**Resolution:** Follow established patterns from Phase 1

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                              | Weight | Description                      |
| -------------------------------------- | ------ | -------------------------------- |
| Domain port has findActiveConnection   | 0.25   | Correct method signature         |
| Domain port has findByTripIdConnection | 0.25   | Correct method signature         |
| Active filter works with pagination    | 0.20   | Combined filter + cursor works   |
| Uses (createdAt, id) sort              | 0.15   | Standard sort pattern            |
| Existing methods marked @deprecated    | 0.10   | Backward compatibility           |
| Tests pass                             | 0.05   | Unit and integration tests green |

---

#### E6: LocationGateway Cursor Pagination

**Goal:** Add cursor-based pagination to LocationGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** E1, E2, E3, E4  
**Parallel With:** E5, E7, E8, E9, E10  
**Subtasks:**

1. **Domain:** Add findSharingWithUserConnection, findByUserIdsConnection
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement
4. **Adapter (In-Memory):** Implement
5. **GraphQL:** LocationConnection type and resolvers
6. **Tests:** Unit and integration tests

**Success Criteria:**

- Methods: findSharingWithUserConnection, findByUserIdsConnection
- Uses `(createdAt, id)` sort
- Existing methods marked `@deprecated`
- Tests pass

**Blockers:** E1-E4  
**Risks:** May have different sort requirements (location-based?)  
**Resolution:** Use standard (createdAt, id) unless specified otherwise

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                     | Weight | Description                      |
| --------------------------------------------- | ------ | -------------------------------- |
| Domain port has findSharingWithUserConnection | 0.25   | Correct method signature         |
| Domain port has findByUserIdsConnection       | 0.25   | Correct method signature         |
| Uses (createdAt, id) sort                     | 0.20   | Standard sort pattern            |
| Existing methods marked @deprecated           | 0.15   | Backward compatibility           |
| Tests pass                                    | 0.15   | Unit and integration tests green |

---

#### E7: SubmissionReportGateway Cursor Pagination

**Goal:** Add cursor-based pagination to SubmissionReportGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** E1, E2, E3, E4  
**Parallel With:** E5, E6, E8, E9, E10  
**Subtasks:**

1. **Domain:** Add findBySubmissionIdConnection, findByReporterIdConnection, findByReasonConnection
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement
4. **Adapter (In-Memory):** Implement
5. **GraphQL:** SubmissionReportConnection type and resolvers
6. **Tests:** Unit and integration tests

**Success Criteria:**

- Methods: findBySubmissionIdConnection, findByReporterIdConnection, findByReasonConnection
- Reason filter works with pagination
- Uses `(createdAt, id)` sort
- Existing methods marked `@deprecated`
- Tests pass

**Blockers:** E1-E4  
**Risks:** Moderation use case may need special handling  
**Resolution:** Follow standard patterns, add moderation-specific tests

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                    | Weight | Description                    |
| -------------------------------------------- | ------ | ------------------------------ |
| Domain port has findBySubmissionIdConnection | 0.20   | Correct method signature       |
| Domain port has findByReporterIdConnection   | 0.20   | Correct method signature       |
| Domain port has findByReasonConnection       | 0.20   | Correct method signature       |
| Reason filter works with pagination          | 0.15   | Combined filter + cursor works |
| Uses (createdAt, id) sort                    | 0.15   | Standard sort pattern          |
| Existing methods marked @deprecated          | 0.10   | Backward compatibility         |

---

#### E8: ChallengeSubmissionGateway Cursor Pagination

**Goal:** Add cursor-based pagination to ChallengeSubmissionGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** E1, E2, E3, E4  
**Parallel With:** E5, E6, E7, E9, E10  
**Subtasks:**

1. **Domain:** Add Connection methods
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement
4. **Adapter (In-Memory):** Implement
5. **GraphQL:** ChallengeSubmissionConnection type and resolvers
6. **Tests:** Unit and integration tests

**Success Criteria:**

- All list-returning methods have Connection variants
- Uses `(createdAt, id)` or `(voteScore, id)` sort depending on method
- Existing methods marked `@deprecated`
- Tests pass including voteScore sorting

**Blockers:** E1-E4  
**Risks:** May have special sorting by voteScore  
**Resolution:** Support multiple cursor types if needed (createdAt vs voteScore)

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                           | Weight | Description                         |
| --------------------------------------------------- | ------ | ----------------------------------- |
| All list-returning methods have Connection variants | 0.30   | Complete coverage                   |
| Uses (createdAt, id) or (voteScore, id) sort        | 0.25   | Sort pattern matches method purpose |
| voteScore sorting tested if applicable              | 0.20   | Special sorting verified            |
| Existing methods marked @deprecated                 | 0.15   | Backward compatibility              |
| Tests pass including voteScore sorting              | 0.10   | Unit tests green                    |

---

#### E9: ChallengeVoteGateway Cursor Pagination

**Goal:** Add cursor-based pagination to ChallengeVoteGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** E1, E2, E3, E4  
**Parallel With:** E5, E6, E7, E8, E10  
**Subtasks:**

1. **Domain:** Add Connection methods
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement
4. **Adapter (In-Memory):** Implement
5. **GraphQL:** ChallengeVoteConnection type and resolvers
6. **Tests:** Unit and integration tests

**Success Criteria:**

- All list-returning methods have Connection variants
- Uses standard sort pattern
- Existing methods marked `@deprecated`
- Tests pass

**Blockers:** E1-E4  
**Risks:** High volume during voting periods  
**Resolution:** Ensure index on (createdAt, id) for performance

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                           | Weight | Description                      |
| --------------------------------------------------- | ------ | -------------------------------- |
| All list-returning methods have Connection variants | 0.30   | Complete coverage                |
| Uses standard sort pattern                          | 0.20   | (createdAt, id) sort             |
| Existing methods marked @deprecated                 | 0.20   | Backward compatibility           |
| Tests pass                                          | 0.20   | Unit and integration tests green |
| Index exists for performance                        | 0.10   | (createdAt, id) index verified   |

---

#### E10: TripGateway Cursor Pagination

**Goal:** Add cursor-based pagination to TripGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** E1, E2, E3, E4  
**Parallel With:** E5, E6, E7, E8, E9  
**Subtasks:**

1. **Domain:** Add findByStatusConnection, findActiveConnection
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement
4. **Adapter (In-Memory):** Implement
5. **GraphQL:** TripConnection type and resolvers
6. **Tests:** Unit and integration tests

**Success Criteria:**

- Methods: findByStatusConnection, findActiveConnection
- Status filter works with pagination
- Uses `(createdAt, id)` sort
- Existing methods marked `@deprecated`
- Tests pass

**Blockers:** E1-E4  
**Risks:** Trip Gateway may have findAll offset pagination to migrate  
**Resolution:** Also migrate offset-based findAll to cursor-based

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                              | Weight | Description                        |
| -------------------------------------- | ------ | ---------------------------------- |
| Domain port has findByStatusConnection | 0.25   | Correct method signature           |
| Domain port has findActiveConnection   | 0.25   | Correct method signature           |
| Status filter works with pagination    | 0.20   | Combined filter + cursor works     |
| Uses (createdAt, id) sort              | 0.15   | Standard sort pattern              |
| Existing methods marked @deprecated    | 0.10   | Backward compatibility             |
| findAll offset pagination migrated     | 0.05   | Offset-based findAll also migrated |

---

### Entity Gateway Migration - Phase 3: Lower-Impact

#### E11: UserGateway Cursor Pagination

**Goal:** Add cursor-based pagination to UserGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** E1, E2, E3, E4, E5, E6, E7, E8, E9, E10  
**Parallel With:** E12, E13, E14, E15  
**Subtasks:**

1. **Domain:** Add findAllConnection, findByRoleConnection
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement
4. **Adapter (In-Memory):** Implement
5. **GraphQL:** UserConnection type and resolvers
6. **Tests:** Unit and integration tests

**Success Criteria:**

- Methods: findAllConnection, findByRoleConnection
- Role filter works with pagination
- Uses `(createdAt, id)` sort
- Migrate existing offset-based findAll
- Existing methods marked `@deprecated`
- Tests pass

**Blockers:** E1-E10 (Phase 2)  
**Risks:** Admin-only use case, lower priority  
**Resolution:** Follow standard patterns

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                              | Weight | Description                    |
| -------------------------------------- | ------ | ------------------------------ |
| Domain port has findAllConnection      | 0.25   | Correct method signature       |
| Domain port has findByRoleConnection   | 0.25   | Correct method signature       |
| Role filter works with pagination      | 0.20   | Combined filter + cursor works |
| Uses (createdAt, id) sort              | 0.15   | Standard sort pattern          |
| Existing offset-based findAll migrated | 0.10   | Offset migrated to cursor      |
| Existing methods marked @deprecated    | 0.05   | Backward compatibility         |

---

#### E12: RewardGateway Cursor Pagination

**Goal:** Add cursor-based pagination to RewardGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** E1, E2, E3, E4, E5, E6, E7, E8, E9, E10  
**Parallel With:** E11, E13, E14, E15  
**Subtasks:**

1. **Domain:** Add findByTripIdConnection, findVisibleByTripIdConnection
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement
4. **Adapter (In-Memory):** Implement
5. **GraphQL:** RewardConnection type and resolvers
6. **Tests:** Unit and integration tests

**Success Criteria:**

- Methods: findByTripIdConnection, findVisibleByTripIdConnection
- Visibility filter works with pagination
- Migrate from existing PaginatedResult to ConnectionResult
- Uses `(createdAt, id)` sort
- Tests pass

**Blockers:** E1-E10  
**Risks:** May have existing PaginatedResult type to migrate  
**Resolution:** Maintain backward compatibility during migration

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                     | Weight | Description                      |
| --------------------------------------------- | ------ | -------------------------------- |
| Domain port has findByTripIdConnection        | 0.25   | Correct method signature         |
| Domain port has findVisibleByTripIdConnection | 0.25   | Correct method signature         |
| Visibility filter works with pagination       | 0.20   | Combined filter + cursor works   |
| PaginatedResult migrated to ConnectionResult  | 0.15   | Type migration complete          |
| Uses (createdAt, id) sort                     | 0.10   | Standard sort pattern            |
| Tests pass                                    | 0.05   | Unit and integration tests green |

---

#### E13: RewardPurchaseGateway Cursor Pagination

**Goal:** Add cursor-based pagination to RewardPurchaseGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** E1, E2, E3, E4, E5, E6, E7, E8, E9, E10  
**Parallel With:** E11, E12, E14, E15  
**Subtasks:**

1. **Domain:** Add findByRewardIdConnection, findByGroupIdConnection, findByTripIdConnection
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement
4. **Adapter (In-Memory):** Implement
5. **GraphQL:** RewardPurchaseConnection type and resolvers
6. **Tests:** Unit and integration tests

**Success Criteria:**

- All three methods have Connection variants
- Uses `(createdAt, id)` sort
- Existing methods marked `@deprecated`
- Tests pass

**Blockers:** E1-E10  
**Risks:** Transactional entity, may have different sorting needs  
**Resolution:** Use (createdAt, id) as standard

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                  | Weight | Description                                                               |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------- |
| All three methods have Connection variants | 0.30   | findByRewardIdConnection, findByGroupIdConnection, findByTripIdConnection |
| Uses (createdAt, id) sort                  | 0.25   | Standard sort pattern                                                     |
| Existing methods marked @deprecated        | 0.20   | Backward compatibility                                                    |
| Tests pass                                 | 0.25   | Unit and integration tests green                                          |

---

#### E14: CoinTransactionGateway Cursor Pagination

**Goal:** Migrate existing offset pagination to cursor-based  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** E1, E2, E3, E4, E5, E6, E7, E8, E9, E10  
**Parallel With:** E11, E12, E13, E15  
**Subtasks:**

1. **Domain:** Add findManyConnection (replacing findMany with offset)
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement cursor-based
4. **Adapter (In-Memory):** Implement cursor-based
5. **GraphQL:** CoinTransactionConnection type and resolvers
6. **Tests:** Unit and integration tests

**Success Criteria:**

- Method: findManyConnection with cursor-based pagination
- Filter support preserved
- Uses `(createdAt, id)` sort
- Existing offset method marked `@deprecated`
- Tests pass

**Blockers:** E1-E10  
**Risks:** Existing offset pagination has complex filters  
**Resolution:** Ensure filter + cursor combination works correctly

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                 | Weight | Description                      |
| ----------------------------------------- | ------ | -------------------------------- |
| Domain port has findManyConnection        | 0.25   | Replaces findMany with offset    |
| Filter support preserved                  | 0.25   | Complex filters still work       |
| Uses (createdAt, id) sort                 | 0.20   | Standard sort pattern            |
| Existing offset method marked @deprecated | 0.15   | Backward compatibility           |
| Tests pass                                | 0.15   | Unit and integration tests green |

---

#### E15: NotificationPreferenceGateway Cursor Pagination

**Goal:** Add cursor-based pagination to NotificationPreferenceGateway  
**Size:** Medium  
**Agent:** sonnet  
**Depends On:** E1, E2, E3, E4, E5, E6, E7, E8, E9, E10  
**Parallel With:** E11, E12, E13, E14  
**Subtasks:**

1. **Domain:** Add Connection methods
2. **Use Cases:** Update Context.Tag
3. **Adapter (Drizzle):** Implement
4. **Adapter (In-Memory):** Implement
5. **GraphQL:** NotificationPreferenceConnection type and resolvers
6. **Tests:** Unit and integration tests

**Success Criteria:**

- All list-returning methods have Connection variants
- Uses `(createdAt, id)` sort
- Existing methods marked `@deprecated`
- Tests pass

**Blockers:** E1-E10  
**Risks:** Lower priority, may be deferred  
**Resolution:** Complete if time allows, otherwise document as Phase 4

### Verification

- **Level:** Per-Item
- **Type:** sonnet
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                           | Weight | Description                      |
| --------------------------------------------------- | ------ | -------------------------------- |
| All list-returning methods have Connection variants | 0.35   | Complete coverage                |
| Uses (createdAt, id) sort                           | 0.25   | Standard sort pattern            |
| Existing methods marked @deprecated                 | 0.25   | Backward compatibility           |
| Tests pass                                          | 0.15   | Unit and integration tests green |

---

#### E16: Final Cleanup and Consistency Check

**Goal:** Verify all gateways follow consistent patterns  
**Size:** Medium  
**Agent:** sdd:tech-lead  
**Depends On:** E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15  
**Parallel With:** None  
\*\*Output:

- Consistency audit report
- List of any deviations or issues
- Fixes for any inconsistencies found

**Success Criteria:**

- All 16 gateways have Connection methods
- All methods follow naming convention: `find*Connection`
- All cursors use base64url encoding
- All sorts include `id` as tiebreaker
- All existing methods have `@deprecated` JSDoc
- No duplicate or missing implementations

**Blockers:** E1-E15  
**Risks:** Inconsistencies may be found requiring fixes  
**Resolution:** Fix any issues, document intentional deviations

### Verification

- **Level:** Panel
- **Type:** sdd:tech-lead
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                               | Weight | Description                                 |
| --------------------------------------- | ------ | ------------------------------------------- |
| All 16 gateways have Connection methods | 0.20   | Complete coverage                           |
| Naming convention verified              | 0.15   | All methods follow find\*Connection pattern |
| Cursor encoding consistent              | 0.15   | All cursors use base64url encoding          |
| Sort pattern consistent                 | 0.15   | All sorts include id as tiebreaker          |
| @deprecated markers present             | 0.15   | All existing methods have JSDoc             |
| No duplicate or missing implementations | 0.15   | Consistency audit passed                    |
| Deviations documented                   | 0.05   | Intentional differences explained           |

---

### Polish Phase

#### P1: Integration Testing Suite

**Goal:** Comprehensive end-to-end tests for all pagination flows  
**Size:** Medium  
**Agent:** sdd:test-specialist  
**Depends On:** E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15, E16  
**Parallel With:** P3  
\*\*Output:

- Integration test file for each entity
- Tests covering GraphQL queries with pagination
- Tests for pagination + filtering combinations

**Success Criteria:**

- Test file exists for each entity gateway
- Tests verify GraphQL Connection structure:
  - edges array with node and cursor
  - nodes array
  - pageInfo with hasNextPage, hasPreviousPage, startCursor, endCursor
- Tests verify cursor-based pagination:
  - First page returns proper hasNextPage
  - Second page using endCursor returns correct items
  - Last page returns hasNextPage=false
- Tests verify error handling:
  - Invalid cursor returns proper error
  - Empty result returns empty edges
- All integration tests pass

**Blockers:** E1-E16  
**Risks:** Integration tests may reveal issues not caught in unit tests  
**Resolution:** Fix any issues found

### Verification

- **Level:** Panel
- **Type:** sdd:test-specialist
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                 | Weight | Description                             |
| ----------------------------------------- | ------ | --------------------------------------- |
| Test file exists for each entity gateway  | 0.15   | 16 test files present                   |
| Tests verify GraphQL Connection structure | 0.20   | edges, nodes, pageInfo correct          |
| Tests verify cursor-based pagination      | 0.20   | First page, subsequent pages, last page |
| Tests verify error handling               | 0.20   | Invalid cursor, empty result handled    |
| Tests cover pagination + filtering        | 0.15   | Combined scenarios tested               |
| All integration tests pass                | 0.10   | Test suite green                        |

---

#### P2: Performance Validation

**Goal:** Verify cursor pagination performance meets requirements  
**Size:** Small  
**Agent:** sdd:database-specialist  
**Depends On:** E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15, E16, F4  
**Parallel With:** None  
\*\*Output:

- Performance test results
- Query timing analysis
- Index usage verification

**Success Criteria:**

- Query execution time < 100ms for 100-item pages
- Query execution time < 200ms for 1000-item datasets
- EXPLAIN ANALYZE shows index usage on composite (sortField, id)
- No sequential scans on paginated queries
- Comparison with old offset pagination shows improvement or parity

**Blockers:** E1-E16, database indexes (F4)  
**Risks:** Performance may not meet targets  
**Resolution:** Add additional indexes, optimize queries, document limitations

### Verification

- **Level:** Panel
- **Type:** sdd:database-specialist
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                                      | Weight | Description                          |
| -------------------------------------------------------------- | ------ | ------------------------------------ |
| Query execution time < 100ms for 100-item pages                | 0.25   | Performance target met               |
| Query execution time < 200ms for 1000-item datasets            | 0.25   | Performance target met               |
| EXPLAIN ANALYZE shows index usage on composite (sortField, id) | 0.25   | Index usage verified                 |
| No sequential scans on paginated queries                       | 0.15   | Query optimization confirmed         |
| Comparison with offset pagination documented                   | 0.10   | Performance improvement/parity shown |

---

#### P3: Documentation and Deprecation Guide

**Goal:** Document the new pagination patterns and migration guide  
**Size:** Small  
**Agent:** haiku  
**Depends On:** E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15, E16  
**Parallel With:** P1  
\*\*Output:

- Updated API documentation
- Migration guide for frontend/mobile teams
- Deprecation timeline

**Success Criteria:**

- Documentation explains Relay Connection specification
- Examples of GraphQL queries with pagination
- Code examples for consuming paginated endpoints
- Deprecation guide with timeline for old methods
- Changelog entry for the feature

**Blockers:** E1-E16  
**Risks:** Documentation may become outdated  
**Resolution:** Add to ongoing maintenance tasks

### Verification

- **Level:** Panel
- **Type:** sdd:tech-lead
- **Threshold:** 4.0/5.0

#### Rubric

| Criterion                                             | Weight | Description                 |
| ----------------------------------------------------- | ------ | --------------------------- |
| Documentation explains Relay Connection specification | 0.25   | Clear explanation of spec   |
| GraphQL query examples with pagination                | 0.25   | Practical examples provided |
| Code examples for consuming paginated endpoints       | 0.20   | Client usage demonstrated   |
| Deprecation guide with timeline                       | 0.20   | Migration path documented   |
| Changelog entry added                                 | 0.10   | Version history updated     |

---

## Implementation Summary Table

| Step | Phase            | Goal                                     | Size   | Priority | Subtasks | Blockers   |
| ---- | ---------------- | ---------------------------------------- | ------ | -------- | -------- | ---------- |
| S1   | Setup            | Verify schema sync tooling               | Tiny   | Critical | 1        | None       |
| S2   | Setup            | Ensure test baseline                     | Tiny   | Critical | 1        | None       |
| S3   | Setup            | Document reference patterns              | Small  | High     | 2        | None       |
| F1   | Foundational     | Domain Connection types                  | Small  | Critical | 2        | None       |
| F2   | Foundational     | CursorEncoder utility                    | Small  | Critical | 2        | None       |
| F3   | Foundational     | Use case pagination types                | Small  | Critical | 2        | F1, F2     |
| F4   | Foundational     | Database composite indexes               | Small  | High     | 2        | None       |
| F5   | Foundational     | GraphQL connection helpers               | Small  | Critical | 2        | F1, F2     |
| E1   | Entity - Phase 1 | EventGateway pagination                  | Medium | Critical | 6        | F1-F5      |
| E2   | Entity - Phase 1 | ChallengeGateway pagination              | Medium | Critical | 6        | F1-F5      |
| E3   | Entity - Phase 1 | NotificationGateway pagination           | Medium | High     | 6        | F1-F5      |
| E4   | Entity - Phase 1 | GroupGateway pagination                  | Medium | High     | 6        | F1-F5      |
| E5   | Entity - Phase 2 | SponsorGateway pagination                | Medium | Medium   | 6        | E1-E4      |
| E6   | Entity - Phase 2 | LocationGateway pagination               | Medium | Medium   | 6        | E1-E4      |
| E7   | Entity - Phase 2 | SubmissionReportGateway pagination       | Medium | Medium   | 6        | E1-E4      |
| E8   | Entity - Phase 2 | ChallengeSubmissionGateway pagination    | Medium | Medium   | 6        | E1-E4      |
| E9   | Entity - Phase 2 | ChallengeVoteGateway pagination          | Medium | Medium   | 6        | E1-E4      |
| E10  | Entity - Phase 2 | TripGateway pagination                   | Medium | Medium   | 6        | E1-E4      |
| E11  | Entity - Phase 3 | UserGateway pagination                   | Medium | Low      | 6        | E1-E10     |
| E12  | Entity - Phase 3 | RewardGateway pagination                 | Medium | Low      | 6        | E1-E10     |
| E13  | Entity - Phase 3 | RewardPurchaseGateway pagination         | Medium | Low      | 6        | E1-E10     |
| E14  | Entity - Phase 3 | CoinTransactionGateway pagination        | Medium | Low      | 6        | E1-E10     |
| E15  | Entity - Phase 3 | NotificationPreferenceGateway pagination | Medium | Low      | 6        | E1-E10     |
| E16  | Entity - Phase 3 | Final cleanup and consistency            | Medium | Low      | 3        | E1-E15     |
| P1   | Polish           | Integration testing suite                | Medium | High     | 4        | E1-E16     |
| P2   | Polish           | Performance validation                   | Small  | High     | 2        | E1-E16, F4 |
| P3   | Polish           | Documentation and deprecation guide      | Small  | Medium   | 2        | E1-E16     |

**Total Steps:** 27  
**Total Subtasks:** ~120  
**Estimated Total Size:** 22 Small + 19 Medium = ~70 hours

---

## Verification Summary Table

| Step | Phase            | Level    | Judge Type              | Evaluations | Threshold |
| ---- | ---------------- | -------- | ----------------------- | ----------- | --------- |
| S1   | Setup            | Per-Item | sdd:qa-engineer         | 1           | 3.5/5.0   |
| S2   | Setup            | Per-Item | sdd:test-specialist     | 1           | 3.5/5.0   |
| S3   | Setup            | Per-Item | sdd:tech-lead           | 1           | 3.5/5.0   |
| F1   | Foundational     | Panel    | sdd:tech-lead           | 3           | 4.5/5.0   |
| F2   | Foundational     | Panel    | sdd:qa-engineer         | 3           | 4.5/5.0   |
| F3   | Foundational     | Panel    | sdd:tech-lead           | 3           | 4.5/5.0   |
| F4   | Foundational     | Panel    | sdd:database-specialist | 3           | 4.5/5.0   |
| F5   | Foundational     | Panel    | sdd:tech-lead           | 3           | 4.5/5.0   |
| E1   | Entity - Phase 1 | Panel    | opus                    | 3           | 4.5/5.0   |
| E2   | Entity - Phase 1 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E3   | Entity - Phase 1 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E4   | Entity - Phase 1 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E5   | Entity - Phase 2 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E6   | Entity - Phase 2 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E7   | Entity - Phase 2 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E8   | Entity - Phase 2 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E9   | Entity - Phase 2 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E10  | Entity - Phase 2 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E11  | Entity - Phase 3 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E12  | Entity - Phase 3 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E13  | Entity - Phase 3 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E14  | Entity - Phase 3 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E15  | Entity - Phase 3 | Per-Item | sonnet                  | 1           | 4.0/5.0   |
| E16  | Entity - Phase 3 | Panel    | sdd:tech-lead           | 3           | 4.0/5.0   |
| P1   | Polish           | Panel    | sdd:test-specialist     | 3           | 4.0/5.0   |
| P2   | Polish           | Panel    | sdd:database-specialist | 3           | 4.0/5.0   |
| P3   | Polish           | Panel    | sdd:tech-lead           | 3           | 4.0/5.0   |

**Verification Summary:**

- **Panel verification steps:** 10 (F1-F5, E1, E16, P1-P3)
- **Per-Item verification steps:** 17 (S1-S3, E2-E15)
- **Highest threshold:** 4.5/5.0 for foundation components and reference implementation
- **Standard threshold:** 4.0/5.0 for entity gateways and polish
- **Setup threshold:** 3.5/5.0 for preparatory work

---

## Definition of Done

The task is complete when:

### Functional Requirements

1. **All 16 gateway interfaces** have cursor-based pagination methods
2. **All 40+ list-returning methods** have Connection variants
3. **All Connection methods** return proper Relay Connection structure:
   - `edges[]` with `node` and `cursor`
   - `nodes[]` for direct access
   - `pageInfo` with `hasNextPage`, `hasPreviousPage`, `startCursor`, `endCursor`
4. **All cursors** are base64url-encoded JSON containing at minimum `{ id, createdAt }`
5. **All sorts** use composite key with `id` as tiebreaker for stability
6. **All existing methods** remain functional and marked with `@deprecated`

### Technical Requirements

7. **All unit tests pass** for new pagination methods
8. **All integration tests pass** for GraphQL queries
9. **Database indexes** exist on `(sortField, id)` for all paginated tables
10. **Performance targets met:** < 100ms for 100-item pages
11. **Zero breaking changes** to existing API consumers

### Documentation Requirements

12. **API documentation** updated with pagination examples
13. **Migration guide** provided for frontend/mobile teams
14. **Deprecation timeline** published
15. **Changelog entry** added

### Quality Gates

16. **Code review** completed for all changes
17. **Consistency audit** passed (all gateways follow same patterns)
18. **Test coverage** > 80% for new code
19. **No lint or type errors** in modified files

---

## Parallelization Diagram

### Execution Wave Overview

```
Wave 1: Setup (3 parallel)
┌─────────────────────────────────────────────────────────────┐
│  [S1:haiku]  │  [S2:test]  │  [S3:tech-lead]                │
│  Tool Verify │   Baseline   │  Document Patterns             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Wave 2: Foundation Part 1 (3 parallel)
┌─────────────────────────────────────────────────────────────┐
│  [F1:opus]   │  [F2:opus]   │  [F4:db-spec]                  │
│  Domain      │  Cursor      │  DB Indexes                    │
│  Types       │  Encoder     │                                │
└──────────────┴──────────────┴────────────────────────────────┘
                              │
                              ▼
Wave 3: Foundation Part 2 (2 parallel)
┌──────────────────────────────┬──────────────────────────────┐
│  [F3:sonnet]                 │  [F5:opus/graphql]             │
│  Use Case Types              │  GraphQL Helpers               │
└──────────────────────────────┴──────────────────────────────┘
                              │
                              ▼
Wave 4: Entity Phase 1 - High Impact (4 parallel)
┌──────────────┬──────────────┬──────────────┬────────────────┐
│  [E1:opus]   │  [E2:sonnet] │  [E3:sonnet] │  [E4:sonnet]   │
│  Event       │  Challenge   │ Notification │  Group         │
└──────────────┴──────────────┴──────────────┴────────────────┘
                              │
                              ▼
Wave 5: Entity Phase 2 - Medium Impact (6 parallel)
┌────────┬────────┬──────────┬────────────┬────────┬──────────┐
│ [E5]   │ [E6]   │ [E7]     │ [E8]       │ [E9]   │ [E10]    │
│ Sponsor│ Location│ Report  │ Submission │ Vote   │ Trip     │
└────────┴────────┴──────────┴────────────┴────────┴──────────┘
                              │
                              ▼
Wave 6: Entity Phase 3 - Lower Impact (5 parallel)
┌────────┬────────┬──────────┬────────────┬────────────────────┐
│ [E11]  │ [E12]  │ [E13]    │ [E14]      │ [E15]              │
│ User   │ Reward │ Purchase │ Coin       │ NotificationPref   │
└────────┴────────┴──────────┴────────────┴────────────────────┘
                              │
                              ▼
Wave 7: Cleanup (1 sequential)
┌─────────────────────────────────────────────────────────────┐
│  [E16:tech-lead]                                             │
│  Consistency Audit & Cleanup                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Wave 8: Polish (3 parallel)
┌──────────────────┬──────────────────┬──────────────────────┐
│ [P1:test-spec]   │ [P2:db-spec]     │ [P3:haiku]           │
│ Integration Tests│ Performance      │ Documentation        │
└──────────────────┴──────────────────┴──────────────────────┘
```

### Dependency Graph

```
S1 ──┐
S2 ──┼──→ F1 ──┐
S3 ──┘        ├──→ F3 ──┐
              │         ├──→ F5 ──┐
              F2 ──────┘         │
              F4 ─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
                   E1           E2           E3           E4
                   │            │            │            │
                   └────────────┴────────────┴────────────┘
                                 │
                    ┌────────────┼────────────┬────────────┬────────────┐
                    ▼            ▼            ▼            ▼            ▼
                   E5           E6           E7           E8           E9  E10
                   │            │            │            │            │   │
                   └────────────┴────────────┴────────────┴────────────┘   │
                                 │                                          │
                    ┌────────────┼────────────┬────────────┬────────────┐   │
                    ▼            ▼            ▼            ▼            ▼   ▼
                   E11          E12          E13          E14          E15
                    │            │            │            │            │
                    └────────────┴────────────┴────────────┴────────────┘
                                 │
                                 ▼
                                E16
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
                   P1           P2           P3
```

### Agent Allocation Summary

| Agent                       | Steps          | Count | Waves   |
| --------------------------- | -------------- | ----- | ------- |
| **opus**                    | F1, F2, F5, E1 | 4     | 2, 3, 4 |
| **sdd:database-specialist** | F4, P2         | 2     | 2, 8    |
| **sonnet**                  | F3, E2-E15     | 15    | 3-6     |
| **sdd:test-specialist**     | S2, P1         | 2     | 1, 8    |
| **sdd:tech-lead**           | S3, E16        | 2     | 1, 7    |
| **haiku**                   | S1, P3         | 2     | 1, 8    |

---

## Sub-Agent Execution Directive

### How to Use This Spec with `/sdd:implement`

This spec is designed for parallel execution using the `/sdd:implement` command with sub-agent orchestration. Follow these guidelines:

### Execution Batches

Execute steps in **8 sequential waves**, with parallel execution within each wave:

```bash
# Wave 1: Setup (all 3 in parallel)
/sdd:implement S1 --agent haiku
/sdd:implement S2 --agent sdd:test-specialist
/sdd:implement S3 --agent sdd:tech-lead

# Wave 2: Foundation Part 1 (all 3 in parallel)
/sdd:implement F1 --agent opus
/sdd:implement F2 --agent opus
/sdd:implement F4 --agent sdd:database-specialist

# Wave 3: Foundation Part 2 (both in parallel)
/sdd:implement F3 --agent sonnet
/sdd:implement F5 --agent opus

# Wave 4: Entity Phase 1 (all 4 in parallel)
/sdd:implement E1 --agent opus
/sdd:implement E2 --agent sonnet
/sdd:implement E3 --agent sonnet
/sdd:implement E4 --agent sonnet

# Wave 5: Entity Phase 2 (all 6 in parallel)
/sdd:implement E5 --agent sonnet
/sdd:implement E6 --agent sonnet
/sdd:implement E7 --agent sonnet
/sdd:implement E8 --agent sonnet
/sdd:implement E9 --agent sonnet
/sdd:implement E10 --agent sonnet

# Wave 6: Entity Phase 3 (all 5 in parallel)
/sdd:implement E11 --agent sonnet
/sdd:implement E12 --agent sonnet
/sdd:implement E13 --agent sonnet
/sdd:implement E14 --agent sonnet
/sdd:implement E15 --agent sonnet

# Wave 7: Cleanup (sequential)
/sdd:implement E16 --agent sdd:tech-lead

# Wave 8: Polish (all 3 in parallel)
/sdd:implement P1 --agent sdd:test-specialist
/sdd:implement P2 --agent sdd:database-specialist
/sdd:implement P3 --agent haiku
```

### Alternative: Automated Batch Execution

Use the `sadd:do-in-steps` skill for automated orchestration:

```bash
/sadd:do-in-steps --spec .specs/tasks/draft/add-cursor-pagination-to-all-gateways.md
```

This will:

1. Parse all steps and dependencies
2. Build the dependency graph
3. Execute waves in sequence
4. Run parallel steps within each wave concurrently
5. Verify completion of each wave before proceeding

### Per-Step Execution Template

For each step, the sub-agent should:

1. **Read the step specification** from this file
2. **Verify dependencies** are complete (check prior steps)
3. **Implement** following the Success Criteria
4. **Run tests** to verify implementation
5. **Mark complete** in task tracking

### Critical Success Factors

1. **E1 is the reference implementation** - ensure it's completed first in Entity Phase 1 before E2-E4 begin
2. **F4 (database indexes) should complete before** any Drizzle gateway work in E1-E15
3. **P2 (performance validation) must wait** for all entities + F4
4. **All entity steps require test specialist review** - coordinate with sdd:test-specialist

### Rollback Strategy

If a wave fails:

1. Stop execution of dependent waves
2. Fix issues in the failed wave
3. Re-run the failed wave
4. Continue to next wave

### Coordination Points

- **After F5**: Sync on GraphQL helper patterns
- **After E1**: Review reference implementation with all entity agents
- **After E16**: Final consistency check before Polish phase

---

## Notes

- **Parallel Execution:** Steps within each phase can be executed in parallel where blockers don't prevent it
- **Reference Implementation:** ActivityFeedGateway patterns should be followed exactly
- **Testing First:** Each gateway should have tests written before or alongside implementation
- **Backward Compatibility:** Zero breaking changes is mandatory - existing methods must remain functional
- **Incremental Delivery:** Each gateway step (E*) can be delivered independently once foundational work (F*) is complete
