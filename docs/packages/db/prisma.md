# Prisma Setup and Usage

## Overview

This document covers the Prisma ORM setup and usage patterns in the MIRAI project.

## Prisma Configuration

### Schema Location

```
packages/db/prisma/schema.prisma
```

### Configuration File

```typescript
// packages/db/prisma/config.ts
import path from 'path';

export default {
  schema: path.join(__dirname, 'schema.prisma'),
};
```

## Prisma Client

### Client Instance

```typescript
// packages/db/src/client.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});
```

### Connection Pooling (Production)

```typescript
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling via pgBouncer
});
```

## Query Patterns

### Basic Queries

```typescript
import { prisma } from '@mirai-app/db';

// Find many
const users = await prisma.user.findMany();

// Find unique
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// Create
const newUser = await prisma.user.create({
  data: { email: 'user@example.com', name: 'John' }
});

// Update
const updated = await prisma.user.update({
  where: { id: userId },
  data: { name: 'Jane' }
});

// Delete
await prisma.user.delete({
  where: { id: userId }
});
```

### Relations

```typescript
// Include relations
const userWithPosts = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    posts: true,
    profile: true,
  }
});

// Nested create
const userWithPost = await prisma.user.create({
  data: {
    email: 'user@example.com',
    posts: {
      create: { title: 'Hello World' }
    }
  }
});
```

### Transactions

```typescript
// Sequential operations
const [user, post] = await prisma.$transaction([
  prisma.user.create({ data: { email: 'user@example.com' } }),
  prisma.post.create({ data: { title: 'Hello' } })
]);

// Interactive transactions
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ ... });
  await tx.profile.create({ userId: user.id, ... });
});
```

## Middleware

```typescript
// packages/db/src/client.ts
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
  return result;
});
```

## Best Practices

1. **Always use the exported client**: `import { prisma } from '@mirai-app/db'`
2. **Handle disconnects**: Call `prisma.$disconnect()` when shutting down
3. **Use transactions** for multi-step operations
4. **Select specific fields** to reduce data transfer

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct connection (for migrations) |

## Further Reading

- [Prisma Documentation](https://www.prisma.io/docs)
- [Migrations Guide](./migrations.md)
- [Schema Conventions](./schema.md)
