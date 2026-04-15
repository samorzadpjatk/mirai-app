# @mirai-app/use-cases - Effect-based Use Cases Layer

> **Application layer of Clean Architecture - Orchestrates domain entities with Effect**
>
> Depends only on @mirai-app/domain (innermost layer)

## Purpose

The use cases layer contains:

- **Interactors**: Use case implementations using `Effect.gen` for composable workflows
- **Ports**: Repository interfaces as `Context.Tag` for dependency injection
- **DTOs**: Input/output data transfer objects
- **Errors**: Use case specific errors using `Data.TaggedError`

This layer has migrated from class-based `Result<T,E>` to functional **Effect** patterns for better composability, type safety, and testability.

## Rules

1. **Only Domain Dependency**: Can only import from `@mirai-app/domain`
2. **No Framework Knowledge**: No knowledge of UI, database, or frameworks
3. **Orchestration Only**: Coordinates domain entities, doesn't contain business rules
4. **Repository Interfaces**: Defines what repositories must do (adapters implement)
5. **Effect<T,E,R>**: All operations return `Effect<T,E,R>` for composable error handling

## Directory Structure

```
src/
├── index.ts              # Public exports
├── ports/                # Repository & service interfaces (Context.Tag)
│   ├── UserRepository.ts # Data access ports with Effect signatures
│   ├── GroupRepository.ts # Group management with member operations
│   ├── AuthPort.ts       # Authentication port
│   ├── TelemetryPort.ts  # Observability port
│   └── errors.ts         # Common port errors (DatabaseError, etc.)
├── interactors/          # Use case implementations
│   ├── CreateUser.ts     # Business workflow use cases
│   ├── AssignUserToGroup.ts    # Effect.gen pattern example
│   ├── RemoveUserFromGroup.ts  # Another Effect pattern
│   ├── AuthenticateUser.ts     # Authentication use case
│   └── LogTelemetry.ts         # Telemetry use case
├── dto/                  # Data Transfer Objects
│   ├── input/            # Input DTOs
│   └── output/           # Output DTOs
├── errors/               # Use case specific errors
└── test/                 # Test utilities (runWithTestLayer, etc.)
    ├── index.ts          # Public test exports
    ├── test-helpers.ts   # Layer-based test utilities
    └── repository-mocks.ts # Pre-built repository mocks
```

## Effect-Based Use Cases

Use cases are implemented as **functional Effect programs** using `Effect.gen` for sequential operations.

### Core Pattern: Effect.gen + yield\*

```typescript
import { Effect, Data } from "effect";

// 1. Define tagged errors
export class EntityNotFoundError extends Data.TaggedError(
  "EntityNotFoundError",
)<{ entityId: string }>() {}

// 2. Use Effect.gen for orchestration
export const doSomethingUseCase = (input: DoSomethingInput) =>
  Effect.gen(function* () {
    // yield* extracts the value from Effect
    const repo = yield* MyEntityRepository;
    const entity = yield* repo.findById(input.entityId);

    if (!entity) {
      return yield* Effect.fail(
        new EntityNotFoundError({ entityId: input.entityId }),
      );
    }

    return entity;
  });
```

**Key rules:**

- Always use `function* ()` (generator function)
- Use `yield*` (with asterisk) to extract Effect values
- Return `Effect.fail()` for errors, never throw

### Complete Use Case Example

From `src/interactors/AssignUserToGroup.ts`:

