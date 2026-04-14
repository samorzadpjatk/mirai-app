# TESTING.md — Testing Best Practices (Effect Edition)

> **Testing source of truth for the MIRAI monorepo**  
> Aligns with **CLAUDE.md** and the layered **AGENTS.md** structure  
> Stack: **TypeScript · Effect · Bun · Jest (native)**
>
> **Note:** This document was migrated from Promise/Either patterns to Effect patterns.
> Legacy patterns are documented in CLAUDE.md §10.2 for reference during migration.

---

## Overview

The MIRAI monorepo uses a **hybrid testing strategy**:

- **Bun test** — `packages/*`, `apps/web`, `apps/backend-server`, `apps/notification-sender`
- **Jest (jest‑expo)** — `apps/native` (Expo requirement)

**All code follows strict Test‑Driven Development (TDD).**

---

## Error‑handling model by layer (Effect Edition)

| Layer          | Error Model                     | Async | Notes                       |
| -------------- | ------------------------------- | ----- | --------------------------- |
| **Domain**     | `Effect<T, E, never>`           | No    | Pure, deterministic Effects |
| **Use Cases**  | `Effect<T, E, R>`               | Yes   | Effect.gen orchestration    |
| **Adapters**   | `Effect<T, E, never>`           | Yes   | Effect.tryPromise wrappers  |
| **Frameworks** | `Effect.runPromise` at boundary | Yes   | Runtime execution           |

**Use `Effect<T, E, never>` for pure domain, `Effect<T, E, R>` for orchestration with dependencies.**

---

## TDD Workflow (Red–Green–Refactor)

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│   RED   │───>│  GREEN  │───>│ REFACTOR│
│ (fails) │    │ (passes)│    │ (clean) │
└────┬────┘    └────┬────┘    └────┬────┘
     │              │              │
     └──────────────┴──────────────┘
```

---

## Test infrastructure

- **Runner:** Bun (`bun:test`)
- **Coverage:** 80% lines, 75% branches (via `bunfig.toml`)
- **DOM:** Happy DOM (preloaded)
- **Native:** Jest + jest‑expo

```toml
[test]
preload = ["./happydom.ts"]
coverageThreshold = { lines = 0.80, branches = 0.75 }
```

---

## Domain layer tests (Effect<T, E, never>)

### Rules

- **Pure unit tests**
- **No mocks**
- **No async/await**
- **No DI (R = never)**
- **No randomness**
- **Use `Effect.runSync` or `Effect.runPromise`**
- **Use `Effect.either` for error case testing**

### Example

```ts
import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { User } from "./User";

describe("[UNIT] User (Domain)", () => {
  it("creates a user with a valid email", () => {
    const effect = User.create({
      id: "user-1",
      email: "test@example.com",
      createdAt: new Date("2026-01-01"),
    });

    const user = Effect.runSync(effect);
    expect(user.email.value).toBe("test@example.com");
  });

  it("rejects an invalid email", () => {
    const effect = User.create({
      id: "user-1",
      email: "invalid",
      createdAt: new Date(),
    });

    // Use Effect.either to test error cases
    const result = Effect.runSync(Effect.either(effect));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ValidationError");
    }
  });

  it("fails with specific error type", () => {
    const effect = User.create({
      id: "user-1",
      email: "invalid",
      createdAt: new Date(),
    });

    // Test error using catchTag for precision
    const result = Effect.runSync(
      effect.pipe(
        Effect.catchTag("ValidationError", (error) =>
          Effect.succeed({ recovered: true, error }),
        ),
      ),
    );
    expect(result.recovered).toBe(true);
  });
});
```

### Testing Pure Effects

```ts
// Use Effect.runSync for pure, synchronous Effects
const user = Effect.runSync(
  User.create({ id: "1", email: "test@example.com" }),
);

// Use Effect.runPromise for Effects that may have async internally
const user = await Effect.runPromise(
  User.create({ id: "1", email: "test@example.com" }),
);

// Test error paths with Effect.either
const either = await Effect.runPromise(Effect.either(effect));
if (either._tag === "Right") {
  expect(either.right).toBeDefined();
} else {
  expect(either.left._tag).toBe("ExpectedError");
}
```

---

## Use‑case tests (Effect.gen + Layer)

### Rules

- **Return `Effect<T, E, R>`**
- **Use `Effect.gen` with `yield*`**
- **Mock ports via `Layer.succeed`**
- **Provide dependencies with `Effect.provide`**
- **Test with `Effect.runPromise`**

### Example with Layer-based DI

```ts
import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { CreateUserUseCase, UserRepository } from "@mirai-app/use-cases";

