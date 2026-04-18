# Relay Cursor Pagination Skill

> Patterns and best practices for implementing GraphQL Relay cursor-based pagination in a Clean Architecture TypeScript codebase using Effect and Pothos.

---

## Overview

This skill provides patterns for implementing cursor-based pagination across all layers of a Clean Architecture codebase:

- **GraphQL Layer**: Pothos Relay plugin for connection types (primary focus)
- **Framework Layer**: Connection utilities in `packages/frameworks/src/graphql/utils/connections.ts`
- **Use Cases Layer**: DTOs return items directly; GraphQL layer builds connections

## Quick Reference

```typescript
// 1. Create Connection Type (in types.ts)
export const TripConnectionType = builder.connectionObject(
  { name: "TripConnection", type: TripType },
  { name: "TripEdge" }
);

// 2. Use in Query (in queries.ts)
import { normalizePaginationArgs, buildConnection, encodeCursor } from "../../utils/connections";

myTrips: t.field({
  type: TripConnectionType,
  args: {
    first: t.arg.int(),
    after: t.arg.string(),
  },
  resolve: async (_parent, args, context) => {
    const { limit, after } = normalizePaginationArgs(args);
    const result = await fetchData({ limit, cursor: after });
    
    return buildConnection({
      items: result.items,
      hasMore: result.hasMore,
      getCursor: (item) => encodeCursor(item.id),
      totalCount: result.total,
    });
  },
}),
```

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Pothos Relay Plugin Patterns](#pothos-relay-plugin-patterns)
3. [Effect-Based Gateway Pagination](#effect-based-gateway-pagination)
4. [Cursor Encoding/Decoding](#cursor-encodingdecoding)
5. [Common Pitfalls](#common-pitfalls)
6. [Layer-by-Layer Implementation](#layer-by-layer-implementation)

---

## Core Concepts

### Why Cursor Pagination?

| Aspect             | Offset Pagination                        | Cursor Pagination                   |
| ------------------ | ---------------------------------------- | ----------------------------------- |
| **Stability**      | Items skipped/duped if data changes      | Stable even with concurrent changes |
| **Performance**    | O(offset + limit) - scans all prior rows | O(limit) - uses indexes directly    |
| **Large Datasets** | Slow at high offsets                     | Consistent performance              |
| **Security**       | Clients can probe total count            | Opaque cursors hide data patterns   |

### The Relay Connection Model

```graphql
type EntityConnection {
  edges: [EntityEdge!]!
  pageInfo: PageInfo!
  totalCount: Int
}

type EntityEdge {
  cursor: String!
  node: Entity!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

**Arguments:**

- `first: Int` - Forward pagination: return first N items
- `after: String` - Forward pagination: start after this cursor
- `last: Int` - Backward pagination: return last N items
- `before: String` - Backward pagination: end before this cursor

---

## Pothos Relay Plugin Patterns

### Setup

```typescript
// packages/frameworks/src/graphql/builder.ts
import SchemaBuilder from "@pothos/core";
import RelayPlugin from "@pothos/plugin-relay";

export const builder = new SchemaBuilder<{
  // ... other types
  Connection: {
    totalCount: number;
  };
}>({
  plugins: [RelayPlugin],
  relay: {
    clientMutationId: "omit",
    cursorType: "String",
    defaultSize: 20,
    maxSize: 100,
  },
});
```

### Using `t.connection` Field Builder

```typescript
// packages/frameworks/src/graphql/resolvers/entity.ts
import { builder } from "../builder";
import { decodeCursor, encodeCursor } from "@mirai-app/use-cases";

builder.queryField("entities", (t) =>
  t.connection({
    type: EntityType,
    args: {
      // Additional custom args
      filter: t.arg({ type: EntityFilterInput, required: false }),
    },
    resolve: async (_parent, args, ctx) => {
      const controller = ctx.controllers.entityController;

      // Decode cursor if provided
      const afterCursor = args.after ? decodeCursor(args.after) : null;

      const result = await controller.findMany({
        first: args.first ?? 20,
        after: afterCursor,
        filter: args.filter,
      });

      // Return in connection format
      return {
        edges: result.items.map((item) => ({
          node: item,
          cursor: encodeCursor({
            id: item.id,
            createdAt: item.createdAt.toISOString(),
          }),
        })),
        pageInfo: {
          hasNextPage: result.hasMore,
          hasPreviousPage: !!args.after, // Simplified - should check DB
          startCursor:
            result.items.length > 0
              ? encodeCursor({
                  id: result.items[0].id,
                  createdAt: result.items[0].createdAt.toISOString(),
                })
              : null,
          endCursor:
            result.items.length > 0 && result.nextCursor
              ? encodeCursor({
                  id: result.nextCursor.id,
                  createdAt: result.nextCursor.createdAt.toISOString(),
                })
              : null,
        },
        totalCount: result.totalCount, // Optional
      };
    },
  }),
);
```

### Using Pothos Connection Helpers

For offset-based APIs (simplest):

```typescript
import { resolveOffsetConnection } from "@pothos/plugin-relay";

builder.queryField("entities", (t) =>
  t.connection({
    type: EntityType,
    resolve: (parent, args, ctx) => {
      return resolveOffsetConnection(
        { args, defaultSize: 20, maxSize: 100 },
        async ({ limit, offset }) => {
          const controller = ctx.controllers.entityController;
          const result = await controller.findMany({ limit, offset });
          return result.items;
        },
      );
    },
  }),
);
```

For cursor-based with Pothos helper:

```typescript
import {
  resolveCursorConnection,
  ResolveCursorConnectionArgs,
} from "@pothos/plugin-relay";

builder.queryField("entities", (t) =>
  t.connection({
    type: EntityType,
    resolve: (_, args, ctx) =>
      resolveCursorConnection(
        {
          args,
          toCursor: (entity) =>
            encodeCursor({
              id: entity.id,
              createdAt: entity.createdAt.toISOString(),
            }),
        },
        async ({
          before,
          after,
          limit,
          inverted,
        }: ResolveCursorConnectionArgs) => {
          const controller = ctx.controllers.entityController;

          // Decode cursors
          const beforeCursor = before ? decodeCursor(before) : null;
          const afterCursor = after ? decodeCursor(after) : null;

          return await controller.findManyCursor({
            limit,
            before: beforeCursor,
            after: afterCursor,
            inverted,
          });
        },
      ),
  }),
);
```

---

## Connection Utilities (Project Standard)

Use the utilities from `packages/frameworks/src/graphql/utils/connections.ts`:

### Available Functions

```typescript
import {
  // Cursor encoding/decoding
  encodeCursor,
  decodeCursor,
  encodeCursorWithTimestamp,
  decodeCursorWithTimestamp,
  
  // Connection building
  buildConnection,
  buildConnectionFromPaginated,
  
  // Pagination arguments
  clampFirst,
  normalizePaginationArgs,
} from "../../utils/connections";
```

### Building a Connection

```typescript
import { buildConnection, encodeCursor } from "../../utils/connections";

const connection = buildConnection({
  items: trips,
  hasMore: true,
  getCursor: (trip) => encodeCursor(trip.id),
  totalCount: 100,
});

// Returns:
// {
//   edges: [{ node: Trip, cursor: "base64id:trip-123" }, ...],
//   pageInfo: {
//     hasNextPage: true,
//     hasPreviousPage: false,
//     startCursor: "base64id:trip-123",
//     endCursor: "base64id:trip-132",
//   },
//   totalCount: 100
// }
```

### Using in Resolver

```typescript
import { 
  normalizePaginationArgs, 
  buildConnection, 
  encodeCursor 
} from "../../utils/connections";

builder.queryFields((t) => ({
  trips: t.field({
    type: TripConnectionType,
    args: {
      first: t.arg.int(),
      after: t.arg.string(),
    },
    resolve: async (_parent, args, ctx) => {
      const { limit, after } = normalizePaginationArgs(args);
      
      const useCase = new GetTripsUseCase();
      const result = await useCase.execute({ 
        first: limit, 
        after: after ? decodeCursor(after) : null 
      });
      
      return buildConnection({
        items: result.items,
        hasMore: result.hasMore,
        getCursor: (trip) => encodeCursor(trip.id),
        totalCount: result.total,
      });
    },
  }),
}));
```

---

## Effect-Based Gateway Pagination

### Domain Layer (Pure Interface)

```typescript
// packages/domain/src/entity/ports/entity-gateway.ts
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Entity } from "../entities/entity";

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface EntityGateway {
  findAll(
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<Entity>, DatabaseError, never>;
  findByFilter(
    filter: Filter,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<Entity>, DatabaseError, never>;
}
```

### Use Cases Layer (Context.Tag + Cursor Types)

```typescript
// packages/use-cases/src/entity/ports/gateway.ts
import type { Entity } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "../../system/errors";

/**
 * Cursor data structure - corresponds to sort fields
 */
export interface EntityCursor {
  id: string;
  createdAt: Date;
  // Add other sort fields as needed
}

/**
 * Options for cursor-based pagination
 */
export interface CursorPaginationOptions {
  limit?: number;
  cursor?: EntityCursor | null;
}

/**
 * Result from cursor-based query
 */
export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: EntityCursor | null;
  hasMore: boolean;
}

/**
 * EntityGateway interface with cursor pagination
 */
export interface EntityGateway {
  /**
   * Find entities with cursor pagination
   */
  findMany(
    options?: CursorPaginationOptions,
  ): Effect.Effect<CursorPaginatedResult<Entity>, DatabaseError, never>;

  /**
   * Find by parent ID with cursor pagination
   */
  findByParentId(
    parentId: string,
    options?: CursorPaginationOptions,
  ): Effect.Effect<CursorPaginatedResult<Entity>, DatabaseError, never>;

  // ... other methods
}

/**
 * Context.Tag for Effect dependency injection
 */
export class EntityGatewayTag extends Context.Tag("EntityGateway")<
  EntityGatewayTag,
  EntityGateway
>() {}
```

### Adapter Layer (Drizzle Implementation)

```typescript
// packages/adapters/src/entity/gateways/drizzle/gateway.ts
import { eq, and, or, lt, desc } from "drizzle-orm";
import { Effect } from "effect";
import type {
  EntityGateway,
  CursorPaginatedResult,
} from "@mirai-app/use-cases";
import { Entity, type EntityId } from "@mirai-app/domain";
import { DatabaseError } from "../../../system/errors";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

export class DrizzleEntityGateway
  extends BaseDrizzleGateway<
    Entity,
    EntitySelect,
    EntityInsert,
    typeof entities
  >
  implements EntityGateway
{
  findByParentId(
    parentId: string,
    options?: {
      limit?: number;
      cursor?: { id: string; createdAt: Date } | null;
    },
  ): Effect.Effect<CursorPaginatedResult<Entity>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = Math.min(options?.limit ?? 20, 100);
        const cursor = options?.cursor;

        // Build base conditions
        const conditions = [eq(this.table.parentId, parentId)];

        // Add cursor filter if provided
        // Uses (createdAt, id) composite sort key
        if (cursor) {
          conditions.push(
            or(
              lt(this.table.createdAt, cursor.createdAt),
              and(
                eq(this.table.createdAt, cursor.createdAt),
                lt(this.table.id, cursor.id),
              ),
            ),
          );
        }

        // Query with limit+1 to determine hasMore
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records
          .slice(0, limit)
          .map((r) => this.mapper.toDomain(r));

        // Build next cursor from last item
        const lastItem = items[items.length - 1];
        const nextCursor =
          hasMore && lastItem
            ? { id: lastItem.id, createdAt: lastItem.createdAt }
            : null;

        return { items, nextCursor, hasMore };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByParentId",
          message: `Failed to find entities by parent ID: ${parentId}`,
          cause: error,
        }),
    });
  }
}
```

---

## Cursor Encoding/Decoding

### Utility Functions

```typescript
// packages/use-cases/src/system/utils/cursor.ts

