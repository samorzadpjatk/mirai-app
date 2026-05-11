# oRPC Middleware

## Overview

Middleware in oRPC allows you to run code before/after procedures, handle authentication, logging, and more.

## Built-in Middleware

The package provides pre-configured middleware:

### Authentication Middleware

```typescript
// packages/trpc/src/middleware/auth.ts
import { middleware } from '../trpc';
import { TRPCError } from '@trpc/server';

export const authMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now guaranteed to exist
    }
  });
});
```

### Logger Middleware

```typescript
// packages/trpc/src/middleware/logger.ts
export const loggerMiddleware = middleware(async ({ path, type, next }) => {
  const start = Date.now();
  
  console.log(`→ ${type} ${path}`);
  
  const result = await next();
  
  const duration = Date.now() - start;
  console.log(`← ${type} ${path} - ${duration}ms`);
  
  return result;
});
```

## Creating Procedures with Middleware

```typescript
// packages/trpc/src/procedures.ts
import { procedure } from './trpc';
import { authMiddleware } from './middleware/auth';
import { loggerMiddleware } from './middleware/logger';

// Public procedure (no auth)
export const publicProcedure = procedure
  .use(loggerMiddleware);

// Protected procedure (requires auth)
export const protectedProcedure = procedure
  .use(loggerMiddleware)
  .use(authMiddleware);

// Admin-only procedure
export const adminProcedure = protectedProcedure
  .use(async ({ ctx, next }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }
    return next();
  });
```

## Using Middleware in Routers

```typescript
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';

export const userRouter = router({
  // No auth required
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findMany();
  }),
  
  // Auth required
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // ctx.user is guaranteed to exist
      return ctx.prisma.user.create({ data: input });
    }),
    
  // Admin only
  deleteAll: adminProcedure
    .mutation(async ({ ctx }) => {
      return ctx.prisma.user.deleteMany();
    }),
});
```

## Composing Middleware

### Sequential Composition

```typescript
const myProcedure = procedure
  .use(loggerMiddleware)      // Runs first
  .use(rateLimitMiddleware)   // Runs second
  .use(authMiddleware);       // Runs third
```

### Conditional Middleware

```typescript
const conditionalProcedure = procedure
  .use(async ({ ctx, type, next }) => {
    // Only apply to mutations
    if (type === 'mutation') {
      // Add validation logic
    }
    return next();
  });
```

## Context Extension

Middleware can add to the context:

```typescript
export const withOrganization = middleware(async ({ ctx, next }) => {
  const organization = await ctx.prisma.organization.findFirst({
    where: { members: { some: { userId: ctx.user.id } } }
  });
  
  return next({
    ctx: {
      ...ctx,
      organization,
    }
  });
});

// Usage
const orgProcedure = protectedProcedure.use(withOrganization);

// In router
getOrg: orgProcedure.query(async ({ ctx }) => {
  return ctx.organization; // Available here
});
```

## Error Handling in Middleware

```typescript
export const errorHandler = middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    // Log error
    console.error('Procedure failed:', error);
    
    // Re-throw to let oRPC handle it
    throw error;
  }
});
```

## Best Practices

1. **Order matters** - Middleware runs in the order they're chained
2. **Keep middleware focused** - One concern per middleware
3. **Don't swallow errors** - Let oRPC handle errors appropriately
4. **Use type-safe context** - Extend context types properly
5. **Document middleware** - Explain what each one does

## Middleware Order

Typical order for a protected procedure:

```
1. Logger      - Log request start
2. Rate Limit  - Check rate limits
3. Auth        - Validate authentication
4. Validation  - Zod input validation (built-in)
5. Your Code   - Actual procedure
6. Logger      - Log request end
```

## Further Reading

- [Procedures](./procedures.md)
- [Router Structure](./router-structure.md)
- [Error Handling](./error-handling.md)
