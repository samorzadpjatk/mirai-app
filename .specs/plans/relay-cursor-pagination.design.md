# Cursor-Based Pagination Design for GraphQL Relay Plugin

## Overview

This design enables all paginated gateways to return Relay Connection-compatible pagination, suitable for Pothos Relay plugin. The implementation uses base64-encoded composite cursors and a generic `Connection<T>` type in the domain layer.

## Key Decisions

- **Approach:** Full Relay Connection in gateways (Option A)
- **Migration:** All paginated gateways at once
- **Connection Type:** Generic `Connection<T>` in domain layer
- **Cursor Encoding:** Base64-encoded composite cursor with all sort fields

## Architecture

### 1. Domain Layer Types (packages/domain)

New value objects and types for Relay pagination:

```typescript
// packages/domain/src/value-objects/pagination.ts

/**
 * Generic Edge type for Relay connections
 */
export interface Edge<T> {
  node: T;
  cursor: string;
}

/**
 * PageInfo for Relay connections
 */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

/**
 * Generic Connection type for Relay pagination
 */
export interface Connection<T> {
  edges: Edge<T>[];
  nodes: T[]; // Convenience field - same as edges.map(e => e.node)
  pageInfo: PageInfo;
  totalCount?: number; // Optional total count for UI
}

/**
 * Pagination args for forward pagination
 */
export interface ForwardPaginationArgs {
  first: number; // Limit
  after?: string | null; // Cursor
}

/**
 * Pagination args for backward pagination
 */
export interface BackwardPaginationArgs {
  last: number;
  before?: string | null;
}

/**
 * Cursor data structure (decoded)
 */
export interface CursorData {
  id: string;
  [sortField: string]: unknown; // Additional sort fields
}
```

### 2. Cursor Utilities (packages/domain)

```typescript
// packages/domain/src/utils/cursor.ts

export class CursorEncoder {
  static encode(data: CursorData): string {
    return btoa(JSON.stringify(data));
  }

  static decode(cursor: string): CursorData {
    try {
      return JSON.parse(atob(cursor));
    } catch {
      throw new Error("Invalid cursor format");
    }
  }
}
```

### 3. Gateway Interface Updates (packages/use-cases)

Example for ActivityFeedGateway:

```typescript
// packages/use-cases/src/activity/ports/gateway.ts

export interface ActivityFeedGateway {
  // Replace existing findByTripId with Relay Connection method
  findByTripIdConnection(
    tripId: string,
    args: ForwardPaginationArgs,
  ): Effect.Effect<
    Connection<ActivityFeed>,
    never,
    never
  >;

  // Optional: keep legacy method for backward compatibility during migration
  findByTripId?(
    tripId: string,
    options?: { limit?: number; cursor?: { id: string; createdAt: Date; isPinned: boolean } | null; includeHidden?: boolean }
  ): Effect.Effect<...>;
}
```

### 4. Gateway Implementations (packages/adapters)

#### Drizzle Gateway Pattern:

```typescript
// packages/adapters/src/activity/gateways/drizzle/gateway.ts

findByTripIdConnection(
  tripId: string,
  args: ForwardPaginationArgs,
): Effect.Effect<Connection<ActivityFeed>, DatabaseError, never> {
  return Effect.tryPromise({
    try: async () => {
      const limit = args.first;
      const cursor = args.after ? CursorEncoder.decode(args.after) : null;

      // Build where conditions
      const conditions = [eq(this.table.tripId, tripId), eq(this.table.isHidden, false)];

      // Add cursor condition if provided
      if (cursor) {
        conditions.push(
          sql`(${this.table.isPinned}, ${this.table.createdAt}, ${this.table.id}) <
              (${cursor.isPinned}, ${cursor.createdAt}, ${cursor.id})`
        );
      }

      // Fetch one extra to determine hasNextPage
      const records = await this.db
        .select()
        .from(this.table)
        .where(and(...conditions))
        .orderBy(desc(this.table.isPinned), desc(this.table.createdAt), desc(this.table.id))
        .limit(limit + 1);

      const hasNextPage = records.length > limit;
      const items = records.slice(0, limit).map(r => this.mapper.toDomain(r));

      // Build edges with cursors
      const edges = items.map(item => ({
        node: item,
        cursor: CursorEncoder.encode({
          id: item.id,
          createdAt: item.createdAt,
          isPinned: item.isPinned,
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
    catch: (error) => new DatabaseError({ ... }),
  });
}
```

