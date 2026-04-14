# Backend Server — Quick Reference

> **Agent instructions for apps/backend-server/**
>
> For universal conventions, see root `AGENTS.md`.
> For comprehensive DI and auth patterns, see `../packages/adapters/AGENTS.md`.

---

## tRPC Router Patterns

### Controller Resolution in Routers

Routers resolve controllers from the request-scoped container. No auth in middleware.

```ts
export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Resolve controller from DI container
      const controller = ctx.container.resolve("userController");
      return controller.getById(input, ctx.container);
    }),
});
```

### Router Template

```ts
import { createTRPCRouter, publicProcedure } from "@mirai-app/frameworks/trpc";
import { z } from "zod";

export const featureRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const controller = ctx.container.resolve("featureController");
    return controller.list(ctx.container);
  }),

  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const controller = ctx.container.resolve("featureController");
      return controller.create(input, ctx.container);
    }),
});
```

---

## Auth Flow

### Using requireAuth in Controllers

Auth happens in controllers using helper functions from `@mirai-app/adapters`:

```ts
import { requireAuth, requireAdmin, getOptionalAuth }
  from "@mirai-app/adapters";

async getById(input: GetByIdInput, di: DIContext) {
  // Throws TRPCError if missing/invalid
  const authContext = await requireAuth(di.headers, di);

  // Now authContext.userId, authContext.role available
  return await this.useCase.execute({ ...input, authContext });
}

// Admin-only endpoints:
async adminAction(input: AdminInput, di: DIContext) {
  const authContext = await requireAdmin(di.headers, di);
  // ...
}
```

---

## Testing

Backend-server tests live in `src/__tests__/` and test integration of tRPC + DI + auth.

---

## Deep Reference

For comprehensive backend patterns:

- See `../packages/adapters/AGENTS.md` for DI and auth patterns
- `CLAUDE.md` §5.5: Authentication & Authorization patterns
- `CLAUDE.md` §10.3: Error conversion at boundaries
- `CLAUDE.md` §10.7: Running Effects with runPromise