```typescript
import { Group, TripParticipant } from "@mirai-app/domain";
import { Data, Effect } from "effect";
import { GroupRepositoryTag } from "../ports/GroupRepository";

// Input/Output DTOs
export interface AssignUserToGroupInput {
  groupId: GroupId;
  userId: UserId;
}

export interface AssignUserToGroupOutput {
  id: string;
  tripId: string;
  name: string;
  // ... other fields
}

// Tagged errors for type-safe error handling
export class GroupNotFoundError extends Data.TaggedError("GroupNotFoundError")<{
  groupId: string;
}>() {}

export class ParticipantNotFoundError extends Data.TaggedError(
  "ParticipantNotFoundError",
)<{
  userId: string;
  tripId: string;
}>() {}

// The use case function returns Effect<T, E, R>
export function assignUserToGroupUseCase(
  input: AssignUserToGroupInput,
): Effect.Effect<
  AssignUserToGroupOutput,
  GroupNotFoundError | ParticipantNotFoundError,
  GroupRepositoryTag
> {
  return Effect.gen(function* () {
    // Access repository via Context.Tag (DI)
    const groupRepo = yield* GroupRepositoryTag;

    // Find the group
    const group = yield* groupRepo.findById(input.groupId);
    if (!group) {
      return yield* Effect.fail(
        new GroupNotFoundError({ groupId: input.groupId }),
      );
    }

    // Find participant
    const participant = yield* groupRepo.findParticipantByUserIdAndTripId(
      input.userId,
      group.tripId,
    );
    if (!participant) {
      return yield* Effect.fail(
        new ParticipantNotFoundError({
          userId: input.userId,
          tripId: group.tripId,
        }),
      );
    }

    // Idempotency check
    if (participant.groupId === input.groupId) {
      return toOutput(group);
    }

    // Perform the assignment
    yield* groupRepo.assignUserToGroup(input.userId, input.groupId);

    return toOutput(group);
  });
}
```

## Context.Tag Dependency Injection

Repositories and services are accessed via `yield* RepositoryTag` rather than constructor injection.

### Defining a Repository Port

```typescript
// ports/GroupRepository.ts
import { Context, Effect } from "effect";
import type { Group, GroupStatus, TripParticipant } from "@mirai-app/domain";
import { DatabaseError } from "./errors";

// Service interface with Effect signatures
export interface GroupRepository {
  findById(id: string): Effect.Effect<Group | null, DatabaseError, never>;
  create(group: Group): Effect.Effect<Group, DatabaseError, never>;
  update(group: Group): Effect.Effect<Group, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
  assignUserToGroup(
    userId: string,
    groupId: string,
  ): Effect.Effect<TripParticipant, DatabaseError, never>;
  // ... other methods
}

// Context.Tag for dependency injection
export class GroupRepositoryTag extends Context.Tag("GroupRepository")<
  GroupRepositoryTag,
  GroupRepository
>() {}
```

### Cross-Cutting Concern Ports

```typescript
// ports/AuthPort.ts - Authentication abstraction
export interface AuthPort {
  validateToken(token: string): Effect.Effect<AuthContext, AuthError, never>;
  getUserById(userId: UserId): Effect.Effect<AuthUser, AuthError, never>;
}

export const AuthPortTag = Context.Tag<AuthPort>("AuthPort");

// ports/TelemetryPort.ts - Observability abstraction
export interface TelemetryPort {
  log(event: TelemetryEvent): Effect.Effect<void, TelemetryError, never>;
  trackMetric(name: string, value: number): Effect.Effect<void, never, never>;
}

export const TelemetryPortTag = Context.Tag<TelemetryPort>("TelemetryPort");
```

**Key Differences from Repository Ports:**

- Repository ports: Data persistence (CRUD operations with Effect)
- Cross-cutting ports: Infrastructure services (auth, logging, external APIs)
- Cross-cutting ports often have framework-specific implementations (Supabase, Sentry, etc.)

## Error Handling with Data.TaggedError

Use `Data.TaggedError` for type-safe, discriminated union errors:

```typescript
import { Data } from "effect";

// Define tagged error classes
export class GroupNotFoundError extends Data.TaggedError("GroupNotFoundError")<{
  groupId: string;
}>() {}

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}>() {}

export class PermissionDeniedError extends Data.TaggedError(
  "PermissionDeniedError",
)<{
  requiredRole: string;
  actualRole: string;
}>() {}

// Use case combines errors into union type
export type MyUseCaseError =
  | GroupNotFoundError
  | UserNotFoundError
  | PermissionDeniedError;

// The Effect signature shows all possible errors
export const myUseCase = (
  input: Input,
): Effect.Effect<Output, MyUseCaseError, MyRepositoryTag> => {
  return Effect.gen(function* () {
    // ... operations
    if (someCondition) {
      return yield* Effect.fail(
        new PermissionDeniedError({
          requiredRole: "ADMIN",
          actualRole: "USER",
        }),
      );
    }
    return output;
  });
};
```