#### In-Memory Gateway Pattern:

```typescript
// packages/adapters/src/activity/gateways/in-memory/gateway.ts

findByTripIdConnection(
  tripId: string,
  args: ForwardPaginationArgs,
): Effect.Effect<Connection<ActivityFeed>, never, never> {
  return Effect.sync(() => {
    const limit = args.first;
    const cursor = args.after ? CursorEncoder.decode(args.after) : null;

    let activities = this.getAllItems()
      .filter(a => a.tripId === tripId && !a.isHidden)
      .sort((a, b) => a.compareForSort(b));

    // Apply cursor filter
    if (cursor) {
      const cursorIndex = activities.findIndex(
        a => a.id === cursor.id &&
             a.createdAt.getTime() === new Date(cursor.createdAt as string).getTime() &&
             a.isPinned === cursor.isPinned
      );
      if (cursorIndex !== -1) {
        activities = activities.slice(cursorIndex + 1);
      }
    }

    const items = activities.slice(0, limit);
    const hasNextPage = activities.length > limit;

    const edges = items.map(item => ({
      node: item,
      cursor: CursorEncoder.encode({
        id: item.id,
        createdAt: item.createdAt,
        isPinned: item.isPinned,
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
  });
}
```

### 5. GraphQL Types (packages/frameworks)

Update Pothos types to use Relay connection patterns:

```typescript
// packages/frameworks/src/graphql/types/activityFeed.ts

// Remove custom pagination types - use Pothos Relay plugin instead

// Define Activity type with Relay node interface
export const ActivityType = builder.node(
  builder.objectType("Activity", {
    description: "An activity in the feed",
    interfaces: [builder.nodeInterface], // Implements Node interface
    id: { resolve: (activity) => activity.id },
    fields: (t) => ({
      // ... existing fields
    }),
    loadMany: (ids, ctx) => ctx.controllers.activityController.getByIds(ids),
  }),
);

// Define Connection using Relay plugin
builder.connectionObject({
  name: "ActivityConnection",
  type: ActivityType,
});
```

### 6. Query Types (packages/frameworks)

Update queries to use Relay connection arguments:

```typescript
// packages/frameworks/src/graphql/types/Query.ts

builder.queryField("activitiesByTrip", (t) =>
  t.connection({
    type: ActivityType,
    args: {
      tripId: t.arg.id({ required: true }),
      // first, after, last, before are automatically added by Relay plugin
    },
    resolve: async (_parent, args, ctx) => {
      const controller = ctx.controllers.activityController;
      const result = await controller.getByTripConnection({
        tripId: args.tripId,
        first: args.first,
        after: args.after,
      });

      // Convert Connection<ActivityFeed> to Relay expected format
      return {
        edges: result.edges,
        pageInfo: result.pageInfo,
      };
    },
  }),
);
```

### 7. Controller Updates (packages/adapters)

```typescript
// packages/adapters/src/activity/controllers/controller.ts

async getByTripConnection(input: {
  tripId: string;
  first: number;
  after?: string | null;
}): Promise<Connection<ActivityFeed>> {
  const program = Effect.gen(function* () {
    const gateway = yield* ActivityFeedGatewayTag;

    return yield* gateway.findByTripIdConnection(input.tripId, {
      first: input.first,
      after: input.after ?? null,
    });
  });

  return await Effect.runPromise(program);
}
```

## Gateways to Migrate

1. **Activity Feed Gateway** - Already has cursor logic, easiest migration
2. **Trip Gateway** - Core entity
3. **Reward Gateway** - Paginated lists
4. **Group Gateway** - Paginated lists
5. **Event Gateway** - Paginated lists
6. **Notification Gateway** - Paginated lists
7. **Coin Transaction Gateway** - Paginated lists
8. **Notification Delivery Gateway** - Paginated lists
9. **Notification Schedule Gateway** - Paginated lists
10. **Challenge Gateway** - Paginated lists
11. **Sponsor Gateway** - Paginated lists
12. **Location Gateway** - If paginated
13. **User Gateway** - If paginated

## Testing Strategy

### Unit Tests

Test each gateway's connection method with:

