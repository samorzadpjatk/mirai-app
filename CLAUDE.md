# CLAUDE.md — Mirai App Monorepo Conventions

> **CEK Five Pillars Compliance Document**  
> Updated for **Effect‑based orchestration** and **awilix‑modular**  
> Architecture: **Clean Architecture + SDD + TDD + SADD + Kaizen + Effect**
>
> **Effect Framework**: This codebase uses **Effect** as the standard for all error handling and async operations. See **Section 10** for comprehensive patterns, migration guides from legacy patterns, and code style guidelines.
>
> **Note**: Legacy patterns using `Result<T,E>` and `Either` are being migrated to Effect. Use Effect for all new code.

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

The monorepo uses [Effect](https://effect.website) as the standard for all error handling and async operations. See **Section 10** for comprehensive patterns and migration guides.

### Effect Benefits

- **Type-safe error handling** - All errors tracked in the type system
- **Composable operations** - Effects chain naturally with `Effect.gen` and `yield*`
- **Structured concurrency** - Sequential and parallel composition with proper error propagation
- **Dependency injection** - `Context.Tag` for type-safe, testable dependencies
- **No exceptions** - All errors are values, predictable control flow

### Quick Reference

| Pattern                                | Location                              | Documentation              |
| -------------------------------------- | ------------------------------------- | -------------------------- |
| Domain with Effect                     | `packages/domain/src/entities/`       | §10.5.1, §10.2 (Migration) |
| Use cases with Effect                  | `packages/use-cases/src/interactors/` | §10.5.2, §10.4 (DI)        |
| Adapters with `Effect.tryPromise`      | `packages/adapters/src/gateways/`     | §10.5.3                    |
| Error handling with `Data.TaggedError` | All layers                            | §10.3                      |
| Testing with Effect                    | `*.test.ts` files                     | §10.5                      |
| Layer composition                      | `packages/frameworks/`                | §10.4                      |

### Migration Status

| Pattern             | Status              | Notes                             | Migration Guide         |
| ------------------- | ------------------- | --------------------------------- | ----------------------- |
| `Result<T,E>`       | Legacy              | Being migrated                    | §10.2: Result→Effect    |
| `Either<L,R>`       | Legacy              | Use `Effect` for new code         | §10.2: Either→Effect    |
| `async/await`       | Legacy              | Use `Effect.gen` instead          | §10.2: async→Effect.gen |
| `Effect<T,E,never>` | Current (Domain)    | Pure domain Effects               | §10.5.1                 |
| `Effect<T,E,R>`     | Current (Use Cases) | Effects with Context requirements | §10.5.2                 |
| `Effect.tryPromise` | Current (Adapters)  | Wrapping external APIs            | §10.5.3                 |

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

## 4.3 Async Testing Rules (Effect Edition)

See **Section 10.5** for comprehensive Effect testing patterns including mock layers, error testing, and integration tests.

### Domain tests

- Pure functions with `Effect<T, E, never>`
- No async/await in test body
- No DI required (pure Effects)
- Test with `Effect.runSync` or `Effect.runPromise`
- Use `Effect.either` for error case testing

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

- Use `Effect.gen` with `yield*` in implementation
- Mock ports via `Context.Tag` + `Layer.succeed`
- Test with `Effect.runPromise` and provide test layers
- See §10.5.2 for detailed patterns

```ts
import { Effect, Layer } from "effect";

describe("[UNIT] CreateUserUseCase", () => {
  it("creates user successfully", async () => {
    const mockRepo = {
      /* mock implementation */
    };
    const TestLayer = Layer.succeed(UserRepository, mockRepo);

    const effect = useCase.execute({ email: "test@example.com" });
    const user = await Effect.runPromise(
      effect.pipe(Effect.provide(TestLayer)),
    );
    expect(user.email).toBe("test@example.com");
  });
});
```

### Adapter tests

- Integration tests with real test database
- Wrap external calls with `Effect.tryPromise`
- Test error conversion at boundaries
- See §10.5.3 for gateway testing patterns

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

See **§10.2** for complete migration patterns from Result, Either, async/await, and Promise<Result> to Effect.

---

## 5.2 Value Objects Pattern (`packages/domain/src/value-objects/`)

### Branded ID Factory Pattern

**Purpose:** Create type-safe, non-interchangeable identifiers with validation.

**Problem:** Copy-pasting 50+ lines for each ID type creates massive duplication (19 ID types × 50 lines = 950 lines of nearly identical code).

**Solution:** Generic `createBrandedId()` factory with pluggable validation.

**Pattern:**

```typescript
// File: packages/domain/src/utils/branded-id.ts
export type BrandedId<Brand extends string> = string & {
  readonly __brand: Brand;
};

export interface BrandedIdFactory<Brand extends string> {
  create(id: string): BrandedId<Brand>;
  unsafeCreate(id: string): BrandedId<Brand>;
  generate(): BrandedId<Brand>;
  equals(a: BrandedId<Brand>, b: BrandedId<Brand>): boolean;
  toString(id: BrandedId<Brand>): string;
}

export function createBrandedId<Brand extends string>(
  brand: Brand,
  options: {
    validate: (id: string) => boolean;
    errorMessage?: string | ((id: string) => string);
  },
): BrandedIdFactory<Brand> {
  // Factory implementation
}

// Built-in validators
export function isValidUUID(id: string): boolean;
export function isValidCUID(id: string): boolean;
```

**Usage:**

```typescript
// File: packages/domain/src/value-objects/UserId.ts (14 lines vs 60 lines)
import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../utils/branded-id";

export const UserId = createBrandedId("UserId", { validate: isValidUUID });
export type UserId = BrandedId<"UserId">;
```

**Benefits:**

- **78% code reduction** (960 → 210 lines)
- **Single source of truth** for ID validation logic
- **Full type safety** - `UserId` and `ChallengeId` are incompatible
- **Consistent API** - All IDs have `.create()`, `.generate()`, `.equals()`
- **Easy to extend** - New ID type = 1 line of code

**Validation Strategies:**

| Strategy        | Use Case                | Example IDs                |
| --------------- | ----------------------- | -------------------------- |
| `isValidUUID`   | Database uses UUID      | UserId, TripId, ActivityId |
| `isValidCUID`   | Prisma/Supabase default | ChallengeId, LocationId    |
| Custom function | Flexible validation     | SponsorId, ReportId        |

---

## 5.3 Use Cases Layer (`packages/use-cases/`)

See **§10.5.2** for detailed use case patterns with Effect, including error composition, testing with mock layers, and DI with Context.Tags.

### Rules

1. Use **Effect.gen + Context.Tags** for composable orchestration (§10.2, §10.4)
2. Define **ports** (repository interfaces) as Context.Tags (§10.4)
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

See **§10.5.3** for detailed adapter patterns, including gateway implementation with `Effect.tryPromise`, error conversion, and controller error handling at system boundaries.

### Rules

1. Implement ports (Context.Tags) - §10.4
2. Convert between domain and persistence
3. No business logic
4. Use DI via awilix‑modular string keys
5. Use `Effect.tryPromise` for external API calls (§10.5.3)
6. Run Effects at system boundaries with `Effect.runPromise` (§10.7)

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

See **§10.4** for comprehensive Layer composition and DI integration patterns, including bridging awilix-modular with Effect Context.

### Rules

1. awilix‑modular serves as the **framework DI system**
2. Effect **Layers** provide type-safe dependency injection (§10.4)
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

See **Section 10.3** for comprehensive error handling patterns with Effect, including `Data.TaggedError` usage, error composition, and recovery strategies.

## Effect-Based Error Handling

All layers use Effect for explicit, type-safe error handling:

### Domain errors

- `Effect<T, DomainError, never>` - pure Effects with no dependencies
- Use `Data.TaggedError` for pattern matching (§10.3)
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
- Compose errors from multiple operations using union types
- Use `Effect.catchTag` for error recovery (see §10.3)

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

- Wrap external errors with `Data.TaggedError` (§10.3)
- Use `Effect.tryPromise` for async operations (§10.5.3)
- Convert Effect errors to HTTP/GraphQL errors at boundaries (§10.3)

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

| Layer      | Error Model                   | Conversion                              | Detailed Docs  |
| ---------- | ----------------------------- | --------------------------------------- | -------------- |
| Domain     | `Data.TaggedError`            | `Effect.fail(new ValidationError(...))` | §10.3, §10.5.1 |
| Use Cases  | `Data.TaggedError` union      | Compose domain errors in return type    | §10.3, §10.5.2 |
| Adapters   | `Data.TaggedError` + external | `Effect.tryPromise` wraps external      | §10.3, §10.5.3 |
| Frameworks | HTTP/GraphQL errors           | `Effect.runPromise` + catch at boundary | §10.3          |

---

# 7. SADD Conventions

No changes.

---

# 8. Kaizen Conventions

## 8.1 Waste Identification Checklist (Muda Analysis)

Apply the 7 types of waste to code reviews and refactoring decisions:

| Waste Type          | Software Manifestation                    | Detection                            | Fix Strategy               |
| ------------------- | ----------------------------------------- | ------------------------------------ | -------------------------- |
| **Overproduction**  | Unused features, speculative abstractions | Search for dead code, unused exports | Delete or feature-flag     |
| **Waiting**         | Slow builds, long CI times                | Measure build/test duration          | Caching, parallelization   |
| **Transportation**  | Excessive data transformations            | Count mapping layers                 | Consolidate mappers        |
| **Over-processing** | Duplicate validation, excessive logging   | Review validation chains             | Centralize, deduplicate    |
| **Inventory**       | Unmerged branches, stale specs            | `git branch -a`, `.specs/` audit     | Merge or delete            |
| **Motion**          | Context switching, repetitive tasks       | Developer time tracking              | Automate, create templates |
| **Defects**         | Flaky tests, tech debt                    | Test stability metrics               | Stabilize, refactor        |

## 8.2 Code Duplication Patterns

### Pattern 1: Copy-Pasted Boilerplate (High Impact)

**Symptoms:**

- Multiple files with 90%+ identical code
- Only string literals or types differ
- Maintenance burden scales with copy count

**Example:** 19 ID value object files with identical factory methods.

**Solution:** Generic factory with type parameters

```typescript
// Before: 19 files × 60 lines = 1140 lines
// After: 1 factory (100 lines) + 19 exports (5 lines each) = 195 lines
// Reduction: 83%
```

### Pattern 2: Exploratory/Spike Test Files

**Symptoms:**

- `[DEBUG]` or `spike` in test names
- Tests verify framework behavior, not application logic
- Single assertions testing library quirks

**Example:** `debug-headers.test.ts`, `minimal-debug.test.ts`

**Solution:**

1. Create `__spikes__/` directory in `.gitignore`
2. Move exploratory code there
3. Delete when investigation complete
4. Document learnings in code comments, not test files

**Prevention:**

```gitignore
# .gitignore
**/__spikes__/
```

### Pattern 3: Stale Specifications

**Symptoms:**

- Plans in `.specs/plans/` older than 90 days
- Tasks in `.specs/tasks/done/` accumulating
- "Maybe future" work never scheduled

**Solution:**

- Auto-archive specs after 90 days of inactivity
- Convert actionable plans to tasks immediately
- Delete or archive completed tasks weekly

## 8.3 PDCA Improvement Cycle

**Process for systematic waste elimination:**

```
PLAN:   Identify waste → Set measurable target → Design experiment
DO:     Implement change → Document deviations → Collect data
CHECK:  Measure results → Compare to baseline → Learn from data
ACT:    Standardize success → Learn from failure → Next cycle
```

**Example Cycles:**

| Cycle | Target                      | Result             | Time   |
| ----- | --------------------------- | ------------------ | ------ |
| 1     | Eliminate ID duplication    | 78% reduction      | 45 min |
| 2     | Clean WebSocket spike tests | 71% file reduction | 10 min |
| 3     | Review plans inventory      | TBD                | TBD    |

---

# 9. Updated Poka‑Yoke Rules

- Branded types required
- No UUID generation in domain
- No DI in domain

---

# 10. Effect Framework Patterns & Migration Guide

## 10.1 Effect Framework Overview

Effect is the standard for all error handling and async operations. It provides:

- **Type-safe error handling** - Errors tracked in the type system
- **Composability** - Effects chain and compose naturally
- **Dependency injection** - Context.Tags for type-safe dependencies
- **Resource management** - Automatic cleanup and finalization
- **Structured concurrency** - `Effect.gen` for readable async flows

### When to Use Effect

| Scenario               | Pattern                 | Example                                 |
| ---------------------- | ----------------------- | --------------------------------------- |
| Domain validation      | `Effect<T, E, never>`   | `User.create()`                         |
| Use case orchestration | `Effect.gen` + `yield*` | `CreateUserUseCase.execute()`           |
| External API calls     | `Effect.tryPromise`     | Repository gateways                     |
| Error recovery         | `Effect.catchTag`       | Converting domain errors to HTTP errors |
| Parallel operations    | `Effect.all`            | Fetching multiple entities              |
| Dependency injection   | `Context.Tag`           | Repository access in use cases          |

---

## 10.2 Migration Patterns

### Result<T,E> → Effect<T,E,never>

**Legacy Pattern:**

```typescript
// OLD: packages/domain/src/utils/result.ts
export type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };
export const ok = <T>(value: T): Result<T, never> => ({ kind: "ok", value });
export const err = <E>(error: E): Result<never, E> => ({ kind: "err", error });

// OLD: Entity with Result
export class User {
  static create(props: {
    id: string;
    email: string;
  }): Result<User, ValidationError> {
    if (!props.email.includes("@")) {
      return err(new ValidationError("Invalid email"));
    }
    return ok(new User(props.id, props.email));
  }
}

// OLD: Usage
const result = User.create({ id: "1", email: "test@example.com" });
if (result.kind === "ok") {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

**New Effect Pattern:**

```typescript
// NEW: Entity with Effect
import { Effect, Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class User {
  private constructor(
    readonly id: string,
    readonly email: string,
  ) {}

  static create(props: {
    id: string;
    email: string;
  }): Effect.Effect<User, ValidationError, never> {
    if (!props.email.includes("@")) {
      return Effect.fail(
        new ValidationError({
          field: "email",
          message: "Invalid email format",
        }),
      );
    }
    return Effect.succeed(new User(props.id, props.email));
  }
}

// NEW: Usage
const effect = User.create({ id: "1", email: "test@example.com" });

// Option 1: Run and get value (throws on error)
const user = await Effect.runPromise(effect);

// Option 2: Get Either for branching
const either = await Effect.runPromise(Effect.either(effect));
if (either._tag === "Right") {
  console.log(either.right);
} else {
  console.error(either.left);
}

// Option 3: Error recovery
const program = effect.pipe(
  Effect.catchTag("ValidationError", (error) =>
    Effect.succeed(new User("1", "default@example.com")),
  ),
);
```

### async/await → Effect.gen

**Legacy Pattern:**

```typescript
// OLD: Use case with async/await
export class CreateUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(input: { email: string }): Promise<Result<User, Error>> {
    try {
      // Check if user exists
      const existing = await this.userRepo.findByEmail(input.email);
      if (existing) {
        return err(new UserAlreadyExistsError(input.email));
      }

      // Validate and create
      const userResult = User.create({
        id: generateUUID(),
        email: input.email,
      });
      if (userResult.kind === "err") {
        return userResult;
      }

      // Save
      const saved = await this.userRepo.save(userResult.value);
      return ok(saved);
    } catch (error) {
      return err(new DatabaseError(String(error)));
    }
  }
}
```

**New Effect Pattern:**

```typescript
// NEW: Use case with Effect.gen
import { Effect, Data } from "effect";

export class UserAlreadyExistsError extends Data.TaggedError(
  "UserAlreadyExistsError",
)<{ email: string }> {}

export class CreateUserUseCase {
  execute(input: {
    email: string;
  }): Effect.Effect<
    User,
    UserAlreadyExistsError | ValidationError | DatabaseError,
    UserRepository
  > {
    return Effect.gen(function* () {
      // Get repository from Context
      const userRepo = yield* UserRepository;

      // Check if user exists (yield* unwraps the Effect)
      const existing = yield* userRepo.findByEmail(input.email);
      if (existing) {
        return yield* Effect.fail(
          new UserAlreadyExistsError({ email: input.email }),
        );
      }

      // Validate and create (composes ValidationError into error channel)
      const user = yield* User.create({
        id: generateUUID(),
        email: input.email,
      });

      // Save and return
      return yield* userRepo.save(user);
    });
  }
}

// Usage with dependency injection
const program = Effect.gen(function* () {
  const useCase = yield* CreateUserUseCaseTag;
  return yield* useCase.execute({ email: "test@example.com" });
}).pipe(Effect.provide(LiveLayer));

const user = await Effect.runPromise(program);
```

### Promise<Result<T,E>> → Effect<T,E,R>

**Legacy Pattern:**

```typescript
// OLD: Repository returning Promise<Result>
interface UserRepository {
  findById(id: string): Promise<Result<User | null, DatabaseError>>;
  save(user: User): Promise<Result<User, DatabaseError>>;
}

// OLD: Composing multiple operations
async function getUserWithGroups(
  userId: string,
): Promise<Result<UserWithGroups, Error>> {
  const userResult = await userRepo.findById(userId);
  if (userResult.kind === "err") return userResult;
  if (!userResult.value) return err(new NotFoundError("User", userId));

  const groupsResult = await groupRepo.findByUserId(userId);
  if (groupsResult.kind === "err") return groupsResult;

  return ok({ ...userResult.value, groups: groupsResult.value });
}
```

**New Effect Pattern:**

```typescript
// NEW: Repository returning Effect
import { Context, Effect } from "effect";

export interface UserRepository {
  findById(id: string): Effect.Effect<User | null, DatabaseError, never>;
  save(user: User): Effect.Effect<User, DatabaseError, never>;
}

export const UserRepository = Context.Tag<UserRepository>("UserRepository");

// NEW: Composing multiple operations with Effect.gen
function getUserWithGroups(userId: string) {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepository;
    const groupRepo = yield* GroupRepository;

    // Sequential composition - errors automatically propagate
    const user = yield* userRepo.findById(userId);
    if (!user) {
      return yield* Effect.fail(
        new NotFoundError({ entity: "User", id: userId }),
      );
    }

    const groups = yield* groupRepo.findByUserId(userId);

    return { ...user, groups };
  });
}

