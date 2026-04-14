# Test Infrastructure Helpers

Layer-based test utilities for Effect-based testing in the use-cases layer.

## Overview

These helpers provide a type-safe, composable approach to testing Effect-based use cases with in-memory repository implementations. They replace the need for complex container mocking with Effect's native Layer system.

## Installation

The test utilities are included with `@mirai-app/use-cases`:

```typescript
import {
  runWithTestLayer,
  createUserRepositoryMock,
  createGroupRepositoryMock,
} from "@mirai-app/use-cases/test";
```

## Core Helpers

### `runWithTestLayer`

Runs an Effect program with a provided test layer and returns a Promise.

```typescript
import { runWithTestLayer } from "@mirai-app/use-cases/test";
import { Layer, Effect } from "effect";

const testLayer = Layer.succeed(MyServiceTag, mockService);

const result = await runWithTestLayer(
  Effect.gen(function* () {
    const service = yield* MyServiceTag;
    return yield* service.doSomething();
  }),
  testLayer,
);

expect(result).toBe("expected-value");
```

### `runWithTestLayerExit`

Returns the full Exit result (Success or Failure) for inspection:

```typescript
import { runWithTestLayerExit } from "@mirai-app/use-cases/test";
import { Exit } from "effect";

const exit = await runWithTestLayerExit(program, testLayer);

if (Exit.isSuccess(exit)) {
  expect(exit.value).toBeDefined();
} else {
  expect(Exit.isFailure(exit)).toBe(true);
}
```

### `runWithTestLayerEither`

Returns Either for pattern matching success/failure:

```typescript
import { runWithTestLayerEither } from "@mirai-app/use-cases/test";

const either = await runWithTestLayerEither(useCase.execute(input), testLayer);

expect(either._tag).toBe("Left");
if (either._tag === "Left") {
  expect(either.left._tag).toBe("NotFoundError");
}
```

### `mergeTestLayers`

Combines multiple layers into a single layer:

```typescript
import {
  mergeTestLayers,
  createUserRepositoryMock,
  createGroupRepositoryMock,
} from "@mirai-app/use-cases/test";

const combinedLayer = mergeTestLayers(
  createUserRepositoryMock({ users: [mockUser] }),
  createGroupRepositoryMock({ groups: [mockGroup] }),
  createChallengeRepositoryMock(),
);
```

## Repository Mocks

All repository ports have corresponding mock factories that create in-memory implementations:

### UserRepository Mock

```typescript
import { createUserRepositoryMock } from "@mirai-app/use-cases/test";
import type { User } from "@mirai-app/domain";

const mockUser: User = {
  id: "user-123",
  email: "test@example.com",
  // ... other fields
};

const testLayer = createUserRepositoryMock({
  users: [mockUser],
});
```

### GroupRepository Mock

```typescript
import { createGroupRepositoryMock } from "@mirai-app/use-cases/test";

const testLayer = createGroupRepositoryMock({
  groups: [mockGroup],
});
```

### ChallengeRepository Mock

```typescript
import { createChallengeRepositoryMock } from "@mirai-app/use-cases/test";

const testLayer = createChallengeRepositoryMock({
  challenges: [mockChallenge],
});
```

### Simulating Failures

All repository mocks support simulating database errors:

```typescript
import { DatabaseError } from "@mirai-app/use-cases/ports";

const failingLayer = createUserRepositoryMock({
  shouldFail: true,
  error: new DatabaseError({
    operation: "findById",
    message: "Connection lost",
  }),
});
```

### State Persistence

Repository mocks use Effect's Ref internally, so state changes persist during test execution:

```typescript
const testLayer = createUserRepositoryMock();

// This use case creates a user in the repository
const useCase = Effect.gen(function* () {
  const repo = yield* UserRepositoryTag;

  // Create user
  yield* repo.create(mockUser);

  // Retrieve user (this will find the created user)
  return yield* repo.findById(mockUser.id);
});

const result = await runWithTestLayer(useCase, testLayer);
expect(result).not.toBeNull();
```

## Available Mock Factories

| Repository                     | Factory Function                           |
| ------------------------------ | ------------------------------------------ |
| UserRepository                 | `createUserRepositoryMock`                 |
| GroupRepository                | `createGroupRepositoryMock`                |
| ChallengeRepository            | `createChallengeRepositoryMock`            |
| ChallengeSubmissionRepository  | `createChallengeSubmissionRepositoryMock`  |
| ChallengeVoteRepository        | `createChallengeVoteRepositoryMock`        |
| LocationRepository             | `createLocationRepositoryMock`             |
| TripRepository                 | `createTripRepositoryMock`                 |
| RewardRepository               | `createRewardRepositoryMock`               |
| RewardPurchaseRepository       | `createRewardPurchaseRepositoryMock`       |
| SponsorRepository              | `createSponsorRepositoryMock`              |
| NotificationRepository         | `createNotificationRepositoryMock`         |
| NotificationScheduleRepository | `createNotificationScheduleRepositoryMock` |
| NotificationDeliveryRepository | `createNotificationDeliveryRepositoryMock` |
| CoinTransactionRepository      | `createCoinTransactionRepositoryMock`      |
| EventRepository                | `createEventRepositoryMock`                |
| ActivityFeedRepository         | `createActivityFeedRepositoryMock`         |
| SubmissionReportRepository     | `createSubmissionReportRepositoryMock`     |