/**
 * Cursor data that gets encoded
 */
export interface CursorData {
  id: string;
  createdAt: string; // ISO 8601 format
  // Extend with additional sort fields as needed
}

/**
 * Encode cursor data to opaque base64url string
 */
export function encodeCursor(data: CursorData): string {
  const json = JSON.stringify(data);
  return Buffer.from(json).toString("base64url");
}

/**
 * Decode cursor from base64url string
 * Returns null if invalid
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf-8");
    const data = JSON.parse(json) as CursorData;

    // Validate required fields
    if (typeof data.id !== "string" || typeof data.createdAt !== "string") {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Decode cursor and return as Date object
 */
export function decodeCursorWithDate(
  cursor: string,
): { id: string; createdAt: Date } | null {
  const data = decodeCursor(cursor);
  if (!data) return null;

  try {
    const createdAt = new Date(data.createdAt);
    if (isNaN(createdAt.getTime())) return null;

    return { id: data.id, createdAt };
  } catch {
    return null;
  }
}
```

### Usage in GraphQL Layer

```typescript
// packages/frameworks/src/graphql/resolvers/entity.ts
builder.queryField("entities", (t) =>
  t.connection({
    type: EntityType,
    resolve: async (_parent, args, ctx) => {
      const controller = ctx.controllers.entityController;

      // Decode GraphQL cursor args
      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;
      const beforeCursor = args.before
        ? decodeCursorWithDate(args.before)
        : null;

      // Call use case
      const result = await controller.findMany({
        first: args.first,
        last: args.last,
        after: afterCursor,
        before: beforeCursor,
      });

      // Encode cursors for response
      return {
        edges: result.items.map((item) => ({
          node: item,
          cursor: encodeCursor({
            id: item.id,
            createdAt: item.createdAt.toISOString(),
          }),
        })),
        pageInfo: {
          hasNextPage: result.hasNextPage,
          hasPreviousPage: result.hasPreviousPage,
          startCursor: result.items[0]
            ? encodeCursor({
                id: result.items[0].id,
                createdAt: result.items[0].createdAt.toISOString(),
              })
            : null,
          endCursor: result.items[result.items.length - 1]
            ? encodeCursor({
                id: result.items[result.items.length - 1].id,
                createdAt:
                  result.items[result.items.length - 1].createdAt.toISOString(),
              })
            : null,
        },
      };
    },
  }),
);
```

---

## Common Pitfalls

### 1. Non-Unique Sort Fields

**Problem:** Using only `createdAt` for sorting causes unstable ordering when timestamps collide.

**Solution:** Always add a unique field (like `id`) as tie-breaker.

```typescript
// BAD
.orderBy(desc(this.table.createdAt))

