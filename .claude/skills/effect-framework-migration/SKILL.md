# Effect Framework Migration Skill

Research-backed guide for migrating from Promise-based architecture to Effect framework while maintaining Clean Architecture boundaries.

## Official Documentation

### Core Resources

- **Effect Website**: https://effect.website/
- **Effect Documentation**: https://effect.website/docs/introduction
- **Effect API Reference**: https://effect.website/docs/api-reference
- **Effect Examples**: https://effect.website/docs/examples

### Package-Specific Docs

- **@effect/sql**: https://effect.website/docs/sql/introduction
- **@effect/sql-drizzle**: https://effect.website/docs/sql/drizzle
- **@effect/platform**: https://effect.website/docs/platform/introduction
- **@effect/platform-node**: https://effect.website/docs/platform-node/introduction

### Community & Ecosystem

- **Effect Discord**: https://discord.gg/effect-ts
- **Effect GitHub**: https://github.com/Effect-TS/effect
- **Effect Blog**: https://effect.website/blog

## Migration Strategy

### Phase 1: Foundation (Week 1-2)

1. **Install Dependencies**

   ```bash
   bun add effect @effect/sql @effect/sql-drizzle
   # For backend
   bun add @effect/platform @effect/platform-node
   ```

2. **Understand Core Concepts**
   - `Effect<A, E, R>` - The core type representing a computation
   - `Layer` - Dependency injection mechanism
   - `Context` - Service resolution at runtime
   - `Schedule` - Retrying and repetition strategies
   - `Stream` - Lazy, pull-based sequences

### Phase 2: Interoperability Layer (Week 3-4)

1. **Create Promise-to-Effect Adapters**
   - Use `Effect.promise()` for simple migrations
   - Use `Effect.tryPromise()` for error handling
   - Use `Effect.async()` for callback-based APIs

2. **Gradual Refactoring Pattern**

   ```typescript
   // Before (Promise)
   async function getUser(id: string): Promise<User> {
     return await db.query.users.findFirst({ where: eq(users.id, id) });
   }

   // During migration (hybrid)
   function getUserEffect(
     id: string,
   ): Effect.Effect<User, DatabaseError, SqlClient> {
     return Effect.gen(function* () {
       const sql = yield* SqlClient;
       return yield* Effect.tryPromise({
         try: () => db.query.users.findFirst({ where: eq(users.id, id) }),
         catch: (error) => new DatabaseError({ cause: error }),
       });
     });
   }
   ```

### Phase 3: Full Migration (Week 5-8)

1. **Replace DI Container with Effect Layers**
2. **Convert all async functions to Effect**
3. **Implement proper error handling with tagged errors**
4. **Add Effect-based logging and telemetry**

## Replacing awilix with Effect Context/Layers

> **Migration from awilix to pure Effect DI (Context.Tag + Layer patterns)**

### Pattern Mapping Quick Reference

| awilix Pattern                                | Effect Pattern                         | Notes                           |
| --------------------------------------------- | -------------------------------------- | ------------------------------- |
| `createStaticModule()`                        | `Layer.succeed()` + `Layer.mergeAll()` | Factory functions return Layers |
| `container.register({ key: asClass(Class) })` | `Layer.succeed(Tag, new Class())`      | Direct instantiation            |
| `container.resolve("key")`                    | `yield* Tag` in `Effect.gen`           | Tag becomes yieldable           |
| `Lifetime.SINGLETON`                          | `Layer.succeed()`                      | Default behavior                |
| `Lifetime.SCOPED`                             | `Layer.effect()` or runtime provision  | Per-request via context         |
| `cradle.deps` injection                       | Tag requirements in Effect type        | Compile-time checked            |

### Before (awilix-modular)

```typescript
// containers.ts
import { createContainer } from "awilix-modular";

export const container = createContainer();
container.register({
  userRepository: asFunction(createUserRepository),
  authService: asFunction(createAuthService),
});

// usage
const { userRepository } = container.cradle;
```

### After (Effect Context/Layers)

