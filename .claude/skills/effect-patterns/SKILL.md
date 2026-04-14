# Effect Patterns - Keep Effect Everywhere

> **USE WHEN:** Implementing use cases with Effect framework, wrapping external libraries with Effect.runPromise, or migrating from async/await back to Effect.

---

## Quick Reference

### Core Principle

```
┌─────────────────────────────────────────────────────────────┐
│  Keep Effect.Effect<T, E, R> in ALL internal code            │
│  Use Effect.runPromise ONLY at external library boundaries   │
└─────────────────────────────────────────────────────────────┘
```

### Type Signatures by Layer

| Layer         | Return Type                   | Pattern                          |
| ------------- | ----------------------------- | -------------------------------- |
| **Domain**    | `Either<E, T>` or plain types | Pure functions, validation       |
| **Use Cases** | `Effect.Effect<T, E, R>`      | Business logic orchestration     |
| **Ports**     | `Effect.Effect<T, E, R>`      | Repository interfaces            |
| **Adapters**  | `Effect.Effect<T, E, R>`      | External service wrappers        |
| **Boundary**  | `Promise<T>`                  | Only at system edge (runPromise) |

---

## Repository Port Patterns

### Port Interface with Effect.Effect

```typescript
// packages/use-cases/src/ports/UserRepository.ts
import type { Effect } from "effect";
import type { User } from "@mirai-app/domain";

/**
 * User Repository Port
 *
 * All methods return Effect.Effect for composability.
 * Errors are tracked at the type level.
 */
export interface UserRepository {
  findById(id: string): Effect.Effect<User | null, never, never>;
  findByEmail(email: string): Effect.Effect<User | null, never, never>;
  create(user: User): Effect.Effect<User, DuplicateEmailError, never>;
  update(user: User): Effect.Effect<User, UserNotFoundError, never>;
  delete(id: string): Effect.Effect<void, UserNotFoundError, never>;
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<User[], never, never>;
}
```

### Port with Error Types

```typescript
// Define tagged errors in domain
import { Data } from "effect";

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}> {}

export class DuplicateEmailError extends Data.TaggedError(
  "DuplicateEmailError",
)<{
  email: string;
}> {}

// Repository returns union of possible errors
type UserRepositoryError = UserNotFoundError | DuplicateEmailError;

export interface UserRepository {
  create(user: User): Effect.Effect<User, UserRepositoryError, never>;
}
```

---

## Use Case Patterns with Effect.gen

### Basic Use Case Pattern

```typescript
// packages/use-cases/src/interactors/GetUser.ts
import { Effect, Data } from "effect";
import type { UserRepository } from "../ports/UserRepository";

export class GetUserNotFoundError extends Data.TaggedError(
  "GetUserNotFoundError",
)<{
  userId: string;
}> {}

export interface GetUserInput {
  userId: string;
}

export interface GetUserOutput {
  id: string;
  email: string;
  fullName: string;
}

export class GetUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  /**
   * Execute use case
   * Returns Effect.Effect for composability
   */
  execute(
    input: GetUserInput,
  ): Effect.Effect<GetUserOutput, GetUserNotFoundError, never> {
    return Effect.gen(function* () {
      // Call repository - no await needed
      const user = yield* this.userRepo.findById(input.userId);

      if (!user) {
        return yield* Effect.fail(
          new GetUserNotFoundError({ userId: input.userId }),
        );
      }

      return toOutput(user);
    }).pipe(
      Effect.tapError((e) => Effect.logError(`GetUser failed: ${e.userId}`)),
    );
  }
}

function toOutput(user: User): GetUserOutput {
  return {
    id: user.id,
    email: user.email,
    fullName: user.getFullName(),
  };
}
```

### Use Case with Multiple Repository Calls

