# Effect Framework Migration Guide

> **USE WHEN:** Migrating codebase from async/await to Effect framework, implementing DDD with Effect, or consolidating libraries.

---

## Quick Reference

### Installation

```bash
# Add to packages
bun add effect

# TypeScript requirements
# tsconfig.json: "strict": true
```

### Core Type

```
Effect<Success, Error, Requirements>
       │            │           │
       │            │           └── Dependencies (Context)
       │            └── Expected errors (tracked at type level)
       └── Success value
```

---

## Migration Patterns

### From async/await to Effect

**Before (async/await):**

```typescript
async function getUser(id: string): Promise<User> {
  const user = await db.findById(id);
  if (!user) throw new Error("Not found");
  return user;
}
```

**After (Effect):**

```typescript
import { Effect, Data, Context } from "effect";

// 1. Define tagged error
class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{}> {}

// 2. Define service tag
class Database extends Context.Tag("Database")<
  Database,
  { findById: (id: string) => Effect.Effect<User | null, never, never> }
>() {}

// 3. Write effect
const getUser = (
  id: string,
): Effect.Effect<User, UserNotFoundError, Database> =>
  Effect.gen(function* () {
    const db = yield* Database;
    const user = yield* db.findById(id);
    if (!user) return yield* Effect.fail(new UserNotFoundError());
    return user;
  });
```

### From tRPC to Effect

**Replace tRPC with Effect Schema + HTTP:**

```typescript
// Before (tRPC)
const userRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => { ... })
});

// After (Effect)
import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";

const GetByIdInput = Schema.Struct({
  id: Schema.String
});

const UserApi = HttpApiGroup.make("users").pipe(
  HttpApiGroup.addEndpoint(
    HttpApiEndpoint.get("getById", "/users/:id").pipe(
      HttpApiEndpoint.setSchema(GetByIdInput)
    )
  )
);
```

---

## DDD Layer Integration

### Domain Layer (Pure)

```typescript
// packages/domain/src/entities/User.ts
import { Either } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{}> {}

export class User {
  private constructor(
    readonly id: string,
    readonly email: string,
    readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    email: string;
    createdAt: Date;
  }): Either.Either<User, ValidationError> {
    if (!props.email.includes("@")) {
      return Either.left(new ValidationError());
    }
    return Either.right(new User(props.id, props.email, props.createdAt));
  }
}
```

### Use Case Layer (Effect)

```typescript
// packages/use-cases/src/interactors/CreateUser.ts
import { Effect } from "effect";

export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private idGenerator: IdGenerator,
  ) {}

  execute = (
    input: CreateUserInput,
  ): Effect.Effect<UserDTO, ValidationError | DuplicateEmailError, never> =>
    Effect.gen(function* () {
      // Validate
      const userOrError = User.create({
        id: yield* this.idGenerator.generate(),
        email: input.email,
        createdAt: new Date(),
      });

      if (Either.isLeft(userOrError)) {
        return yield* Effect.fail(userOrError.left);
      }

      const user = userOrError.right;

      // Check duplicates
      const existing = yield* this.userRepository.findByEmail(user.email);
      if (existing) {
        return yield* Effect.fail(new DuplicateEmailError());
      }

      // Save
      yield* this.userRepository.save(user);

      return UserDTO.fromDomain(user);
    });
}
```

### Adapter Layer (Wrappers)

```typescript
// packages/adapters/src/gateways/PrismaUserRepository.ts
import { Effect } from "effect";

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  findById(id: string): Effect.Effect<User | null, never, never> {
    return Effect.tryPromise({
      try: () => this.prisma.user.findUnique({ where: { id } }),
      catch: () => new DatabaseError(), // Defects, not recoverable
    }).pipe(Effect.map((user) => (user ? UserMapper.toDomain(user) : null)));
  }
}
```

---

## Dependency Injection (Replaces awilix)

### Service Definition

```typescript
// 1. Define Tag (unique identifier)
class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  {
    findById: (id: string) => Effect.Effect<User | null, never, never>;
    save: (user: User) => Effect.Effect<void, never, never>;
  }
>() {}

// 2. Alternative: Effect.Service pattern (simpler)
class UserRepository extends Effect.Service<UserRepository>()(
  "UserRepository",
  {
    effect: Effect.gen(function* () {
      const prisma = yield* PrismaClient;
      return {
        findById: (id: string) => Effect.tryPromise(...),
        save: (user: User) => Effect.tryPromise(...)
      };
    }),
    dependencies: [PrismaClientLive]
  }
) {}
```

### Layer Construction

```typescript
// Live implementation
const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const prisma = yield* PrismaClient;
    return {
      findById: (id: string) =>
        Effect.tryPromise(() => prisma.user.findUnique({ where: { id } })).pipe(
          Effect.map((u) => (u ? toDomain(u) : null)),
        ),
      save: (user: User) =>
        Effect.tryPromise(() => prisma.user.create({ data: toPrisma(user) })),
    };
  }),
);

// Test implementation
const UserRepositoryTest = Layer.succeed(UserRepository, {
  findById: () => Effect.succeed(mockUser),
  save: () => Effect.succeed(void 0),
});
```

