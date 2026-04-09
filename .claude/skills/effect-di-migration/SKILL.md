# Skill: Effect.ts + DI Migration

> Comprehensive guide for migrating from imperative Result patterns to Effect.ts functional programming with awilix-modular DI

## Executive Summary

This skill provides patterns for migrating Mirai App codebase from:

- **Current**: `Result<T,E>` with imperative async/await
- **Target**: `Effect<A,E,R>` with functional composition + awilix-modular DI

**Key Benefits:**

- Type-safe error tracking at compile time
- Composable, testable effects
- Resource safety (automatic cleanup)
- Dependency injection via Context/Layer
- Observability (tracing, metrics built-in)

---

## Effect.ts Core Concepts

### The Effect Type: `Effect<A, E, R>`

```typescript
// Effect<Success, Error, Requirements>
//      A           E      R

// Current Result pattern:
function getUser(id: string): Promise<Result<User, string>>;

// Effect equivalent:
function getUser(id: string): Effect.Effect<User, string, never>;
//                                     ^success ^error   ^no deps needed

// With dependency (repository injected via Context):
function getUser(id: string): Effect.Effect<User, string, UserRepository>;
//                                                      ^dependency required
```

**Key Differences from Result:**

| Aspect          | Result<T,E>          | Effect<A,E,R>              |
| --------------- | -------------------- | -------------------------- |
| Evaluation      | Immediate/eager      | Lazy (description of work) |
| Error type      | Runtime check        | Compile-time tracked       |
| Dependencies    | Constructor injected | Context requirements       |
| Composition     | Chaining methods     | `pipe()` + combinators     |
| Async           | Promise wrapping     | Built-in                   |
| Resource safety | Manual               | Automatic with `Scope`     |

### Either<A,E> - The Result Equivalent

```typescript
import * as Either from "effect/Either"

// Creating
const success = Either.right(value)    // Like ok(value)
const failure = Either.left(error)     // Like err(error)

// Checking
Either.isRight(result)  // Like isSuccess()
Either.isLeft(result)   // Like isError()

// Transforming
result.pipe(
  Either.map(f),        // Like map(result, f)
  Either.mapLeft(f),     // Like mapError(result, f)
  Either.flatMap(f)      // Like flatMap(result, f)
)

// Matching
result.pipe(
  Either.match({
    onRight: (value) => ...,  // Like onSuccess
    onLeft: (error) => ...    // Like onError
  })
)
```

**Migration: Result → Either**

```typescript
// Before (Result)
import { Result, ok, err, isSuccess, map, flatMap } from "./result";

function validateEmail(email: string): Result<string, string> {
  if (!email.includes("@")) return err("Invalid email");
  return ok(email);
}

// After (Either)
import * as Either from "effect/Either";

function validateEmail(email: string): Either.Either<string, string> {
  if (!email.includes("@")) return Either.left("Invalid email");
  return Either.right(email);
}
```

---

## Layer Pattern for DI Integration

### Conceptual Mapping: awilix-modular → Effect

| awilix-modular        | Effect.ts                        | Purpose                        |
| --------------------- | -------------------------------- | ------------------------------ |
| `createStaticModule`  | `Layer`                          | Service definition/constructor |
| `providers`           | `Layer.effect` / `Layer.succeed` | Service implementation         |
| `imports`             | `Layer.pipe(Layer.merge)`        | Dependency composition         |
| `exports`             | Tag + implementation             | Service exposure               |
| `container.resolve()` | `Effect.gen` + `yield* Tag`      | Service access                 |
| `Lifetime.SCOPED`     | `Scope`                          | Lifecycle management           |

### Creating Layers for Repositories