## Testing with Effect

Tests use `Layer.succeed` to provide mock implementations and `Effect.provide` to inject dependencies.

### Basic Test Pattern

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  assignUserToGroupUseCase,
  GroupNotFoundError,
  ParticipantNotFoundError,
} from "./AssignUserToGroup";
import { GroupRepositoryTag } from "../ports/GroupRepository";

describe("[UNIT] assignUserToGroupUseCase", () => {
  let mockLayer: Layer.Layer<GroupRepositoryTag>;

  beforeEach(() => {
    // Create mock repository
    const mockRepo = {
      findById: (id: string) => Effect.succeed(mockGroup),
      findParticipantByUserIdAndTripId: () => Effect.succeed(mockParticipant),
      assignUserToGroup: () => Effect.succeed(updatedParticipant),
      // ... other methods
    };

    // Create layer that provides the mock
    mockLayer = Layer.succeed(GroupRepositoryTag, mockRepo);
  });

  it("should assign user to group successfully", async () => {
    const program = assignUserToGroupUseCase({
      groupId: "group-123",
      userId: "user-456",
    }).pipe(Effect.provide(mockLayer));

    const result = await Effect.runPromise(program);

    expect(result.id).toBe("group-123");
    expect(result.name).toBe("Test Group");
  });

  it("should fail with GroupNotFoundError when group does not exist", async () => {
    const failingRepo = {
      findById: () => Effect.succeed(null), // Returns null
      // ... other methods
    };
    const failingLayer = Layer.succeed(GroupRepositoryTag, failingRepo);

    const program = assignUserToGroupUseCase({
      groupId: "non-existent",
      userId: "user-456",
    }).pipe(Effect.provide(failingLayer));

    // Use Effect.either to capture the error
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GroupNotFoundError);
      expect(either.left.groupId).toBe("non-existent");
    }
  });
});
```

### Using Test Utilities

The `@mirai-app/use-cases/test` package provides pre-built helpers:

```typescript
import {
  runWithTestLayer,
  createGroupRepositoryMock,
  createUserRepositoryMock,
} from "@mirai-app/use-cases/test";
import { Layer, Effect } from "effect";

// Create combined test layer
const testLayer = Layer.mergeAll(
  createGroupRepositoryMock({ groups: [mockGroup] }),
  createUserRepositoryMock(),
);

// Run test with layer
const result = await runWithTestLayer(
  assignUserToGroupUseCase({ groupId: "g1", userId: "u1" }),
  testLayer,
);

// For error assertions, use Effect.either
const either = await runWithTestLayer(
  Effect.either(assignUserToGroupUseCase({ groupId: "bad", userId: "u1" })),
  testLayer,
);
```

### Test Utilities Reference

| Helper                                   | Description                               |
| ---------------------------------------- | ----------------------------------------- |
| `runWithTestLayer(program, layer)`       | Run Effect with layer, returns Promise<A> |
| `runWithTestLayerExit(program, layer)`   | Returns Exit<A,E> for inspection          |
| `runWithTestLayerEither(program, layer)` | Returns Either for error assertions       |
| `createTestLayer(tag, implementation)`   | Create Layer from tag + impl              |
| `createFailingLayer(tag, error)`         | Create layer that always fails            |
| `mergeTestLayers(...layers)`             | Combine multiple layers                   |
| `assertSuccess(exit)`                    | Type-narrow Exit to success               |
| `assertFailure(exit)`                    | Type-narrow Exit to failure               |
| `isFailureWithTag(exit, errorTag)`       | Check error type                          |

## Creating DTOs

### Input DTOs

```typescript
// dto/input/CreateUserInput.ts
import { z } from "zod";