### Composing Layers

```typescript
// Combine layers
const AppLayer = Layer.mergeAll(UserRepositoryLive, ConfigLive, LoggerLive);

// Or compose (for dependencies)
const DatabaseLive = LoggerLive.pipe(
  Layer.merge(ConfigLive),
  Layer.provideMerge(UserRepositoryLive),
);

// Provide to effect
const runnable = program.pipe(Effect.provide(AppLayer));

Effect.runPromise(runnable);
```

---

## Library Consolidation Map

| Current Library     | Effect Replacement              | Notes                                   |
| ------------------- | ------------------------------- | --------------------------------------- |
| awilix              | `Context.Tag` + `Layer`         | Type-safe DI with compile-time checking |
| Zod                 | `effect/Schema`                 | Bidirectional validation + JSON Schema  |
| RxJS/Observables    | `effect/Stream`                 | Backpressure, resource safety           |
| node-cron           | `effect/Schedule`               | Composable, testable scheduling         |
| retry libraries     | `Effect.retry` + `Schedule`     | Built-in exponential backoff            |
| Result/Either types | `effect/Either`                 | Unified with Effect ecosystem           |
| date-fns            | `effect/DateTime`               | Timezone-aware, immutable               |
| uuid libraries      | `Effect.random`                 | Deterministic in tests                  |
| p-retry/p-timeout   | `Effect.retry`/`Effect.timeout` | Fiber-aware                             |
| inversify/tsyringe  | `Context.Tag`                   | No decorators needed                    |

---

## Testing Patterns

### TestClock (Time Control)

```typescript
import { TestClock, TestContext } from "effect";

describe("with time control", () => {
  const test = Effect.gen(function* () {
    const q = yield* Queue.unbounded<string>();

    // Fork delayed effect
    yield* Queue.offer(q, "done").pipe(Effect.delay("5 minutes"), Effect.fork);

    // Verify not executed yet
    const before = yield* Queue.poll(q);
    assert.strictEqual(Option.isNone(before), true);

    // Advance time
    yield* TestClock.adjust("5 minutes");

    // Now it's done
    const after = yield* Queue.take(q);
    assert.strictEqual(after, "done");
  }).pipe(Effect.provide(TestContext.TestContext));

  it("should control time", async () => {
    await Effect.runPromise(test);
  });
});
```

### Test Layers

```typescript
// Create test implementation
const TestUserRepository = Layer.effect(
  UserRepository,
  Effect.succeed({
    findById: () => Effect.succeed(null),
    save: () => Effect.succeed(void 0),
  }),
);

// Test with injected dependencies
const testProgram = program.pipe(
  Effect.provide(TestUserRepository),
  Effect.provide(TestLogger),
);

// Run test
await Effect.runPromise(testProgram);
```

### Mocking with Effect.fn

```typescript
// Create mock function with traceability
const mockFindById = Effect.fn("findById", (id: string) =>
  Effect.succeed(mockUser),
);

// Use in layer
const MockRepository = Layer.succeed(UserRepository, {
  findById: mockFindById,
});

// Assert calls
assert.strictEqual(mockFindById.calls.length, 1);
```

---

## Error Handling Patterns

### Tagged Errors (Required)

```typescript
// Always use tagged errors for type-safe matching
class NotFoundError extends Data.TaggedError("NotFoundError")<{
  resource: string;
  id: string;
}> {}

class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

// Function returning multiple error types
const findUser = (
  id: string,
): Effect.Effect<User, NotFoundError | DatabaseError, Database> =>
  Effect.gen(function* () {
    const db = yield* Database;
    const user = yield* db.findById(id);
    if (!user) {
      return yield* Effect.fail(new NotFoundError({ resource: "User", id }));
    }
    return user;
  });
```

### Error Matching

```typescript
const result = await Effect.runPromise(
  findUser("123").pipe(
    Effect.catchTag(
      "NotFoundError",
      (e) => Effect.succeed(null), // Return null instead of failing
    ),
    Effect.catchTag("DatabaseError", (e) =>
      Effect.fail(new SystemError("Database unavailable")),
    ),
  ),
);
```

### Converting to Either (Boundary)

```typescript
// At system boundaries, convert to Either
const result = await Effect.runPromise(
  findUser("123").pipe(
    Effect.either, // Effect<Either<User, NotFoundError | DatabaseError>, never, never>
  ),
);

// Pattern match on result
if (Either.isRight(result)) {
  return successResponse(result.right);
} else {
  return errorResponse(result.left);
}
```

---

## Schema (Replaces Zod)

### Basic Validation

```typescript
import { Schema } from "effect";

// Define schema
const UserSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.String.pipe(Schema.pattern(/^.+@.+$/)),
  age: Schema.Number.pipe(Schema.int(), Schema.greaterThan(0)),
});

// Infer type
type User = Schema.Schema.Type<typeof UserSchema>;

// Decode (unknown -> User)
const decodeUser = Schema.decodeUnknown(UserSchema);

// Encode (User -> unknown)
const encodeUser = Schema.encodeUnknown(UserSchema);

// Use in Effect
const parseUser = (input: unknown): Effect.Effect<User, ParseError, never> =>
  Schema.decodeUnknown(UserSchema)(input);
```