// Parallel composition
function getUserAndGroupsParallel(userId: string) {
  return Effect.gen(function* () {
    const userRepo = yield* UserRepository;
    const groupRepo = yield* GroupRepository;

    // Fetch in parallel
    const [user, groups] = yield* Effect.all([
      userRepo.findById(userId),
      groupRepo.findByUserId(userId),
    ]);

    if (!user) {
      return yield* Effect.fail(
        new NotFoundError({ entity: "User", id: userId }),
      );
    }

    return { ...user, groups };
  });
}
```

---

## 10.3 Error Handling with Data.TaggedError

### Defining Tagged Errors

Always use `Data.TaggedError` for domain and use case errors. This enables pattern matching with `Effect.catchTag`.

```typescript
import { Data } from "effect";

// Domain errors
export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  entity: string;
  id: string;
}> {}

// Use case errors
export class UserAlreadyExistsError extends Data.TaggedError(
  "UserAlreadyExistsError",
)<{ email: string }> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  userId: string;
  resource: string;
}> {}

// Adapter errors
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  cause?: unknown;
}> {}

export class NetworkError extends Data.TaggedError("NetworkError")<{
  url: string;
  cause?: unknown;
}> {}
```

### Error Composition in Use Cases

Use cases compose errors from multiple domain operations:

```typescript
import { Effect } from "effect";

