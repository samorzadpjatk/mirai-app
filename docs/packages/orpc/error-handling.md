# oRPC Error Handling

## Overview

This document covers error handling patterns in oRPC.

## ORPCError Types

oRPC provides standard error codes via `ORPCError`:

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
import { ORPCError } from "@orpc/server";

throw new ORPCError('NOT_FOUND', {
  message: 'User not found',
});
```

### With Cause

```typescript
throw new ORPCError('INTERNAL_SERVER_ERROR', {
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
      throw new ORPCError('NOT_FOUND', {
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
      throw new ORPCError('CONFLICT', {
        message: 'User with this email already exists',
      });
    }

    const [created] = await ctx.db.insert(users).values(input).returning();
    return created;
  })
```

### Unauthorized

```typescript
protectedProcedure: os.middleware(async ({ context, next }) => {
    if (!context.user) {
      throw new ORPCError('UNAUTHORIZED', {
        message: 'You must be logged in to access this resource',
      });
    }
    return next({ context });
  })
```

### Forbidden

```typescript
adminProcedure: os.middleware(async ({ context, next }) => {
    if (context.user.role !== 'admin') {
      throw new ORPCError('FORBIDDEN', {
        message: 'Admin access required',
      });
    }
    return next({ context });
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
      throw new ORPCError('BAD_REQUEST', {
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
import { orpc } from '@mirai-app/orpc/client';

function UserProfile({ userId }: { userId: string }) {
  const { data, error, isError } = orpc.user.getById.useQuery(
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
interface ORPCClientError {
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
// packages/orpc/src/api/trpc.ts
import { os, ORPCError } from "@orpc/server";

// oRPC error handling is configured on the handler/server side
// Custom interceptors can be added to the RPCHandler
const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error): void => {
      console.error(error);
      if (!dev && !(error instanceof ORPCError)) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Internal server error" });
      }
    }),
  ],
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
// packages/orpc/src/api/trpc.ts
// Global error handling is done via RPCHandler interceptors
const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error): void => {
      console.error(error);
      
      // Send to error tracking service
      if (error instanceof ORPCError && error.code === 'INTERNAL_SERVER_ERROR') {
        errorTracker.captureException(error);
      }
    }),
  ],
});
```

## Further Reading

- [oRPC Error Handling Docs](https://orpc.unnoq.com/docs/error-handling)
- [Procedures](./procedures.md)
- [Middleware](./middleware.md)
