# tRPC Router Structure

## Overview

This document explains how tRPC routers are organized and composed in the MIRAI project.

## Router Hierarchy

```
appRouter (root)
├── userRouter
│   ├── list
│   ├── getById
│   ├── create
│   └── update
├── postRouter
│   ├── list
│   ├── getById
│   ├── create
│   └── delete
└── ...
```

## Root Router

```typescript
// packages/trpc/src/routers/index.ts
import { router } from '../trpc';
import { userRouter } from './user';
import { postRouter } from './post';

export const appRouter = router({
  user: userRouter,
  post: postRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;
```

## Sub-Router Pattern

```typescript
// packages/trpc/src/routers/user.ts
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const userRouter = router({
  // Queries
  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.prisma.user.findMany();
    }),
    
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.user.findUnique({
        where: { id: input.id }
      });
    }),
    
  // Mutations
  create: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.user.create({ data: input });
    }),
    
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return ctx.prisma.user.update({
        where: { id },
        data,
      });
    }),
});
```

## Router Composition

### Adding a New Router

1. **Create router file**:
   ```typescript
   // packages/trpc/src/routers/product.ts
   import { router, publicProcedure } from '../trpc';
   
   export const productRouter = router({
     list: publicProcedure.query(async ({ ctx }) => {
       return ctx.prisma.product.findMany();
     }),
   });
   ```

2. **Add to root router**:
   ```typescript
   // packages/trpc/src/routers/index.ts
   import { productRouter } from './product';
   
   export const appRouter = router({
     user: userRouter,
     post: postRouter,
     product: productRouter, // Add here
   });
   ```

3. **Client automatically updates** via TypeScript inference

## Naming Conventions

### Procedures

| Type | Naming | Example |
|------|--------|---------|
| List | `list` or `getAll` | `user.list` |
| Get one | `getById` or `getBySlug` | `user.getById` |
| Create | `create` | `user.create` |
| Update | `update` | `user.update` |
| Delete | `delete` or `remove` | `user.delete` |
| Search | `search` | `user.search` |

### Routers

- Use noun form, singular: `user`, `post`, `product`
- Group related functionality
- Keep routers focused (5-10 procedures per router)

## Router Organization

```
packages/trpc/src/routers/
├── index.ts          # Root router export
├── user.ts           # User procedures
├── post.ts           # Post procedures
├── product.ts        # Product procedures
└── _utils.ts         # Shared router utilities
```

## Client Usage

```typescript
// The router structure maps to client API
const trpc = createTRPCReact<AppRouter>();

// Queries
trpc.user.list.useQuery();
trpc.user.getById.useQuery({ id: '123' });

// Mutations
const createUser = trpc.user.create.useMutation();
createUser.mutate({ email: 'user@example.com', name: 'John' });
```

## Best Practices

1. **Keep routers small** - Split when you have >10 procedures
2. **Use consistent naming** - Follow the conventions above
3. **Group by domain** - Not by CRUD operation
4. **Version in router name** if needed: `userV2Router`
5. **Document with JSDoc** for complex procedures

## Further Reading

- [Procedures](./procedures.md)
- [Middleware](./middleware.md)
- [Error Handling](./error-handling.md)