export class CreateGroupUseCase {
  execute(input: { name: string; ownerId: string }): Effect.Effect<
    Group,
    | ValidationError // From Group.create
    | NotFoundError // From user lookup
    | UnauthorizedError // From permission check
    | DatabaseError, // From repository
    UserRepository | GroupRepository
  > {
    return Effect.gen(function* () {
      const userRepo = yield* UserRepository;
      const groupRepo = yield* GroupRepository;

      // ValidationError possible here
      const group = yield* Group.create({ name: input.name });

      // NotFoundError possible here
      const owner = yield* userRepo.findById(input.ownerId);
      if (!owner) {
        return yield* Effect.fail(
          new NotFoundError({ entity: "User", id: input.ownerId }),
        );
      }

      // UnauthorizedError possible here
      if (!owner.canCreateGroups) {
        return yield* Effect.fail(
          new UnauthorizedError({
            userId: input.ownerId,
            resource: "group:create",
          }),
        );
      }

      // DatabaseError possible here
      return yield* groupRepo.save(group, owner);
    });
  }
}
```

### Error Recovery Patterns

```typescript
import { Effect } from "effect";

// Pattern 1: Catch specific error and provide default
const program1 = effect.pipe(
  Effect.catchTag(
    "NotFoundError",
    (error) => Effect.succeed(null), // Return null for not found
  ),
);