describe("[UNIT] CreateUserUseCase", () => {
  // Create mock repository implementation
  const createMockRepository = () => ({
    findByEmail: (email: string) => Effect.succeed(null),
    create: (user: any) => Effect.succeed(user),
  });

  it("creates a user", async () => {
    const mockRepo = createMockRepository();

    // Create test layer
    const TestLayer = Layer.succeed(UserRepository, mockRepo);

    // Execute use case with provided dependencies
    const useCase = new CreateUserUseCase();
    const effect = useCase.execute({ email: "test@example.com" });

    // Run with test layer
    const user = await Effect.runPromise(
      effect.pipe(Effect.provide(TestLayer)),
    );

    expect(user.email.value).toBe("test@example.com");
  });

  it("handles user already exists error", async () => {
    const existingUser = { id: "1", email: "test@example.com" };
    const mockRepo = {
      findByEmail: (email: string) => Effect.succeed(existingUser),
      create: (user: any) => Effect.succeed(user),
    };

    const TestLayer = Layer.succeed(UserRepository, mockRepo);
    const useCase = new CreateUserUseCase();
    const effect = useCase.execute({ email: "test@example.com" });

    // Test error case with Effect.either
    const result = await Effect.runPromise(
      Effect.either(effect.pipe(Effect.provide(TestLayer))),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UserAlreadyExistsError");
    }
  });
});
```

### Layer Composition for Complex Tests

```ts
import { Layer, Effect } from "effect";
import {
  UserRepository,
  GroupRepository,
  Logger,
  Metrics,
} from "@mirai-app/use-cases";

// Individual mock layers
const MockUserRepository = Layer.succeed(
  UserRepository,
  createMockUserRepository(),
);

const MockGroupRepository = Layer.succeed(
  GroupRepository,
  createMockGroupRepository(),
);

const MockLogger = Layer.succeed(Logger, {
  log: () => Effect.void,
  error: () => Effect.void,
});

// Compose multiple layers
const TestLayer = Layer.mergeAll(
  MockUserRepository,
  MockGroupRepository,
  MockLogger,
);

// Use in tests
const result = await Effect.runPromise(
  useCase.execute(input).pipe(Effect.provide(TestLayer)),
);
```

---

## Adapter tests (integration with Effect)

### Rules

- **Real DB / SDKs**
- **No mocks**
- **Clean up after tests**
- **Use `Effect.tryPromise` for external calls**
- **Test error conversion at boundaries**

```ts
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Effect } from "effect";

describe("[INTEGRATION] DrizzleUserRepository", () => {
  let repo: DrizzleUserRepository;
  let db: TestDatabase;

  beforeAll(async () => {
    db = await createTestDatabase();
    repo = new DrizzleUserRepository(db);
  });

  it("persists a user", async () => {
    const user = makeTestUser();

    // Repository returns Effect
    const saved = await Effect.runPromise(repo.create(user));
    expect(saved.id).toBeDefined();
  });

  it("handles database errors", async () => {
    const user = makeInvalidTestUser();

    // Test error path
    const result = await Effect.runPromise(Effect.either(repo.create(user)));

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("DatabaseError");
    }
  });

  afterAll(async () => {
    await db.cleanUp();
  });
});
```

---

## Framework tests

- **Minimal coverage (60%)**
- **Verify wiring only**
- **Skip framework internals**
- **Test `Effect.runPromise` at boundaries**

---

## Effect Testing Patterns

### Pattern 1: Testing Success Cases

```ts
const effect = useCase.execute(input);
const result = await Effect.runPromise(effect.pipe(Effect.provide(TestLayer)));
expect(result).toBeDefined();
```

### Pattern 2: Testing Error Cases

```ts
// Using Effect.either
const result = await Effect.runPromise(
  Effect.either(effect.pipe(Effect.provide(TestLayer))),
);
expect(result._tag).toBe("Left");

// Using catchTag to verify specific errors
const error = await Effect.runPromise(
  effect.pipe(
    Effect.provide(TestLayer),
    Effect.catchTag("NotFoundError", (e) => Effect.succeed(e)),
  ),
);
expect(error._tag).toBe("NotFoundError");
```

### Pattern 3: Testing with Multiple Dependencies

```ts
const TestLayer = Layer.mergeAll(
  Layer.succeed(UserRepository, mockUserRepo),
  Layer.succeed(GroupRepository, mockGroupRepo),
  Layer.succeed(Logger, mockLogger),
);

