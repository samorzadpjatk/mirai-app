# Effect Framework Migration Design

> **Comprehensive migration plan for the Mirai App monorepo from Promise-based patterns to Effect framework**  
> **Status:** Validated  
> **Last Updated:** 2026-04-12  
> **Platform:** Bun (`@effect/platform-bun`), React Native (core `effect` only)

---

## Executive Summary

This document outlines a complete migration from the current Promise-based architecture (with custom `Result<T,E>` types) to the **Effect framework**. The migration maintains Clean Architecture boundaries while modernizing error handling, introducing structured concurrency, and enabling observability.

### Key Outcomes

| Aspect          | Before                            | After                                       |
| --------------- | --------------------------------- | ------------------------------------------- |
| **Error Model** | Custom `Result<T,E>` + exceptions | `Effect.Effect<T, E, R>` with tagged errors |
| **DI System**   | awilix + awilix-modular           | Effect Context + Layers                     |
| **DB Access**   | async/await with Drizzle          | `@effect/sql-drizzle` with Effect           |
| **GraphQL**     | async/await resolvers             | Effect.runPromise at boundaries             |
| **Test Setup**  | Container mocking                 | Layer-based test wiring                     |

### Timeline

**8 weeks (1-2 months solo)** with comprehensive test coverage

- **Week 1-2:** Foundation & Domain Layer
- **Week 3-4:** Use Cases Layer
- **Week 5-6:** Adapters & GraphQL Layer
- **Week 7-8:** Integration, Testing & Performance

---

## 1. Architecture Overview

### Current State (Promise-Based)

```
Domain:    Result<T,E> (pure sync)
Use Cases: async/await + Promise<Result<T,E>>
Adapters:  async/await + DI via awilix-modular
Apps:      GraphQL + async/await (tRPC deprecated)
```

### Target State (Effect-Based)

```
Domain:    Effect.Effect<T, E, never> (pure sync Effects)
Use Cases: Effect.Effect<T, E, R> (with service requirements)
Adapters:  Effect.Effect<T, E, R> (with infrastructure requirements)
Apps:      Effect.runPromise in GraphQL resolvers
```

### Migration Sequence

**Layer-by-layer migration** maintains Clean Architecture while converting:

1. **Domain Layer** → Convert `Result` to `Effect`
2. **Use Cases Layer** → Convert async/await to `Effect.gen`
3. **Adapters Layer** → Wrap external calls with `Effect.tryPromise`
4. **Apps Layer** → Bridge Effect back to GraphQL with `Effect.runPromise`

---

## 2. Library Consolidation

### Libraries to Remove

| Library            | Package(s)               | Replacement           | Reason                                                 |
| ------------------ | ------------------------ | --------------------- | ------------------------------------------------------ |
| **awilix**         | backend-server, adapters | Effect Context/Layers | Effect's native DI is more powerful and type-safe      |
| **awilix-modular** | backend-server, adapters | Effect Layers         | No need for external DI framework                      |
| **zod** (partial)  | adapters, frameworks     | Effect Schema         | Effect Schema provides validation + effect composition |

### Libraries to Keep (with Effect Wrappers)

| Library                         | Reason                                                      |
| ------------------------------- | ----------------------------------------------------------- |
| **@supabase/supabase-js**       | No Effect-native alternative; wrap with `Effect.tryPromise` |
| **graphql-yoga / @pothos/core** | GraphQL layer stays, but resolvers use Effect               |
| **expo-\* / react-native**      | Native dependencies stay, wrap native calls with Effect     |
| **@effect/sql-drizzle**         | Replaces raw Drizzle with Effect-native SQL operations      |

### Effect Ecosystem by Package

**Core (all packages):**

```json
{
  "dependencies": {
    "effect": "^3.15.0"
  }
}
```

**Bun-based apps/packages (backend-server, notification-sender, seed, all packages):**

```json
{
  "dependencies": {
    "@effect/platform": "^0.75.0",
    "@effect/platform-bun": "^0.75.0",
    "@effect/sql": "^0.30.0",
    "@effect/sql-drizzle": "^0.30.0"
  }
}
```

**React Native / Expo (native app only):**

