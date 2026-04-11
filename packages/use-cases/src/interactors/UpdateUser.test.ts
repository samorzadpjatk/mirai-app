import { describe, it, expect, mock } from "bun:test";
import { UpdateUserUseCase } from "./UpdateUser";
import type { UpdateUserInput } from "./UpdateUser";
import { User, UserRole } from "@mirai-app/domain";
import type { UserRepository } from "../ports/UserRepository";

describe("[UNIT] UpdateUserUseCase", () => {
  // Helper to create a valid user
  const createValidUser = (
    overrides?: Partial<{
      id: string;
      firstName: string;
      lastName: string;
      hasAvatar: boolean;
    }>,
  ): User => {
    const result = User.create({
      id: overrides?.id ?? "user-123",
      authUserId: "auth-123",
      firstName: overrides?.firstName ?? "John",
      lastName: overrides?.lastName ?? "Doe",
      role: UserRole.USER,
      hasAvatar: overrides?.hasAvatar ?? false,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test user: ${result.error}`);
    }
    return result.value;
  };

  describe("execute", () => {
    it("should update user first and last name", async () => {
      // Arrange
      const existingUser = createValidUser({ id: "user-456" });
      const updatedUser = existingUser.updateName({
        firstName: "Jane",
        lastName: "Smith",
      });
      if (updatedUser.kind === "err") {
        throw new Error(`Failed to update user: ${updatedUser.error}`);
      }

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(existingUser)),
        findById: mock(() => Promise.resolve(existingUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedUser.value)),
        delete: mock(() => Promise.resolve()),
      };

      const useCase = new UpdateUserUseCase(mockRepo);
      const input: UpdateUserInput = {
        userId: "user-456",
        firstName: "Jane",
        lastName: "Smith",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.firstName).toBe("Jane");
        expect(result.value.lastName).toBe("Smith");
        expect(result.value.fullName).toBe("Jane Smith");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("user-456");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should update only first name when lastName not provided", async () => {
      // Arrange
      const existingUser = createValidUser({
        id: "user-789",
        lastName: "Original",
      });
      const updatedUser = existingUser.updateName({
        firstName: "NewFirst",
        lastName: "Original", // Keep original
      });
      if (updatedUser.kind === "err") {
        throw new Error(`Failed to update user: ${updatedUser.error}`);
      }

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(existingUser)),
        findById: mock(() => Promise.resolve(existingUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedUser.value)),
        delete: mock(() => Promise.resolve()),
      };

      const useCase = new UpdateUserUseCase(mockRepo);
      const input: UpdateUserInput = {
        userId: "user-789",
        firstName: "NewFirst",
        // lastName not provided
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.firstName).toBe("NewFirst");
        expect(result.value.lastName).toBe("Original");
      }
    });

    it("should update only last name when firstName not provided", async () => {
      // Arrange
      const existingUser = createValidUser({
        id: "user-abc",
        firstName: "Original",
      });
      const updatedUser = existingUser.updateName({
        firstName: "Original", // Keep original
        lastName: "NewLast",
      });
      if (updatedUser.kind === "err") {
        throw new Error(`Failed to update user: ${updatedUser.error}`);
      }

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(existingUser)),
        findById: mock(() => Promise.resolve(existingUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedUser.value)),
        delete: mock(() => Promise.resolve()),
      };

      const useCase = new UpdateUserUseCase(mockRepo);
      const input: UpdateUserInput = {
        userId: "user-abc",
        lastName: "NewLast",
        // firstName not provided
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.firstName).toBe("Original");
        expect(result.value.lastName).toBe("NewLast");
      }
    });

    it("should update hasAvatar status", async () => {
      // Arrange
      const existingUser = createValidUser({
        id: "user-avatar",
        hasAvatar: false,
      });
      const updatedUser = existingUser.setAvatar(true);

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(existingUser)),
        findById: mock(() => Promise.resolve(existingUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedUser)),
        delete: mock(() => Promise.resolve()),
      };

      const useCase = new UpdateUserUseCase(mockRepo);
      const input: UpdateUserInput = {
        userId: "user-avatar",
        hasAvatar: true,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.hasAvatar).toBe(true);
      }
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

      const useCase = new UpdateUserUseCase(mockRepo);
      const input: UpdateUserInput = {
        userId: "non-existent",
        firstName: "NewName",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("User not found");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("non-existent");
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error when name validation fails", async () => {
      // Arrange
      const existingUser = createValidUser({ id: "user-invalid" });

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(existingUser)),
        findById: mock(() => Promise.resolve(existingUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(existingUser)),
        delete: mock(() => Promise.resolve()),
      };

      const useCase = new UpdateUserUseCase(mockRepo);
      const input: UpdateUserInput = {
        userId: "user-invalid",
        firstName: "A", // Too short
        lastName: "Doe",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("firstName");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error when name contains digits", async () => {
      // Arrange
      const existingUser = createValidUser({ id: "user-digits" });

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(existingUser)),
        findById: mock(() => Promise.resolve(existingUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(existingUser)),
        delete: mock(() => Promise.resolve()),
      };

      const useCase = new UpdateUserUseCase(mockRepo);
      const input: UpdateUserInput = {
        userId: "user-digits",
        firstName: "John123",
        lastName: "Doe",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("digits");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should update multiple fields at once", async () => {
      // Arrange
      const existingUser = createValidUser({
        id: "user-multi",
        firstName: "Old",
        lastName: "Name",
        hasAvatar: false,
      });
      const nameUpdated = existingUser.updateName({
        firstName: "New",
        lastName: "Person",
      });
      if (nameUpdated.kind === "err") {
        throw new Error(`Failed to update user: ${nameUpdated.error}`);
      }
      const finalUser = nameUpdated.value.setAvatar(true);

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(existingUser)),
        findById: mock(() => Promise.resolve(existingUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(finalUser)),
        delete: mock(() => Promise.resolve()),
      };

      const useCase = new UpdateUserUseCase(mockRepo);
      const input: UpdateUserInput = {
        userId: "user-multi",
        firstName: "New",
        lastName: "Person",
        hasAvatar: true,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.firstName).toBe("New");
        expect(result.value.lastName).toBe("Person");
        expect(result.value.fullName).toBe("New Person");
        expect(result.value.hasAvatar).toBe(true);
      }
    });

    it("should work with different repository implementations", async () => {
      // Arrange
      const existingUser = createValidUser({ id: "user-different-repo" });
      const updatedUser = existingUser.updateName({
        firstName: "Updated",
        lastName: "User",
      });
      if (updatedUser.kind === "err") {
        throw new Error(`Failed to update user: ${updatedUser.error}`);
      }

      const mockRepo: UserRepository = {
        existsByAuthUserId: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(existingUser)),
        findById: mock(() => Promise.resolve(existingUser)),
        findByAuthUserId: mock(() => Promise.resolve(null)),
        findByRole: mock(() => Promise.resolve([])),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedUser.value)),
        delete: mock(() => Promise.resolve()),
      };

      // Create use case with mock repository
      const useCase = new UpdateUserUseCase(mockRepo);

      const input: UpdateUserInput = {
        userId: "user-different-repo",
        firstName: "Updated",
        lastName: "User",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.firstName).toBe("Updated");
        expect(result.value.lastName).toBe("User");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("user-different-repo");
      expect(mockRepo.update).toHaveBeenCalled();
    });
  });
});