```typescript
// services.ts
import { Context, Layer, Effect } from "effect";

// Define service interface
export interface UserRepository {
  readonly findById: (id: string) => Effect.Effect<User, NotFoundError>;
  readonly save: (user: User) => Effect.Effect<void, DatabaseError>;
}

// Create Tag (service identifier)
export const UserRepository = Context.Tag<UserRepository>("UserRepository");

// Create Layer (dependency wiring)
export const UserRepositoryLive = Layer.effect(
  UserRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient;
    return UserRepository.of({
      findById: (id) =>
        Effect.gen(function* () {
          const result = yield* sql`SELECT * FROM users WHERE id = ${id}`;
          if (result.length === 0) return yield* new NotFoundError({ id });
          return result[0];
        }),
      save: (user) => sql`INSERT INTO users ...`,
    });
  }),
);
```

### Layer Composition Patterns

```typescript
// Program composition
const AppLayer = Layer.mergeAll(
  UserRepositoryLive,
  AuthServiceLive,
  DatabaseLayer,
);

// Provide dependencies
const program = Effect.provide(appLogic, AppLayer);

// Run the program
Effect.runPromise(program);
```

## @effect/sql-drizzle Migration

### Installation

```bash
bun add @effect/sql @effect/sql-drizzle drizzle-orm
```

### Setup Pattern

```typescript
import { SqlClient } from "@effect/sql";
import { Drizzle } from "@effect/sql-drizzle";
import { drizzle } from "drizzle-orm/postgres-js";

// Create the SQL client layer
const SqlLive = SqlClient.postgres({
  url: Config.string("DATABASE_URL"),
});

// Drizzle layer depends on SQL client
const DrizzleLive = Drizzle.layer.pipe(Layer.provide(SqlLive));
```

### Repository Pattern with Drizzle

```typescript
import { Drizzle } from "@effect/sql-drizzle";

export class UserRepository extends Effect.Service<UserRepository>()(
  "UserRepository",
  {
    effect: Effect.gen(function* () {
      const db = yield* Drizzle.Drizzle;

      return {
        findById: (id: string) =>
          Effect.gen(function* () {
            const result = yield* db.query.users.findFirst({
              where: (users, { eq }) => eq(users.id, id),
            });

            return Option.fromNullable(result).pipe(
              Option.map(rowToUser),
              Effect.mapError(() => new UserNotFoundError({ userId: id })),
            );
          }),

        save: (user: User) =>
          Effect.gen(function* () {
            yield* db.insert(users).values(userToRow(user));
          }),
      };
    }),
    dependencies: [DrizzleLive],
  },
) {}
```

## Clean Architecture with Effect

### Layer Boundaries

```
Domain Layer (packages/domain/)
├── Pure functions only
├── Branded types for IDs
├── Tagged error classes
└── No Effect dependency (pure data + functions)

Use Case Layer (packages/use-cases/)
├── Effect<A, E, R> orchestration
├── Layer composition for dependencies
├── Service interfaces (Context.Tags)
└── Interactor implementations

Adapter Layer (packages/adapters/)
├── Layer implementations
├── tRPC controllers
├── Database gateways
└── External service clients

Framework Layer (packages/frameworks/)
├── Layer composition root
├── Runtime configuration
├── Scope management
└── Main entry point
```

### Effect.Service Pattern (Clean Architecture)

```typescript
// Domain - pure types and errors
export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

// Use Case - service definition
export class CreateUser extends Effect.Service<CreateUser>()("CreateUser", {
  effect: Effect.gen(function* () {
    const userRepo = yield* UserRepository;
    const authService = yield* AuthService;

    return {
      execute: (input: CreateUserInput) =>
        Effect.gen(function* () {
          // Validation
          if (input.email.length === 0) {
            return yield* new ValidationError({
              field: "email",
              message: "Email is required",
            });
          }

          // Business logic
          const hashedPassword = yield* authService.hashPassword(
            input.password,
          );
          const user = User.create({ ...input, hashedPassword });

          // Persistence
          yield* userRepo.save(user);

          return user;
        }),
    };
  }),
  dependencies: [UserRepositoryLive, AuthServiceLive],
}) {}
```

## React Native Specific Considerations

### ⚠️ No @effect/platform

React Native cannot use `@effect/platform` due to Node.js-specific dependencies.

### Alternative Patterns