```json
{
  "dependencies": {
    "effect": "^3.15.0"
    // NO @effect/platform packages - React Native uses its own runtime (JavaScriptCore/Hermes)
    // Core Effect works fine, but platform-specific features (FileSystem, Path, etc.)
    // need React Native specific implementations
  }
}
```

### Platform Package Strategy

| Environment                   | Platform Package       | Notes                                                                                                       |
| ----------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Bun** (backend, packages)   | `@effect/platform-bun` | Full FileSystem, Path, Terminal, Command support                                                            |
| **React Native** (native app) | **None**               | Use core `effect` only. RN uses JavaScriptCore/Hermes, not Node/Bun. Platform APIs need custom RN wrappers. |

### React Native Considerations

React Native does **not** use `@effect/platform-*` packages because:

- RN runs on JavaScriptCore (iOS) or Hermes (Android), not Node.js/Bun
- File system access goes through `expo-file-system` (native bridge)
- SQLite access goes through `expo-sqlite` (native bridge)
- **Solution**: Keep using `expo-*` packages, wrap native calls with `Effect.tryPromise`

**Example React Native pattern:**

```typescript
import * as FileSystem from "expo-file-system";
import { Effect } from "effect";

// Wrap native modules in Effect
export const readFile = (uri: string) =>
  Effect.tryPromise({
    try: () => FileSystem.readAsStringAsync(uri),
    catch: (error) => new FileSystemError({ cause: error }),
  });
```

---

## 3. Domain Layer Migration (Week 1-2)

### Error Types (Effect-Native)

Replace custom error classes with `Data.TaggedError` for pattern matching:

```typescript
// packages/domain/src/errors/domain-errors.ts
import { Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class EntityNotFoundError extends Data.TaggedError(
  "EntityNotFoundError",
)<{
  entityType: string;
  id: string;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  action: string;
}> {}
```

### Entity Migration Pattern

**Before:**

```typescript
// packages/domain/src/entities/User.ts
import type { Result } from "../utils/result";
import { ok, err, isError } from "../utils/result";

export class User {
  static create(props: {...}): Result<User, ValidationError> {
    if (invalid) return err(new ValidationError("..."));
    return ok(new User(...));
  }
}
```

**After:**

```typescript
// packages/domain/src/entities/User.ts
import { Effect } from "effect";
import { ValidationError } from "../errors/domain-errors";

export class User {
  static create(props: {...}): Effect.Effect<User, ValidationError> {
    return Effect.gen(function* () {
      if (invalid) {
        return yield* Effect.fail(new ValidationError({
          field: "email",
          message: "Invalid email format"
        }));
      }
      return new User(...);
    });
  }
}
```

### Key Principles

1. **Pure domain** - no external dependencies still enforced
2. **No UUID/time generation** - pass IDs and timestamps as parameters
3. **Tagged errors** - use `Data.TaggedError` for exhaustiveness checking
4. **Effect.gen** - for sequential validation logic

---

## 4. Use Cases Layer Migration (Week 3-4)

### Port Transformation

Convert repository interfaces to Effect-based:

```typescript
// packages/use-cases/src/ports/UserRepository.ts
import { Effect } from "effect";
import type { User } from "@mirai-app/domain";
import { RepositoryError } from "../errors";

export interface UserRepository {
  readonly findById: (id: string) => Effect.Effect<User | null, never>;
  readonly findByEmail: (email: string) => Effect.Effect<User | null, never>;
  readonly create: (user: User) => Effect.Effect<User, RepositoryError>;
  readonly save: (user: User) => Effect.Effect<User, RepositoryError>;
}

// Service tag for Context
export class UserRepository extends Context.Tag("UserRepository")<
  UserRepository,
  UserRepository
>() {}
```

### Use Case Transformation

**Before:**

```typescript
// packages/use-cases/src/interactors/CreateUser.ts
export class CreateUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(input: {
    email: string;
  }): Promise<Result<User, UserAlreadyExistsError>> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      return err(new UserAlreadyExistsError());
    }
    const userResult = User.create({ email: input.email });
    if (userResult.kind === "err") {
      return err(userResult.error);
    }
    const saved = await this.userRepo.create(userResult.value);
    return ok(saved);
  }
}
```

**After:**

