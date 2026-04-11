import { describe, it, expect, mock } from "bun:test";
import { GetUserUseCase } from "./GetUser";
import type { GetUserInput } from "./GetUser";
import { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "../ports/UserRepository";

describe("[UNIT] GetUserUseCase", () => {
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
      const result = await useCase.execute(input);

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
      const result = await useCase.execute(input);

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
      const result = await useCase.execute(input);

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
      const userResult = User.create({
        id: "user-empty",
        authUserId: "auth-empty",
        firstName: "",
        lastName: "",
        role: UserRole.USER,
      });
      if (userResult.kind === "err") {
        throw new Error(`Failed to create test user: ${userResult.error}`);
      }
      const mockUser = userResult.value;

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
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.fullName).toBe("Unknown");
      }
    });

    it("should work with different repository implementations", async () => {
      // Arrange
      const mockUser = createValidUser({ id: "user-different-repo" });
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

      // Create use case with the mock repository
      const useCase = new GetUserUseCase(mockRepo);

      const input: GetUserInput = {
        userId: "user-different-repo",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("user-different-repo");
      }
    });
  });
});