// GOOD
.orderBy(desc(this.table.createdAt), desc(this.table.id))
```

### 2. Cursor Field Mismatch

**Problem:** Cursor contains different fields than query ORDER BY.

**Solution:** Cursor must exactly match sort fields.

```typescript
// If ORDER BY is: createdAt DESC, id DESC
// Cursor must be: { createdAt, id }
// Not just: { id }
```

### 3. Off-by-One Errors

**Problem:** Items appear in multiple pages or get skipped.

**Solution:** Use strict inequality, not inclusive.

```typescript
// BAD - item at cursor appears in next page
lte(this.table.createdAt, cursor.createdAt);

// GOOD - strictly after cursor
lt(this.table.createdAt, cursor.createdAt);
```

### 4. Timezone Issues

**Problem:** Date serialization loses timezone info.

**Solution:** Always use ISO 8601 UTC strings.

```typescript
// GOOD
const cursor = {
  id: entity.id,
  createdAt: entity.createdAt.toISOString(), // "2024-01-15T10:30:00.000Z"
};
```

### 5. Missing hasPreviousPage

**Problem:** Only implementing `hasNextPage` breaks backward pagination.

**Solution:** Implement both per Relay spec.

```typescript
// For first/after pagination
hasPreviousPage: !!after,  // or query DB to confirm
hasNextPage: items.length > limit  // fetched limit+1
```

### 6. Count Queries for Total

**Problem:** `SELECT COUNT(*)` is expensive on large tables.

**Solution:** Make `totalCount` optional or use estimate.

```typescript
// Option 1: Omit totalCount entirely
// Option 2: Use approximate count
const [{ count }] = await this.db.execute(
  sql`SELECT reltuples::bigint as count FROM pg_class WHERE oid = ${this.table}::regclass`,
);
```

### 7. In-Memory Sorting

**Problem:** Sorting in JavaScript after fetching from DB.

**Solution:** Always sort in database query.

```typescript
// BAD
const records = await this.db.select().from(this.table);
records.sort((a, b) => b.createdAt - a.createdAt); // Wrong!