```typescript
// Current: RepositoryModule with awilix-modular
export const RepositoryModule = createStaticModule({
  name: "RepositoryModule",
  providers: {
    userRepository: PrismaUserRepository,
  },
  exports: ["userRepository"],
});

// Effect equivalent: Layer-based DI
import { Context, Layer, Effect } from "effect";

// 1. Define service interface
export interface UserRepository {
  findById: (id: string) => Effect.Effect<User | null, Error, never>;
  create: (user: User) => Effect.Effect<User, Error, never>;
}

// 2. Create Tag (like DI token)
export class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  UserRepository
>() {}

// 3. Create Live Layer (production implementation)
export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    // Access PrismaClient from parent layer
    const prisma = yield* PrismaClient;

    return {
      findById: (id) =>
        Effect.tryPromise({
          try: () => prisma.user.findUnique({ where: { id } }),
          catch: (e) => new DatabaseError(e),
        }),
      create: (user) =>
        Effect.tryPromise({
          try: () => prisma.user.create({ data: user }),
          catch: (e) => new DatabaseError(e),
        }),
    };
  }),
);

// 4. Create Test Layer (mock implementation)
export const UserRepositoryTest = Layer.succeed(UserRepository, {
  findById: () => Effect.succeed(null),
  create: (user) => Effect.succeed(user),
});
```

### Composing Layers (Module Imports)

```typescript
// Current: RepositoryModule imports PrismaClient
// Effect: Compose layers explicitly

// Layer composition hierarchy
const AppLayer = UserRepositoryLive.pipe(
  Layer.provide(PrismaClientLive), // PrismaClient dependency
  Layer.provide(ConfigLive), // Config dependency
  Layer.provide(LoggerLive), // Logger dependency
);

// Or merge parallel layers
const RepositoryLayer = Layer.mergeAll(
  UserRepositoryLive,
  TripRepositoryLive,
  ChallengeRepositoryLive,
).pipe(Layer.provide(PrismaClientLive));
```

---

## Migration Strategy: Incremental Adoption

### Phase 1: Result → Either (Low Risk)

Convert existing Result returns to Either without changing logic:

```typescript
// packages/domain/src/entities/User.ts

// Before
import { Result, ok, err } from "../utils/result";

export class User {
  static create(props: CreateUserProps): Result<User, string> {
    if (!props.email.includes("@")) {
      return err("Invalid email");
    }
    return ok(new User(props));
  }
}

// After (hybrid - keeps Result internally, exposes Either)
import { Either } from "effect";
import { Result, ok, err } from "../utils/result";

export class User {
  static create(props: CreateUserProps): Either.Either<User, string> {
    const result = this.createResult(props);
    return result.isSuccess()
      ? Either.right(result.value)
      : Either.left(result.error);
  }

  // Keep internal Result for now
  private static createResult(props: CreateUserProps): Result<User, string> {
    if (!props.email.includes("@")) {
      return err("Invalid email");
    }
    return ok(new User(props));
  }
}
```

### Phase 2: Add Effect for Async Operations

```typescript
// packages/use-cases/src/interactors/CreateUser.ts

// Before
import { Result, ok, err } from "@mirai-app/domain";

export class CreateUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(input: CreateUserInput): Promise<Result<UserDTO, string>> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      return err("User already exists");
    }

    const user = User.create(input);
    if (user.isError()) {
      return err(user.error);
    }

    const saved = await this.userRepo.create(user.value);
    return ok(UserDTO.fromDomain(saved));
  }
}

// After (Effect version)
import { Effect } from "effect";
import { UserRepository } from "./layers";

export class CreateUserUseCase {
  execute(
    input: CreateUserInput,
  ): Effect.Effect<UserDTO, string, UserRepository> {
    return Effect.gen(function* () {
      const userRepo = yield* UserRepository; // Access via Context

      const existing = yield* userRepo.findByEmail(input.email);
      if (existing) {
        return yield* Effect.fail("User already exists");
      }

      const user = User.create(input);
      if (Either.isLeft(user)) {
        return yield* Effect.fail(user.left);
      }

      const saved = yield* userRepo.create(user.right);
      return UserDTO.fromDomain(saved);
    });
  }
}
```

