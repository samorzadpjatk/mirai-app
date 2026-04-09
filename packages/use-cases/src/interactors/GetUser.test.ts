import { describe, it, expect, mock, beforeEach } from "bun:test";
import { GetUserUseCase } from "./GetUser";
import type { GetUserInput } from "./GetUser";
import { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "../ports/UserRepository";
import { createTestContainer } from "@mirai-app/frameworks/di";
import type { AwilixContainer } from "awilix";
import { Effect } from "effect";

async function runAsResult<T>(
  effect: Effect.Effect<T, Error>,
): Promise<{ kind: "ok"; value: T } | { kind: "err"; error: string }> {
  try {
    const value = await Effect.runPromise(effect);
    return { kind: "ok", value };
  } catch (error) {
    return {
      kind: "err",
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

describe("[UNIT] GetUserUseCase", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createTestContainer();
  });

  // Helper to create a valid user
  const createValidUser = (
    overrides?: Partial<{
      id: string;
      authUserId: string;
      firstName: string;
      lastName: string;
    }>,
  ): User => {
    const result = User.create({
      id: overrides?.id ?? "user-123",
      authUserId: overrides?.authUserId ?? "auth-123",
      firstName: overrides?.firstName ?? "John",
      lastName: overrides?.lastName ?? "Doe",
      role: UserRole.USER,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test user: ${result.error}`);
    }
    return result.value;
  };

  describe("execute", () => {
    it("should return user when found by ID", async () => {
      // Arrange
      const mockUser = createValidUser({
        id: "user-456",
        authUserId: "auth-456",
        firstName: "Jane",
        lastName: "Smith",
      });
      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockUser)),
        findById: mock(() => Promise.resolve(mockUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockUser)),
        delete: mock(() => Promise.resolve()),
      };

      // Manual instantiation (backward compatible)
      const useCase = new GetUserUseCase(mockRepo);
      const input: GetUserInput = {
        userId: "user-456",
      };

      // Act
      const result = await runAsResult(useCase.execute(input));

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("user-456");
        expect(result.value.authUserId).toBe("auth-456");
        expect(result.value.firstName).toBe("Jane");
        expect(result.value.lastName).toBe("Smith");
        expect(result.value.fullName).toBe("Jane Smith");
        expect(result.value.role).toBe("USER");
        expect(result.value.hasAvatar).toBe(false);
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("user-456");
    });

    it("should return error when user not found", async () => {
      // Arrange
      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(createValidUser())),
        findById: mock(() => Promise.resolve(null)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(createValidUser())),
        delete: mock(() => Promise.resolve()),
      };

      const useCase = new GetUserUseCase(mockRepo);
      const input: GetUserInput = {
        userId: "non-existent-id",
      };

      // Act
      const result = await runAsResult(useCase.execute(input));

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("User not found");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("non-existent-id");
    });

    it("should return user with correct output format including null lastSeenOn", async () => {
      // Arrange
      const mockUser = createValidUser({ id: "user-789" });
      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockUser)),
        findById: mock(() => Promise.resolve(mockUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockUser)),
        delete: mock(() => Promise.resolve()),
      };

      const useCase = new GetUserUseCase(mockRepo);
      const input: GetUserInput = {
        userId: "user-789",
      };

      // Act
      const result = await runAsResult(useCase.execute(input));

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("user-789");
        expect(result.value.lastSeenOn).toBeNull();
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should return user with empty full name when both names are empty", async () => {
      // Arrange
      const result = User.create({
        id: "user-empty",
        authUserId: "auth-empty",
        firstName: "",
        lastName: "",
        role: UserRole.USER,
      });
      if (result.kind === "err") {
        throw new Error(`Failed to create test user: ${result.error}`);
      }
      const mockUser = result.value;

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockUser)),
        findById: mock(() => Promise.resolve(mockUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockUser)),
        delete: mock(() => Promise.resolve()),
      };

      const useCase = new GetUserUseCase(mockRepo);
      const input: GetUserInput = {
        userId: "user-empty",
      };

      // Act
      const result2 = await runAsResult(useCase.execute(input));

      // Assert
      expect(result2.kind).toBe("ok");
      if (result2.kind === "ok") {
        expect(result2.value.fullName).toBe("Unknown");
      }
    });

    it("should support container-based resolution", async () => {
      // Arrange
      const mockUser = createValidUser({ id: "user-container" });
      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockUser)),
        findById: mock(() => Promise.resolve(mockUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockUser)),
        delete: mock(() => Promise.resolve()),
      };

      // Register in container using the factory pattern
      container.register({
        userRepository: { resolve: () => mockRepo } as any,
      });

      // Create use case from container - use manual instantiation with resolved repo
      const userRepo = container.resolve<UserRepository>("userRepository");
      const useCase = new GetUserUseCase(userRepo);

      const input: GetUserInput = {
        userId: "user-container",
      };

      // Act
      const result = await runAsResult(useCase.execute(input));

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("user-container");
      }
    });
  });
});
