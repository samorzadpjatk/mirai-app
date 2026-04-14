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

## awilix-modular Module Structure

The monorepo uses **awilix-modular** for framework-level DI. **Resolution is string-token based only.**

```ts
// packages/frameworks/src/modules/controller-module.ts
import { createStaticModule } from "awilix-modular";
import { Lifetime } from "awilix";
import { RepositoryModule } from "./repository-module";

export const ControllerModule = createStaticModule({
  name: "ControllerModule",
  imports: [RepositoryModule],
  providers: {
    userController: {
      factory: (cradle) => new UserController(cradle.userRepository),
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: ["userController"],
});
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

### Container Resolution (routers)

```ts
// In tRPC router: resolve from request-scoped container
export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = ctx.container.resolve("userController");
      return controller.getById(input, ctx.container);
    }),
});
```

### Test Container Setup

```ts
// In tests: create isolated container with overrides
import { createTestContainer } from "@mirai-app/frameworks/di";
import { asClass } from "awilix";

const container = createTestContainer();
container.register({
  userRepository: asClass(InMemoryUserRepository).singleton(),
});
```

---

## Troubleshooting

### Effect runtime errors

- **Validate:** Ensure all Layers are provided before calling `Effect.runPromise`
- **Fix:** Add missing `Layer.provide()` calls in composition chain

### DI resolution failures

- **Validate:** Check token string matches registered provider name exactly
- **Fix:** Verify module exports include the token being resolved

### Scope violations

- **Validate:** Repositories are SINGLETON, Controllers are SCOPED
- **Fix:** Adjust Lifetime in module provider definitions

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