// GOOD
.orderBy(desc(this.table.createdAt), desc(this.table.id))
```

---

## Layer-by-Layer Implementation

### Step 1: Domain Layer (Define Interface)

```typescript
// packages/domain/src/entity/ports/entity-gateway.ts
import type { Effect } from "effect";
import type { DatabaseError } from "../../ports/database-error";
import type { Entity } from "../entities/entity";

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface EntityGateway {
  findByParentId(
    parentId: string,
    options?: PaginationOptions,
  ): Effect.Effect<PaginatedResult<Entity>, DatabaseError, never>;
}
```

### Step 2: Use Cases Layer (Add Cursor Types + Tag)

```typescript
// packages/use-cases/src/entity/ports/gateway.ts
import type { EntityGateway as DomainEntityGateway } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "../../system/errors";

export interface EntityCursor {
  id: string;
  createdAt: Date;
}

export interface CursorPaginationOptions {
  limit?: number;
  cursor?: EntityCursor | null;
}

export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: EntityCursor | null;
  hasMore: boolean;
}

export interface EntityGateway extends DomainEntityGateway {
  findByParentIdCursor(
    parentId: string,
    options?: CursorPaginationOptions,
  ): Effect.Effect<CursorPaginatedResult<Entity>, DatabaseError, never>;
}