// Pattern 2: Catch and transform error type
const program2 = effect.pipe(
  Effect.catchTag("DatabaseError", (error) =>
    Effect.fail(new ServiceUnavailableError({ cause: error })),
  ),
);

// Pattern 3: Catch multiple error types
const program3 = effect.pipe(
  Effect.catchTags({
    NotFoundError: (error) => Effect.succeed(null),
    ValidationError: (error) =>
      Effect.fail(new BadRequestError({ message: error.message })),
  }),
);

// Pattern 4: Catch all errors
const program4 = effect.pipe(
  Effect.catchAll((error) => {
    logger.error("Unexpected error", error);
    return Effect.fail(new InternalServerError());
  }),
);

// Pattern 5: Convert to Either for explicit branching
const program5 = effect.pipe(Effect.either);
// Returns: Effect<Either<ErrorType, SuccessType>, never, Dependencies>
```

### Converting Errors at Boundaries (Controllers)

```typescript
import { Effect } from "effect";
import { TRPCError } from "@trpc/server";

export class GroupController {
  constructor(private createGroupUseCase: CreateGroupUseCase) {}

  async create(input: CreateGroupInput, di: DIContext) {
    const program = this.createGroupUseCase.execute(input).pipe(
      // Convert domain errors to HTTP errors
      Effect.catchTag("ValidationError", (error) => {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${error.field}: ${error.message}`,
        });
      }),
      Effect.catchTag("NotFoundError", (error) => {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `${error.entity} not found: ${error.id}`,
        });
      }),
      Effect.catchTag("UnauthorizedError", (error) => {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Access denied to ${error.resource}`,
        });
      }),
      // Let DatabaseError propagate as 500 (internal error)
    );

    return await Effect.runPromise(program);
  }
}
```

---

## 10.4 Layer Composition and DI Integration

### Context.Tag Pattern (Primary DI)

Use `Context.Tag` for dependency injection within Effect programs:

```typescript
import { Context, Effect } from "effect";

