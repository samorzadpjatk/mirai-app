# Adapter Layer — Quick Reference

> **DI patterns, controllers, and gateways for the Mirai App monorepo**
>
> This package contains tRPC controllers, database gateways, and awilix-modular DI configuration.

---

## Dependency injection (Effect-based)

The monorepo uses **Effect-based DI** with controllers instantiated per-request. **Controllers are accessed via `ctx.controllers`.**

### Quick reference

```ts
// In router: access controller from context
const controller = ctx.controllers.userController;
const result = await controller.getById(input);
if (!result.success) {
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
}
return result.data;

// In test: create test context with mocked controllers
const ctx = createTestContext({
  controllers: {
    userController: new MockUserController(),
  },
});
```

### Controller access in routers

```ts
export const userRouter = createTRPCRouter({
  getById: publicProcedure // ✅ Only procedure type
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Auth happens in controller, not middleware
      const controller = ctx.controllers.userController;
      const result = await controller.getById(input);
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error,
        });
      }
      return result.data;
    }),
});
```

### Effect Layer Composition

```ts
import { Layer } from "effect";

// Compose layers for dependency injection
export const AppLayer = Layer.mergeAll(RepositoryLive, ServiceLive, LoggerLive);

// Controllers are instantiated with the appLayer
export const controllers = createControllers({ appLayer });
```

### Scope strategy

| Scope     | Use for                          | Lifetime         |
| --------- | -------------------------------- | ---------------- |
| SINGLETON | Repositories, stateless services | One per app      |
| SCOPED    | Controllers, use cases           | One per request  |
| TRANSIENT | Utilities, factories             | New each resolve |

---

## Authentication in controllers

Controllers handle authentication using helper functions from `controller-helpers.ts`:

```typescript
import { requireAuth, requireAdmin, requireModerator, getOptionalAuth }
  from "@mirai-app/adapters";

// In controller method:
async getById(input: GetByIdInput, di: DIContext) {
  // Require authentication (throws TRPCError if missing/invalid)
  const authContext = await requireAuth(di.headers, di);

  // Now authContext.userId, authContext.role available
  return await this.useCase.execute({ ...input, authContext });
}

// For admin-only endpoints:
async adminAction(input: AdminInput, di: DIContext) {
  // Throws if not admin
  const authContext = await requireAdmin(di.headers, di);
  // ...
}
```

AuthContext is passed explicitly to use cases. No auth in tRPC middleware.

---

## Gateway patterns with Effect.tryPromise

Wrap external calls (Prisma, Supabase, HTTP APIs) with `Effect.tryPromise`:

```ts
import { Effect } from "effect";

// Gateway method pattern
findById(id: string): Effect.Effect<User | null, DatabaseError, never> {
  return Effect.tryPromise({
    try: () => this.prisma.user.findUnique({ where: { id } }),
    catch: (error) => new DatabaseError({ cause: error }),
  }).pipe(
    Effect.map((prismaUser) =>
      prismaUser ? this.mapper.toDomain(prismaUser) : null
    )
  );
}
```

Convert errors at boundaries — never let Prisma errors leak into use cases.

---

## BasePrismaRepository rules

If you use a shared base repository (e.g., `BasePrismaRepository`), it must remain **mechanical**:

- **Allowed:** CRUD boilerplate, query helpers, pagination helpers, transaction plumbing.
- **Not allowed:** business rules, invariants, authorization, domain decisions.
- **Mapping rule:** persistence ↔ domain mapping stays in **mappers**.
- **Invariant rule:** invariants live in **domain/use-cases**, not adapters.

---

## Deep Reference

For comprehensive adapter patterns, see CLAUDE.md:

- §5.3 Adapters Layer: Effect.tryPromise, error conversion
- §5.4 Frameworks Layer: awilix-modular integration
- §5.5 Authentication & Authorization: Controller patterns
- §10.5.3: Adapter/Gateway testing patterns
- §10.7: Effect Pattern Quick Reference — tryPromise, runPromise
