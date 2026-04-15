# Ports and Adapters Pattern

**Purpose:** Comprehensive guide to Clean Architecture's Ports and Adapters pattern as implemented in Mirai App

**Reference:** CLAUDE.md §5 (Layer Patterns)

---

## Overview

The Ports and Adapters pattern (also known as Hexagonal Architecture) separates the application's core business logic from external concerns. The domain layer defines **what** operations are needed through ports (interfaces), while adapters provide **how** those operations are implemented.

```
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                             │
│                  (WHAT: Interfaces)                         │
│         ┌─────────────────────────────────┐                 │
│         │   UserRepository (interface)    │                 │
│         │   - findById(id)                │                 │
│         │   - save(user)                  │                 │
│         └─────────────────────────────────┘                 │
└──────────────────────▲──────────────────────────────────────┘
                       │ Port
┌──────────────────────▼──────────────────────────────────────┐
│                  Use Cases Layer                            │
│              (HOW: Orchestration + DI)                      │
│         ┌─────────────────────────────────┐                 │
│         │   UserRepositoryTag (Context.Tag) │                 │
│         │   + Effect dependency injection   │                 │
│         └─────────────────────────────────┘                 │
└──────────────────────▲──────────────────────────────────────┘
                       │ Port (with DI capability)
┌──────────────────────▼──────────────────────────────────────┐
│                   Adapters Layer                            │
│            (IMPLEMENTATION: Drizzle ORM)                    │
│         ┌─────────────────────────────────┐                 │
│         │   DrizzleUserRepository           │                 │
│         │   - implements UserRepository     │                 │
│         │   - uses db.query.users           │                 │
│         └─────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Two-Layer Port System

Mirai App uses a **two-layer port system** to maintain Clean Architecture compliance while enabling Effect-based dependency injection.

### Layer 1: Domain Ports (`@mirai-app/domain/ports`)

**Purpose:** Pure TypeScript interfaces that define repository contracts. Zero dependencies.

**Characteristics:**

- Pure interfaces with no implementation details
- Return `Effect<T, DatabaseError, never>` (no dependencies)
- No imports from external frameworks (Prisma, tRPC, etc.)
- No Context.Tags (no DI concerns at this level)

```typescript
// packages/domain/src/ports/UserRepository.ts
import type { User } from "../entities/User";
import type { Effect } from "effect";
import type { DatabaseError } from "./DatabaseError";

export interface UserRepository {
  findById(id: string): Effect.Effect<User | null, DatabaseError, never>;
  create(user: User): Effect.Effect<User, DatabaseError, never>;
  update(user: User): Effect.Effect<User, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
}
```

**Import pattern:**

```typescript
import type { UserRepository, DatabaseError } from "@mirai-app/domain/ports";
```

### Layer 2: Use Cases Ports (`packages/use-cases/src/ports/`)

**Purpose:** Domain interfaces enhanced with Context.Tags for Effect dependency injection.

**Characteristics:**

- Reuses domain interface (same method signatures)
- Adds Context.Tag for Effect DI (`yield* UserRepositoryTag`)
- Enables `Layer.provide()` for testing
- Allows use cases to declare dependencies explicitly

```typescript
// packages/use-cases/src/ports/UserRepository.ts
import type { User } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "./errors";

// Interface (matches domain, adds explicit error type)
export interface UserRepository {
  findById(id: string): Effect.Effect<User | null, DatabaseError, never>;
  create(user: User): Effect.Effect<User, DatabaseError, never>;
  update(user: User): Effect.Effect<User, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
}

// Context.Tag for dependency injection
export class UserRepositoryTag extends Context.Tag("UserRepository")<
  UserRepositoryTag,
  UserRepository
>() {}
```

**Usage in use cases:**

```typescript
import { Effect } from "effect";
import { UserRepositoryTag } from "../ports/UserRepository";

export class GetUserUseCase {
  execute(userId: string) {
    return Effect.gen(function* () {
      const repo = yield* UserRepositoryTag; // Get from context
      const user = yield* repo.findById(userId);
      if (!user) {
        return yield* Effect.fail(new NotFoundError({ userId }));
      }
      return user;
    });
  }
}
```

### Layer 3: Adapters (Implementations)

**Purpose:** Concrete implementations using specific technologies (Drizzle ORM, in-memory for testing).

**Characteristics:**

- Implements the domain interface
- Uses `Effect.tryPromise` to wrap external calls
- Converts database errors to `DatabaseError`
- Maps between database records and domain entities

```typescript
// packages/adapters/src/gateways/DrizzleUserRepository.ts
import { Effect } from "effect";
import { eq } from "drizzle-orm";
import type { UserRepository } from "@mirai-app/domain/ports";
import { DatabaseError } from "@mirai-app/domain/ports";