```typescript
// packages/use-cases/src/interactors/CreateUser.ts
import { Effect, Context, Data } from "effect";
import { User, ValidationError } from "@mirai-app/domain";
import { UserRepository, RepositoryError } from "../ports";

export class UserAlreadyExistsError extends Data.TaggedError(
  "UserAlreadyExistsError",
)<{}> {}

// Service definition via Context.Tag
export class CreateUserUseCase extends Context.Tag("CreateUserUseCase")<
  CreateUserUseCase,
  {
    readonly execute: (input: {
      email: string;
    }) => Effect.Effect<
      User,
      UserAlreadyExistsError | ValidationError | RepositoryError
    >;
  }
>() {}

// Live implementation factory
export const CreateUserUseCaseLive = Layer.effect(
  CreateUserUseCase,
  Effect.gen(function* () {
    const userRepo = yield* UserRepository;

    return {
      execute: (input) =>
        Effect.gen(function* () {
          const existing = yield* userRepo.findByEmail(input.email);

          if (existing !== null) {
            return yield* Effect.fail(new UserAlreadyExistsError());
          }

          const user = yield* User.create({ email: input.email });
          return yield* userRepo.create(user);
        }),
    };
  }),
);
```

### Key Principles

1. **No more classes with constructors** - use `Context.Tag` for service definition
2. **No more async/await** - use `Effect.gen` with `yield*`
3. **Automatic error union** - Effect unions all possible errors in the type signature
4. **Composability** - Use cases can be composed with `Effect.andThen`, `Effect.flatMap`

---

## 5. Adapters & GraphQL Layer (Week 5-6)

### Repository with @effect/sql-drizzle

```typescript
// packages/adapters/src/gateways/DrizzleUserRepository.ts
import { Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { Drizzle } from "@effect/sql-drizzle";
import * as schema from "@mirai-app/frameworks/drizzle/schema";
import { UserRepository } from "@mirai-app/use-cases";

export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const db = Drizzle.make(sql, { schema });

    return {
      findById: (id: string) =>
        db.query.users
          .findFirst({
            where: eq(schema.users.id, id),
          })
          .pipe(
            Effect.map((record) =>
              record ? UserMapper.toDomain(record) : null,
            ),
            Effect.catchAll((error) =>
              Effect.fail(
                new RepositoryError({ operation: "findById", cause: error }),
              ),
            ),
          ),

      create: (user: User) =>
        db
          .insert(schema.users)
          .values(UserMapper.toPersistence(user))
          .returning()
          .pipe(
            Effect.map((rows) => rows[0]!),
            Effect.map(UserMapper.toDomain),
            Effect.catchAll((error) =>
              Effect.fail(
                new RepositoryError({ operation: "create", cause: error }),
              ),
            ),
          ),
    };
  }),
);
```

### GraphQL Context with Effect Runtime

```typescript
// apps/backend-server/src/graphql/context.ts
import { Effect, Runtime, Layer } from "effect";
import type { HonoContext } from "hono";
import type { AuthContext } from "@mirai-app/domain";
import { AppLayer, AppServices } from "@mirai-app/frameworks";

export interface GraphQLContext {
  // Pre-wired Effect Runtime with all services
  runtime: Runtime.Runtime<AppServices>;
  request: Request;
  authContext?: AuthContext;
}

// Create context factory that builds Effect Runtime per request
export function createEffectContextFactory(
  appLayer: Layer.Layer<AppServices>,
): (honoContext: HonoContext) => Promise<GraphQLContext> {
  return async (honoContext: HonoContext): Promise<GraphQLContext> => {
    const runtime = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* Effect.runtime<AppServices>();
      }).pipe(Effect.provide(appLayer)),
    );

    return {
      runtime,
      request: honoContext.req.raw,
    };
  };
}
```

### GraphQL Resolver with Effect

```typescript
// apps/backend-server/src/graphql/resolvers/User.ts
import { Effect } from "effect";
import { GetUserUseCase } from "@mirai-app/use-cases";
import { requireAuthEffect, mapErrorToGraphQLEffect } from "../utils";

builder.queryField("user", (t) =>
  t.field({
    type: "User",
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, context): Promise<GetUserOutput | null> => {
      return await Effect.runPromise(
        Effect.gen(function* () {
          yield* requireAuthEffect(context);
          const getUserUseCase = yield* GetUserUseCase;

          return yield* getUserUseCase.execute({ id: args.id }).pipe(
            Effect.catchTag("EntityNotFoundError", () => Effect.succeed(null)),
            Effect.mapError((error) => mapErrorToGraphQLEffect(error)),
          );
        }).pipe(Effect.provide(context.runtime)),
      );
    },
  }),
);
```

