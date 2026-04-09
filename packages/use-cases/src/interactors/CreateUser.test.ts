import { describe, it, expect, mock, beforeEach } from "bun:test";
import { CreateUserUseCase } from "./CreateUser";
import type { CreateUserInput } from "./CreateUser";
import { User, UserRole, ok, err } from "@repo/domain";
import type { Result } from "@repo/domain";
import type { UserRepository } from "../ports/UserRepository";
import { createTestContainer, TYPES } from "@repo/frameworks/di";
import type { Container } from "inversify";

describe("[UNIT] CreateUserUseCase", () => {
  let container: Container;

  beforeEach(() => {
    container = createTestContainer();
  });

  // Helper to create a valid user
  const createValidUser = (): User => {
    const result = User.create({
      authUserId: "auth-123",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.USER,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test user: ${result.error}`);
    }
    return result.value;
  };

  describe("execute", () => {
    it("should create user with valid input", async () => {
      // Arrange
      const mockUser = createValidUser();
      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockUser)),
        findById: mock(() => Promise.resolve(null)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockUser)),
        delete: mock(() => Promise.resolve()),
      };

      container.bind(TYPES.UserRepository).toConstantValue(mockRepo);

      const userRepo = container.get<UserRepository>(TYPES.UserRepository);
      const useCase = new CreateUserUseCase(userRepo);
      const input: CreateUserInput = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.authUserId).toBe("auth-123");
        expect(result.value.firstName).toBe("John");
        expect(result.value.lastName).toBe("Doe");
        expect(result.value.role).toBe("USER");
        expect(result.value.fullName).toBe("John Doe");
      }
      expect(mockRepo.existsByAuthUserId).toHaveBeenCalledWith("auth-123");
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should return error when user already exists with authUserId", async () => {
      // Arrange
      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(true)),
        create: mock(() => Promise.resolve(createValidUser())),
        findById: mock(() => Promise.resolve(null)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(createValidUser())),
        delete: mock(() => Promise.resolve()),
      };

      container.bind(TYPES.UserRepository).toConstantValue(mockRepo);

      const userRepo = container.get<UserRepository>(TYPES.UserRepository);
      const useCase = new CreateUserUseCase(userRepo);
      const input: CreateUserInput = {
        authUserId: "auth-existing",
        firstName: "Jane",
        lastName: "Smith",
        role: UserRole.USER,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("already exists");
      }
      expect(mockRepo.existsByAuthUserId).toHaveBeenCalledWith("auth-existing");
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should return error when domain validation fails for invalid name", async () => {
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

      container.bind(TYPES.UserRepository).toConstantValue(mockRepo);

      const userRepo = container.get<UserRepository>(TYPES.UserRepository);
      const useCase = new CreateUserUseCase(userRepo);
      const input: CreateUserInput = {
        authUserId: "auth-456",
        firstName: "A", // Too short (less than 2 chars when trimmed)
        lastName: "Doe",
        role: UserRole.USER,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("firstName");
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should return error when domain validation fails for empty authUserId", async () => {
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

      container.bind(TYPES.UserRepository).toConstantValue(mockRepo);

      const userRepo = container.get<UserRepository>(TYPES.UserRepository);
      const useCase = new CreateUserUseCase(userRepo);
      const input: CreateUserInput = {
        authUserId: "", // Empty
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("authUserId");
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should use default USER role when role not provided", async () => {
      // Arrange
      const mockUser = createValidUser();
      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockUser)),
        findById: mock(() => Promise.resolve(null)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockUser)),
        delete: mock(() => Promise.resolve()),
      };

      container.bind(TYPES.UserRepository).toConstantValue(mockRepo);

      const userRepo = container.get<UserRepository>(TYPES.UserRepository);
      const useCase = new CreateUserUseCase(userRepo);
      const input: CreateUserInput = {
        authUserId: "auth-789",
        firstName: "Bob",
        lastName: "Wilson",
        // role not provided
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.role).toBe("USER");
      }
    });
  });
});