export class DrizzleUserRepository implements UserRepository {
  constructor(private db: Database) {}

  findById(id: string) {
    return Effect.tryPromise({
      try: () => this.db.query.users.findFirst({ where: eq(users.id, id) }),
      catch: (error) =>
        new DatabaseError({ operation: "findById", cause: error }),
    }).pipe(
      Effect.map((record) => (record ? UserMapper.toDomain(record) : null)),
    );
  }

  // ... other implementations
}
```

---

## Dependency Flow

```
Domain ──► Use Cases ──► Adapters ──► Frameworks
  │           │            │            │
  │           │            │            │
  ▼           ▼            ▼            ▼
WHAT         HOW       IMPLEMENT     CONFIGURE
(interface)  (DI Tag)   (Drizzle)    (tRPC, etc.)
```

**Key principle:** Dependencies point inward. The domain knows nothing about use cases, adapters, or frameworks.

---

## Why Two Port Layers?

### Clean Architecture Compliance

| Concern       | Domain Layer                   | Use Cases Layer           |
| ------------- | ------------------------------ | ------------------------- |
| **Purity**    | Zero external dependencies     | Only Effect Context       |
| **DI**        | None                           | Context.Tags for DI       |
| **Testing**   | Pure functions, no mocks       | Mock with `Layer.succeed` |
| **Knowledge** | Knows nothing about frameworks | Knows about Effect only   |

### Practical Benefits

1. **Testability at Each Layer**
   - Domain: Test entities/VOs without any setup
   - Use Cases: Mock repositories with `Layer.succeed`
   - Adapters: Integration tests with real database

2. **Framework Independence**
   - Domain: Pure TypeScript
   - Use Cases: Effect framework only
   - Adapters: Drizzle, Supabase, or any ORM

3. **Incremental Migration**
   - Change ORM without touching domain or use cases
   - Add new repository implementations (caching, read replicas)
   - Swap adapters while keeping business logic intact

---

## Complete Code Example

### 1. Domain Port (Interface)

```typescript
// packages/domain/src/ports/TripRepository.ts
import type { Trip } from "../entities/Trip";
import type { Effect } from "effect";
import type { DatabaseError } from "./DatabaseError";

export interface TripRepository {
  findById(id: string): Effect.Effect<Trip | null, DatabaseError, never>;
  findByUserId(userId: string): Effect.Effect<Trip[], DatabaseError, never>;
  create(trip: Trip): Effect.Effect<Trip, DatabaseError, never>;
  update(trip: Trip): Effect.Effect<Trip, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
}
```

### 2. Use Cases Port (Interface + Context.Tag)

```typescript
// packages/use-cases/src/ports/TripRepository.ts
import type { Trip } from "@mirai-app/domain";
import { Context, Effect } from "effect";
import { DatabaseError } from "./errors";

export interface TripRepository {
  findById(id: string): Effect.Effect<Trip | null, DatabaseError, never>;
  findByUserId(userId: string): Effect.Effect<Trip[], DatabaseError, never>;
  create(trip: Trip): Effect.Effect<Trip, DatabaseError, never>;
  update(trip: Trip): Effect.Effect<Trip, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
}

export class TripRepositoryTag extends Context.Tag("TripRepository")<
  TripRepositoryTag,
  TripRepository
>() {}
```

### 3. Adapter Implementation

```typescript
// packages/adapters/src/gateways/DrizzleTripRepository.ts
import { Effect } from "effect";
import { eq } from "drizzle-orm";
import type { TripRepository } from "@mirai-app/domain/ports";
import { DatabaseError } from "@mirai-app/domain/ports";
import { trips } from "../db/schema";
import { TripMapper } from "../mappers/TripMapper";

export class DrizzleTripRepository implements TripRepository {
  constructor(private db: Database) {}

  findById(id: string) {
    return Effect.tryPromise({
      try: () => this.db.query.trips.findFirst({ where: eq(trips.id, id) }),
      catch: (error) =>
        new DatabaseError({ operation: "findById", id, cause: error }),
    }).pipe(
      Effect.map((record) => (record ? TripMapper.toDomain(record) : null)),
    );
  }