const result = await Effect.runPromise(
  useCase.execute(input).pipe(Effect.provide(TestLayer)),
);
```

### Pattern 4: Testing Sequential Operations

```ts
it("performs sequential operations", async () => {
  const program = Effect.gen(function* () {
    const repo = yield* UserRepository;
    const user = yield* repo.findById("1");
    if (!user) {
      return yield* Effect.fail(new NotFoundError({ entity: "User", id: "1" }));
    }
    return yield* repo.update({ ...user, name: "Updated" });
  });

  const result = await Effect.runPromise(
    program.pipe(Effect.provide(TestLayer)),
  );
  expect(result.name).toBe("Updated");
});
```

### Pattern 5: Testing Parallel Operations

```ts
it("performs parallel operations", async () => {
  const program = Effect.gen(function* () {
    const userRepo = yield* UserRepository;
    const groupRepo = yield* GroupRepository;

    // Fetch in parallel with Effect.all
    const [user, groups] = yield* Effect.all([
      userRepo.findById("1"),
      groupRepo.findByUserId("1"),
    ]);

    return { user, groups };
  });

  const result = await Effect.runPromise(
    program.pipe(Effect.provide(TestLayer)),
  );
  expect(result.user).toBeDefined();
  expect(result.groups).toBeDefined();
});
```

---

## Testing patterns by scenario

### Pure functions

- No mocks
- Table‑driven tests
- Edge cases first
- Use `Effect.runSync`

### External dependency mocking (Use Cases)

- Mock ports only using `Layer.succeed`
- Provide via `Effect.provide`
- Never mock domain entities

### Async operations (Adapters)

- Use `Effect.tryPromise` for real external calls
- Test error conversion with `Effect.either`
- Clean up resources with `Effect.ensuring`

### React hooks (Happy DOM)

- `@testing-library/react`
- Mock browser APIs
- SSR safety via code review + integration

### Zustand stores

- Direct store testing
- Reset state via `setState`

### Fastify/tRPC utilities

- Test Effect execution at boundary
- Error conversion with `Effect.catchTag`

---

## Mocking rules (Effect Edition)

| Layer         | Mocking                   |
| ------------- | ------------------------- |
| Domain        | ❌ Never                  |
| Use Cases     | ✅ Ports only via Layer   |
| Adapters      | ❌ (use real deps)        |
| Frameworks    | Minimal                   |
| External APIs | Always (in adapter tests) |

---

## Coverage targets

| Layer      | Target |
| ---------- | ------ |
| Domain     | 90%+   |
| Use Cases  | 85%+   |
| Adapters   | 75%+   |
| Frameworks | 60%+   |

**Domain has zero exemptions.**

---

## Anti‑patterns

- ❌ `Result<T,E>` (legacy, being migrated)
- ❌ `Either<L,R>` (use Effect instead)
- ❌ String errors (use `Data.TaggedError`)
- ❌ UUID generation in domain
- ❌ async/await in Effect.gen (use `yield*`)
- ❌ Mocking domain entities
- ❌ Testing framework behavior
- ❌ Direct Promise chains (use Effect composition)

---

## Migration Guide: Promise → Effect

### Before (Promise/async-await)

```ts
// Test with async/await
const result = await useCase.execute(input);
expect(result.email).toBe("test@example.com");
```

### After (Effect)

```ts
// Test with Effect.runPromise
const result = await Effect.runPromise(
  useCase.execute(input).pipe(Effect.provide(TestLayer)),
);
expect(result.email).toBe("test@example.com");
```

### Before (Either-based)

```ts
const result = User.create(input);
expect(result._tag).toBe("Right");
if (result._tag === "Right") {
  expect(result.right.email).toBe("test@example.com");
}
```

### After (Effect-based)

```ts
const effect = User.create(input);
const user = Effect.runSync(effect);
expect(user.email).toBe("test@example.com");

// Or for error cases
const result = Effect.runSync(Effect.either(effect));
expect(result._tag).toBe("Left");
```

---

## TDD checklist (Effect Edition)

### Before coding

- **Test exists**
- **Test fails** (run `bun test` to verify)
- **Effect return type defined**

### While coding

- **Minimal code to make Effect succeed**
- **Use `Effect.gen` for orchestration**
- **Use `Effect.succeed`/`Effect.fail` for control flow**
- **All tests green**

### After

- **Refactor with Effect composition**
- **Add edge cases with Effect.either**
- **Verify coverage**
- **Document Layer dependencies**

---

## Related documents

- **CLAUDE.md** — Architecture & conventions (§10: Effect Framework Patterns)
- **AGENTS.md** — Agent instructions (root + per-package guides)
- **bunfig.toml** — Coverage thresholds
- **apps/native/jest.config.cjs** — Native testing config
- **.dependency-cruiser.mjs** — Layer enforcement

---

**Last Updated:** 2026‑04‑14  
**Version:** 4.0.0 (Effect Edition)
