# oRPC Procedures

## Overview

This document covers oRPC procedure patterns for queries and mutations.

## Procedure Types

### Public Procedures

Available to all clients:

```typescript
import { os } from "@orpc/server";

export const user = os
  .route({
    list: os.handler(async ({ context }) => {
      return context.db.query.users.findMany();
    }),
    getById: os
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        return context.db.query.users.findFirst({,
  });
```

### Protected Procedures

Require authentication:

```typescript
import { os } from "@orpc/server";
import { authMiddleware } from './middleware/auth';

export const user = os
  .middleware(authMiddleware)
  .route({
    create: os
      .input(z.object({ name: z.string() }))
      .handler(async ({ input, context }) => {
        // context.user is guaranteed to exist
        const [created] = await context.db.insert(users).values({
          ...input,
          createdBy: context.user.id,
        }).returning();
        return created;
      }),
  });
```

## Query Procedures

### Basic Query

```typescript
list: publicProcedure
  .query(async ({ ctx }) => {
    return ctx.db.query.users.findMany();
  })
```

### With Input Validation

```typescript
getById: publicProcedure
  .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      return context.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, input.id),
    });
  })
```

### With Pagination

```typescript
list: publicProcedure
  .input(z.object({
    cursor: z.string().optional(),
    limit: z.number().min(1).max(100).default(20),
  }))
  .query(async ({ input, ctx }) => {
    const userList = await ctx.db.query.users.findMany({
      limit: input.limit + 1,
      offset: input.cursor ? parseInt(input.cursor, 10) : 0,
    });

    let nextCursor: typeof input.cursor = undefined;
    if (userList.length > input.limit) {
      const nextItem = userList.pop();
      nextCursor = nextItem!.id;
    }

    return { users: userList, nextCursor };
  })
```

### With Filtering

```typescript
search: publicProcedure
  .input(z.object({
    query: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }))
  .query(async ({ input, ctx }) => {
    const conditions = [];
    if (input.query) {
      conditions.push(or(ilike(users.name, `%${input.query}%`), ilike(users.email, `%${input.query}%`)));
    }
    if (input.status) {
      conditions.push(eq(users.status, input.status));
    }
    return ctx.db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
    });
  })
```

## Mutation Procedures

### Create

```typescript
create: protectedProcedure
  .input(z.object({
    email: z.string().email(),
    name: z.string().min(1).max(100),
  }))
  .handler(async ({ input, context }) => {
      const [created] = await context.db.insert(users).values(input).returning();
      return created;
    })
```

### Update

```typescript
update: protectedProcedure
  .input(z.object({
    id: z.string(),
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
  }))
  .handler(async ({ input, context }) => {
      const { id, ...data } = input;
      const [updated] = await context.db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  })
```

### Delete

```typescript
delete: protectedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
      const [deleted] = await context.db.delete(users)
      .where(eq(users.id, input.id))
      .returning();
    return deleted;
  })
```

## Input Validation

### Zod Schemas

```typescript
import { z } from 'zod';

// Reusable schemas
const userIdSchema = z.object({ id: z.string() });
const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

// Using in procedures
getById: publicProcedure
  .input(userIdSchema)
  .query(async ({ input }) => { ... })

create: protectedProcedure
  .input(userCreateSchema)
  .mutation(async ({ input }) => { ... })
```

### Transform Input

```typescript
create: protectedProcedure
  .input(z.object({
    email: z.string().email(),
  }).transform((data) => ({
    ...data,
    email: data.email.toLowerCase(),
  })))
  .mutation(async ({ input }) => {
    // input.email is now lowercase
  })
```

## Context Usage

```typescript
query: publicProcedure
  .query(async ({ ctx }) => {
    // Available in context:
    context.db          // Database client
    context.user        // Current user (if authenticated)
    context.req         // Request object (server)
    context.res         // Response object (server)
  })
```

## Best Practices

1. **Always validate input** with Zod schemas
2. **Use specific types** rather than `any`
3. **Return consistent shapes** for similar procedures
4. **Handle null/undefined** gracefully
5. **Use mutations** for any operation that changes data
6. **Document with JSDoc** for complex procedures

## Further Reading

- [Router Structure](./router-structure.md)
- [Middleware](./middleware.md)
- [Error Handling](./error-handling.md)
