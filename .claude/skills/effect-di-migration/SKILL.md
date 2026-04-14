# Effect DI Migration Guide

> **Migration from awilix to pure Effect DI (Context.Tag + Layer patterns)**

## Overview

This skill provides guidance for migrating from awilix dependency injection to Effect's native DI system using `Context.Tag` and `Layer` patterns. This migration is already underway in the codebase, with Layer factories established and partial migration completed in controllers.

---

## Quick Reference: Pattern Mapping

| awilix Pattern                                | Effect Pattern                         | Notes                           |
| --------------------------------------------- | -------------------------------------- | ------------------------------- |
| `createStaticModule()`                        | `Layer.succeed()` + `Layer.mergeAll()` | Factory functions return Layers |
| `container.register({ key: asClass(Class) })` | `Layer.succeed(Tag, new Class())`      | Direct instantiation            |
| `container.resolve("key")`                    | `yield* Tag` in `Effect.gen`           | Tag becomes yieldable           |
| `Lifetime.SINGLETON`                          | `Layer.succeed()`                      | Default behavior                |
| `Lifetime.SCOPED`                             | `Layer.effect()` or runtime provision  | Per-request via context         |
| `cradle.deps` injection                       | Tag requirements in Effect type        | Compile-time checked            |

---

## Core Effect DI Patterns

### 1. Context.Tag (Service Identifiers)

`Context.Tag` creates a unique identifier for services that can be used as dependencies in Effect programs.

```typescript
import { Context, Effect } from "effect";

// Define service interface
export interface UserRepository {
  findById(id: string): Effect.Effect<User | null, DatabaseError, never>;
  save(user: User): Effect.Effect<User, DatabaseError, never>;
}

// Create the Tag (dependency identifier)
export class UserRepositoryTag extends Context.Tag("UserRepository")<
  UserRepositoryTag,
  UserRepository
>() {}
```

**Key Points:**

- Tag name (first argument) must be globally unique
- Tag is both a type and a runtime value
- Used with `yield*` in `Effect.gen` to access the service

### 2. Layer.succeed (Direct Binding)

Creates a Layer that directly binds a Tag to an implementation. Used for stateless services and singletons.

```typescript
import { Layer } from "effect";
import { UserRepositoryTag } from "@mirai-app/use-cases";
import { DrizzleUserRepository } from "@mirai-app/adapters";

// Create a layer binding Tag to implementation
const userRepoLayer = Layer.succeed(
  UserRepositoryTag,
  new DrizzleUserRepository(db),
);
```

**When to Use:**

- Repositories (stateless, thread-safe)
- Services with no dependencies
- Test mocks

### 3. Layer.effect (Effectful Construction)

Creates a Layer from an Effect. Used when service construction requires async or effectful operations.

```typescript
import { Layer, Effect } from "effect";

const databaseLayer = Layer.effect(
  DatabaseTag,
  Effect.gen(function* () {
    const config = yield* ConfigTag;
    const db = yield* Effect.tryPromise({
      try: () => createConnection(config.connectionString),
      catch: (error) => new DatabaseConnectionError({ cause: error }),
    });
    return db;
  }),
);
```

**When to Use:**

- Async service initialization
- Services requiring configuration
- Resource acquisition with cleanup

### 4. Layer.merge and Layer.mergeAll (Composition)

Combines multiple layers into one. Dependencies are satisfied left-to-right.

```typescript
import { Layer } from "effect";

// Merge two layers
const combined = Layer.merge(layerA, layerB);

// Merge many layers
const appLayer = Layer.mergeAll(
  Layer.succeed(UserRepositoryTag, userRepo),
  Layer.succeed(TripRepositoryTag, tripRepo),
  Layer.succeed(AuthPortTag, authAdapter),
  // ... more bindings
);
```

**Key Points:**

- Order matters for dependency resolution
- `mergeAll` is variadic and handles any number of layers
- Result type is intersection of all layer requirements

### 5. Effect.provide (Dependency Injection)

Provides a Layer to an Effect, satisfying its requirements.

