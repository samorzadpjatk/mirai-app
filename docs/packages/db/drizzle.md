# Drizzle Setup and Usage

## Overview

This document covers the Drizzle ORM setup and usage patterns in the MIRAI project.

## Drizzle Configuration

### Schema Location

```
packages/db/src/schema/
```

### Drizzle Kit Config

```typescript
// packages/db/drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/postgres",
  },
  casing: "snake_case",
  verbose: true,
  strict: true,
  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations__",
    schema: "public",
  },
});
```

## Drizzle Client

### Client Instance

```typescript
// packages/db/src/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof createDrizzleDb> | undefined;

const createDrizzleDb = (databaseUrl: string) => {
  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
};

export const createDb = (databaseUrl: string) => {
  _db ??= createDrizzleDb(databaseUrl);
  return _db;
};

export type DB = ReturnType<typeof createDb>;
export type TransactionDB = Parameters<Parameters<DB["transaction"]>[0]>[0];
```

### Connection (Production)

```typescript
import { createDb } from '@mirai-app/db';

const db = createDb(process.env.DATABASE_URL);
```

## Query Patterns

### Basic Queries

```typescript
import { createDb, users, eq } from '@mirai-app/db';

const db = createDb(process.env.DATABASE_URL);

// Find many
const allUsers = await db.query.users.findMany();

// Find first
const user = await db.query.users.findFirst({
  where: (u, { eq }) => eq(u.id, userId),
});

// Insert
const [newUser] = await db.insert(users).values({
  email: 'user@example.com',
  firstName: 'John',
}).returning();

// Update
const [updated] = await db.update(users)
  .set({ firstName: 'Jane' })
  .where(eq(users.id, userId))
  .returning();

// Delete
const [deleted] = await db.delete(users)
  .where(eq(users.id, userId))
  .returning();
```

### Relations

```typescript
// Include relations via query API
const userWithTrips = await db.query.users.findFirst({
  where: (u, { eq }) => eq(u.id, userId),
  with: {
    trips: true,
  },
});

// Insert with related data (use transactions)
const [createdUser] = await db.insert(users).values({
  email: 'user@example.com',
}).returning();
```

### Transactions

```typescript
// Sequential operations
const result = await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values({
    email: 'user@example.com',
  }).returning();

  const [post] = await tx.insert(posts).values({
    userId: user.id,
    title: 'Hello',
  }).returning();

  return { user, post };
});
```

## Best Practices

1. **Always use the exported client**: `import { createDb } from '@mirai-app/db'`
2. **Use transactions** for multi-step operations
3. **Select specific fields** to reduce data transfer using the query API
4. **Leverage Drizzle's type safety** - schema and queries are fully typed

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

## Further Reading

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Migrations Guide](./migrations.md)
- [Schema Conventions](./schema.md)
