# oRPC Procedures

## Overview

This document covers oRPC procedure patterns for queries and mutations.

## Procedure Types

### Public Procedures

Available to all clients:

```typescript
import { publicProcedure } from '../trpc';

export const userRouter = router({
  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.user.findMany();
    }),
});
```

### Protected Procedures

Require authentication:

```typescript
import { protectedProcedure } from '../trpc';

export const userRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // ctx.user is guaranteed to exist
      return ctx.prisma.user.create({
        data: { ...input, createdBy: ctx.user.id }
      });
    }),
});
```

## Query Procedures

### Basic Query

```typescript
list: publicProcedure
  .query(async ({ ctx }) => {
    return ctx.prisma.user.findMany();
  })
```

### With Input Validation

```typescript
getById: publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input, ctx }) => {
    return ctx.prisma.user.findUnique({
      where: { id: input.id }
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
    const users = await ctx.prisma.user.findMany({
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
    });
    
    let nextCursor: typeof input.cursor = undefined;
    if (users.length > input.limit) {
      const nextItem = users.pop();
      nextCursor = nextItem!.id;
    }
    
    return { users, nextCursor };
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
    return ctx.prisma.user.findMany({
      where: {
        AND: [
          input.query ? {
            OR: [
              { name: { contains: input.query, mode: 'insensitive' } },
              { email: { contains: input.query, mode: 'insensitive' } },
            ]
          } : undefined,
          input.status ? { status: input.status } : undefined,
        ].filter(Boolean),
      }
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
  .mutation(async ({ input, ctx }) => {
    return ctx.prisma.user.create({
      data: input,
    });
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
  .mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    return ctx.prisma.user.update({
      where: { id },
      data,
    });
  })
```

### Delete

```typescript
delete: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input, ctx }) => {
    return ctx.prisma.user.delete({
      where: { id: input.id }
    });
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
    ctx.prisma      // Database client
    ctx.user        // Current user (if authenticated)
    ctx.req         // Request object (server)
    ctx.res         // Response object (server)
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