// 1. Define service interface
export interface UserRepository {
  findById(id: string): Effect.Effect<User | null, DatabaseError, never>;
  save(user: User): Effect.Effect<User, DatabaseError, never>;
}

// 2. Create Context.Tag
export const UserRepository = Context.Tag<UserRepository>("UserRepository");

// 3. Use in Effect.gen
export class GetUserUseCase {
  execute(
    id: string,
  ): Effect.Effect<User, NotFoundError | DatabaseError, UserRepository> {
    return Effect.gen(function* () {
      const repo = yield* UserRepository; // Type-safe resolution
      const user = yield* repo.findById(id);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ entity: "User", id }));
      }
      return user;
    });
  }
}

// 4. Provide implementation
const program = getUserUseCase
  .execute("123")
  .pipe(Effect.provideService(UserRepository, new DrizzleUserRepository(db)));
```

### Layer Composition (Application Setup)

Combine multiple services into Layers:

```typescript
import { Layer, Effect } from "effect";

// Individual service layers
const UserRepositoryLive = Layer.succeed(
  UserRepository,
  new DrizzleUserRepository(db),
);

const GroupRepositoryLive = Layer.succeed(
  GroupRepository,
  new DrizzleGroupRepository(db),
);

const LoggerLive = Layer.succeed(Logger, new ConsoleLogger());

// Composed layers
const RepositoryLayer = Layer.mergeAll(UserRepositoryLive, GroupRepositoryLive);

const ServiceLayer = Layer.mergeAll(
  LoggerLive,
  // ... other services
);

// Full application layer
const AppLayer = Layer.mergeAll(RepositoryLayer, ServiceLayer);

// Build runtime
const runtime = await Effect.runPromise(Layer.toRuntime(AppLayer));

// Run any program with full dependencies
const result = await Runtime.runPromise(runtime)(program);
```

### awilix-modular + Effect Integration

Bridge awilix-modular (framework DI) with Effect Context:

```typescript
// frameworks/di/effect-bridge.ts
import { Layer, Context, Effect } from "effect";
import type { DIContainer } from "./container";

// Bridge awilix container to Effect Context
export const makeContainerLayer = (
  container: DIContainer,
): Layer.Layer<Context.Context<UserRepository | GroupRepository>> => {
  return Layer.mergeAll(
    Layer.succeed(UserRepository, container.resolve("userRepository")),
    Layer.succeed(GroupRepository, container.resolve("groupRepository")),
  );
};

// In controller: resolve from container and provide to Effect
export class UserController {
  async getById(input: { id: string }, di: DIContext) {
    const container = di.container;

    // Resolve use case from awilix container
    const useCase = container.resolve("getUserUseCase");

    // Create Effect program and provide dependencies
    const program = useCase.execute(input.id).pipe(
      Effect.provide(makeContainerLayer(container)),
      Effect.catchTag("NotFoundError", () => {
        throw new TRPCError({ code: "NOT_FOUND" });
      }),
    );

    return await Effect.runPromise(program);
  }
}
```

### Scoped Dependencies (Request-scoped)

For request-scoped dependencies (transactions, auth context):

```typescript
import { Context, Effect, Layer } from "effect";

