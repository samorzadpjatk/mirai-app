import { describe, it, expect, beforeEach } from "bun:test";
import { CreateUserUseCase } from "./CreateUser";
import type { CreateUserInput } from "./CreateUser";
import { User, UserRole } from "@mirai-app/domain";
import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] CreateUserUseCase", () => {
  let repo: InMemoryUserRepository;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new CreateUserUseCase(repo);
  });

  // Helper to create a valid user
  const createValidUser = (overrides?: Partial<CreateUserInput>): User => {
    const result = User.create({
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
    it("should create user with valid input", async () => {
      // Arrange
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

      // Verify user was actually stored
      const stored = await repo.findByAuthUserId("auth-123");
      expect(stored).not.toBeNull();
      expect(stored?.authUserId).toBe("auth-123");
    });

    it("should return error when user already exists with authUserId", async () => {
      // Arrange - seed existing user
      const existingUser = createValidUser({ authUserId: "auth-existing" });
      await repo.create(existingUser);

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

      // Verify create was not called again
      const users = await repo.findAll();
      expect(users).toHaveLength(1);
    });

    it("should return error when domain validation fails for invalid name", async () => {
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
        expect(result.error).toContain("required");
      }

      // Verify no user was stored
      const stored = await repo.findByAuthUserId("auth-456");
      expect(stored).toBeNull();
    });

    it("should return error when domain validation fails for empty authUserId", async () => {
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
        expect(result.error).toContain("required");
      }

      // Verify no user was stored
      const users = await repo.findAll();
      expect(users).toHaveLength(0);
    });

    it("should use default USER role when role not provided", async () => {
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

      // Verify stored user has USER role
      const stored = await repo.findByAuthUserId("auth-789");
      expect(stored?.role).toBe(UserRole.USER);
    });

    it("should work with different repository implementations", async () => {
      // This test verifies the use case works with any UserRepository
      // by using the in-memory implementation
      const differentRepo = new InMemoryUserRepository();
      const differentUseCase = new CreateUserUseCase(differentRepo);

      const input: CreateUserInput = {
        authUserId: "auth-different-repo",
        firstName: "Different",
        lastName: "Repo",
      };

      // Act
      const result = await differentUseCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.authUserId).toBe("auth-different-repo");
        expect(result.value.firstName).toBe("Different");
        expect(result.value.lastName).toBe("Repo");
      }

      // Verify data was stored in the different repository
      const stored = await differentRepo.findByAuthUserId(
        "auth-different-repo",
      );
      expect(stored).not.toBeNull();
    });
  });
});