### Bidirectional Transformations

```typescript
// Date transformation
const UserSchema = Schema.Struct({
  id: Schema.String,
  createdAt: Schema.DateFromString, // string <-> Date
});

// Custom transformation
const UppercaseString = Schema.transform(Schema.String, Schema.String, {
  decode: (s) => s.toUpperCase(),
  encode: (s) => s.toLowerCase(),
});
```

---

## Schedules (Retries & Repetition)

### Retry Patterns

```typescript
import { Schedule } from "effect";

// Exponential backoff
const exponential = Schedule.exponential("100 millis").pipe(
  Schedule.jittered, // Add randomization
  Schedule.compose(Schedule.recurs(5)), // Max 5 retries
);

// Custom retry
const fetchWithRetry = fetchData.pipe(
  Effect.retry({
    schedule: exponential,
    while: (error) => error._tag === "NetworkError",
  }),
);

// Timeout + retry
const fetchWithTimeout = fetchData.pipe(
  Effect.timeout("5 seconds"),
  Effect.retry(exponential),
);
```

### Cron-like Scheduling

```typescript
// Using cron expression
const everyMinute = Schedule.cron("* * * * *");

// Compose schedules
const duringBusinessHours = Schedule.intersect(
  Schedule.cron("0 9-17 * * 1-5"), // 9-17 on weekdays
  Schedule.fixed("1 hour"),
);
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Eager Execution

```typescript
// WRONG - Effect executes nothing
const bad = Effect.runPromise(Effect.log("Hello"));
// This returns a Promise, but you didn't await it

// CORRECT
await Effect.runPromise(Effect.log("Hello"));

// Or with fork
Effect.runFork(Effect.log("Hello"));
```

### Pitfall 2: Forgetting Dependencies

```typescript
// WRONG - Requirements not provided
const program: Effect.Effect<string, never, Database> = Effect.gen(
  function* () {
    const db = yield* Database; // Database not provided!
    return "done";
  },
);

// CORRECT - Provide layer
await Effect.runPromise(program.pipe(Effect.provide(DatabaseLive)));
```

### Pitfall 3: Catching Defects as Errors

```typescript
// WRONG - Defects should not be caught as errors
Effect.tryPromise({
  try: () => Promise.reject(new Error("bug")),
  catch: (e) => new ExpectedError(), // Don't do this
});

// CORRECT - Let defects bubble up
Effect.tryPromise({
  try: () => fetchData(),
  catch: (e) => new NetworkError(), // Only expected failures
});

// Defects should be fixed, not caught
// Use Effect.orDie to convert expected to defect if needed
```

### Pitfall 4: Resource Leaks

```typescript
// WRONG - Resource not released on interruption
const acquire = Effect.sync(() => fs.openSync("file.txt", "r"));

// CORRECT - Use acquireRelease
const withFile = Effect.acquireRelease(
  Effect.sync(() => fs.openSync("file.txt", "r")),
  (fd) => Effect.sync(() => fs.closeSync(fd)),
);

// Or use Scope
const program = Effect.gen(function* () {
  const scope = yield* Scope.make();
  const file = yield* openFile.pipe(Scope.extend(scope));
  // ... use file
  yield* Scope.close(scope, Exit.succeed(void 0));
});
```

---

## Monorepo Integration

### Package Structure

```
packages/
  domain/
    src/entities/
    src/value-objects/
    # Pure: Either, Data, no Effect

  use-cases/
    src/ports/
    src/interactors/
    # Effect.gen, Context.Tags, Layers

  adapters/
    src/gateways/
    src/controllers/
    # Effect.tryPromise, external APIs

  frameworks/
    src/di/
    src/effect-runtime/
    # Layer composition, runtime config
```

### Dependency Rules

```
domain → (pure, no deps)
use-cases → domain + effect
adapters → use-cases + effect + external
frameworks → adapters + effect
```

### Runtime Setup

```typescript
// apps/backend/src/index.ts
import { Effect, Layer, Runtime } from "effect";

// Compose all layers
const MainLayer = Layer.mergeAll(
  DatabaseLayer,
  LoggerLayer,
  ConfigLayer,
  HttpLayer,
);

// Build runtime once
const runtime = Effect.runSync(Effect.scoped(Layer.toRuntime(MainLayer)));

// Use runtime for all effects
const run = <A, E>(effect: Effect.Effect<A, E, never>) =>
  Runtime.runPromise(runtime)(effect);
```

---

## Resources

- [Effect Documentation](https://effect.website/docs/introduction)
- [Effect GitHub](https://github.com/Effect-TS/effect)
- [Effect Discord](https://discord.gg/effect-ts)
- [Effect vs Promise](https://effect.website/docs/additional-resources/effect-vs-promise)
- [Effect Schema](https://effect.website/docs/schema/introduction)