```typescript
// Native-compatible service implementation
import { Context, Effect, Layer } from "effect";

// Custom HTTP client using React Native's fetch
export const HttpClient = Context.Tag<HttpClient>("HttpClient");

export const HttpClientLive = Layer.succeed(
  HttpClient,
  HttpClient.of({
    request: (url: string, options?: RequestInit) =>
      Effect.tryPromise({
        try: () => fetch(url, options).then((r) => r.json()),
        catch: (error) => new HttpError({ cause: error }),
      }),
  }),
);

// SQLite for React Native
export const SqliteClient = Context.Tag<SqliteClient>("SqliteClient");

export const SqliteClientLive = Layer.effect(
  SqliteClient,
  Effect.gen(function* () {
    // Use react-native-sqlite-storage or expo-sqlite
    const sqlite = yield* Effect.promise(() => openDatabase());

    return SqliteClient.of({
      query: (sql: string, params?: unknown[]) =>
        Effect.tryPromise({
          try: () => sqlite.executeSql(sql, params),
          catch: (error) => new SqliteError({ cause: error }),
        }),
    });
  }),
);
```

### React Native Testing

```typescript
// Use Effect's built-in testing utilities
import { Effect, TestClock, TestContext } from "effect";

// Mock layers for testing
const MockHttpClient = Layer.succeed(
  HttpClient,
  HttpClient.of({
    request: () => Effect.succeed({ mock: true }),
  }),
);

// Test with controlled environment
const testEffect = Effect.provide(program, MockHttpClient);
const result = await Effect.runPromise(testEffect);
```

## Testing Patterns

### Unit Testing with Effect.Test

```typescript
import { Effect, TestContext } from "effect";
import { describe, it, expect } from "bun:test";

describe("UserRepository", () => {
  it("should find user by id", async () => {
    const testEffect = Effect.gen(function* () {
      const repo = yield* UserRepository;
      const user = yield* repo.findById("user-123");

      expect(user.id).toBe("user-123");
      return user;
    }).pipe(
      Effect.provide(TestUserRepository), // Test double layer
      Effect.provide(TestContext.TestContext), // Test environment
    );

    await Effect.runPromise(testEffect);
  });
});
```

### Mock Layer Pattern

```typescript
// Create test doubles using Layer.succeed
export const MockUserRepository = Layer.succeed(
  UserRepository,
  UserRepository.of({
    findById: (id) =>
      Effect.succeed({
        id,
        email: "test@example.com",
        name: "Test User",
      } as User),
    save: () => Effect.void,
  }),
);

// Stub with controlled behavior
export const createStubUserRepository = (findByIdResult: Option<User>) =>
  Layer.succeed(
    UserRepository,
    UserRepository.of({
      findById: () =>
        findByIdResult.pipe(Effect.mapError(() => new NotFoundError())),
      save: () => Effect.void,
    }),
  );
```

### Property-Based Testing

```typescript
import { Effect, FastCheck } from "effect";

const propertyTest = Effect.gen(function* () {
  yield* FastCheck.assert(
    FastCheck.property(FastCheck.string(), (name) => {
      const user = User.create({ name, email: "test@test.com" });
      return user.name === name;
    }),
  );
});
```

## Common Pitfalls and Solutions

### 1. Runtime Errors in Effect.gen

**Problem**: Yielding non-Effect values

```typescript
// ❌ Wrong - yields plain value
const wrong = Effect.gen(function* () {
  const value = someAsyncFunction(); // Returns Promise, not Effect
  yield* value; // Type error!
});

// ✅ Correct - wrap in Effect.promise
const correct = Effect.gen(function* () {
  const value = yield* Effect.promise(() => someAsyncFunction());
});
```

### 2. Error Type Inference

**Problem**: Errors not properly typed

```typescript
// ❌ Wrong - errors become unknown
const bad = Effect.tryPromise({
  try: () => fetch("/api"),
  catch: (e) => e, // Returns unknown
});

// ✅ Correct - create tagged error
class ApiError extends Data.TaggedError("ApiError")<{ cause: unknown }> {}

const good = Effect.tryPromise({
  try: () => fetch("/api"),
  catch: (e) => new ApiError({ cause: e }),
});
```