- Empty result set
- First page fetch
- Subsequent page fetch with cursor
- Last page (hasNextPage = false)
- Invalid cursor handling

```typescript
// Example test
it("returns correct Connection for first page", async () => {
  const gateway = new InMemoryActivityFeedGateway();
  gateway.seed(generateActivities(25));

  const result = await Effect.runPromise(
    gateway.findByTripIdConnection("trip-1", { first: 10 }),
  );

  expect(result.edges).toHaveLength(10);
  expect(result.pageInfo.hasNextPage).toBe(true);
  expect(result.pageInfo.hasPreviousPage).toBe(false);
  expect(result.pageInfo.startCursor).toBe(result.edges[0].cursor);
  expect(result.pageInfo.endCursor).toBe(result.edges[9].cursor);
});
```

### Integration Tests

Test GraphQL queries returning connections:

- Query with `first: 10`
- Query with `first: 10, after: <cursor>`
- Verify cursor format is base64
- Verify pageInfo fields

## Migration Phases

### Phase 1: Domain Layer (packages/domain)

- Add `Connection<T>`, `Edge<T>`, `PageInfo` interfaces
- Add `CursorEncoder` utility
- Add `ForwardPaginationArgs` interface

### Phase 2: Use Cases Layer (packages/use-cases)

- Update each gateway port interface
- Add new `*Connection` methods
- Keep legacy methods during migration (mark @deprecated)

### Phase 3: Adapters Layer (packages/adapters)

- Implement `*Connection` methods in all gateways
  - In-memory gateways
  - Drizzle gateways
- Update controllers to expose new methods

### Phase 4: Framework Layer (packages/frameworks)

- Update Pothos types to use `builder.node()` and `builder.connectionObject()`
- Update Query types with Relay connection fields
- Update resolvers

### Phase 5: Cleanup

- Remove legacy pagination methods from gateways
- Update GraphQL client generation
- Update frontend queries (if needed)

## Risks and Mitigations

| Risk                                    | Mitigation                                                                |
| --------------------------------------- | ------------------------------------------------------------------------- |
| Breaking changes to GraphQL API         | Keep old fields during migration, use deprecation                         |
| Cursor encoding errors                  | Validate cursor format, return GraphQL error for invalid cursors          |
| Performance issues with complex sorting | Ensure database indexes on sort fields                                    |
| Sort order inconsistencies              | Define explicit multi-field sort (isPinned DESC, createdAt DESC, id DESC) |

## Success Criteria

1. All paginated gateways return `Connection<T>` with proper `Edge` and `PageInfo`
2. Cursors are base64-encoded and include all sort fields
3. GraphQL schema uses standard Relay connection types
4. Pothos Relay plugin generates proper connection objects
5. All tests pass (unit + integration)
6. No offset-based pagination in new code

## Files to Modify

### Domain Layer

- `packages/domain/src/index.ts` - Export new types
- `packages/domain/src/value-objects/pagination.ts` - New file
- `packages/domain/src/utils/cursor.ts` - New file

### Use Cases Layer

- `packages/use-cases/src/activity/ports/gateway.ts`
- `packages/use-cases/src/trip/ports/gateway.ts`
- `packages/use-cases/src/reward/ports/gateway.ts`
- `packages/use-cases/src/group/ports/gateway.ts`
- `packages/use-cases/src/event/ports/gateway.ts`
- `packages/use-cases/src/notification/ports/gateway.ts`
- `packages/use-cases/src/coin/ports/gateway.ts`
- `packages/use-cases/src/challenge/ports/gateway.ts`
- `packages/use-cases/src/sponsor/ports/gateway.ts`
- (All other paginated gateways)

### Adapters Layer

- All in-memory gateway implementations
- All drizzle gateway implementations
- All controllers

### Frameworks Layer

- `packages/frameworks/src/graphql/types/*.ts` - Update to use Relay patterns
- `packages/frameworks/src/graphql/builder.ts` - Ensure Relay plugin is properly configured

## Example GraphQL Query

```graphql
query GetActivities($tripId: ID!, $first: Int!, $after: String) {
  activitiesByTrip(tripId: $tripId, first: $first, after: $after) {
    edges {
      node {
        id
        title
        description
        createdAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

---

**Last Updated:** 2026-04-16
**Status:** Design Complete - Ready for Implementation