```typescript
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly productRepo: ProductRepository,
    private readonly userRepo: UserRepository,
  ) {}

  execute(
    input: CreateOrderInput,
  ): Effect.Effect<
    OrderOutput,
    UserNotFoundError | ProductNotFoundError | InsufficientStockError,
    never
  > {
    return Effect.gen(function* () {
      // Validate user exists
      const user = yield* this.userRepo
        .findById(input.userId)
        .pipe(
          Effect.flatMap(
            Effect.fromNullable(
              () => new UserNotFoundError({ userId: input.userId }),
            ),
          ),
        );

      // Validate products and check stock
      const products = yield* Effect.forEach(input.productIds, (id) =>
        this.productRepo
          .findById(id)
          .pipe(
            Effect.flatMap(
              Effect.fromNullable(
                () => new ProductNotFoundError({ productId: id }),
              ),
            ),
          ),
      );

      // Check stock for all products
      yield* Effect.forEach(products, (product) =>
        product.hasStock(input.quantity)
          ? Effect.succeed(void 0)
          : Effect.fail(new InsufficientStockError({ productId: product.id })),
      );

      // Create order
      const order = yield* this.orderRepo.create({
        userId: user.id,
        products: products.map((p) => p.id),
        total: products.reduce((sum, p) => sum + p.price, 0),
      });

      return toOutput(order);
    });
  }
}
```

### Use Case with Parallel Operations

```typescript
export class GetDashboardDataUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly orderRepo: OrderRepository,
    private readonly statsRepo: StatsRepository,
  ) {}

  execute(
    input: GetDashboardInput,
  ): Effect.Effect<DashboardOutput, UserNotFoundError, never> {
    return Effect.gen(function* () {
      // Validate user
      const user = yield* this.userRepo
        .findById(input.userId)
        .pipe(
          Effect.flatMap(
            Effect.fromNullable(
              () => new UserNotFoundError({ userId: input.userId }),
            ),
          ),
        );

      // Fetch data in parallel - Effect.all runs concurrently
      const [recentOrders, stats, recommendations] = yield* Effect.all([
        this.orderRepo.findRecentByUser(user.id, { limit: 5 }),
        this.statsRepo.getUserStats(user.id),
        this.getRecommendations(user.id),
      ]);

      return {
        user: toUserSummary(user),
        recentOrders: recentOrders.map(toOrderSummary),
        stats,
        recommendations,
      };
    });
  }

  private getRecommendations(
    userId: string,
  ): Effect.Effect<Recommendation[], never, never> {
    // Private helper also returns Effect
    return Effect.succeed([]); // Implementation
  }
}
```

---

## Effect.tryPromise for External Libraries

### Wrapping External Async Functions

```typescript
// packages/adapters/src/gateways/PrismaUserRepository.ts
import { Effect, Data } from "effect";
import type { UserRepository } from "@mirai-app/use-cases";
import type { PrismaClient } from "@prisma/client";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  cause: unknown;
}> {}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Effect.Effect<User | null, never, never> {
    // Wrap Prisma call with Effect.tryPromise
    return Effect.tryPromise({
      try: () => this.prisma.user.findUnique({ where: { id } }),
      catch: (error) =>
        new DatabaseError({ operation: "findById", cause: error }),
    }).pipe(
      Effect.map((prismaUser) =>
        prismaUser ? UserMapper.toDomain(prismaUser) : null,
      ),
      // Defects become DatabaseError, but never throw
    );
  }

  create(user: User): Effect.Effect<User, DuplicateEmailError, never> {
    return Effect.tryPromise({
      try: () =>
        this.prisma.user.create({
          data: UserMapper.toPrisma(user),
        }),
      catch: (error) => {
        // Check for specific error types
        if (isUniqueConstraintError(error, "email")) {
          return new DuplicateEmailError({ email: user.email });
        }
        return new DatabaseError({ operation: "create", cause: error });
      },
    }).pipe(
      Effect.map((prismaUser) => UserMapper.toDomain(prismaUser)),
      // Type: Effect.Effect<User, DuplicateEmailError | DatabaseError, never>
      // But we know database errors are defects, so we refine:
      Effect.catchTag("DatabaseError", (e) => Effect.die(e)), // Defects should crash
    );
  }
}
```

### Wrapping HTTP APIs

