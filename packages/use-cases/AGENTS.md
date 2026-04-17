# Use Case Layer — Quick Reference

> **Effect-based orchestration layer**
>
> Orchestrates domain objects to accomplish business workflows. Uses Effect for composable, testable workflows with explicit dependencies.

---

## Universal Rules

- **TDD first:** Write the failing test before implementation
- **GraphQL workflow:** Never edit generated GraphQL clients, types, or operations. Only edit Pothos schema files, then sync schema, then regenerate client

---

## Logging in Effect

Use `EffectLogger` from `@mirai-app/shared` for all Effect-based logging:

```ts
import { EffectLogger } from "@mirai-app/shared";

// In Effect.gen blocks
const program = Effect.gen(function* () {
  yield* EffectLogger.info("Operation started", { userId: "123" });
  // ... logic
  yield* EffectLogger.error("Failed", error, { operation: "save" });
});
```

---

## Core Pattern: Effect.gen + yield\*

Use `Effect.gen` for sequential operations that may fail:

```ts
import { Effect, Data } from "effect";

// 1. Define tagged errors
export class EntityNotFoundError extends Data.TaggedError(
  "EntityNotFoundError",
)<{ entityId: string }>() {}

// 2. Use Effect.gen for orchestration
Effect.gen(function* () {
  // yield* extracts the value from Effect
  const repo = yield* MyEntityRepository;
  const entity = yield* repo.findById(id);

  if (!entity) {
    return yield* Effect.fail(new EntityNotFoundError({ entityId: id }));
  }

  return entity;
});
```

**Key rules:**

- Always use `function* ()` (generator function)
- Use `yield*` (with asterisk) to extract Effect values
- Return `Effect.fail()` for errors, never throw

---

## Context.Tag DI Pattern

Define repository/service interfaces as Context.Tags:

```ts
// packages/use-cases/src/{domain}/ports/MyEntityPort.ts
import { Context, Effect } from "effect";
import type { IMyEntityPort } from "@mirai-app/domain";

// Context.Tag for dependency injection - uses Tag suffix
export class MyEntityPortTag extends Context.Tag("MyEntityPort")<
  MyEntityPortTag,
  IMyEntityPort
>() {}
```

---

## Domain Ports vs Use Cases Ports

Mirai App uses a **two-layer port system** for Clean Architecture compliance with Effect DI.

