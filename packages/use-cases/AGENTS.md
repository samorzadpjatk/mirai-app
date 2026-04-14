# Use Case Layer — Quick Reference

> **Effect-based orchestration layer**
>
> Orchestrates domain objects to accomplish business workflows. Uses Effect for composable, testable workflows with explicit dependencies.

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
      myEntityRepository: asClass(InMemoryMyEntityRepository).singleton(),
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

**Last Updated:** 2026-04-14