## Complete Test Example

```typescript
import { describe, it, expect } from "bun:test";
import { Effect, Data, Layer } from "effect";
import {
  runWithTestLayer,
  runWithTestLayerEither,
  createUserRepositoryMock,
  createGroupRepositoryMock,
  mergeTestLayers,
} from "@mirai-app/use-cases/test";
import {
  UserRepositoryTag,
  GroupRepositoryTag,
} from "@mirai-app/use-cases/ports";

// Define error types
class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
  userId: string;
}> {}

class GroupNotFoundError extends Data.TaggedError("GroupNotFoundError")<{
  groupId: string;
}> {}

// Define use case
const getUserGroupUseCase = (input: { userId: string; groupId: string }) =>
  Effect.gen(function* () {
    const userRepo = yield* UserRepositoryTag;
    const groupRepo = yield* GroupRepositoryTag;

    const user = yield* userRepo.findById(input.userId);
    if (user === null) {
      return yield* Effect.fail(
        new UserNotFoundError({ userId: input.userId }),
      );
    }

    const group = yield* groupRepo.findById(input.groupId);
    if (group === null) {
      return yield* Effect.fail(
        new GroupNotFoundError({ groupId: input.groupId }),
      );
    }

    return { user, group };
  });

describe("[UNIT] GetUserGroupUseCase", () => {
  it("should return user and group when both exist", async () => {
    // Create mock data
    const mockUser = {
      id: "user-1",
      email: "test@test.com",
    } as import("@mirai-app/domain").User;
    const mockGroup = {
      id: "group-1",
      name: "Test Group",
    } as import("@mirai-app/domain").Group;

    // Create merged test layer
    const testLayer = mergeTestLayers(
      createUserRepositoryMock({ users: [mockUser] }),
      createGroupRepositoryMock({ groups: [mockGroup] }),
    );

    // Run use case
    const result = await runWithTestLayer(
      getUserGroupUseCase({ userId: "user-1", groupId: "group-1" }),
      testLayer,
    );

    expect(result.user.id).toBe("user-1");
    expect(result.group.id).toBe("group-1");
  });

  it("should fail with UserNotFoundError when user doesn't exist", async () => {
    const mockGroup = {
      id: "group-1",
      name: "Test Group",
    } as import("@mirai-app/domain").Group;

    const testLayer = mergeTestLayers(
      createUserRepositoryMock(), // Empty - no users
      createGroupRepositoryMock({ groups: [mockGroup] }),
    );

    const either = await runWithTestLayerEither(
      getUserGroupUseCase({ userId: "nonexistent", groupId: "group-1" }),
      testLayer,
    );

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left._tag).toBe("UserNotFoundError");
    }
  });
});
```

## Type Safety

All helpers maintain full type safety:

- No `any` types are used
- Effect types are properly inferred
- Layer composition maintains service requirements
- Repository interfaces are fully implemented

## Additional Utilities

### `createTestLayer`

Creates a Layer from a tag and implementation:

```typescript
import { createTestLayer } from "@mirai-app/use-cases/test";

const layer = createTestLayer(UserRepositoryTag, {
  findById: () => Effect.succeed(null),
  // ... other methods
});
```

### `createFailingLayer`

Creates a layer where all service methods fail:

```typescript
import { createFailingLayer } from "@mirai-app/use-cases/test";

const failingLayer = createFailingLayer(
  UserRepositoryTag,
  new DatabaseError({ operation: "mock", message: "Simulated error" }),
);
```

### `assertSuccess` / `assertFailure`

Type-safe Exit assertion helpers:

```typescript
import { assertSuccess, runWithTestLayerExit } from "@mirai-app/use-cases/test";

const exit = await runWithTestLayerExit(program, layer);
const value = assertSuccess(exit); // Returns value or throws
expect(value).toBeDefined();
```

### `isFailureWithTag`

Check if an Exit represents a specific error type:

```typescript
import { isFailureWithTag } from "@mirai-app/use-cases/test";

const exit = await runWithTestLayerExit(program, layer);
expect(isFailureWithTag(exit, "NotFoundError")).toBe(true);
```

## Best Practices

1. **Use `mergeTestLayers`** for combining multiple repository mocks
2. **Use `runWithTestLayerEither`** when testing error scenarios
3. **Pre-populate repositories** with mock data when testing retrieval scenarios
4. **Use empty repositories** when testing creation scenarios
5. **Always check error types** with `_tag` matching for tagged errors
6. **Import from `@mirai-app/use-cases/test`** for all test utilities

## Migration from Container Mocking

Before (awilix-modular):

```typescript
const container = createTestContainer();
container.register({
  userRepository: asClass(InMemoryUserRepository).singleton(),
});
const useCase = container.resolve("getUserUseCase");
const result = await useCase.execute({ id: "123" });
```

After (Effect Layers):

```typescript
const testLayer = createUserRepositoryMock({ users: [mockUser] });
const result = await runWithTestLayer(getUserUseCase({ id: "123" }), testLayer);
```

## References

- See `test-helpers.ts` for core utility implementations
- See `repository-mocks.ts` for all repository mock factories
- See `usage-examples.test.ts` for complete working examples
- See `test-helpers.test.ts` for self-tests of the infrastructure