```typescript
// packages/adapters/src/services/ExternalApiClient.ts
import { Effect, Data } from "effect";

export class HttpError extends Data.TaggedError("HttpError")<{
  status: number;
  message: string;
}> {}

export class NetworkError extends Data.TaggedError("NetworkError")<{
  cause: unknown;
}> {}

export class ExternalApiClient {
  constructor(private readonly baseUrl: string) {}

  get<T>(path: string): Effect.Effect<T, HttpError | NetworkError, never> {
    return Effect.tryPromise({
      try: () => fetch(`${this.baseUrl}${path}`),
      catch: (error) => new NetworkError({ cause: error }),
    }).pipe(
      Effect.flatMap((response) => {
        if (!response.ok) {
          return Effect.fail(
            new HttpError({
              status: response.status,
              message: response.statusText,
            }),
          );
        }
        return Effect.tryPromise(() => response.json() as Promise<T>);
      }),
    );
  }

  post<T>(
    path: string,
    body: unknown,
  ): Effect.Effect<T, HttpError | NetworkError, never> {
    return Effect.tryPromise({
      try: () =>
        fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      catch: (error) => new NetworkError({ cause: error }),
    }).pipe(
      Effect.flatMap((response) => {
        if (!response.ok) {
          return Effect.fail(
            new HttpError({
              status: response.status,
              message: response.statusText,
            }),
          );
        }
        return Effect.tryPromise(() => response.json() as Promise<T>);
      }),
    );
  }
}
```

### Wrapping File System Operations

```typescript
import { Effect, Data } from "effect";
import * as fs from "fs/promises";

export class FileSystemError extends Data.TaggedError("FileSystemError")<{
  operation: string;
  path: string;
  cause: unknown;
}> {}

export class FileNotFoundError extends Data.TaggedError("FileNotFoundError")<{
  path: string;
}> {}

export const FileSystem = {
  readFile(
    path: string,
  ): Effect.Effect<Buffer, FileSystemError | FileNotFoundError, never> {
    return Effect.tryPromise({
      try: () => fs.readFile(path),
      catch: (error) => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return new FileNotFoundError({ path });
        }
        return new FileSystemError({
          operation: "readFile",
          path,
          cause: error,
        });
      },
    });
  },

  writeFile(
    path: string,
    data: Buffer | string,
  ): Effect.Effect<void, FileSystemError, never> {
    return Effect.tryPromise({
      try: () => fs.writeFile(path, data),
      catch: (error) =>
        new FileSystemError({ operation: "writeFile", path, cause: error }),
    });
  },

  mkdir(
    path: string,
    recursive = false,
  ): Effect.Effect<void, FileSystemError, never> {
    return Effect.tryPromise({
      try: () => fs.mkdir(path, { recursive }),
      catch: (error) =>
        new FileSystemError({ operation: "mkdir", path, cause: error }),
    });
  },
};
```

---

## Effect.runPromise Usage Patterns

### Pattern 1: Controller Boundary (Primary Use)

```typescript
// packages/adapters/src/controllers/UserController.ts
import { Effect, Either } from "effect";
import { TRPCError } from "@trpc/server";

export class UserController {
  constructor(private readonly getUserUseCase: GetUserUseCase) {}

  async getById(input: GetUserInput): Promise<GetUserOutput> {
    // Execute use case (returns Effect)
    const effect = this.getUserUseCase.execute(input);

    // Run at boundary and convert to Either for error handling
    const result = await Effect.runPromise(Effect.either(effect));

    // Pattern match on result
    if (Either.isLeft(result)) {
      const error = result.left;
      switch (error._tag) {
        case "GetUserNotFoundError":
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `User not found: ${error.userId}`,
          });
        default:
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unknown error",
          });
      }
    }

    return result.right;
  }
}
```

### Pattern 2: Direct Execution with Error Conversion

```typescript
async getById(input: GetUserInput): Promise<GetUserOutput> {
  try {
    // Effect.runPromise throws on failure
    return await Effect.runPromise(this.getUserUseCase.execute(input));
  } catch (error) {
    // Error is the typed error from the Effect
    if (error._tag === "GetUserNotFoundError") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `User not found: ${error.userId}`,
      });
    }
    throw error; // Re-throw unexpected errors
  }
}
```

