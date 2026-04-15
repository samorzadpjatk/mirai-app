# Framework Layer — Quick Reference

> **DI wiring, Layer composition, and framework configuration for the Mirai App monorepo**
>
> This document complements **CLAUDE.md §10.4** with practical patterns for the Frameworks layer.

---

## Layer Composition (Effect)

The Frameworks layer composes Effect Layers for dependency injection:

```ts
// packages/frameworks/src/layers/app-layer.ts
import { Layer } from "effect";
import { RepositoryLive } from "@mirai-app/adapters";
import { DatabaseLive, LoggerLive } from "./infrastructure";

// Compose layers from right to left (inner → outer)
export const AppLayer = RepositoryLive.pipe(
  Layer.provide(DatabaseLive),
  Layer.provide(LoggerLive),
);
```

**Key rule:** Frameworks layer wires infrastructure, never contains business logic.

---

## Controller Factory Pattern

Controllers are instantiated with Effect Layers. **Access controllers via `ctx.controllers`.**

```ts
// packages/frameworks/src/context.ts
import { createControllers } from "@mirai-app/adapters";

export interface GraphQLContext {
  controllers: Controllers;
  appLayer: Layer.Layer<unknown>;
  request: Request;
  authContext?: AuthContext;
  runtime: GraphQLRuntime;
}

// Create controllers with the appLayer
const controllers = createControllers({ appLayer, supabase });
```

---

## Scope Strategy

| Scope     | Use for                          | Lifetime         |
| --------- | -------------------------------- | ---------------- |
| SINGLETON | Repositories, stateless services | One per app      |
| SCOPED    | Controllers, use cases           | One per request  |
| TRANSIENT | Utilities, factories             | New each resolve |

---

## DI Wiring Examples

### Controller Access (routers)

```ts
// In tRPC router: access controller from context
export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
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

### Test Context Setup

```ts
// In tests: create test context with mocked controllers
import { createTestContext } from "@mirai-app/frameworks/testing";

const ctx = createTestContext({
  controllers: {
    userController: new MockUserController(),
  },
});
```

---

## Troubleshooting

### Effect runtime errors

- **Validate:** Ensure all Layers are provided before calling `Effect.runPromise`
- **Fix:** Add missing `Layer.provide()` calls in composition chain

### Controller access failures

- **Validate:** Check controller is accessed via `ctx.controllers.controllerName`
- **Fix:** Ensure context factory properly instantiates all controllers

### Scope violations

- **Validate:** Repositories are SINGLETON, Controllers are SCOPED
- **Fix:** Adjust Lifetime in Layer definitions

---

## Deep Reference

For comprehensive framework patterns, see **CLAUDE.md**:

- **§5.4:** Frameworks Layer — Layer composition, DI integration, awilix-modular patterns
- **§10.4:** Layer Composition and DI Integration — Effect + awilix-modular integration
- **§10.7:** Effect Pattern Quick Reference — Running Effects with runPromise
- **§11:** Summary of Architectural Guarantees

---

**Last Updated:** 2026-04-14  
**Version:** 1.0.0