// Request-scoped context
export interface RequestContext {
  requestId: string;
  authContext: AuthContext;
}

export const RequestContext = Context.Tag<RequestContext>("RequestContext");

// Use case that needs request context
export class CreateGroupUseCase {
  execute(input: { name: string }) {
    return Effect.gen(function* () {
      const requestCtx = yield* RequestContext;
      const repo = yield* GroupRepository;

      // Access request-scoped data
      console.log(`Processing request ${requestCtx.requestId}`);

      const group = yield* Group.create({
        name: input.name,
        ownerId: requestCtx.authContext.userId,
      });

      return yield* repo.save(group);
    });
  }
}

// Provide request-scoped layer per request
app.post("/groups", async (req, res) => {
  const requestLayer = Layer.succeed(RequestContext, {
    requestId: generateRequestId(),
    authContext: req.authContext,
  });

  const program = createGroupUseCase
    .execute(req.body)
    .pipe(Effect.provide(requestLayer), Effect.provide(AppLayer));

  const result = await Effect.runPromise(program);
  res.json(result);
});
```

---

## 10.5 Testing with Effect

### Testing Domain (Pure Effects)

```typescript
import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { User, ValidationError } from "@mirai-app/domain";

describe("[UNIT] User entity", () => {
  it("creates valid user", () => {
    const effect = User.create({
      id: "user-1",
      email: "test@example.com",
      createdAt: new Date(),
    });

    // Run synchronously for pure Effects
    const user = Effect.runSync(effect);
    expect(user.email).toBe("test@example.com");
  });

  it("fails with invalid email", () => {
    const effect = User.create({
      id: "user-1",
      email: "invalid-email",
      createdAt: new Date(),
    });

    // Use Effect.either to test error case
    const either = Effect.runSync(Effect.either(effect));
    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(ValidationError);
      expect(either.left.field).toBe("email");
    }
  });

  it("fails with empty name using runPromise", async () => {
    const effect = User.create({
      id: "user-1",
      email: "",
      createdAt: new Date(),
    });

    // Can also use async runPromise
    const either = await Effect.runPromise(Effect.either(effect));
    expect(either._tag).toBe("Left");
  });
});
```

### Testing Use Cases (with mocked dependencies)

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { CreateUserUseCase, UserRepository } from "@mirai-app/use-cases";
import { User } from "@mirai-app/domain";

// Create mock repository
const createMockUserRepository = (users: User[] = []) => ({
  findByEmail: (email: string) =>
    Effect.succeed(users.find((u) => u.email === email) || null),
  save: (user: User) => Effect.succeed(user),
});

describe("[UNIT] CreateUserUseCase", () => {
  it("creates user successfully", async () => {
    const mockRepo = createMockUserRepository([]);
    const useCase = new CreateUserUseCase();

    const program = useCase
      .execute({ email: "test@example.com" })
      .pipe(Effect.provideService(UserRepository, mockRepo));

    const user = await Effect.runPromise(program);
    expect(user.email).toBe("test@example.com");
  });

  it("fails when user already exists", async () => {
    const existingUser = /* create existing user */;
    const mockRepo = createMockUserRepository([existingUser]);
    const useCase = new CreateUserUseCase();

    const program = useCase
      .execute({ email: "existing@example.com" })
      .pipe(Effect.provideService(UserRepository, mockRepo));

    const either = await Effect.runPromise(Effect.either(program));
    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left._tag).toBe("UserAlreadyExistsError");
    }
  });
});
```

### Testing with Test Layers

```typescript
import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";

// Build test layer with all mocked dependencies
const TestLayer = Layer.mergeAll(
  Layer.succeed(UserRepository, mockUserRepository),
  Layer.succeed(GroupRepository, mockGroupRepository),
  Layer.succeed(Logger, mockLogger),
);

describe("[UNIT] Complex use case", () => {
  it("completes full workflow", async () => {
    const useCase = new ComplexUseCase();

    const program = useCase
      .execute({
        /* input */
      })
      .pipe(Effect.provide(TestLayer));

    const result = await Effect.runPromise(program);
    expect(result).toBeDefined();
  });

  it("handles errors from multiple sources", async () => {
    const failingRepo = {
      findById: () => Effect.fail(new DatabaseError({ operation: "findById" })),
    };

    const FailingTestLayer = Layer.succeed(UserRepository, failingRepo);

    const program = useCase
      .execute({ id: "123" })
      .pipe(Effect.provide(FailingTestLayer));

    const either = await Effect.runPromise(Effect.either(program));
    expect(either._tag).toBe("Left");
  });
});
```

### Integration Testing (Real Database)

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Effect } from "effect";
import { createTestDatabase, resetDatabase } from "./test-helpers";