### Layer Composition (Replacing awilix)

```typescript
// packages/frameworks/src/layers/AppLayer.ts
import { Layer } from "effect";
import { BunContext } from "@effect/platform-bun";
import { SqlLive } from "./SqlLive";
import { UserRepositoryLive } from "@mirai-app/adapters";
import {
  GetUserUseCaseLive,
  CreateUserUseCaseLive,
} from "@mirai-app/use-cases";

// Compose all application layers
export const AppLayer = Layer.mergeAll(
  BunContext.layer, // Bun platform context (FileSystem, Path, etc.)
  SqlLive, // Database connection pool
  UserRepositoryLive, // Repository implementations
  GetUserUseCaseLive, // Use case implementations
  CreateUserUseCaseLive,
  // ... all other layers
);

// Export type of all services for Runtime typing
export type AppServices = typeof AppLayer;
```

### Main Entry Point (Bun)

```typescript
// apps/backend-server/src/index.ts
import { BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";
import { AppLayer } from "@mirai-app/frameworks";
import { createHonoServer } from "./hono-server";

const program = Effect.gen(function* () {
  const server = yield* createHonoServer;
  yield* Effect.sync(() => {
    console.log(`Server running on http://localhost:${server.port}`);
  });
  return server;
}).pipe(Effect.provide(AppLayer));

// Use BunRuntime for proper Bun integration
BunRuntime.runMain(program);
```

---

## 6. Testing Strategy (Week 7-8)

### Domain Layer Testing

```typescript
// packages/domain/src/entities/User.test.ts
import { Effect } from "effect";

describe("[UNIT] User entity", () => {
  it("creates valid user", async () => {
    const result = await Effect.runPromise(
      User.create({ email: "test@example.com", ... })
    );
    expect(result.email).toBe("test@example.com");
  });

  it("fails with invalid email", async () => {
    const result = await Effect.runPromiseExit(
      User.create({ email: "invalid", ... })
    );
    expect(result._tag).toBe("Failure");
  });
});
```

### Use Case Testing with Test Layers

```typescript
// packages/use-cases/src/interactors/CreateUser.test.ts
import { Effect, Layer } from "effect";

const TestLayer = Layer.mergeAll(
  InMemoryUserRepositoryLive,
  CreateUserUseCaseLive,
);

describe("[UNIT] CreateUserUseCase", () => {
  it("creates user successfully", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const useCase = yield* CreateUserUseCase;
        return yield* useCase.execute({ email: "test@example.com" });
      }).pipe(Effect.provide(TestLayer)),
    );

    expect(result.email).toBe("test@example.com");
  });
});
```

### Adapter Integration Testing

```typescript
// packages/adapters/src/gateways/__tests__/DrizzleUserRepository.test.ts
import { Effect, Layer } from "effect";
import { SqlClient } from "@effect/sql";
import { PostgreSqlContainer } from "@testcontainers/postgresql";

describe("[INTEGRATION] DrizzleUserRepository", () => {
  let postgresContainer: PostgreSqlContainer;
  let TestLayer: Layer.Layer<UserRepository>;

  beforeAll(async () => {
    postgresContainer = await new PostgreSqlContainer().start();
    TestLayer = Layer.mergeAll(
      SqlClient.layer({ url: postgresContainer.getConnectionUri() }),
      UserRepositoryLive
    );
  });

  it("persists and retrieves user", async () => {
    const user = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UserRepository;
        const created = yield* repo.create(
          yield* User.create({ email: "test@example.com", ... })
        );
        return yield* repo.findById(created.id);
      }).pipe(Effect.provide(TestLayer))
    );

    expect(user).not.toBeNull();
    expect(user!.email).toBe("test@example.com");
  });
});
```

### GraphQL Resolver Testing

```typescript
// apps/backend-server/src/graphql/resolvers/__tests__/User.test.ts
import { Effect, Layer, Runtime } from "effect";