### Phase 3: Migrate DI to Layer Pattern

```typescript
// packages/adapters/src/layers/RepositoryLayer.ts

import { Layer, Effect, Context } from "effect";
import { PrismaClient } from "@mirai-app/frameworks";

// Define repository service interface
export interface RepositoryService {
  user: UserRepository;
  trip: TripRepository;
  challenge: ChallengeRepository;
  // ... 16 repositories
}

// Create Tag
export class RepositoryService extends Context.Tag("RepositoryService")<
  RepositoryService,
  RepositoryService
>() {}

// Live implementation
export const RepositoryLive = Layer.effect(
  RepositoryService,
  Effect.gen(function* () {
    const prisma = yield* PrismaClient;

    return {
      user: createUserRepository(prisma),
      trip: createTripRepository(prisma),
      challenge: createChallengeRepository(prisma),
      // ...
    };
  }),
);

// Test implementation
export const RepositoryTest = Layer.succeed(RepositoryService, {
  user: createMockUserRepository(),
  trip: createMockTripRepository(),
  // ...
});
```

---

## Integration Patterns: awilix-modular + Effect

### Pattern 1: Keep awilix-modular, Add Effect Types

**When**: Gradual migration, existing DI works well

```typescript
// Keep awilix-modular for DI setup
export const RepositoryModule = createStaticModule({
  name: "RepositoryModule",
  providers: {
    // Return Effect-based repositories
    userRepository: class {
      findById = (id: string) =>
        Effect.tryPromise({
          try: () => prisma.user.findUnique({ where: { id } }),
          catch: (e) => new DatabaseError(e),
        });
    },
  },
});

// Use Effect in use cases
export class CreateUserUseCase {
  constructor(private deps: { userRepository: UserRepository }) {}

  execute(input: CreateUserInput) {
    return Effect.gen(function* () {
      // Use injected repository that returns Effects
      const user = yield* this.deps.userRepository.findById(input.id);
      // ...
    });
  }
}
```

### Pattern 2: Full Effect Layer Migration

**When**: Clean break, full Effect adoption

```typescript
// Replace awilix-modular with Effect Layer
import { Layer, Effect, pipe } from "effect";

// Define all services as Tags
export class UserService extends Context.Tag("UserService")<
  UserService,
  {
    create: (input: CreateUserInput) => Effect.Effect<User, string, never>;
  }
>() {}

// Implement as Layer
export const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const repo = yield* UserRepository;

    return {
      create: (input) =>
        Effect.gen(function* () {
          // Implementation using repo
        }),
    };
  }),
);

// Composition root
const AppLive = UserServiceLive.pipe(
  Layer.provide(UserRepositoryLive),
  Layer.provide(PrismaClientLive),
  Layer.provide(ConfigLive),
);

// Runtime entry point
import { Effect, Layer, Runtime } from "effect";

const runtime = pipe(AppLive, Layer.toRuntime, Effect.runSync);

// Execute effects with runtime
const program = Effect.gen(function* () {
  const userService = yield* UserService;
  return yield* userService.create({ email: "test@example.com" });
});

Runtime.runPromise(runtime)(program);
```

---

## Testing Patterns

### Testing with Effect

```typescript
import { Effect, Exit, Either } from "effect";
import { describe, it, expect } from "bun:test";

describe("CreateUserUseCase", () => {
  it("should create user successfully", async () => {
    // Create test layer
    const TestLayer = UserRepositoryTest.pipe(Layer.provide(LoggerTest));

    // Run effect with test dependencies
    const program = Effect.gen(function* () {
      const useCase = new CreateUserUseCase();
      return yield* useCase.execute({ email: "test@example.com" });
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(TestLayer)),
    );

    expect(result.email).toBe("test@example.com");
  });

  it("should fail with validation error", async () => {
    const program = Effect.gen(function* () {
      const useCase = new CreateUserUseCase();
      return yield* useCase.execute({ email: "invalid" });
    });

    const exit = await Effect.runPromiseExit(
      program.pipe(Effect.provide(TestLayer)),
    );

    // Check failure
    if (Exit.isFailure(exit)) {
      expect(exit.cause._tag).toBe("Fail");
    }
  });
});
```