export const CreateUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;
```

### Output DTOs

```typescript
// dto/output/UserDTO.ts
import type { User } from "@mirai-app/domain";

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export const toUserDTO = (user: User): UserDTO => ({
  id: user.id,
  email: user.email.value,
  name: user.name,
  createdAt: user.createdAt.toISOString(),
});
```

## Key Principles

### Ports vs Adapters

- **Ports** (in this layer): Interfaces as `Context.Tag` that define WHAT the application needs
- **Adapters** (in adapters layer): Layer implementations that provide HOW

```typescript
// Port (Context.Tag) - in use-cases layer
export interface UserRepository {
  findById(id: string): Effect.Effect<User | null, DatabaseError, never>;
}
export const UserRepositoryTag = Context.Tag<UserRepository>("UserRepository");

// Adapter (Layer) - in adapters layer
const UserRepositoryLive = Layer.succeed(UserRepositoryTag, {
  findById: (id) =>
    Effect.tryPromise({
      try: () => prisma.user.findUnique({ where: { id } }),
      catch: (error) =>
        new DatabaseError({ operation: "findById", cause: error }),
    }),
});
```

### Cross-Cutting vs Repository Ports

- **Repository Ports**: Define data persistence contracts with Effect signatures
  - Example: `findById(id: string): Effect.Effect<User | null, DatabaseError, never>`
  - Implemented by: Prisma/SQLite repositories in adapters layer

- **Cross-Cutting Ports**: Define infrastructure service contracts
  - Example: `validateToken(token: string): Effect.Effect<AuthContext, AuthError, never>`
  - Implemented by: Framework-specific adapters (Supabase, Sentry, etc.)

### DTOs Separate Layers

DTOs prevent domain objects from leaking to outer layers:

```
Request → Input DTO → Use Case → Domain Entity → Repository
                                              ↓
Response ← Output DTO ← Use Case ← Domain Entity ← Database
```

### Effect at System Boundaries

Use cases return `Effect<T,E,R>` which is executed at framework boundaries:

```typescript
// In controller (adapter layer)
const program = assignUserToGroupUseCase({ groupId, userId }).pipe(
  Effect.provide(repoLayer),
);

const result = await Effect.runPromise(program);
```

## Effect Pattern Quick Reference

| Pattern           | Syntax                              | Use Case                 |
| ----------------- | ----------------------------------- | ------------------------ |
| Generator         | `Effect.gen(function* () { ... })`  | Sequential orchestration |
| Extract value     | `yield* someEffect`                 | Unwrap Effect value      |
| Access dependency | `yield* RepositoryTag`              | DI via Context.Tag       |
| Fail              | `yield* Effect.fail(error)`         | Short-circuit on error   |
| Succeed           | `Effect.succeed(value)`             | Wrap success             |
| Map               | `Effect.map(effect, f)`             | Transform success        |
| FlatMap           | `Effect.flatMap(effect, f)`         | Chain Effects            |
| Parallel          | `Effect.all([e1, e2, e3])`          | Concurrent execution     |
| Error recovery    | `Effect.catchTag("Error", handler)` | Handle specific errors   |
| Provide           | `Effect.provide(Layer)`             | Inject dependencies      |
| Run               | `Effect.runPromise(effect)`         | Execute at boundaries    |
| Either            | `Effect.either(effect)`             | Capture success/failure  |

## References

- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars (Effect patterns §10)
- [AGENTS.md](./AGENTS.md) - Quick reference for AI agents
- [Effect Documentation](https://effect.website/) - Official Effect docs
- [Ports and Adapters Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

---

**Migration Note**: This package has migrated from class-based `Result<T,E>` to functional Effect patterns. All new use cases should use `Effect.gen` with `Context.Tag` DI. Legacy use cases using `Result` are being migrated incrementally.
