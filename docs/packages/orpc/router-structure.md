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
// packages/orpc/src/api/routers/user/index.ts
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
├── user/             # User procedures
├── post/             # Post procedures
├── product/          # Product procedures
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

1. **Keep routers small** - Split when you have >10 procedures OR >1000 lines
2. **Enforce file size limits** - Router files >1000 lines violate SRP and are hard to review/test safely
3. **Split pattern**: Extract into `*Queries.ts`, `*Mutations.ts`, `*Enrichment.ts` files
4. **Completed splits**: `activityFeed.ts` → `activityFeed/`, `group.ts` → `group/`, `location.ts` → `location/`, `challengeSubmission.ts` → `challengeSubmission/`, `reward.ts` → `reward/`
5. **Use consistent naming** - Follow the conventions above
6. **Group by domain** - Not by CRUD operation
7. **Version in router name** if needed: `userV2Router`
8. **Document with JSDoc** for complex procedures

## Router Directory Module Pattern

Established convention for splitting monolithic oRPC router files:

```
packages/orpc/src/api/routers/{name}/
├── index.ts      # exports router, wires .input().handler() to extracted functions
├── types.ts      # Zod schemas, type aliases (may be empty if no shared types)
├── queries.ts    # async handler functions for .query() procedures
├── mutations.ts  # async handler functions for .mutation() procedures
├── utils.ts      # helper functions (may be empty)
```

**Import path fixes when moving from flat file to directory**:
- `../../api/trpc` → `../../trpc` (drop `api/` because we're already inside `api/`)
- `../../utils/*` → `../../../utils/*` (one extra level up)
- `../../services/*` → `../../../services/*`

**Module resolution**: TypeScript/Bun resolves `./routers/coin` to `./routers/coin/index.ts` automatically. No changes needed in `root.ts` or test imports.

### Context Type Narrowing in Extracted Handlers

When extracting inline `.handler()` bodies to standalone functions in `queries.ts`/`mutations.ts`:

**Problem**: The oRPC context includes `db: DB`, but some handlers also accept `db: TransactionDB` when called from within a transaction wrapper. Typing the function parameter as `DB | TransactionDB` can cause assignability errors with helper functions that expect only `DB`.

**Solution**: Define a base context type with `db: DB` for helpers. In the handler function signatures, use `DB | TransactionDB` only when the function itself calls `.transaction()`. Pass `{ db: tx }` explicitly when calling helpers from inside a transaction.

### Verification Checklist for Router Splits

- [ ] All 5 files created (index, types, queries, mutations, utils)
- [ ] Original `.ts` file deleted
- [ ] No `.ts` files remain in `packages/orpc/src/api/routers/` (only directories)
- [ ] `tsc --noEmit` passes in `packages/orpc`
- [ ] Tests for the specific router pass
- [ ] Regexes and string literals match the original character-by-character
- [ ] `root.ts` needs no import path changes (directory resolution handles it)

**Completed splits in this repo**: `activityFeed`, `challenge`, `challengeSubmission`, `group`, `location`, `reward`, `user`, `coin`, `coinTransaction`, `notificationDelivery`, `notificationSender`, `notifications`, `notificationSchedule`, `sponsor`, `storage`, `submissionReport`, `trip`, `challengeVote`.

## Further Reading

- [Procedures](./procedures.md)
- [Middleware](./middleware.md)
- [Error Handling](./error-handling.md)