  findByUserId(userId: string) {
    return Effect.tryPromise({
      try: () =>
        this.db.query.trips.findMany({ where: eq(trips.userId, userId) }),
      catch: (error) =>
        new DatabaseError({ operation: "findByUserId", userId, cause: error }),
    }).pipe(Effect.map((records) => records.map(TripMapper.toDomain)));
  }

  create(trip: Trip) {
    return Effect.tryPromise({
      try: () =>
        this.db.insert(trips).values(TripMapper.toDb(trip)).returning(),
      catch: (error) =>
        new DatabaseError({ operation: "create", cause: error }),
    }).pipe(Effect.map((records) => TripMapper.toDomain(records[0])));
  }

  update(trip: Trip) {
    return Effect.tryPromise({
      try: () =>
        this.db
          .update(trips)
          .set(TripMapper.toDb(trip))
          .where(eq(trips.id, trip.id))
          .returning(),
      catch: (error) =>
        new DatabaseError({ operation: "update", id: trip.id, cause: error }),
    }).pipe(Effect.map((records) => TripMapper.toDomain(records[0])));
  }

  delete(id: string) {
    return Effect.tryPromise({
      try: () => this.db.delete(trips).where(eq(trips.id, id)),
      catch: (error) =>
        new DatabaseError({ operation: "delete", id, cause: error }),
    });
  }
}
```

### 4. Use Case Orchestration

```typescript
// packages/use-cases/src/interactors/CreateTrip.ts
import { Effect, Data } from "effect";
import { Trip } from "@mirai-app/domain";
import { TripRepositoryTag } from "../ports/TripRepository";
import { UserRepositoryTag } from "../ports/UserRepository";

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}>() {}

export class CreateTripInput {
  constructor(
    readonly userId: string,
    readonly name: string,
    readonly description: string,
    readonly startDate: Date,
    readonly endDate: Date,
  ) {}
}

export class TripDTO {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string,
    readonly startDate: Date,
    readonly endDate: Date,
    readonly userId: string,
  ) {}

  static fromDomain(trip: Trip): TripDTO {
    return new TripDTO(
      trip.id,
      trip.name,
      trip.description,
      trip.startDate,
      trip.endDate,
      trip.userId,
    );
  }
}

export class CreateTripUseCase {
  execute(input: CreateTripInput) {
    return Effect.gen(function* () {
      // Get repositories from context
      const userRepo = yield* UserRepositoryTag;
      const tripRepo = yield* TripRepositoryTag;

      // Verify user exists
      const user = yield* userRepo.findById(input.userId);
      if (!user) {
        return yield* Effect.fail(
          new UserNotFoundError({ userId: input.userId }),
        );
      }

      // Create trip entity (domain logic)
      const trip = yield* Trip.create({
        id: crypto.randomUUID(),
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        userId: input.userId,
        createdAt: new Date(),
      });

      // Persist through repository port
      const saved = yield* tripRepo.create(trip);

      // Return DTO
      return TripDTO.fromDomain(saved);
    });
  }
}
```

### 5. Controller (System Boundary)

```typescript
// apps/backend-server/src/controllers/tripRouter.ts
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { CreateTripUseCase, UserNotFoundError } from "@mirai-app/use-cases";
import { container } from "../di/container";

export const tripRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const useCase = container.resolve("createTripUseCase");

      return await Effect.runPromise(
        useCase
          .execute({
            userId: ctx.auth.userId,
            name: input.name,
            description: input.description,
            startDate: input.startDate,
            endDate: input.endDate,
          })
          .pipe(
            Effect.catchTag("UserNotFoundError", () => {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "User not found",
              });
            }),
            Effect.catchTag("ValidationError", (error) => {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: error.message,
              });
            }),
            Effect.catchTag("DatabaseError", (error) => {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Database error",
              });
            }),
          ),
      );
    }),
});
```

### 6. Testing with Mock Layers

```typescript
// packages/use-cases/src/interactors/CreateTrip.test.ts
import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import { Trip } from "@mirai-app/domain";
import { CreateTripUseCase, UserNotFoundError } from "./CreateTrip";
import { TripRepositoryTag } from "../ports/TripRepository";
import { UserRepositoryTag } from "../ports/UserRepository";

