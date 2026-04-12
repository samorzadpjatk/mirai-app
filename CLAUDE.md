# CLAUDE.md — Mirai App Monorepo Conventions

> **CEK Five Pillars Compliance Document**  
> Updated for **Effect‑based orchestration** and **awilix‑modular**  
> Architecture: **Clean Architecture + SDD + TDD + SADD + Kaizen + Effect**
>
> **Note**: The codebase uses **Effect** framework for composable, type-safe error handling and async operations. Legacy patterns using `Result<T,E>` and `Either` are being migrated to Effect.

---

# 1. CEK Five Pillars Overview

| Pillar     | Focus        | Key Principle                                      |
| ---------- | ------------ | -------------------------------------------------- |
| **SDD**    | Planning     | Specifications precede implementations             |
| **TDD**    | Quality      | Test‑first development (Red‑Green‑Refactor)        |
| **DDD**    | Architecture | Clean Architecture with strict inward dependencies |
| **SADD**   | Execution    | Subagent workflows with quality gates              |
| **Kaizen** | Improvement  | Continuous small improvements (YAGNI)              |
| **Effect** | Composition  | Type‑safe, composable error handling and async     |

---

## Effect Framework Integration

The monorepo uses [Effect](https://effect.website) for:

- **Explicit error handling** - Errors as values, not exceptions
- **Composable async operations** - `Effect.gen` for structured concurrency
- **Dependency injection** - Context.Tags for type-safe dependencies
- **Resource management** - Automatic cleanup and finalization

### Migration Status

| Pattern             | Status              | Notes                                 |
| ------------------- | ------------------- | ------------------------------------- |
| `Result<T,E>`       | Legacy              | Being migrated to `Effect<T,E,never>` |
| `Either<L,R>`       | Legacy              | Use `Effect` for new code             |
| `Effect<T,E,never>` | Current (Domain)    | Pure domain layer Effects             |
| `Effect<T,E,R>`     | Current (Use Cases) | Effects with Context requirements     |
| `Effect.tryPromise` | Current (Adapters)  | Wrapping external APIs                |

---

# 2. Clean Architecture (Effect Edition)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER (Apps)                            │
│        native / web / backend — GraphQL, Hono, UI, routing               │
└─────────────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              INTERFACE ADAPTERS (packages/adapters/)                    │
│   Controllers (GraphQL) · Gateways (Repositories) · Presenters · Mappers  │
│   **Effect.runPromise** at system boundaries                            │
└─────────────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (packages/use-cases/)                    │
│   Interactors (Use Cases) · Ports (Interfaces) · DTOs · Errors          │
│   **Effect.gen + Context.Tags** for composable orchestration             │
└─────────────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 DOMAIN LAYER (packages/domain/)                         │
│   Entities · Value Objects · Domain Services · Pure Functions           │
│   **Effect<T, E, never>** for pure, composable errors                   │
│   ZERO external dependencies                                             │
└─────────────────────────────────────────────────────────────────────────┘
                      ▲
                      │ implements
┌─────────────────────────────────────────────────────────────────────────┐
│           INFRASTRUCTURE (packages/frameworks/)                         │
│   GraphQL/Yoga · Drizzle ORM · Supabase client · DI container           │
│   **Effect Layers** for type-safe dependency injection                  │
│   awilix‑modular serves as the framework DI system                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Dependency Rule**

```
Frameworks → Adapters → Use Cases → Domain
```

**Effect Pattern Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP LAYER                               │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │ Effect.runPromise(runtime)(effect)                     │    │
│   └─────────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                   FRAMEWORKS LAYER                      │    │
│   │  Layer.mergeAll(Config, Logger, RepositoryLayers)      │    │
│   │  Layer.toRuntime → Runtime                             │    │
│   └─────────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                    ADAPTERS LAYER                       │    │
│   │  Controllers: Effect.runPromise(effect)                │    │
│   │  Gateways: Effect.tryPromise(externalCall)            │    │
│   └─────────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                   USE CASES LAYER                       │    │
│   │  Effect.gen(function* () {                             │    │
│   │    const repo = yield* Repository;                     │    │
│   │    // orchestration logic                              │    │
│   │  })                                                    │    │
│   └─────────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                    DOMAIN LAYER                       │    │
│   │  Effect<T, E, never> - Pure, no dependencies           │    │
│   │  Data.TaggedError for errors                          │    │
│   └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

# 3. SDD Conventions

No changes.

---

# 4. TDD Conventions (Effect Edition)

## 4.1 Red‑Green‑Refactor

No changes.

## 4.2 Test Locations

No changes.

## 4.3 Async Testing Rules

### Domain tests

- Pure functions
- Use `Effect<T, E, never>`
- No async/await
- No DI
- Test with `Effect.runSync` or `Effect.runPromise`

```ts
import { Effect } from "effect";

describe("[UNIT] User entity", () => {
  it("creates valid user", () => {
    const effect = User.create({ id: "1", email: "test@example.com" });
    const user = Effect.runSync(effect);
    expect(user.email).toBe("test@example.com");
  });

  it("fails with invalid email", () => {
    const effect = User.create({ id: "1", email: "invalid" });
    const result = Effect.runSync(Effect.either(effect));
    expect(result._tag).toBe("Left");
  });
});
```

### Use case tests

- Use `Effect.gen` with `yield*`
- Mock ports via Context.Tags or awilix‑modular
- Test with `Effect.runPromise` and provide layers

```ts
import { Effect } from "effect";

describe("[UNIT] CreateUserUseCase", () => {
  it("creates user successfully", async () => {
    const effect = useCase.execute({ email: "test@example.com" });
    const user = await Effect.runPromise(
      effect.pipe(Effect.provide(TestLayer)),
    );
    expect(user.email).toBe("test@example.com");
  });
});
```

### Adapter tests

- Integration tests
- Real Drizzle test DB or test doubles
- Wrap external calls with `Effect.tryPromise`

---

# 5. DDD Conventions

## 5.1 Domain Layer (`packages/domain/`)

### Rules

1. **Pure TypeScript only**
2. **No external dependencies** (except Effect)
3. **No DI**
4. **No UUID generation**
5. **Use `Effect<T, E, never>` for all domain operations**
6. **Use `Data.TaggedError` for error types**

### Example

```ts
import { Effect, Data } from "effect";
import { Email } from "../value-objects/Email";
import { UserId } from "../value-objects/UserId";

// Tagged error for pattern matching
export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class User {
  private constructor(
    readonly id: UserId,
    readonly email: Email,
    readonly createdAt: Date,
  ) {}

  static create(props: {
    id: UserId;
    email: string;
    createdAt: Date;
  }): Effect.Effect<User, ValidationError, never> {
    return Effect.gen(function* () {
      const email = yield* Email.create(props.email);
      return new User(props.id, email, props.createdAt);
    });
  }
}
```

### Effect<T, E, never> Pattern

The domain layer uses `Effect<T, E, never>` for explicit error handling:

```typescript
import { Effect, Data } from "effect";

// Define tagged errors
export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  entity: string;
  id: string;
}> {}

// Entity with Effect-based factory
export class MyEntity {
  private constructor(
    readonly id: string,
    readonly name: string,
  ) {}

  static create(props: {
    id: string;
    name: string;
  }): Effect.Effect<MyEntity, ValidationError, never> {
    if (props.name.trim().length === 0) {
      return Effect.fail(
        new ValidationError({
          field: "name",
          message: "Name is required",
        }),
      );
    }
    return Effect.succeed(new MyEntity(props.id, props.name));
  }
}

// Usage:
const effect = MyEntity.create({ id: "1", name: "Test" });
const user = await Effect.runPromise(effect); // MyEntity

// Error handling with catchTag
const program = effect.pipe(
  Effect.catchTag("ValidationError", (error) =>
    Effect.succeed(new MyEntity("1", "Default")),
  ),
);
```

**Pattern:** Use `Effect.succeed()` for success, `Effect.fail()` for errors. Use `Effect.gen` for composable validation chains.

### Migration: Result → Effect

Legacy `Result<T,E>` code:

```typescript
// OLD: Result-based
import { Result, ok, err } from "../utils/result";

static create(props: {...}): Result<User, ValidationError> {
  if (invalid) return err(new ValidationError("..."));
  return ok(new User(...));
}
```

New `Effect<T,E,never>` code:

```typescript
// NEW: Effect-based
import { Effect, Data } from "effect";

static create(props: {...}): Effect.Effect<User, ValidationError, never> {
  if (invalid) {
    return Effect.fail(new ValidationError({ field: "...", message: "..." }));
  }
  return Effect.succeed(new User(...));
}
```

---

## 5.2 Use Cases Layer (`packages/use-cases/`)

### Rules

1. Use **Effect.gen + Context.Tags** for composable orchestration
2. Define **ports** (repository interfaces) as Context.Tags
3. No framework imports
4. No Prisma, no GraphQL/Hono imports, no DI annotations
5. Return `Effect<T, E, R>` where R contains required dependencies

### Example

```typescript
// packages/use-cases/src/interactors/CreateUser.ts
import { Effect, Data } from "effect";
import { User } from "@mirai-app/domain";
import { UserRepository } from "../ports/UserRepository";

// Tagged error for pattern matching
export class UserAlreadyExistsError extends Data.TaggedError(
  "UserAlreadyExistsError",
)<{
  email: string;
}> {}

// Context.Tag for dependency injection
export class CreateUserUseCase {
  execute(input: {
    email: string;
  }): Effect.Effect<
    User,
    UserAlreadyExistsError | ValidationError,
    UserRepository
  > {
    return Effect.gen(function* () {
      // Get repository from Context
      const userRepo = yield* UserRepository;

      // Check if user exists
      const existing = yield* userRepo.findByEmail(input.email);
      if (existing) {
        return yield* Effect.fail(
          new UserAlreadyExistsError({ email: input.email }),
        );
      }

      // Create user with Effect-based validation
      const user = yield* User.create({ email: input.email });

      // Save and return
      return yield* userRepo.create(user);
    });
  }
}

// Port defined as Context.Tag
// packages/use-cases/src/ports/UserRepository.ts
import { Context, Effect } from "effect";
import { User } from "@mirai-app/domain";

export interface UserRepository {
  findByEmail(email: string): Effect.Effect<User | null, never, never>;
  create(user: User): Effect.Effect<User, never, never>;
  // ... other methods
}

export const UserRepository = Context.Tag<UserRepository>("UserRepository");
```

---

## 5.3 Adapters Layer (`packages/adapters/`)

### Rules

1. Implement ports (Context.Tags)
2. Convert between domain and persistence
3. No business logic
4. Use DI via awilix‑modular string keys
5. Use `Effect.tryPromise` for external API calls
6. Run Effects at system boundaries with `Effect.runPromise`

### Example

#### Gateway with Effect.tryPromise

```ts
// gateways/drizzle/UserRepository.ts
import { Effect } from "effect";
import { UserRepository, User } from "@mirai-app/use-cases";
import { DatabaseError } from "../errors/adapter-errors";

export class DrizzleUserRepository implements UserRepository {
  constructor(private db: Database) {}

  findByEmail(email: string): Effect.Effect<User | null, never, never> {
    return Effect.tryPromise({
      try: () =>
        this.db.query.users.findFirst({ where: eq(users.email, email) }),
      catch: () => new DatabaseError({ operation: "findByEmail", email }),
    }).pipe(
      Effect.map((record) => (record ? UserMapper.toDomain(record) : null)),
    );
  }

  create(user: User): Effect.Effect<User, never, never> {
    return Effect.tryPromise({
      try: () =>
        this.db
          .insert(users)
          .values(UserMapper.toPersistence(user))
          .returning(),
      catch: () => new DatabaseError({ operation: "create", userId: user.id }),
    }).pipe(Effect.map((records) => UserMapper.toDomain(records[0])));
  }
}
```

#### Controller with Effect.runPromise

```ts
// controllers/user.ts
import { Effect } from "effect";
import { requireAuth } from "../utils/controller-helpers";
import type { CreateUserUseCase } from "@mirai-app/use-cases";
import type { DIContext } from "@mirai-app/frameworks/di";

export class UserController {
  constructor(private createUserUseCase: CreateUserUseCase) {}

  async create(input: CreateUserInput, di: DIContext) {
    // 1. Authenticate
    const authContext = await requireAuth(di.headers, di);

    // 2. Create Effect program
    const program = this.createUserUseCase.execute({
      ...input,
      authContext,
    });

    // 3. Run Effect at boundary with error handling
    return await Effect.runPromise(
      program.pipe(
        Effect.catchTag("UserAlreadyExistsError", (error) => {
          throw new HTTPError(409, `User ${error.email} already exists`);
        }),
        Effect.catchTag("ValidationError", (error) => {
          throw new HTTPError(400, error.message);
        }),
      ),
    );
  }
}
```

---

## 5.4 Frameworks Layer (`packages/frameworks/`)

### Rules

1. awilix‑modular serves as the **framework DI system**
2. Effect **Layers** provide type-safe dependency injection
3. No business logic
4. Provide Drizzle, GraphQL context, Effect Runtime, etc.

### DI with awilix-modular

```ts
// modules/RepositoryModule.ts
export const RepositoryModule = createStaticModule({
  name: "RepositoryModule",
  providers: {
    userRepository: DrizzleUserRepository,
  },
  exports: ["userRepository"],
});
```

### Effect Layer Integration

```ts
// layers/index.ts
import { Layer, Effect } from "effect";

// Convert awilix container to Effect Context
export const makeContainerLayer = (
  container: DIContainer,
): Layer.Layer<Context> => {
  return Layer.succeed(Context.Tag<DIContainer>("DIContainer"), container);
};

// Repository Layer
export const RepositoryLayer = Layer.mergeAll(
  Layer.succeed(UserRepository, new DrizzleUserRepository(db)),
  Layer.succeed(GroupRepository, new DrizzleGroupRepository(db)),
  // ... more repositories
);

// Full App Layer
export const AppLayer = Layer.mergeAll(
  RepositoryLayer,
  ServiceLayer,
  ConfigLayer,
);
```

### Running Effects with Runtime

```ts
// Application entry point
import { Effect, Runtime, Layer } from "effect";

const program = Effect.gen(function* () {
  const server = yield* HttpServer;
  yield* server.start();
});

// Build runtime from layers
const runtime = await Effect.runPromise(Layer.toRuntime(AppLayer));

// Run program with runtime
Runtime.runPromise(runtime)(program);
```

### Resolution from Container

```ts
// In GraphQL resolver or Hono handler
const useCase = container.resolve("createUserUseCase");

// Run Effect with container-provided dependencies
const result = await Effect.runPromise(
  useCase.execute(input).pipe(Effect.provide(makeContainerLayer(container))),
);
```

---

## 5.5 Authentication & Authorization Patterns

### New Pattern (Post-Refactoring)

Controllers now handle authentication. tRPC middleware no longer manages it:

```
Client Request (Authorization: Bearer <token>)
    ↓
Controller (TokenExtractor.extract from headers)
    ↓
Use Case (AuthenticateUserUseCase)
    ↓
Port (AuthPort) → Adapter (SupabaseAuthAdapter)
    ↓
AuthContext returned
```

### Controller Pattern

```typescript
import {
  requireAuth,
  requireAdmin,
} from "@mirai-app/adapters/controller-helpers";

export class MyController {
  async getData(input: GetDataInput, di: DIContext) {
    // 1. Extract and validate auth at controller level
    const authContext = await requireAuth(di.headers, di);

    // 2. Pass AuthContext explicitly to use cases
    return await this.useCase.execute({ ...input, authContext });
  }

  async adminOnly(input: AdminInput, di: DIContext) {
    // Throws TRPCError FORBIDDEN if not admin
    const authContext = await requireAdmin(di.headers, di);
    // ...
  }
}
```

### AuthContext Value Object

```typescript
import { AuthContext, UserRole } from "@mirai-app/domain";

// Created by use cases, passed to controllers
authContext.userId; // Branded UserId type
authContext.role; // UserRole.USER | MODERATOR | ADMIN
authContext.email; // User email
authContext.isAdmin(); // Helper: role === ADMIN
authContext.isModerator(); // Helper: role === MODERATOR || ADMIN
```

### Authorization Use Cases

```typescript
// Check admin role
const result = authorizeAdminUseCase.execute({ authContext });
if (isErr(result)) {
  // Permission denied - user is not admin
}

// Check moderator (includes admins)
const result = authorizeModeratorUseCase.execute({ authContext });
```

### Result<T,E> from Auth Use Cases

```typescript
const result = await authenticateUserUseCase.execute({ token });
if (isOk(result)) {
  return result.value; // AuthContext
} else {
  // Handle: InvalidTokenError, SessionExpiredError, etc.
}
```

---

# 6. Error Handling Conventions

## Effect-Based Error Handling

All layers use Effect for explicit, type-safe error handling:

### Domain errors

- `Effect<T, DomainError, never>` - pure Effects with no dependencies
- Use `Data.TaggedError` for pattern matching
- Never throw exceptions in domain

```ts
import { Data, Effect } from "effect";

// Tagged errors enable pattern matching
export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  entity: string;
  id: string;
}> {}

// Usage in entity
static create(props: {...}): Effect.Effect<User, ValidationError, never> {
  if (invalid) {
    return Effect.fail(new ValidationError({ field: "email", message: "Invalid" }));
  }
  return Effect.succeed(new User(...));
}
```

### Use case errors

- Return `Effect<T, DomainError | UseCaseError, R>` for expected failures
- Compose errors from multiple operations
- Use `Effect.catchTag` for error recovery

```ts
execute(input: {...}): Effect.Effect<
  User,
  ValidationError | UserAlreadyExistsError,
  UserRepository
> {
  return Effect.gen(function* () {
    const repo = yield* UserRepository;

    // ValidationError can be raised here
    const user = yield* User.create(input);

    // UserAlreadyExistsError can be raised here
    return yield* repo.create(user);
  });
}
```

### Adapter errors

- Wrap external errors with `Data.TaggedError`
- Use `Effect.tryPromise` for async operations
- Convert Effect errors to HTTP/GraphQL errors at boundaries

```ts
// Gateway: wrap external errors
findById(id: string): Effect.Effect<User | null, DatabaseError, never> {
  return Effect.tryPromise({
    try: () => db.query.users.findFirst({ where: eq(users.id, id) }),
    catch: (error) => new DatabaseError({ operation: "findById", id, cause: error }),
  });
}

// Controller: convert to HTTP errors at boundary
async getById(input: { id: string }, di: DIContext) {
  const program = this.useCase.execute(input).pipe(
    Effect.catchTag("NotFoundError", () => Effect.succeed(null)),
    Effect.catchTag("DatabaseError", (error) => {
      throw new HTTPError(500, error.message);
    })
  );

  return await Effect.runPromise(program);
}
```

### Error Pattern Summary

| Layer      | Error Model                   | Conversion                              |
| ---------- | ----------------------------- | --------------------------------------- |
| Domain     | `Data.TaggedError`            | `Effect.fail(new ValidationError(...))` |
| Use Cases  | `Data.TaggedError`            | Compose domain errors                   |
| Adapters   | `Data.TaggedError` + external | `Effect.tryPromise` wraps external      |
| Frameworks | HTTP/GraphQL errors           | `Effect.runPromise` + catch at boundary |

---

# 7. SADD Conventions

No changes.

---

# 8. Kaizen Conventions

No changes.

---

# 9. Updated Poka‑Yoke Rules

- Branded types required
- No UUID generation in domain
- No DI in domain

---

# 10. Effect Pattern Quick Reference

## Common Effect Patterns

### Creating Effects

```ts
// Success
Effect.succeed(value);

// Failure
Effect.fail(new ValidationError({ field, message }));

// From Promise (adapters)
Effect.tryPromise({
  try: () => fetchUser(id),
  catch: (error) => new NetworkError({ cause: error }),
});

// From sync function
Effect.sync(() => calculateValue());

// From predicate
Effect.filterOrFail(
  value,
  (v) => v > 0,
  () => new ValidationError({ field: "value", message: "Must be positive" }),
);
```

### Composing Effects

```ts
// Sequential composition
Effect.gen(function* () {
  const a = yield* effectA;
  const b = yield* effectB(a);
  return b;
});

// Parallel composition
Effect.all([effectA, effectB, effectC]);

// Racing
Effect.race(effectA, effectB);

// Fallback
Effect.orElse(effectA, () => effectB);
```

### Error Handling

```ts
// Catch specific error type
effect.pipe(
  Effect.catchTag("ValidationError", (error) => Effect.succeed(defaultValue)),
);

// Catch all errors
effect.pipe(Effect.catchAll((error) => Effect.succeed(fallback)));

// Convert to Either (for branching)
Effect.either(effect); // Effect<Either<E, A>, never, R>

// Map error
effect.pipe(Effect.mapError((error) => new DomainError({ cause: error })));
```

### Running Effects

```ts
// Run sync (for pure Effects)
const result = Effect.runSync(effect);

// Run async
const result = await Effect.runPromise(effect);

// Run with custom Runtime
const runtime = await Effect.runPromise(Layer.toRuntime(layer));
Runtime.runPromise(runtime)(effect);
```

### Dependency Injection with Context

```ts
// Define service interface
interface UserRepository {
  findById(id: string): Effect.Effect<User | null, never, never>;
}

// Create Tag
const UserRepository = Context.Tag<UserRepository>("UserRepository");

// Use in Effect
Effect.gen(function* () {
  const repo = yield* UserRepository;
  return yield* repo.findById(id);
});

// Provide implementation
const program = effect.pipe(
  Effect.provideService(UserRepository, new DrizzleUserRepository(db)),
);
```

---

# 11. Summary of Architectural Guarantees

| Layer      | Error Model                 | Dependencies       | DI  | UUID | Async      |
| ---------- | --------------------------- | ------------------ | --- | ---- | ---------- |
| Domain     | `Effect<T, E, never>`       | None               | No  | No   | No         |
| Use Cases  | `Effect<T, E, R>`           | Domain + Ports     | Yes | Yes  | Via Effect |
| Adapters   | `Effect.tryPromise` + catch | Use Cases + Domain | Yes | Yes  | Via Effect |
| Frameworks | HTTP/GraphQL errors         | Everything         | Yes | Yes  | Via Effect |

---

## Migration: Legacy → Effect

| Legacy Pattern                   | Effect Pattern                                 |
| -------------------------------- | ---------------------------------------------- |
| `Result<T, E>`                   | `Effect<T, E, never>`                          |
| `ok(value)` / `err(error)`       | `Effect.succeed(value)` / `Effect.fail(error)` |
| `isOk(result)` / `isErr(result)` | `Effect.either` or error channels              |
| `Promise<Result<T, E>>`          | `Effect<T, E, R>`                              |
| `async/await`                    | `Effect.gen` with `yield*`                     |
| `try/catch`                      | `Effect.catchTag` / `Effect.catchAll`          |
| `Promise.all`                    | `Effect.all`                                   |
| `Promise.race`                   | `Effect.race`                                  |
| awilix DI                        | `Context.Tag` + `Layer`                        |
