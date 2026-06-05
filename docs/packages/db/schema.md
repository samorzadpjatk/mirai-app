# Schema Design Conventions

## Overview

Conventions and best practices for designing the Drizzle schema.

## Naming Conventions

### Tables

- **camelCase, plural in code; snake_case in DB**: `users`, `events`, `tripParticipants`
- **Avoid abbreviations**: `users` not `usrs`

### Columns

- **camelCase in code; snake_case in DB**: `firstName` → `first_name`, `createdAt` → `created_at`
- **Boolean**: prefix with verb `is`, `has`, `can`: `isActive`, `hasAvatar`
- **Timestamps**: `createdAt`, `updatedAt`

### Relations

- **Descriptive relation names** when ambiguous, using `relationName`:
  ```typescript
  coinTransactionsAdmin: many(coinTransactions, {
    relationName: "UserCoinTransactionsAdmin",
  }),
  ```

## Schema Structure

### Table Template

```typescript
import { pgTable, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { randomUUID } from "../utils/uuid";

export const users = pgTable("users", {
  // Primary key
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),

  // Required fields
  authUserId: text("auth_user_id").notNull().unique(),
  firstName: text("first_name").notNull(),

  // Optional fields
  lastSeenOn: timestamp("last_seen_on", { withTimezone: true }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
});
```

### Field Ordering

1. Primary key (`id`)
2. Required fields
3. Optional fields
4. Timestamps (`createdAt`, `updatedAt`)

## Data Types

### IDs

```typescript
// UUID (recommended for most cases)
id: varchar("id", { length: 36 })
  .primaryKey()
  .$defaultFn(() => randomUUID()),

// Auto-increment (for internal/sequential data)
id: serial("id").primaryKey(),
```

### Strings

```typescript
// Short text
title: text("title").notNull(),

// Long text
description: text("description"),

// Enforced limits
slug: varchar("slug", { length: 100 }),
```

### Dates

```typescript
// Always use timestamp with timezone
createdAt: timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull(),
updatedAt: timestamp("updated_at", { withTimezone: true })
  .$onUpdate(() => new Date())
  .notNull(),
expiresAt: timestamp("expires_at", { withTimezone: true }),
```

### Booleans

```typescript
// Always default boolean values
isActive: boolean("is_active").default(true).notNull(),
isAdmin: boolean("is_admin").default(false).notNull(),
```

## Relations

### One-to-One

```typescript
// In schema file
export const profiles = pgTable("profiles", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id)
    .unique(),
});

// In relations file
export const usersRelations = relations(users, ({ one }) => ({
  profile: one(profiles),
}));
```

### One-to-Many

```typescript
// In schema file
export const posts = pgTable("posts", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  authorId: varchar("author_id", { length: 36 })
    .notNull()
    .references(() => users.id),
});

// In relations file
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));
```

### Many-to-Many

```typescript
// Junction table
export const postTags = pgTable(
  "post_tags",
  {
    postId: varchar("post_id", { length: 36 })
      .notNull()
      .references(() => posts.id),
    tagId: varchar("tag_id", { length: 36 })
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

// In relations file
export const postsRelations = relations(posts, ({ many }) => ({
  tags: many(tags),
}));
```

## Indexes

### When to Add Indexes

- **Foreign keys**: Always index relation fields
- **Search fields**: Index fields used in WHERE clauses
- **Unique constraints**: Use `.unique()` on columns

```typescript
export const posts = pgTable("posts", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  authorId: varchar("author_id", { length: 36 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  // Custom indexes
  index("posts_status_created_at_idx").on(table.status, table.createdAt),
  index("posts_author_id_status_idx").on(table.authorId, table.status),
]);
```

## Constraints

### Unique Constraints

```typescript
// Single field
email: text("email").unique(),

// Multiple fields (composite) - via table constraint
export const memberships = pgTable(
  "memberships",
  {
    organizationId: varchar("organization_id", { length: 36 }).notNull(),
    email: text("email").notNull(),
  },
  (table) => [unique().on(table.organizationId, table.email)],
);
```

## Soft Deletes

Pattern for soft deletion:

```typescript
export const users = pgTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  email: text("email").unique(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
```

Query with filter:
```typescript
import { isNull } from "drizzle-orm";

const activeUsers = await db.query.users.findMany({
  where: (u, { isNull }) => isNull(u.deletedAt),
});
```

## Schema Documentation

Add comments for clarity using JSDoc:

```typescript
/**
 * User account in the system
 */
export const users = pgTable("users", {
  /** Unique identifier (UUID) */
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),

  /** Email address used for login */
  email: text("email").unique(),
});
```

## Schema Refactor History

### 2026-06-04: Database Schema Cleanup

**Removed tables** (no active application references):
- `events` — Event management table (no runtime references, no router, no UI usage)
- `userEvents` — User-event relationship table (no runtime references, no router, no UI usage)

**Retained tables** (operational/telemetry):
- `userAgents` — User agent tracking for operational telemetry (documented as non-business data)

**Router restructuring**:
- `notificationDelivery` and `notificationSender` moved from `appRouter` to dedicated `serviceRouter`
- `submissionReport` router removed entirely (no UI calls it)
- `appRouter` now contains 15 public-facing routers
- `serviceRouter` contains 2 internal service-to-service routers

**Result**: 38 tables (down from 40), 15 client routers + 2 service routers.

## Schema Refactor Log

### 2026-06-04: Removed Unused Tables

The following tables were removed from the schema as they were not actively used by the application:

| Table | Reason | Migration |
|-------|--------|-----------|
| `events` | No active references in application code | `20260604170708_quick_warhawk.sql` |
| `userEvents` | No active references in application code | `20260604170708_quick_warhawk.sql` |

### Operational Tables

The following table is retained for operational telemetry but is not considered business data:

| Table | Purpose |
|-------|---------|
| `userAgents` | Stores user agent strings for operational analytics |

### Current Schema State

- **38 tables** (down from 40)
- Full table list: `packages/db/src/schema/index.ts`
- See `DB_SCHEMA_REFACTOR_PLAN.md` for complete refactor details

## Best Practices

1. **Use UUIDs** for external-facing IDs
2. **Always include timestamps** (createdAt, updatedAt)
3. **Index foreign keys** and frequently queried fields
4. **Use snake_case for database column names** via the first argument to column helpers
5. **Keep relations explicit** in a separate `relations.ts` file
6. **Validate at application layer** even with schema constraints