describe("[UNIT] CreateTripUseCase", () => {
  it("creates trip for existing user", async () => {
    // Create mock implementations
    const mockUserRepo = Layer.succeed(UserRepositoryTag, {
      findById: () => Effect.succeed({ id: "user-123", name: "Test User" }),
      // ... other methods
    });

    const mockTripRepo = Layer.succeed(TripRepositoryTag, {
      create: (trip: Trip) => Effect.succeed(trip),
      // ... other methods
    });

    // Merge layers and run
    const useCase = new CreateTripUseCase();
    const program = useCase
      .execute({
        userId: "user-123",
        name: "Summer Vacation",
        description: "Trip to Italy",
        startDate: new Date("2024-07-01"),
        endDate: new Date("2024-07-15"),
      })
      .pipe(Effect.provide(mockUserRepo), Effect.provide(mockTripRepo));

    const result = await Effect.runPromise(program);
    expect(result.name).toBe("Summer Vacation");
  });

  it("fails when user not found", async () => {
    const failingUserRepo = Layer.succeed(UserRepositoryTag, {
      findById: () => Effect.succeed(null),
    });

    const useCase = new CreateTripUseCase();
    const program = useCase
      .execute({
        userId: "nonexistent",
        name: "Test Trip",
        description: "Description",
        startDate: new Date(),
        endDate: new Date(),
      })
      .pipe(
        Effect.provide(failingUserRepo),
        Effect.provide(Layer.succeed(TripRepositoryTag, {} as any)),
      );

    const result = await Effect.runPromise(Effect.either(program));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UserNotFoundError");
    }
  });
});
```

---

## Port Naming Conventions

| Layer     | Pattern                                       | Example                 |
| --------- | --------------------------------------------- | ----------------------- |
| Domain    | `*Repository` interface                       | `UserRepository`        |
| Use Cases | `*Repository` interface + `*Tag` class        | `UserRepositoryTag`     |
| Adapters  | `Drizzle*Repository` or `InMemory*Repository` | `DrizzleUserRepository` |

---

## Error Handling Pattern

All repository ports use `DatabaseError` for consistent error handling:

```typescript
// From @mirai-app/domain/ports
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  cause?: unknown;
}>() {}
```

**In adapters:** Wrap external calls and convert to `DatabaseError`

```typescript
Effect.tryPromise({
  try: () => db.query.users.findFirst(...),
  catch: (error) => new DatabaseError({ operation: "findById", cause: error }),
});
```

**In use cases:** Handle with `Effect.catchTag`

```typescript
Effect.catchTag("DatabaseError", (error) => {
  logger.error("Database operation failed", error);
  return Effect.fail(new ServiceUnavailableError());
});
```

---

## Quick Reference

| Task                        | Where           | Pattern                                                         |
| --------------------------- | --------------- | --------------------------------------------------------------- |
| Define repository interface | Domain ports    | `interface UserRepository { ... }`                              |
| Add DI capability           | Use cases ports | `class UserRepositoryTag extends Context.Tag(...)`              |
| Implement repository        | Adapters        | `class DrizzleUserRepository implements UserRepository`         |
| Use repository in use case  | Use cases       | `const repo = yield* UserRepositoryTag`                         |
| Mock for testing            | Test file       | `Layer.succeed(UserRepositoryTag, { ... })`                     |
| Import domain port          | Any package     | `import type { UserRepository } from "@mirai-app/domain/ports"` |

---

## Migration Guide

### Adding a New Repository

1. **Create domain port** (`packages/domain/src/ports/NewEntityRepository.ts`)
   - Define interface with `Effect<T, DatabaseError, never>` methods
   - No external imports
   - Add to `packages/domain/src/ports/index.ts`

2. **Create use cases port** (`packages/use-cases/src/ports/NewEntityRepository.ts`)
   - Copy interface from domain
   - Add `Context.Tag` class (named `NewEntityRepositoryTag`)
   - Reuse `DatabaseError` from `./errors`

3. **Create adapter implementation** (`packages/adapters/src/gateways/DrizzleNewEntityRepository.ts`)
   - Implement domain interface
   - Use `Effect.tryPromise` for Drizzle calls
   - Map between DB records and domain entities

4. **Register in DI container** (`apps/backend-server/src/di/container.ts`)
   - Map interface to implementation

5. **Use in use cases** (`packages/use-cases/src/interactors/`)
   - Import `NewEntityRepositoryTag`
   - Use `yield* NewEntityRepositoryTag` in `Effect.gen`

---

**Last Updated:** 2026-04-15  
**Reference:** CLAUDE.md §5 (Clean Architecture Layers)