describe("[INTEGRATION] DrizzleUserRepository", () => {
  let db: Database;
  let repository: DrizzleUserRepository;

  beforeAll(async () => {
    db = await createTestDatabase();
    repository = new DrizzleUserRepository(db);
  });

  afterAll(async () => {
    await resetDatabase(db);
  });

  it("saves and retrieves user", async () => {
    const user = await Effect.runPromise(
      User.create({
        id: "test-1",
        email: "test@example.com",
        createdAt: new Date(),
      }),
    );

    const saved = await Effect.runPromise(repository.save(user));
    expect(saved.id).toBe("test-1");

    const found = await Effect.runPromise(repository.findById("test-1"));
    expect(found?.email).toBe("test@example.com");
  });

  it("returns null for non-existent user", async () => {
    const result = await Effect.runPromise(repository.findById("non-existent"));
    expect(result).toBeNull();
  });
});
```

---

## 10.6 Code Style Guidelines for Effect

### Naming Conventions

| Construct        | Convention                     | Example                               |
| ---------------- | ------------------------------ | ------------------------------------- |
| Effect variables | `effect` or descriptive        | `createUserEffect`, `fetchDataEffect` |
| Tagged errors    | PascalCase with `Error` suffix | `ValidationError`, `NotFoundError`    |
| Context.Tags     | PascalCase, matches interface  | `UserRepository`, `Logger`            |
| Layer variables  | `*Live` or `*Test`             | `UserRepositoryLive`, `TestLayer`     |
| Programs         | Descriptive                    | `createUserProgram`, `fetchWorkflow`  |

### Effect.gen Guidelines

```typescript
// GOOD: Clean, sequential composition
const program = Effect.gen(function* () {
  const user = yield* UserRepository.findById(id);
  if (!user) {
    return yield* Effect.fail(new NotFoundError({ entity: "User", id }));
  }
  const groups = yield* GroupRepository.findByUserId(user.id);
  return { user, groups };
});

// GOOD: Early returns with yield*
const program = Effect.gen(function* () {
  const cached = yield* Cache.get(key);
  if (cached) {
    return cached; // Early return
  }

  const fetched = yield* fetchFromApi(key);
  yield* Cache.set(key, fetched);
  return fetched;
});

// AVOID: Deep nesting
const program = Effect.gen(function* () {
  const a = yield* effectA;
  if (a) {
    const b = yield* effectB(a);
    if (b) {
      const c = yield* effectC(b); // Too deep
      return c;
    }
  }
  return null;
});

// GOOD: Flatten with early returns
const program = Effect.gen(function* () {
  const a = yield* effectA;
  if (!a) return null;

  const b = yield* effectB(a);
  if (!b) return null;

  return yield* effectC(b);
});
```

### Error Handling Style

```typescript
// GOOD: Specific error types with Data.TaggedError
export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}> {}

export class GroupFullError extends Data.TaggedError("GroupFullError")<{
  groupId: string;
  maxSize: number;
}> {}

// GOOD: Error composition in use case signature
execute(input: {
  userId: string;
  groupId: string;
}): Effect.Effect<
  Membership,
  UserNotFoundError | GroupFullError | DatabaseError,
  UserRepository | GroupRepository
> {
  return Effect.gen(function* () {
    // Implementation
  });
}

// AVOID: Generic errors
Effect.fail(new Error("Something went wrong")); // Don't do this

// GOOD: Specific, actionable errors
Effect.fail(new DatabaseError({ operation: "findById", id, cause: error }));
```

### Pipe vs Effect.gen

```typescript
// GOOD: Use pipe for simple transformations
const program = Effect.succeed(data).pipe(
  Effect.map((d) => d.items),
  Effect.filterOrFail(
    (items) => items.length > 0,
    () => new NotFoundError({ entity: "Items" }),
  ),
  Effect.map((items) => items[0]),
);

// GOOD: Use Effect.gen for complex orchestration
const program = Effect.gen(function* () {
  const user = yield* fetchUser(id);
  const permissions = yield* fetchPermissions(user.role);
  const resources = yield* fetchResources(permissions);

  if (resources.length === 0) {
    return yield* Effect.fail(new NoResourcesError());
  }

  return { user, resources };
});

// AVOID: Long chains in pipe when gen is clearer
// Instead of:
effectA.pipe(
  Effect.flatMap((a) =>
    effectB(a).pipe(
      Effect.flatMap((b) => effectC(b).pipe(Effect.map((c) => ({ a, b, c })))),
    ),
  ),
);

// Prefer:
Effect.gen(function* () {
  const a = yield* effectA;
  const b = yield* effectB(a);
  const c = yield* effectC(b);
  return { a, b, c };
});
```

### Type Annotations

```typescript
// GOOD: Explicit return type on public methods
export class UserService {
  findById(id: string): Effect.Effect<User | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: () => this.db.query.users.findFirst({ where: eq(users.id, id) }),
      catch: (error) =>
        new DatabaseError({ operation: "findById", id, cause: error }),
    });
  }
}

// GOOD: Type parameters on generic Effects
const retryPolicy = Effect.retry(
  effect,
  Schedule.exponential(1000).pipe(Schedule.intersect(Schedule.recurs(3))),
);

// AVOID: Implicit any in Effect callbacks
Effect.map((x) => x.id); // x is implicitly any - avoid

// GOOD: Explicit types or inference from typed source
Effect.map((x: User) => x.id); // Explicit
// OR
userEffect.pipe(Effect.map((user) => user.id)); // Inferred from userEffect type
```

### Layer and Context Guidelines

```typescript
// GOOD: Tag near interface definition
export interface Logger {
  log(message: string): Effect.Effect<void, never, never>;
  error(message: string, error?: unknown): Effect.Effect<void, never, never>;
}

export const Logger = Context.Tag<Logger>("Logger");

// GOOD: Live layer implementation in separate file
// layers/LoggerLive.ts
export const LoggerLive = Layer.succeed(Logger, {
  log: (message) => Effect.sync(() => console.log(message)),
  error: (message, error) => Effect.sync(() => console.error(message, error)),
});