### Mocking Services

```typescript
// Create mock implementations
export const MockUserRepository = Layer.succeed(UserRepository, {
  findById: (id) =>
    Effect.succeed({
      id,
      email: "mock@example.com",
    }),
  create: (user) =>
    Effect.succeed({
      ...user,
      id: "mock-id-123",
      createdAt: new Date(),
    }),
});

// More sophisticated mock with state
export const createStatefulMock = () => {
  const users = new Map<string, User>();

  return Layer.succeed(UserRepository, {
    findById: (id) => Effect.sync(() => users.get(id) || null),
    create: (user) =>
      Effect.sync(() => {
        const saved = { ...user, id: crypto.randomUUID() };
        users.set(saved.id, saved);
        return saved;
      }),
  });
};
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Mixing Effect and Promise

**Problem**: Accidental mixing of Effect and Promise types

```typescript
// WRONG - returns Promise<Effect<...>>
async function getUser(id: string): Promise<Effect<User, Error>> {
  return Effect.succeed(await fetchUser(id)); // ❌
}

// CORRECT - returns Effect directly
function getUser(id: string): Effect<User, Error, never> {
  return Effect.tryPromise({
    try: () => fetchUser(id),
    catch: (e) => new DatabaseError(e),
  });
}
```

### Pitfall 2: Forgetting to Provide Dependencies

**Problem**: Runtime error when dependencies not in Context

```typescript
// This will compile but fail at runtime
const program = Effect.gen(function* () {
  const repo = yield* UserRepository; // Error if not provided!
  // ...
});

// Always provide layers
const runnable = program.pipe(Effect.provide(RepositoryLive));
```

### Pitfall 3: Resource Leaks

**Problem**: Not handling resources properly

```typescript
// WRONG - manual cleanup, error-prone
function withDatabase<T>(fn: (db: Connection) => Promise<T>) {
  const conn = await connect();
  try {
    return await fn(conn);
  } finally {
    await conn.close(); // Might not run on error!
  }
}

// CORRECT - Effect handles cleanup
const program = Effect.acquireUseRelease(
  Effect.tryPromise(() => connect()), // acquire
  (conn) => Effect.tryPromise(() => query(conn)), // use
  (conn) => Effect.tryPromise(() => conn.close()), // release
);
```

### Pitfall 4: Over-eager Execution

**Problem**: Effects run immediately instead of being descriptions

```typescript
// WRONG - runs immediately
const result = Effect.runPromise(Effect.succeed(42)); // ❌ Don't do this in functions

// CORRECT - return Effect for later execution
function getNumber(): Effect.Effect<number, never, never> {
  return Effect.succeed(42); // Just a description
}

// Run at composition root
const main = Effect.gen(function* () {
  const num = yield* getNumber(); // Now it runs
  console.log(num);
});

