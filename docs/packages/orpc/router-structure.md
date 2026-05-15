# oRPC Router Structure

## Overview

This document explains how oRPC routers are organized and composed in the MIRAI project.

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
// packages/orpc/src/api/root.ts
import { os } from "@orpc/server";
import { user } from './routers/user';
import { post } from './routers/post';

export const appRouter = os.contract({
  user,
  post,
});

// Export type for client
export type AppRouter = typeof appRouter;
```

## Sub-Router Pattern

```typescript
// packages/orpc/src/api/routers/user.ts
import { os } from "@orpc/server";
import { z } from 'zod';

export const userRouter = router({
  // Queries
  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.query.users.findMany();
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, input.id),
      });
    }),

  // Mutations
  create: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const [created] = await ctx.db.insert(users).values(input).returning();
      return created;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db.update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();
      return updated;
    }),
});
```

## Router Composition

### Adding a New Router

1. **Create router file**:
   ```typescript
   // packages/orpc/src/api/routers/product.ts
   import { os } from "@orpc/server";
   
    export const productRouter = router({
      list: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.query.products.findMany();
      }),
    });
   ```

2. **Add to root router**:
   ```typescript
   // packages/orpc/src/api/root.ts
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
packages/orpc/src/api/routers/
├── index.ts          # Root router export
├── user.ts           # User procedures
├── post.ts           # Post procedures
├── product.ts        # Product procedures
└── _utils.ts         # Shared router utilities
```

## Client Usage

```typescript
// The router structure maps to client API via QueryProvider
import { orpc } from "@mirai-app/orpc/client";

// Queries
orpc.user.list.useQuery();
orpc.user.getById.useQuery({ id: '123' });

// Mutations
const createUser = orpc.user.create.useMutation();
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