### The Two-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│  Domain Layer: @mirai-app/domain/ports                        │
│  ─────────────────────────────────────                      │
│  - Pure TypeScript interfaces                                 │
│  - No dependencies, no Context.Tags                           │
│  - Defines WHAT operations exist                              │
│  - Example: UserRepository (interface)                        │
├─────────────────────────────────────────────────────────────┤
│  Use Cases Layer: packages/use-cases/src/{domain}/ports/      │
│  ────────────────────────────────────────────────            │
│  - Same interface as domain                                   │
│  - Adds Context.Tag for Effect DI                             │
│  - Enables `yield* UserPort`                                  │
│  - Enables `Layer.succeed` for testing                        │
│  - Example: UserPort (interface + Tag)                        │
└─────────────────────────────────────────────────────────────┘
```

### Why Both Layers Exist

| Concern          | Domain Ports              | Use Cases Ports            |
| ---------------- | ------------------------- | -------------------------- |
| **Purpose**      | Define contract (WHAT)    | Enable orchestration (HOW) |
| **Dependencies** | Zero external deps        | Effect Context only        |
| **DI**           | None                      | Context.Tag for `yield*`   |
| **Testing**      | Pure, no mocks            | Mock with `Layer.succeed`  |
| **Import**       | `@mirai-app/domain/ports` | Relative `./ports/*`       |

### Import Pattern

**From domain (type-only):**

```ts
// In use-cases port files
import type { UserRepository as DomainUserRepository } from "@mirai-app/domain/ports";
```

**From use-cases (interface + Tag):**

```ts
// In use case interactors
import { UserPort } from "../user/ports/UserPort";

// Usage in Effect.gen
const repo = yield * UserPort;
const user = yield * repo.findById(id);
```

### Tag Pattern

```ts
// packages/use-cases/src/user/ports/UserPort.ts
import type { IUserPort } from "@mirai-app/domain";
import { Context, Effect } from "effect";

// Context.Tag for dependency injection - Tag suffix
export class UserPortTag extends Context.Tag("UserPort")<
  UserPortTag,
  IUserPort
>() {}
```

### Clean Architecture Flow

```
Domain Port (interface)
      ↓
Use Cases Port (interface + Context.Tag)
      ↓
Adapter Implementation (DrizzleUserGateway)
      ↓
Framework Integration (DI container registration)
```

**Dependencies point inward:**

- Domain knows nothing about use cases
- Use cases know about Effect but nothing about Drizzle
- Adapters depend on domain interfaces
- Frameworks wire everything together

### Full Example

```ts
// packages/use-cases/src/user/interactors/GetUserWithTrips.ts
import { Effect, Data } from "effect";
import { UserPortTag } from "../ports/UserPort";
import { TripPortTag } from "../../trip/ports/TripPort";

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}>() {}

export class GetUserWithTripsUseCase {
  execute(userId: string) {
    return Effect.gen(function* () {
      // Get repositories from context - use Tag suffix
      const userRepo = yield* UserPortTag;
      const tripRepo = yield* TripPortTag;

      // Orchestrate domain operations
      const user = yield* userRepo.findById(userId);
      if (!user) {
        return yield* Effect.fail(new UserNotFoundError({ userId }));
      }

      const trips = yield* tripRepo.findByUserId(userId);

      return { user, trips };
    });
  }
}
```

### Reference

- [Ports and Adapters Pattern Guide](../../docs/ports-and-adapters-pattern.md)
- CLAUDE.md §5 - Clean Architecture layer conventions

---

## Inference-First Convention

Use cases follow the **inference-first** convention for return type annotations:

### Principles

1. **Port interfaces use explicit types** - contracts must be clear
2. **Use case implementations use inference** - let TypeScript infer from Effect.gen
3. **Error unions form naturally** - no need to manually construct union types

### Example

```ts
// Port interface (explicit - in domain layer)
export interface IUserPort {
  findById(id: string): Effect.Effect<User | null, IPortError, never>;
}

// Use case implementation (inferred - in use-cases layer)
export class GetUserUseCase {
  // No explicit return type
  execute(userId: string) {
    return Effect.gen(function* () {
      const userRepo = yield* UserPortTag;
      const user = yield* userRepo.findById(userId);
      // Inferred: Effect<User | null, UserNotFoundError | IPortError, UserPortTag>
      if (!user) {
        return yield* Effect.fail(new UserNotFoundError({ userId }));
      }
      return user;
    });
  }
}
```

### When to Use Explicit vs Inferred

| Context                         | Use Explicit | Use Inferred |
| ------------------------------- | ------------ | ------------ |
| Port interfaces (Domain)        | ✅ Always    | ❌ Never     |
| Port implementations (Adapters) | ❌ Never     | ✅ Always    |
| Use case interactors            | ❌ Never     | ✅ Always    |
| Effect.gen functions            | ❌ Never     | ✅ Always    |

---

## Use Case Template (Inference-First)

Use cases orchestrate domain operations using Effect.gen. Use **type inference** - do not add explicit return type annotations on the execute method.

```ts
// packages/use-cases/src/{domain}/interactors/DoSomething.ts
import { Effect, Data } from "effect";
import { MyEntityPortTag } from "../ports/MyEntityPort";

export class EntityNotFoundError extends Data.TaggedError(
  "EntityNotFoundError",
)<{ entityId: string }>() {}

export class DoSomethingUseCase {
  // No explicit return type - TypeScript infers from implementation
  // Inferred: Effect<SomethingResultDTO, EntityNotFoundError | IPortError, MyEntityPortTag>
  execute(input: DoSomethingInput) {
    return Effect.gen(function* () {
      const repo = yield* MyEntityPortTag; // Use Tag suffix

      const entity = yield* repo.findById(input.entityId);
      if (!entity) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityId: input.entityId }),
        );
      }

      const updated = yield* repo.save(entity);
      return SomethingResultDTO.fromDomain(updated);
    });
  }
}
```

**Key rules:**

- No explicit return type annotations on use case methods
- Let TypeScript infer from `Effect.gen` implementation
- Error types naturally compose from port errors + use case errors
- Dependencies declared implicitly via `yield* PortTag`

---

## Test Template with Layer.provide

Mock dependencies using `Layer.succeed` and `Effect.provide`:

```ts
import { describe, it, expect } from "bun:test";
import { Effect, Layer, Either } from "effect";
import { DoSomethingUseCase } from "./DoSomething";
import { MyEntityPortTag } from "../ports/MyEntityPort";

// Create mock repository layer
const createMockRepoLayer = () =>
  Layer.succeed(MyEntityPortTag, {
    findById: (id: string) => Effect.succeed(null),
    save: (entity: MyEntity) => Effect.succeed(entity),
    delete: (id: string) => Effect.succeed(void 0),
  });

describe("[UNIT] DoSomethingUseCase", () => {
  it("returns DTO on success", async () => {
    const useCase = new DoSomethingUseCase();
    const mockLayer = createMockRepoLayer();

    const program = useCase
      .execute({ entityId: "1" })
      .pipe(Effect.provide(mockLayer));

    const result = await Effect.runPromise(program);
    expect(result).toBeDefined();
  });

  it("fails with EntityNotFoundError", async () => {
    const useCase = new DoSomethingUseCase();
    const failingLayer = Layer.succeed(MyEntityPortTag, {
      findById: () => Effect.succeed(null), // Returns null
      save: (e: MyEntity) => Effect.succeed(e),
      delete: () => Effect.succeed(void 0),
    });

    const program = useCase
      .execute({ entityId: "nonexistent" })
      .pipe(Effect.provide(failingLayer));

    const either = await Effect.runPromise(Effect.either(program));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(EntityNotFoundError);
    }
  });
});
```

---

## Test Template with Container

For integration with awilix-modular DI:

```ts
import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { createTestContainer } from "@mirai-app/frameworks/di";
import { asClass } from "awilix";

describe("[UNIT] DoSomethingUseCase", () => {
  let container: any;

  beforeEach(() => {
    container = createTestContainer();
    container.register({
      myEntityPort: asClass(InMemoryMyEntityGateway).singleton(),
      doSomethingUseCase: asClass(DoSomethingUseCase).scoped(),
    });
  });

  it("returns DTO on success", async () => {
    const useCase = container.resolve("doSomethingUseCase");
    const dto = await Effect.runPromise(useCase.execute({ entityId: "1" }));
    expect(dto).toBeDefined();
  });
});
```

---

## Deep Reference

For comprehensive use case patterns, see **AGENTS.md** and **TESTING.md**:

- `packages/use-cases/AGENTS.md` (this file) — Effect.gen orchestration, Context.Tags
- `packages/frameworks/AGENTS.md` — Layer Composition and DI Integration
- `TESTING.md` — Testing Use Cases with Mock layers
- Root `AGENTS.md` — Effect Pattern Quick Reference

---

**Last Updated:** 2026-04-18  
**Version:** 1.3.0 (Updated with inference-first convention, Either testing patterns, and Tag suffix documentation)