```typescript
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const userRepo = yield* UserRepositoryTag;
  const user = yield* userRepo.findById("123");
  return user;
});

// Provide dependencies
const runnable = program.pipe(Effect.provide(appLayer));

// Execute
const result = await Effect.runPromise(runnable);
```

**Key Points:**

- `Effect.provide` removes satisfied requirements from the Effect type
- Must provide all required services or TypeScript will error
- Can chain multiple `.pipe(Effect.provide(layer))` calls

---

## Migration Strategy

### Phase 1: Tag Definitions (COMPLETE)

Repository Tags are already defined in `packages/use-cases/src/ports/`:

```typescript
// UserRepository.ts
export class UserRepositoryTag extends Context.Tag("UserRepository")<
  UserRepositoryTag,
  UserRepository
>() {}
```

### Phase 2: Layer Factories (COMPLETE)

Layer factories established in `packages/frameworks/src/layers/`:

```typescript
// RepositoryLayer.ts
export const makeRepositoryLayer = (db: DrizzleDb) =>
  Layer.mergeAll(
    makeUserDomainLayer(db),
    makeTripRewardDomainLayer(db),
    // ... other domain layers
  );

// ServiceLayer.ts
export const makeServiceLayer = (config: ServiceLayerConfig) =>
  Layer.merge(
    makeSupabaseServicesLayer(config),
    makeTelemetryServiceLayer(config.db),
  );
```

### Phase 3: Controller Migration (IN PROGRESS)

Controllers currently receive Layers from the module system:

```typescript
// OLD (awilix only):
constructor(private deps: RepositoryModuleDeps) {}

// CURRENT (hybrid):
constructor(private appLayer: Layer.Layer<unknown>) {}

// NEW (pure Effect):
// Controllers become Effect programs that yield* Tags directly
```

Migration pattern for controllers:

```typescript
// Before (awilix):
async getById(input: GetByIdInput, di: DIContext) {
  const authContext = await requireAuth(di.headers, di);
  const repo = this.deps.userRepository;
  return repo.findById(input.id);
}

// During (hybrid with Layer):
async getById(input: GetByIdInput, di: DIContext) {
  const authContext = await requireAuth(di.headers, di);
  const program = Effect.gen(function* () {
    const repo = yield* UserRepositoryTag;
    return yield* repo.findById(input.id);
  }).pipe(Effect.provide(this.appLayer));

  return await Effect.runPromise(program);
}

// After (pure Effect - future):
getById = (input: GetByIdInput, di: DIContext) => Effect.gen(function* () {
  yield* requireAuthEffect(di.headers);
  const repo = yield* UserRepositoryTag;
  return yield* repo.findById(input.id);
}).pipe(Effect.provide(this.appLayer));
```

### Phase 4: Router Integration (FUTURE)

Future state: tRPC routers work directly with Effect:

```typescript
export const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      const program = Effect.gen(function* () {
        const repo = yield* UserRepositoryTag;
        const user = yield* repo.findById(input.id);
        if (!user) {
          return yield* Effect.fail(new TRPCError({ code: "NOT_FOUND" }));
        }
        return user;
      }).pipe(Effect.provide(ctx.appLayer));

      return Effect.runPromise(program);
    }),
});
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Tag Not Available in Test

**Problem:** Tests fail with "Tag not found" error.

**Solution:** Ensure all Tags used in the program are provided by the test Layer.

```typescript
// ❌ Missing Tag provision
const testLayer = Layer.succeed(UserRepositoryTag, mockRepo);
// Missing: OtherRepositoryTag used by program

// ✅ Complete provision
const testLayer = Layer.mergeAll(
  Layer.succeed(UserRepositoryTag, mockUserRepo),
  Layer.succeed(OtherRepositoryTag, mockOtherRepo),
  Layer.succeed(AuthPortTag, mockAuth),
);
```

### Pitfall 2: Layer Type Mismatch

**Problem:** Type errors when passing Layer to controller.

**Solution:** Use explicit `Layer.Layer<unknown>` type or proper type assertion.

```typescript
// ❌ Type inference issues
new UserController(Layer.succeed(UserRepositoryTag, repo));