describe("[INTEGRATION] User GraphQL resolver", () => {
  const createTestRuntime = () => {
    const testLayer = Layer.mergeAll(InMemoryUserRepositoryLive, TestAuthLive);
    return Effect.runSync(
      Effect.gen(function* () {
        return yield* Effect.runtime<typeof testLayer>();
      }).pipe(Effect.provide(testLayer)),
    );
  };

  it("resolves user query", async () => {
    const runtime = createTestRuntime();

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const useCase = yield* GetUserUseCase;
        return yield* useCase.execute({ id: "user-123" });
      }).pipe(Effect.provide(runtime)),
    );

    expect(result.id).toBe("user-123");
  });
});
```

---

## 7. Implementation Checklist

### Phase 1: Foundation (Week 1-2)

- [ ] Install Effect dependencies across all packages
- [ ] Create `packages/frameworks/src/effect/index.ts` with core exports
- [ ] Define `Data.TaggedError` classes for all domain errors
- [ ] Create `Effect.Effect` wrappers for all domain entities
- [ ] Update domain tests to use `Effect.runPromise`
- [ ] Verify zero external dependencies in domain package

### Phase 2: Use Cases (Week 3-4)

- [ ] Convert repository ports to Effect-based interfaces with `Context.Tag`
- [ ] Transform all use cases from async/await to `Effect.gen`
- [ ] Create `Layer.effect` implementations for all use cases
- [ ] Update use case tests with Layer-based test wiring
- [ ] Remove awilix from use-cases layer
- [ ] Ensure all error types are properly tagged

### Phase 3: Adapters & GraphQL (Week 5-6)

- [ ] Set up `@effect/sql-drizzle` in frameworks package
- [ ] Convert all repositories to `Layer.effect` implementations
- [ ] Update mappers to work with Effect types
- [ ] Create `createEffectContextFactory` for GraphQL
- [ ] Convert all GraphQL resolvers to use `Effect.runPromise`
- [ ] Implement `AppLayer` merging all service layers
- [ ] Remove awilix and awilix-modular from codebase

### Phase 4: Integration & Testing (Week 7-8)

- [ ] Run full test suite (`bun test`)
- [ ] Create integration tests with testcontainers
- [ ] Performance benchmark comparison
- [ ] Error handling validation (expected vs unexpected errors)
- [ ] Remove zod where Effect Schema replaces it
- [ ] Update CLAUDE.md and AGENTS.md documentation
- [ ] Create migration guide for developers

---

## 8. Risk Mitigation

### Common Pitfalls

| Risk                             | Mitigation                                                        |
| -------------------------------- | ----------------------------------------------------------------- |
| **Effect runtime leaks**         | Always use `Effect.runPromise` at boundaries, never store Runtime |
| **Error type proliferation**     | Use shared error types, avoid creating one-off errors             |
| **Layer composition complexity** | Build layers incrementally, test each layer independently         |
| **Performance regression**       | Benchmark after each phase, Effect should be faster or equal      |

### Rollback Strategy

If critical issues arise:

1. **Domain layer** can stay as Effect (pure, no runtime)
2. **Use cases** can be wrapped back to async/await with `Effect.runPromise`
3. **Adapters** can keep Effect but expose Promise-based APIs

---

## 9. Benefits Summary

After migration, the codebase gains:

1. **Structured Concurrency** - Fibers, cancellation, and supervision
2. **Resource Safety** - Automatic cleanup of DB connections, handles
3. **Observability** - Built-in tracing, logging, and metrics
4. **Error Handling** - Exhaustive error checking via tagged errors
5. **Composability** - Effects compose naturally with `andThen`, `flatMap`, `race`, etc.
6. **Type Safety** - Full type inference for error channels
7. **Testability** - Layer-based mocking is cleaner than container mocking

---

## 10. Appendix: Example Conversion

### Full File Before/After

See individual sections above for detailed before/after examples of:

- Domain entities (Section 3)
- Use cases (Section 4)
- Repositories (Section 5)
- GraphQL resolvers (Section 5)
- Tests (Section 6)

---

**Next Step:** Use `/sdd:add-task` to create implementation tasks for this migration, or create a git worktree with `/git:create-worktree` for isolated development.