Effect.runPromise(main);
```

---

## Migration Checklist

### For Each Module:

- [ ] Identify all `Result<T,E>` return types
- [ ] Map to `Either<A,E>` for sync, `Effect<A,E,R>` for async
- [ ] Identify dependencies (services, repositories)
- [ ] Create Layer for each service
- [ ] Update tests to use `Effect.runPromise`
- [ ] Verify error types are tracked
- [ ] Ensure resources are properly managed

### Repository Migration:

- [ ] Define repository interface returning Effects
- [ ] Create Tag for repository
- [ ] Implement Prisma repository as Layer
- [ ] Create mock repository Layer for testing
- [ ] Update RepositoryModule or replace with Layer

### Use Case Migration:

- [ ] Convert `async execute()` to `Effect<A,E,R>`
- [ ] Replace `await` with `yield*` in generators
- [ ] Replace `Result.isSuccess()` with `Effect.either`
- [ ] Update error handling with `Effect.catchTag`

### Controller Migration:

- [ ] Accept Effects from use cases
- [ ] Convert to Response at boundary
- [ ] Handle errors with pattern matching

---

## Quick Reference: Result → Effect

| Operation    | Result                 | Either                            | Effect                                          |
| ------------ | ---------------------- | --------------------------------- | ----------------------------------------------- |
| Success      | `ok(v)`                | `Either.right(v)`                 | `Effect.succeed(v)`                             |
| Failure      | `err(e)`               | `Either.left(e)`                  | `Effect.fail(e)`                                |
| Map          | `map(r, f)`            | `Either.map(r, f)`                | `Effect.map(e, f)`                              |
| FlatMap      | `flatMap(r, f)`        | `Either.flatMap(r, f)`            | `Effect.flatMap(e, f)`                          |
| Match        | `match(r, onS, onF)`   | `Either.match({onRight, onLeft})` | `Effect.match({onSuccess, onFailure})`          |
| Async        | `Promise<Result<T,E>>` | `Effect<A,E,R>`                   | `Effect<A,E,R>`                                 |
| From Promise | `try/catch`            | -                                 | `Effect.tryPromise({try, catch})`               |
| All          | `all([r1, r2])`        | `Either.all([e1, e2])`            | `Effect.all([e1, e2])`                          |
| Parallel     | `Promise.all`          | -                                 | `Effect.all([...], {concurrency: "unbounded"})` |

---

## Resources

- **Effect Documentation**: https://effect.website/docs
- **Effect GitHub**: https://github.com/Effect-TS/effect
- **Effect vs neverthrow**: https://effect.website/docs/additional-resources/effect-vs-neverthrow
- **awilix-modular**: https://github.com/wildstyles/awilix-modular

---

## Example: Complete Migration

```typescript
// BEFORE: Imperative with Result
// packages/use-cases/src/interactors/CreateUser.ts

import { Result, ok, err } from "@mirai-app/domain";
import type { UserRepository } from "@mirai-app/use-cases";

export class CreateUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(input: CreateUserInput): Promise<Result<UserDTO, string>> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      return err("User already exists");
    }

    const user = User.create(input);
    if (user.isError()) {
      return err(user.error);
    }

    const saved = await this.userRepo.create(user.value);
    return ok(UserDTO.fromDomain(saved));
  }
}

// AFTER: Functional with Effect
// packages/use-cases/src/interactors/CreateUser.ts

import { Effect, Either, pipe } from "effect";
import { UserRepository } from "../layers/RepositoryLayer";

export class CreateUserUseCase {
  execute(
    input: CreateUserInput,
  ): Effect.Effect<UserDTO, string, UserRepository> {
    return Effect.gen(this, function* () {
      const userRepo = yield* UserRepository;

      const existing = yield* userRepo.findByEmail(input.email);
      if (existing) {
        return yield* Effect.fail("User already exists");
      }

      const user = User.create(input); // Returns Either
      if (Either.isLeft(user)) {
        return yield* Effect.fail(user.left);
      }

      const saved = yield* userRepo.create(user.right);
      return UserDTO.fromDomain(saved);
    });
  }
}

// Controller using the Effect
// apps/backend-server/src/routers/user.ts

import { Effect, Either, pipe } from "effect";
import { CreateUserUseCase } from "@mirai-app/use-cases";
import { RepositoryLive } from "@mirai-app/adapters";

export const userRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateUserInput.schema)
    .mutation(async ({ ctx, input }) => {
      const useCase = new CreateUserUseCase();

      const program = useCase.execute(input);

      // Provide dependencies and run
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(ctx.runtimeLayer)),
      );

      return result;
    }),
});
```

---

**Last Updated**: 2026-04-09
**Skill Version**: 1.0.0