// GOOD: Test layer for testing
// test-utils/TestLayers.ts
export const LoggerTest = Layer.succeed(Logger, {
  log: () => Effect.succeed(undefined),
  error: () => Effect.succeed(undefined),
});

// AVOID: Creating tags inline without explicit type
const repo = Context.Tag("Repository"); // Missing generic type

// GOOD: Explicit generic type
const UserRepository = Context.Tag<UserRepository>("UserRepository");
```

---

## 10.7 Effect Pattern Quick Reference

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

| Layer      | Error Model                            | Dependencies       | DI                    | UUID | Async                   | Pattern Reference |
| ---------- | -------------------------------------- | ------------------ | --------------------- | ---- | ----------------------- | ----------------- |
| Domain     | `Effect<T, E, never>`                  | None (pure)        | No                    | No   | Via `Effect.gen`        | §10.5.1, §10.7    |
| Use Cases  | `Effect<T, E, R>`                      | Domain + Ports     | Yes (Context.Tag)     | Yes  | Via `Effect.gen`        | §10.5.2, §10.4    |
| Adapters   | `Effect.tryPromise` + error conversion | Use Cases + Domain | Yes (awilix + Effect) | Yes  | Via `Effect.tryPromise` | §10.5.3, §10.7    |
| Frameworks | HTTP/GraphQL error responses           | Everything         | Yes (awilix-modular)  | Yes  | Via `Effect.runPromise` | §10.4, §10.7      |

---

## Migration: Legacy → Effect (Complete Reference)

| Legacy Pattern                   | Effect Pattern                           | Migration Guide                                                          |
| -------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `Result<T, E>`                   | `Effect<T, E, never>`                    | §10.2: Replace `ok()`/`err()` with `Effect.succeed()`/`Effect.fail()`    |
| `Either<L,R>`                    | `Effect<T, E, never>`                    | §10.2: Use `Effect.either` to convert to Either when needed              |
| `isOk(result)` / `isErr(result)` | `Effect.either` or direct error handling | §10.2: Use `yield*` for error propagation, `Effect.either` for branching |
| `Promise<Result<T, E>>`          | `Effect<T, E, R>`                        | §10.2: Remove Promise wrapper, Effect is already async-capable           |
| `async/await`                    | `Effect.gen` + `yield*`                  | §10.2: Sequential composition with `yield*`, parallel with `Effect.all`  |
| `try/catch`                      | `Effect.catchTag` / `Effect.catchAll`    | §10.3: Pattern match errors with `catchTag`, catch all with `catchAll`   |
| `throw new Error()`              | `Effect.fail(new Data.TaggedError(...))` | §10.3: Use tagged errors for pattern matching                            |
| `Promise.all([...])`             | `Effect.all([...])`                      | §10.7: Parallel composition with automatic error merging                 |
| `Promise.race([...])`            | `Effect.race(...)`                       | §10.7: Racing effects                                                    |
| awilix DI                        | `Context.Tag` + `Layer`                  | §10.4: Type-safe DI with Context.Tags                                    |
| `new Repository()` injection     | `yield* RepositoryTag`                   | §10.4: Service location with `yield*` in `Effect.gen`                    |
| Repository interface             | Context.Tag + interface                  | §10.4: Tag serves as both interface and injection key                    |

---

## 10.8 Summary: Effect by Layer

### Domain Layer (`packages/domain/`)

```typescript
// Pure Effects, no dependencies
static create(props: Props): Effect.Effect<Entity, ValidationError, never> {
  return Effect.gen(function* () {
    // Validation logic
    if (invalid) {
      return yield* Effect.fail(new ValidationError({ field, message }));
    }
    return new Entity(...);
  });
}
```

### Use Cases Layer (`packages/use-cases/`)

```typescript
// Effects with Context requirements
execute(input: Input): Effect.Effect<
  Output,
  DomainErrors | UseCaseErrors,
  RepositoryTag | ServiceTag
> {
  return Effect.gen(function* () {
    const repo = yield* RepositoryTag;
    // Orchestration logic
    return result;
  });
}
```

### Adapters Layer (`packages/adapters/`)

```typescript
// Gateway wrapping external APIs
findById(id: string): Effect.Effect<User | null, DatabaseError, never> {
  return Effect.tryPromise({
    try: () => this.db.query.users.findFirst({ where: eq(users.id, id) }),
    catch: (error) => new DatabaseError({ operation: "findById", id, cause: error }),
  }).pipe(Effect.map((u) => u ? toDomain(u) : null));
}

// Controller at system boundary
async handle(input: Input, di: DIContext) {
  const program = this.useCase.execute(input).pipe(
    Effect.catchTag("NotFoundError", () => {
      throw new TRPCError({ code: "NOT_FOUND" });
    }),
    Effect.catchTag("ValidationError", (error) => {
      throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    }),
  );
  return await Effect.runPromise(program);
}
```

### Frameworks Layer (`packages/frameworks/`)

```typescript
// Layer composition and runtime setup
const AppLayer = Layer.mergeAll(RepositoryLayer, ServiceLayer, ConfigLayer);

const runtime = await Effect.runPromise(Layer.toRuntime(AppLayer));
Runtime.runPromise(runtime)(program);
```