### 3. Layer Ordering

**Problem**: Circular dependencies or missing layers

```typescript
// ❌ Wrong - wrong order
const badProgram = Effect.provide(
  program,
  Layer.merge(ServiceALive, ServiceBLive), // B depends on A but A provided first
);

// ✅ Correct - dependency order
const goodProgram = Effect.provide(
  program,
  ServiceBLive.pipe(Layer.provide(ServiceALive)), // A provided to B
);
```

### 4. Resource Management

**Problem**: Resources not properly released

```typescript
// ❌ Wrong - manual cleanup
const bad = Effect.gen(function* () {
  const conn = yield* acquireConnection();
  const result = yield* useConnection(conn);
  yield* releaseConnection(conn); // May not run on error!
});

// ✅ Correct - use Effect.acquireUseRelease or Scope
const good = Effect.acquireUseRelease(
  acquireConnection(),
  (conn) => useConnection(conn),
  (conn) => releaseConnection(conn),
);
```

### 5. Context Tag Conflicts

**Problem**: Multiple tags with same identifier

```typescript
// ❌ Wrong - same string identifier
const Tag1 = Context.Tag<Service1>("Service");
const Tag2 = Context.Tag<Service2>("Service"); // Same string!

// ✅ Correct - unique identifiers
const Tag1 = Context.Tag<Service1>("Service1");
const Tag2 = Context.Tag<Service2>("Service2");
```

## Migration Checklist

### Week 1: Preparation

- [ ] Install Effect packages
- [ ] Set up Layer composition root
- [ ] Create first Effect-based service
- [ ] Write tests with Effect.Test

### Week 2: Interoperability

- [ ] Create Promise-to-Effect adapters
- [ ] Migrate one repository to Effect
- [ ] Set up error handling patterns
- [ ] Add logging with Effect.Logger

### Week 3-4: Backend Migration

- [ ] Replace awilix with Effect Layers
- [ ] Migrate tRPC routers to Effect
- [ ] Update database access with @effect/sql-drizzle
- [ ] Implement proper error handling

### Week 5-6: Native App Migration

- [ ] Create native-compatible services (no @effect/platform)
- [ ] Implement custom HTTP client
- [ ] Migrate SQLite access to Effect
- [ ] Test on device/simulator

### Week 7-8: Testing & Optimization

- [ ] Achieve 80%+ test coverage
- [ ] Add property-based tests
- [ ] Performance benchmarking
- [ ] Documentation updates

## Quick Reference

### Effect Type Signatures

```typescript
Effect<A, E, R>
// A = Success value type
// E = Error type (must be caught or handled)
// R = Required context/services

// Common patterns
Effect.void                    // Effect<void, never, never>
Effect.succeed(value)          // Effect<A, never, never>
Effect.fail(error)             // Effect<never, E, never>
Effect.promise(() => promise)  // Effect<A, never, never>
Effect.tryPromise({ try, catch }) // Effect<A, E, never>
Effect.gen(function* () { ... })  // Effect<A, E, R>
```

### Layer Patterns

```typescript
// Simple value layer
Layer.succeed(Tag, implementation)

// Effect-based layer
Layer.effect(Tag, Effect.gen(...))

// Layer with dependencies
Layer.effect(Tag, Effect.gen(...)).pipe(
  Layer.provide(DependencyLayer)
)

// Merge multiple layers
Layer.mergeAll(Layer1, Layer2, Layer3)

// Provide to program
Effect.provide(program, Layer)
```

### Error Handling

```typescript
// Create tagged error
class MyError extends Data.TaggedError('MyError')<{
  message: string;
  cause?: unknown;
}> {}

// Use in Effect
Effect.fail(new MyError({ message: 'Failed' }))

// Catch specific errors
Effect.catchTag('MyError', (error) => ...)

// Catch all errors
Effect.catchAll((error) => ...)

// Map error
Effect.mapError((error) => new WrappedError({ cause: error }))
```

---

**Last Updated**: 2026-04-17
**Effect Version**: 3.x
**Compatibility**: Bun, Node.js, React Native

---

## Related Skills

- `effect-patterns` - Day-to-day Effect coding patterns and use case implementations
