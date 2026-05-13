# oRPC Error Handling

## Overview

This document covers error handling patterns in oRPC.

## TRPCError Types

oRPC provides standard error codes:

| Code | HTTP Status | Usage |
|------|-------------|-------|
| `BAD_REQUEST` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `TIMEOUT` | 408 | Request timeout |
| `CONFLICT` | 409 | Resource conflict |
| `PRECONDITION_FAILED` | 412 | Precondition failed |
| `PAYLOAD_TOO_LARGE` | 413 | Request too large |
| `METHOD_NOT_SUPPORTED` | 405 | HTTP method not allowed |
| `UNPROCESSABLE_CONTENT` | 422 | Unprocessable entity |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `CLIENT_CLOSED_REQUEST` | 499 | Client closed connection |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

## Throwing Errors

### Basic Error

```typescript
import { TRPCError } from '@trpc/server';

throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'User not found',
});
```

### With Cause

```typescript
throw new TRPCError({
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Failed to create user',
  cause: originalError,
});
```

## Common Patterns

### Not Found

```typescript
getById: publicProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input, ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, input.id),
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `User with id ${input.id} not found`,
      });
    }

    return user;
  })
```

### Conflict

```typescript
create: protectedProcedure
  .input(z.object({ email: z.string().email() }))
  .mutation(async ({ input, ctx }) => {
    const existing = await ctx.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, input.email),
    });

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User with this email already exists',
      });
    }

    const [created] = await ctx.db.insert(users).values(input).returning();
    return created;
  })
```

### Unauthorized

```typescript
protectedProcedure: procedure
  .use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }
    return next();
  })
```

### Forbidden

```typescript
adminProcedure: protectedProcedure
  .use(async ({ ctx, next }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }
    return next();
  })
```

### Validation Error

```typescript
create: protectedProcedure
  .input(z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }))
  .mutation(async ({ input, ctx }) => {
    // Zod handles validation automatically
    // But you can add custom validation:
    if (input.password === input.email) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Password cannot be the same as email',
      });
    }

    const [created] = await ctx.db.insert(users).values(input).returning();
    return created;
  })
```

## Client-Side Error Handling

### React Query Integration

```typescript
import { trpc } from '@mirai-app/orpc/client';

function UserProfile({ userId }: { userId: string }) {
  const { data, error, isError } = trpc.user.getById.useQuery(
    { id: userId },
    {
      retry: (failureCount, error) => {
        // Don't retry on 404
        if (error.data?.code === 'NOT_FOUND') return false;
        return failureCount < 3;
      }
    }
  );
  
  if (isError) {
    if (error.data?.code === 'NOT_FOUND') {
      return <div>User not found</div>;
    }
    return <div>Error: {error.message}</div>;
  }
  
  return <div>{data.name}</div>;
}
```

### Error Type

```typescript
// Error shape
interface TRPCClientError {
  message: string;
  code: string;
  data: {
    code: string;
    httpStatus: number;
    path?: string;
    stack?: string;
  };
}
```

## Error Formatters

### Custom Error Formatter

```typescript
// packages/trpc/src/trpc.ts
import { initTRPC } from '@trpc/server';

const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Add custom fields
        timestamp: new Date().toISOString(),
        // Hide stack in production
        stack: process.env.NODE_ENV === 'development' 
          ? shape.data.stack 
          : undefined,
      }
    };
  }
});
```

## Best Practices

1. **Use appropriate error codes** - Don't use INTERNAL_SERVER_ERROR for everything
2. **Provide helpful messages** - "User not found" not "Error"
3. **Don't leak sensitive info** - Don't expose internal details
4. **Log server errors** - But don't send stack traces to clients
5. **Handle errors gracefully** on the client

## Global Error Handler

```typescript
// packages/trpc/src/trpc.ts
const t = initTRPC.create({
  onError: ({ error, path, type }) => {
    // Log error
    console.error(`oRPC Error in ${type} ${path}:`, error);
    
    // Send to error tracking service
    if (error.code === 'INTERNAL_SERVER_ERROR') {
      errorTracker.captureException(error);
    }
  }
});
```

## Further Reading

- [oRPC Error Handling Docs](https://trpc.io/docs/error-handling)
- [Procedures](./procedures.md)
- [Middleware](./middleware.md)