### Pattern 3: Batch Operations with Error Accumulation

```typescript
async batchGetUsers(ids: string[]): Promise<(GetUserOutput | null)[]> {
  // Create effects for all users
  const effects = ids.map((id) =>
    this.getUserUseCase.execute({ userId: id }).pipe(
      Effect.match({
        onSuccess: (output) => output,
        onFailure: () => null, // Convert error to null
      })
    )
  );

  // Run all concurrently and get results
  return await Effect.runPromise(Effect.all(effects));
}
```

### Pattern 4: Testing Boundary

```typescript
// In tests, runPromise at the end
describe("[UNIT] GetUserUseCase", () => {
  it("returns user on success", async () => {
    const useCase = new GetUserUseCase(mockRepo);

    const result = await Effect.runPromise(useCase.execute({ userId: "123" }));

    expect(result.id).toBe("123");
  });

  it("fails with not found error", async () => {
    const useCase = new GetUserUseCase(emptyRepo);

    // Use Effect.either to capture error without throwing
    const either = await Effect.runPromise(
      Effect.either(useCase.execute({ userId: "999" })),
    );

    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left._tag).toBe("GetUserNotFoundError");
    }
  });
});
```

---

## Error Handling Patterns

### Tagged Errors (Required)

```typescript
import { Data } from "effect";

// Always use Data.TaggedError for type-safe error matching
export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  resource: string;
  id: string;
}> {}

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  userId: string;
  action: string;
}> {}

// Use in function signature
function findUser(
  id: string,
): Effect.Effect<User, NotFoundError | DatabaseError, UserRepository> {
  return Effect.gen(function* () {
    const repo = yield* UserRepository;
    const user = yield* repo.findById(id);

    if (!user) {
      return yield* Effect.fail(new NotFoundError({ resource: "User", id }));
    }

    return user;
  });
}
```

### Error Recovery

```typescript
// Catch specific error types and recover
const withFallback = findUser("123").pipe(
  Effect.catchTag(
    "NotFoundError",
    (error) => Effect.succeed(GUEST_USER), // Return default user
  ),
);

// Catch all errors and provide default
const withDefault = findUser("123").pipe(
  Effect.catchAll((error) => Effect.succeed(GUEST_USER)),
);

// Retry on specific errors
const withRetry = fetchData.pipe(
  Effect.retry({
    schedule: Schedule.exponential("100 millis").pipe(Schedule.recurs(3)),
    while: (error) => error._tag === "NetworkError",
  }),
);
```

### Converting Errors at Boundaries

```typescript
// Convert typed errors to HTTP responses
async function handleRequest(input: GetUserInput): Promise<Response> {
  const effect = getUserUseCase.execute(input).pipe(
    // Convert domain errors to HTTP errors
    Effect.mapError((error) => {
      switch (error._tag) {
        case "GetUserNotFoundError":
          return new HttpError({ status: 404, message: "User not found" });
        case "ValidationError":
          return new HttpError({ status: 400, message: error.message });
        default:
          return new HttpError({ status: 500, message: "Internal error" });
      }
    }),
  );

  return await Effect.runPromise(effect);
}
```

---

## Testing Patterns

### Testing Use Cases with In-Memory Repositories

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Either } from "effect";
import { InMemoryUserRepository } from "@mirai-app/adapters";
import { GetUserUseCase, GetUserNotFoundError } from "./GetUser";

