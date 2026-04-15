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
// packages/use-cases/src/ports/MyEntityRepository.ts
import { Context, Effect } from "effect";
import type { MyEntity } from "@mirai-app/domain";

export interface MyEntityRepository {
  findById(id: string): Effect.Effect<MyEntity | null, never, never>;
  save(entity: MyEntity): Effect.Effect<MyEntity, never, never>;
  delete(id: string): Effect.Effect<void, never, never>;
}

// Create the Context.Tag for dependency injection
export const MyEntityRepository =
  Context.Tag<MyEntityRepository>("MyEntityRepository");
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
│  Use Cases Layer: packages/use-cases/src/ports/               │
│  ────────────────────────────────────────────────            │
│  - Same interface as domain                                   │
│  - Adds Context.Tag for Effect DI                             │
│  - Enables `yield* UserRepositoryTag`                         │
│  - Enables `Layer.succeed` for testing                        │
│  - Example: UserRepository (interface) + UserRepositoryTag    │
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
import { UserRepositoryTag } from "../ports/UserRepository";

// Usage in Effect.gen
const repo = yield * UserRepositoryTag;
const user = yield * repo.findById(id);
```

### Tag Pattern

```ts
// packages/use-cases/src/ports/UserRepository.ts
import type { User } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "./errors";

// Interface (matches domain port)
export interface UserRepository {
  findById(id: string): Effect.Effect<User | null, DatabaseError, never>;
  create(user: User): Effect.Effect<User, DatabaseError, never>;
  // ... other methods
}

// Context.Tag for dependency injection
export class UserRepositoryTag extends Context.Tag("UserRepository")<
  UserRepositoryTag,
  UserRepository
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
// packages/use-cases/src/interactors/GetUserWithTrips.ts
import { Effect, Data } from "effect";
import { UserRepositoryTag } from "../ports/UserRepository";
import { TripRepositoryTag } from "../ports/TripRepository";

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}>() {}

export class GetUserWithTripsUseCase {
  execute(userId: string) {
    return Effect.gen(function* () {
      // Get repositories from context
      const userRepo = yield* UserRepositoryTag;
      const tripRepo = yield* TripRepositoryTag;

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

## Use Case Template

```ts
// packages/use-cases/src/interactors/DoSomething.ts
import { Effect, Data } from "effect";
import { MyEntityRepository } from "../ports/MyEntityRepository";

export class EntityNotFoundError extends Data.TaggedError(
  "EntityNotFoundError",
)<{ entityId: string }>() {}

export class DoSomethingUseCase {
  execute(
    input: DoSomethingInput,
  ): Effect.Effect<
    SomethingResultDTO,
    EntityNotFoundError,
    MyEntityRepository
  > {
    return Effect.gen(function* () {
      const repo = yield* MyEntityRepository;

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

---

## Test Template with Layer.provide

Mock dependencies using `Layer.succeed` and `Effect.provide`:

```ts
import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import { DoSomethingUseCase } from "./DoSomething";
import { MyEntityRepository } from "../ports/MyEntityRepository";

// Create mock repository layer
const createMockRepoLayer = () =>
  Layer.succeed(MyEntityRepository, {
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
    const failingLayer = Layer.succeed(MyEntityRepository, {
      findById: () => Effect.succeed(null), // Returns null
      save: (e: MyEntity) => Effect.succeed(e),
      delete: () => Effect.succeed(void 0),
    });

    const program = useCase
      .execute({ entityId: "nonexistent" })
      .pipe(Effect.provide(failingLayer));

    const either = await Effect.runPromise(Effect.either(program));
    expect(either._tag).toBe("Left");
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
      myEntityRepository: asClass(InMemoryMyEntityGateway).singleton(),
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

For comprehensive use case patterns, see CLAUDE.md:

- §5.3: Use Cases Layer — Effect.gen orchestration, Context.Tags
- §10.4: Layer Composition and DI Integration
- §10.5.2: Testing Use Cases — Mock layers with Layer.provide
- §10.7: Effect Pattern Quick Reference

---

**Last Updated:** 2026-04-15