// ✅ Explicit type
new UserController(
  Layer.succeed(
    UserRepositoryTag as any,
    repo,
  ) as unknown as Layer.Layer<unknown>,
);
```

### Pitfall 3: Repository Lifecycle

**Problem:** Repositories need fresh state per test.

**Solution:** Create new Layer per test, don't share across tests.

```typescript
// ❌ Shared layer state
const globalLayer = createTestLayer();

// ✅ Fresh layer per test
beforeEach(() => {
  const testLayer = createTestLayer({
    userRepository: new InMemoryUserRepository(),
  });
});
```

### Pitfall 4: Forgetting to Provide Layer

**Problem:** Effect fails at runtime with missing service.

**Solution:** Always check TypeScript errors before running. Unprovided requirements show as `Requirements` in Effect type.

```typescript
// Type shows: Effect<User, Error, UserRepositoryTag>
//                           ^^^^^^^^^^^^^^^^^^^^^
//                           Must be provided!
const program = Effect.gen(function* () {
  const repo = yield* UserRepositoryTag;
  return yield* repo.findById("123");
});

// ✅ Properly provided
const runnable = program.pipe(Effect.provide(userRepoLayer));
// Type: Effect<User, Error, never> - ready to run!
```

---

## Testing Patterns

### Unit Test with Layer.succeed

```typescript
import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import { GetUserUseCase } from "./GetUser";
import { UserRepositoryTag } from "../ports/UserRepository";

describe("[UNIT] GetUserUseCase", () => {
  it("returns user on success", async () => {
    // Create mock repository
    const mockRepo = {
      findById: (id: string) =>
        Effect.succeed({
          id,
          name: "John Doe",
        } as User),
      save: (user: User) => Effect.succeed(user),
    };

    // Create test layer
    const testLayer = Layer.succeed(UserRepositoryTag, mockRepo);

    // Execute use case
    const useCase = new GetUserUseCase();
    const program = useCase
      .execute({ userId: "123" })
      .pipe(Effect.provide(testLayer));

    const result = await Effect.runPromise(program);
    expect(result.id).toBe("123");
  });
});
```

### Integration Test with TestContainer

```typescript
import { describe, it, expect } from "bun:test";
import { createTestLayer } from "@mirai-app/frameworks/di";
import { Effect } from "effect";

describe("[INTEGRATION] User flow", () => {
  it("creates and retrieves user", async () => {
    const testLayer = createTestLayer();

    const program = Effect.gen(function* () {
      const repo = yield* UserRepositoryTag;
      const auth = yield* AuthPortTag;

      // Test with real (InMemory) implementations
      const user = yield* repo.save({ id: "1", name: "Test" });
      const found = yield* repo.findById(user.id);

      return found;
    }).pipe(Effect.provide(testLayer));

    const result = await Effect.runPromise(program);
    expect(result).toBeDefined();
  });
});
```

### Mocking with Partial Layers

```typescript
// Override specific services while keeping others
const baseLayer = createTestLayer();

const mockLayer = baseLayer.pipe(
  Layer.merge(Layer.succeed(UserRepositoryTag, customMockRepo)),
);
```

---

## Best Practices

1. **Always use Tags for cross-layer dependencies** - Never pass concrete implementations through constructor injection at the use case level.

2. **Keep service interfaces pure** - Methods should return `Effect<T, E, never>` (no requirements at interface level).

3. **Construct services in Layers** - Dependencies are managed at construction time in Layers, not at service interface level.

4. **Use `Effect.gen` with `yield*`** - Never use `async/await` inside Effect programs.

5. **Test with `Layer.succeed`** - Create minimal test layers with mocks.

6. **Type safety first** - Unprovided requirements show in Effect type - fix TypeScript errors before running.

7. **Layer composition order** - Less dependent layers first, more dependent later:
   ```typescript
   Layer.mergeAll(
     configLayer, // No deps
     loggerLayer, // Needs config
     databaseLayer, // Needs config + logger
   );
   ```

---

## References

- Effect Documentation: https://effect.website/docs/requirements-management/layers
- Current codebase patterns: `packages/frameworks/src/layers/`
- Test patterns: `packages/frameworks/src/di/test-layer.ts`