describe("[UNIT] GetUserUseCase", () => {
  let userRepo: InMemoryUserRepository;
  let useCase: GetUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    useCase = new GetUserUseCase(userRepo);
  });

  it("returns user when found", async () => {
    // Seed test data using Effect.runPromise
    await Effect.runPromise(userRepo.seed([mockUser]));

    const result = await Effect.runPromise(
      useCase.execute({ userId: mockUser.id }),
    );

    expect(result.id).toBe(mockUser.id);
    expect(result.email).toBe(mockUser.email);
  });

  it("fails with not found error when user doesn't exist", async () => {
    const either = await Effect.runPromise(
      Effect.either(useCase.execute({ userId: "non-existent" })),
    );

    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(GetUserNotFoundError);
      expect(either.left.userId).toBe("non-existent");
    }
  });
});
```

### Mocking Repository Responses

```typescript
// Create mock repository with controlled responses
function createMockRepository(responses: {
  findById?: User | null;
}): UserRepository {
  return {
    findById: () => Effect.succeed(responses.findById ?? null),
    findByEmail: () => Effect.succeed(null),
    create: () => Effect.die(new Error("Not implemented")),
    update: () => Effect.die(new Error("Not implemented")),
    delete: () => Effect.succeed(void 0),
    findAll: () => Effect.succeed([]),
  };
}

// Test with mock
it("handles user found scenario", async () => {
  const mockRepo = createMockRepository({ findById: mockUser });
  const useCase = new GetUserUseCase(mockRepo);

  const result = await Effect.runPromise(useCase.execute({ userId: "123" }));

  expect(result.id).toBe("123");
});
```

### Testing with Effect.TestClock

```typescript
import { TestClock, TestContext } from "effect";

describe("time-dependent operations", () => {
  it("expires token after timeout", async () => {
    const effect = Effect.gen(function* () {
      const token = yield* createToken();

      // Advance time by 1 hour
      yield* TestClock.adjust("1 hour");

      // Token should now be expired
      const isValid = yield* validateToken(token);
      return isValid;
    }).pipe(Effect.provide(TestContext.TestContext));

    const result = await Effect.runPromise(effect);
    expect(result).toBe(false);
  });
});
```

---

## Monorepo Integration

### Package Structure

```
packages/
  domain/
    src/entities/       # Pure functions, Either types
    src/value-objects/  # Immutable data
    # NO Effect here - keep domain pure

  use-cases/
    src/ports/          # Repository interfaces with Effect.Effect
    src/interactors/    # Use cases with Effect.gen
    # ALL business logic uses Effect

  adapters/
    src/gateways/       # Effect.tryPromise for external libs
    src/controllers/    # Effect.runPromise at boundaries
    # Wrap external calls, unwrap at edges

  frameworks/
    src/di/             # DI container setup (awilix-modular)
    # Wire everything together
```

### Dependency Direction

```
┌─────────────────────────────────────┐
│  Frameworks (Effect.runPromise)     │  ← Entry point, unwraps Effects
│  └─ Controllers                     │
├─────────────────────────────────────┤
│  Adapters (Effect.tryPromise)       │  ← External library wrappers
│  └─ Gateways, Services              │
├─────────────────────────────────────┤
│  Use Cases (Effect.gen)             │  ← Business logic
│  └─ Interactors                     │
├─────────────────────────────────────┤
│  Domain (pure, Either types)        │  ← No Effect here
│  └─ Entities, Value Objects         │
└─────────────────────────────────────┘
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Using Effect.runPromise Inside Use Cases

```typescript
// WRONG - Don't runPromise inside business logic
export class BadUseCase {
  async execute(input: Input): Promise<Output> {
    const user = await Effect.runPromise(this.repo.findById(input.id)); // ❌
    // ...
  }
}

// CORRECT - Return Effect and let caller run it
export class GoodUseCase {
  execute(input: Input): Effect.Effect<Output, Error, never> {
    return Effect.gen(function* () {
      const user = yield* this.repo.findById(input.id); // ✅
      // ...
    });
  }
}
```

### Pitfall 2: Mixing async/await with Effect.gen

```typescript
// WRONG - Don't use async function with Effect.gen
async function badPattern(): Effect.Effect<string, never, never> {
  const result = await someAsyncCall(); // ❌
  return Effect.succeed(result);
}

// CORRECT - Wrap async in tryPromise, use gen for composition
function goodPattern(): Effect.Effect<string, never, never> {
  return Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      try: () => someAsyncCall(),
      catch: () => new Error(),
    }); // ✅
    return result;
  });
}
```