export class EntityGatewayTag extends Context.Tag("EntityGateway")<
  EntityGatewayTag,
  EntityGateway
>() {}

// Re-export cursor utilities
export {
  encodeCursor,
  decodeCursor,
  decodeCursorWithDate,
} from "../../system/utils/cursor";
```

### Step 3: Adapter Layer (Implement in Drizzle)

```typescript
// packages/adapters/src/entity/gateways/drizzle/gateway.ts
import { eq, and, or, lt, desc } from "drizzle-orm";
import { Effect } from "effect";
import { Entity, type EntityId } from "@mirai-app/domain";
import type {
  EntityGateway,
  CursorPaginatedResult,
} from "@mirai-app/use-cases";
import { DatabaseError } from "../../../system/errors";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

export class DrizzleEntityGateway
  extends BaseDrizzleGateway<
    Entity,
    EntitySelect,
    EntityInsert,
    typeof entities
  >
  implements EntityGateway
{
  findByParentIdCursor(
    parentId: string,
    options?: {
      limit?: number;
      cursor?: { id: string; createdAt: Date } | null;
    },
  ): Effect.Effect<CursorPaginatedResult<Entity>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = Math.min(options?.limit ?? 20, 100);
        const cursor = options?.cursor;

        const conditions = [eq(this.table.parentId, parentId)];

        if (cursor) {
          conditions.push(
            or(
              lt(this.table.createdAt, cursor.createdAt),
              and(
                eq(this.table.createdAt, cursor.createdAt),
                lt(this.table.id, cursor.id),
              ),
            ),
          );
        }

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records
          .slice(0, limit)
          .map((r) => this.mapper.toDomain(r));

        const lastItem = items[items.length - 1];
        const nextCursor =
          hasMore && lastItem
            ? { id: lastItem.id, createdAt: lastItem.createdAt }
            : null;

        return { items, nextCursor, hasMore };
      },
      catch: (error) =>
        new DatabaseError({ operation: "findByParentIdCursor", cause: error }),
    });
  }
}
```

### Step 4: In-Memory Gateway (Testing)

```typescript
// packages/adapters/src/entity/gateways/in-memory/gateway.ts
import { Effect } from "effect";
import type {
  EntityGateway,
  CursorPaginatedResult,
} from "@mirai-app/use-cases";
import { Entity, type EntityId } from "@mirai-app/domain";
import { InMemoryGateway } from "../../../system/shared/gateways/in-memory-base";

