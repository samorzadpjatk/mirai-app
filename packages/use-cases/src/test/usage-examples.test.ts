/**
 * Test Infrastructure Usage Examples
 *
 * This file demonstrates how to use the test infrastructure helpers
 * with real use case tests. These examples show best practices for
 * Effect-based testing.
 *
 * @module usage-examples
 */

import { describe, it, expect } from "bun:test";
import { Effect, Layer, Data, Context } from "effect";
import {
  runWithTestLayer,
  runWithTestLayerEither,
  createFailingLayer,
  mergeTestLayers,
} from "./test-helpers.js";
import {
  createUserRepositoryMock,
  createGroupRepositoryMock,
  createChallengeRepositoryMock,
} from "./repository-mocks.js";
import {
  UserRepositoryTag,
  GroupRepositoryTag,
  ChallengeRepositoryTag,
  DatabaseError,
} from "../ports/index.js";

// =============================================================================
// Example 1: Simple Use Case Test with Single Repository
// =============================================================================

describe("[EXAMPLE] Simple Use Case Test", () => {
  // Define a simple use case for demonstration
  class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
    userId: string;
  }> {}

  // A simple use case that depends on UserRepository
  const getUserUseCase = (userId: string) =>
    Effect.gen(function* () {
      const repo = yield* UserRepositoryTag;
      const user = yield* repo.findById(userId);

      if (user === null) {
        return yield* Effect.fail(new UserNotFoundError({ userId }));
      }

      return user;
    });

  it("should return user when found", async () => {
    // Create a mock user (using a minimal mock structure)
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    };

    // Create the test layer with a mock repository
    const testLayer = createUserRepositoryMock({
      users: [mockUser as unknown as import("@mirai-app/domain").User],
    });

    // Run the use case with the test layer
    const result = await runWithTestLayer(
      getUserUseCase("user-123"),
      testLayer,
    );

    expect(result.id).toBe("user-123");
    expect(result.email).toBe("test@example.com");
  });

  it("should fail with UserNotFoundError when user not found", async () => {
    // Create an empty repository (no users)
    const testLayer = createUserRepositoryMock();

    // Run the use case and check the result
    const either = await runWithTestLayerEither(
      getUserUseCase("nonexistent"),
      testLayer,
    );

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left._tag).toBe("UserNotFoundError");
    }
  });

  it("should handle database errors gracefully", async () => {
    // Create a failing repository layer
    const dbError = new DatabaseError({
      operation: "findById",
      message: "Connection lost",
    });
    const failingLayer = createUserRepositoryMock({
      shouldFail: true,
      error: dbError,
    });

    // Expect the use case to fail - use Either to capture the error properly
    const either = await runWithTestLayerEither(
      getUserUseCase("user-123"),
      failingLayer,
    );

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      // The error should be DatabaseError
      expect(either.left._tag).toBe("DatabaseError");
    }
  });
});

// =============================================================================
// Example 2: Complex Use Case with Multiple Dependencies
// =============================================================================

describe("[EXAMPLE] Complex Use Case with Multiple Dependencies", () => {
  // A more complex use case that orchestrates multiple repositories
  const assignUserToGroupUseCase = (input: {
    userId: string;
    groupId: string;
  }) =>
    Effect.gen(function* () {
      const userRepo = yield* UserRepositoryTag;
      const groupRepo = yield* GroupRepositoryTag;

      // Verify user exists
      const user = yield* userRepo.findById(input.userId);
      if (user === null) {
        return yield* Effect.fail(
          new Data.TaggedError("UserNotFoundError")<{ userId: string }>(),
        );
      }

      // Verify group exists
      const group = yield* groupRepo.findById(input.groupId);
      if (group === null) {
        return yield* Effect.fail(
          new Data.TaggedError("GroupNotFoundError")<{ groupId: string }>(),
        );
      }

      // Return success result
      return { user, group, assigned: true };
    });

  it("should assign user to group when both exist", async () => {
    const mockUser = {
      id: "user-456",
      email: "user@test.com",
      name: "Test User",
    };
    const mockGroup = {
      id: "group-789",
      name: "Test Group",
      tripId: "trip-001",
      organizerId: "user-456",
      status: "ACTIVE",
      coins: 100,
      code: "GROUP001",
    };

    // Merge multiple repository mocks
    const testLayer = mergeTestLayers(
      createUserRepositoryMock({
        users: [mockUser as unknown as import("@mirai-app/domain").User],
      }),
      createGroupRepositoryMock({
        groups: [mockGroup as unknown as import("@mirai-app/domain").Group],
      }),
    );

    const result = await runWithTestLayer(
      assignUserToGroupUseCase({ userId: "user-456", groupId: "group-789" }),
      testLayer,
    );

    expect(result.assigned).toBe(true);
    expect(result.user.id).toBe("user-456");
    expect(result.group.id).toBe("group-789");
  });
});

// =============================================================================
// Example 3: Testing with Pre-populated Repository State
// =============================================================================