### Pitfall 3: Forgetting to Handle All Error Cases

```typescript
// WRONG - Not handling all possible errors
function risky(): Effect.Effect<User, NotFoundError, never> {
  return Effect.gen(function* () {
    const user = yield* repo.findById("123"); // Returns Effect<User | null, never, never>
    return user; // ❌ Type error - user could be null
  });
}

// CORRECT - Handle null case explicitly
function safe(): Effect.Effect<User, NotFoundError, never> {
  return Effect.gen(function* () {
    const user = yield* repo.findById("123");
    if (!user) {
      return yield* Effect.fail(
        new NotFoundError({ resource: "User", id: "123" }),
      );
    }
    return user; // ✅ Now User, not User | null
  });
}
```

### Pitfall 4: Converting Defects to Expected Errors

```typescript
// WRONG - Defects should not be caught as expected errors
Effect.tryPromise({
  try: () => externalApi.call(),
  catch: (e) => new ExpectedError(), // Don't do this for bugs
});

// CORRECT - Only catch expected failures
type ExternalError = NetworkError | RateLimitError | ValidationError;

Effect.tryPromise({
  try: () => externalApi.call(),
  catch: (e): ExternalError => {
    if (isNetworkError(e)) return new NetworkError({ cause: e });
    if (isRateLimitError(e))
      return new RateLimitError({ retryAfter: e.retryAfter });
    if (isValidationError(e)) return new ValidationError({ field: e.field });
    throw e; // Unexpected errors are defects - let them crash
  },
});
```

---

## Migration Guide: From Async/Await to Effect

### Step 1: Change Port Interfaces

```typescript
// BEFORE (async/await)
interface UserRepository {
  findById(id: string): Promise<User | null>;
}

// AFTER (Effect)
interface UserRepository {
  findById(id: string): Effect.Effect<User | null, never, never>;
}
```

### Step 2: Update Adapter Implementations

```typescript
// BEFORE
async findById(id: string): Promise<User | null> {
  const user = await this.prisma.user.findUnique({ where: { id } });
  return user ? UserMapper.toDomain(user) : null;
}

// AFTER
findById(id: string): Effect.Effect<User | null, never, never> {
  return Effect.tryPromise({
    try: () => this.prisma.user.findUnique({ where: { id } }),
    catch: (e) => new DatabaseError({ cause: e }),
  }).pipe(
    Effect.map((user) => (user ? UserMapper.toDomain(user) : null)),
    Effect.orDie // Defects should crash, not be caught
  );
}
```

### Step 3: Update Use Cases

```typescript
// BEFORE
async execute(input: GetUserInput): Promise<Result<GetUserOutput, GetUserNotFoundError>> {
  const user = await this.userRepo.findById(input.userId);
  if (!user) return err(new GetUserNotFoundError());
  return ok(toOutput(user));
}

// AFTER
execute(input: GetUserInput): Effect.Effect<GetUserOutput, GetUserNotFoundError, never> {
  return Effect.gen(function* () {
    const user = yield* this.userRepo.findById(input.userId);
    if (!user) return yield* Effect.fail(new GetUserNotFoundError());
    return toOutput(user);
  });
}
```

### Step 4: Update Controllers

```typescript
// BEFORE
async getById(input: GetUserInput): Promise<GetUserOutput> {
  const result = await this.useCase.execute(input);
  if (result.kind === "err") {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }
  return result.value;
}

// AFTER
async getById(input: GetUserInput): Promise<GetUserOutput> {
  const result = await Effect.runPromise(
    Effect.either(this.useCase.execute(input))
  );
  if (Either.isLeft(result)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }
  return result.right;
}
```

---

## Resources

- [Effect Documentation](https://effect.website/docs/introduction)
- [Effect GitHub](https://github.com/Effect-TS/effect)
- [Effect vs Promise](https://effect.website/docs/additional-resources/effect-vs-promise)
- [Effect Error Handling](https://effect.website/docs/error-management/expected-errors)