export class InMemoryEntityGateway
  extends InMemoryGateway<Entity>
  implements EntityGateway
{
  findByParentIdCursor(
    parentId: string,
    options?: {
      limit?: number;
      cursor?: { id: string; createdAt: Date } | null;
    },
  ): Effect.Effect<CursorPaginatedResult<Entity>, never, never> {
    const limit = options?.limit ?? 20;
    const cursor = options?.cursor;

    let items = this.getAllItems().filter((e) => e.parentId === parentId);

    // Sort by createdAt DESC, id DESC
    items.sort((a, b) => {
      const dateCompare = b.createdAt.getTime() - a.createdAt.getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });

    // Apply cursor filter
    if (cursor) {
      const cursorIndex = items.findIndex(
        (e) =>
          e.id === cursor.id &&
          e.createdAt.getTime() === cursor.createdAt.getTime(),
      );
      if (cursorIndex !== -1) {
        items = items.slice(cursorIndex + 1);
      }
    }

    const paginatedItems = items.slice(0, limit);
    const hasMore = items.length > limit;

    const lastItem = paginatedItems[paginatedItems.length - 1];
    const nextCursor =
      hasMore && lastItem
        ? { id: lastItem.id, createdAt: lastItem.createdAt }
        : null;

    return Effect.succeed({ items: paginatedItems, nextCursor, hasMore });
  }
}
```

### Step 5: GraphQL Layer (Pothos Resolver)

```typescript
// packages/frameworks/src/graphql/resolvers/entity.ts
import { builder } from "../builder";
import { decodeCursorWithDate, encodeCursor } from "@mirai-app/use-cases";

// Define the type if not already defined
const EntityType = builder.node("Entity", {
  id: { resolve: (e) => e.id },
  loadOne: (id, ctx) => ctx.controllers.entityController.getById(id),
  fields: (t) => ({
    // ... entity fields
  }),
});