describe("[EXAMPLE] Testing with Pre-populated State", () => {
  // Service port for a notification system
  interface NotificationService {
    readonly sendNotification: (
      userId: string,
      message: string,
    ) => Effect.Effect<{ sent: boolean; notificationId: string }, never, never>;
  }

  class NotificationServiceTag extends Context.Tag("NotificationService")<
    NotificationServiceTag,
    NotificationService
  >() {}

  // Use case that interacts with users and sends notifications
  const notifyUserUseCase = (userId: string, message: string) =>
    Effect.gen(function* () {
      const userRepo = yield* UserRepositoryTag;
      const notificationService = yield* NotificationServiceTag;

      const user = yield* userRepo.findById(userId);
      if (user === null) {
        return yield* Effect.fail(
          new Data.TaggedError("UserNotFoundError")<{ userId: string }>(),
        );
      }

      // Send notification
      const result = yield* notificationService.sendNotification(
        userId,
        message,
      );
      return { user, notification: result };
    });

  it("should notify user when user exists", async () => {
    const mockUser = {
      id: "user-001",
      email: "active@example.com",
    };

    const userLayer = createUserRepositoryMock({
      users: [mockUser as unknown as import("@mirai-app/domain").User],
    });

    const notificationLayer = Layer.succeed(NotificationServiceTag, {
      sendNotification: (_userId: string, _message: string) =>
        Effect.succeed({ sent: true, notificationId: "notif-123" }),
    });

    const combinedLayer = mergeTestLayers(userLayer, notificationLayer);

    const result = await runWithTestLayer(
      notifyUserUseCase("user-001", "Hello!"),
      combinedLayer,
    );

    expect(result.notification.sent).toBe(true);
    expect(result.notification.notificationId).toBe("notif-123");
  });
});

// =============================================================================
// Example 4: Repository State Changes During Test
// =============================================================================

describe("[EXAMPLE] State Changes During Test", () => {
  // A use case that creates a user and then retrieves it
  const createAndRetrieveUserUseCase = (userData: {
    id: string;
    email: string;
  }) =>
    Effect.gen(function* () {
      const repo = yield* UserRepositoryTag;

      // Create user (this should add to repository state)
      const mockUser = {
        id: userData.id,
        email: userData.email,
        name: "New User",
      };

      yield* repo.create(
        mockUser as unknown as import("@mirai-app/domain").User,
      );

      // Retrieve the created user
      const retrieved = yield* repo.findById(userData.id);
      return retrieved;
    });

  it("should persist and retrieve created user", async () => {
    // Start with empty repository
    const testLayer = createUserRepositoryMock();

    const result = await runWithTestLayer(
      createAndRetrieveUserUseCase({ id: "user-new", email: "new@test.com" }),
      testLayer,
    );

    expect(result).not.toBeNull();
    expect(result?.id).toBe("user-new");
  });
});

// =============================================================================
// Example 5: Error Scenarios and Edge Cases
// =============================================================================

describe("[EXAMPLE] Error Scenarios", () => {
  class ValidationError extends Data.TaggedError("ValidationError")<{
    field: string;
    message: string;
  }> {}

  class GroupNotFoundError extends Data.TaggedError("GroupNotFoundError")<{
    groupId: string;
  }> {}

  // A use case with validation and multiple error paths
  const validateAndCreateChallengeUseCase = (input: {
    title: string;
    groupId: string;
  }) =>
    Effect.gen(function* () {
      // Validation
      if (input.title.length < 3) {
        return yield* Effect.fail(
          new ValidationError({
            field: "title",
            message: "Title must be at least 3 characters",
          }),
        );
      }

      const groupRepo = yield* GroupRepositoryTag;
      const challengeRepo = yield* ChallengeRepositoryTag;

      // Verify group exists
      const group = yield* groupRepo.findById(input.groupId);
      if (group === null) {
        return yield* Effect.fail(
          new GroupNotFoundError({ groupId: input.groupId }),
        );
      }

      // Create challenge
      const mockChallenge = {
        id: "challenge-new",
        title: input.title,
        groupId: input.groupId,
      };

      yield* challengeRepo.create(
        mockChallenge as unknown as import("@mirai-app/domain").Challenge,
      );

      return mockChallenge;
    });

  it("should fail with ValidationError for short title", async () => {
    const testLayer = mergeTestLayers(
      createGroupRepositoryMock(),
      createChallengeRepositoryMock(),
    );

    const either = await runWithTestLayerEither(
      validateAndCreateChallengeUseCase({
        title: "Hi", // Too short
        groupId: "group-123",
      }),
      testLayer,
    );

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left._tag).toBe("ValidationError");
    }
  });

  it("should fail with GroupNotFoundError for non-existent group", async () => {
    const testLayer = mergeTestLayers(
      createGroupRepositoryMock(), // Empty - no groups
      createChallengeRepositoryMock(),
    );

    const either = await runWithTestLayerEither(
      validateAndCreateChallengeUseCase({
        title: "Valid Title",
        groupId: "nonexistent-group",
      }),
      testLayer,
    );

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      // The error should be GroupNotFoundError since the group doesn't exist
      expect(either.left._tag).toBe("GroupNotFoundError");
    }
  });

  it("should succeed with valid input", async () => {
    const mockGroup = {
      id: "group-valid",
      name: "Valid Group",
      status: "ACTIVE",
    };

    const testLayer = mergeTestLayers(
      createGroupRepositoryMock({
        groups: [mockGroup as unknown as import("@mirai-app/domain").Group],
      }),
      createChallengeRepositoryMock(),
    );

    const result = await runWithTestLayer(
      validateAndCreateChallengeUseCase({
        title: "Valid Challenge Title",
        groupId: "group-valid",
      }),
      testLayer,
    );

    expect(result.title).toBe("Valid Challenge Title");
    expect(result.groupId).toBe("group-valid");
  });
});