// Connection field
builder.queryField("entities", (t) =>
  t.connection({
    type: EntityType,
    args: {
      parentId: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const controller = ctx.controllers.entityController;

      const afterCursor = args.after ? decodeCursorWithDate(args.after) : null;

      const result = await controller.findByParentId({
        parentId: args.parentId,
        first: args.first ?? 20,
        after: afterCursor,
      });

      return {
        edges: result.items.map((item) => ({
          node: item,
          cursor: encodeCursor({
            id: item.id,
            createdAt: item.createdAt.toISOString(),
          }),
        })),
        pageInfo: {
          hasNextPage: result.hasMore,
          hasPreviousPage: !!args.after, // Simplified
          startCursor: result.items[0]
            ? encodeCursor({
                id: result.items[0].id,
                createdAt: result.items[0].createdAt.toISOString(),
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

### Step 6: Controller (Adapter Pattern)

```typescript
// packages/adapters/src/entity/controllers/controller.ts
import { Effect } from "effect";
import { EntityGatewayTag } from "@mirai-app/use-cases";

export class EntityController {
  async findByParentId(input: {
    parentId: string;
    first?: number;
    after?: { id: string; createdAt: Date } | null;
  }): Promise<{
    items: Entity[];
    hasMore: boolean;
    nextCursor: { id: string; createdAt: Date } | null;
  }> {
    const program = Effect.gen(function* () {
      const gateway = yield* EntityGatewayTag;

      const result = yield* gateway.findByParentIdCursor(input.parentId, {
        limit: input.first,
        cursor: input.after,
      });

      return result;
    }).pipe(Effect.provide(this.appLayer));

    return await Effect.runPromise(program);
  }
}
```

---

## Testing Patterns

### Unit Test: Cursor Encoding

```typescript
// packages/use-cases/src/system/utils/cursor.test.ts
import { describe, it, expect } from "bun:test";
import { encodeCursor, decodeCursor, decodeCursorWithDate } from "./cursor";

describe("[UNIT] Cursor Utils", () => {
  it("encodes and decodes cursor correctly", () => {
    const data = { id: "123", createdAt: "2024-01-15T10:30:00.000Z" };
    const encoded = encodeCursor(data);
    const decoded = decodeCursor(encoded);
    expect(decoded).toEqual(data);
  });

  it("returns null for invalid cursor", () => {
    expect(decodeCursor("invalid")).toBeNull();
    expect(decodeCursor("!!!")).toBeNull();
    expect(decodeCursor("")).toBeNull();
  });

  it("produces URL-safe output", () => {
    const data = { id: "test-123", createdAt: new Date().toISOString() };
    const encoded = encodeCursor(data);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("decodes cursor with Date object", () => {
    const data = { id: "123", createdAt: "2024-01-15T10:30:00.000Z" };
    const encoded = encodeCursor(data);
    const decoded = decodeCursorWithDate(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe("123");
    expect(decoded?.createdAt).toBeInstanceOf(Date);
    expect(decoded?.createdAt.toISOString()).toBe(data.createdAt);
  });
});
```

### Unit Test: Gateway Pagination

```typescript
// packages/adapters/src/entity/gateways/in-memory/gateway.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { InMemoryEntityGateway } from "./gateway";
import { Entity } from "@mirai-app/domain";

describe("[UNIT] InMemoryEntityGateway Pagination", () => {
  let gateway: InMemoryEntityGateway;

  beforeEach(() => {
    gateway = new InMemoryEntityGateway();
  });

  it("returns paginated results with cursor", async () => {
    // Seed test data
    const entities = Array.from({ length: 25 }, (_, i) =>
      Entity.create({
        id: `entity-${String(i).padStart(3, "0")}`,
        parentId: "parent-1",
        createdAt: new Date(2024, 0, i + 1),
      }),
    );
    await Effect.runPromise(gateway.seed(entities));

    // First page
    const page1 = await Effect.runPromise(
      gateway.findByParentIdCursor("parent-1", { limit: 10 }),
    );

    expect(page1.items).toHaveLength(10);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).not.toBeNull();

    // Second page using cursor
    const page2 = await Effect.runPromise(
      gateway.findByParentIdCursor("parent-1", {
        limit: 10,
        cursor: page1.nextCursor,
      }),
    );

    expect(page2.items).toHaveLength(10);
    expect(page2.items[0].id).not.toBe(page1.items[0].id);

    // Verify no overlap
    const page1Ids = new Set(page1.items.map((e) => e.id));
    const page2Ids = new Set(page2.items.map((e) => e.id));
    const intersection = [...page1Ids].filter((id) => page2Ids.has(id));
    expect(intersection).toHaveLength(0);
  });

  it("returns hasMore=false on last page", async () => {
    const entities = Array.from({ length: 5 }, (_, i) =>
      Entity.create({
        id: `entity-${i}`,
        parentId: "parent-1",
        createdAt: new Date(2024, 0, i + 1),
      }),
    );
    await Effect.runPromise(gateway.seed(entities));

    const result = await Effect.runPromise(
      gateway.findByParentIdCursor("parent-1", { limit: 10 }),
    );

    expect(result.items).toHaveLength(5);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });
});
```

---

## Migration Checklist

When adding cursor pagination to a new domain:

- [ ] Create `EntityConnectionType` using `builder.connectionObject()` in types.ts
- [ ] Update query resolver to use `normalizePaginationArgs()` and `buildConnection()`
- [ ] Import utilities from `../../utils/connections`
- [ ] Test the GraphQL query with `first` and `after` arguments

## Project Status

**Completed Big Bang Migration (April 2025):**
All domains now use Relay cursor-based pagination exclusively:

- TripConnection/TripEdge
- UserConnection/UserEdge
- GroupConnection/GroupEdge
- ChallengeConnection/ChallengeEdge
- SubmissionConnection/SubmissionEdge
- RewardConnection/RewardEdge
- NotificationConnection/NotificationEdge
- CoinTransactionConnection/CoinTransactionEdge
- ActivityFeedConnection/ActivityFeedEdge

**Legacy types removed:**
- `PaginatedTrips`, `PaginatedUsers`, `PaginatedGroups`, etc.
- `PaginationInput` and `PaginationInfo` input/object types
- All `Paginated*DTO` interfaces from use-cases layer

---

## References

- [Relay Cursor Connections Spec](https://relay.dev/graphql/connections.htm)
- [GraphQL Pagination Best Practices](https://graphql.org/learn/pagination/)
- [Pothos Relay Plugin Docs](https://pothos-graphql.dev/docs/plugins/relay)
