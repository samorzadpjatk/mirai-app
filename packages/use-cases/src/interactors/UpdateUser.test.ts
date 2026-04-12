import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateUserUseCase,
  type UpdateUserInput,
  UserNotFoundError,
  UserUpdateError,
} from "./UpdateUser";
import { User, UserRole } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { UserRepositoryTag } from "../ports/UserRepository";
import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] updateUserUseCase (Effect)", () => {
  let repo: InMemoryUserRepository;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
  });

  // Helper to create a valid user
  const createValidUser = (
    overrides?: Partial<{
      id: string;
      firstName: string;
      lastName: string;
      hasAvatar: boolean;
    }>,
  ): User => {
    const effect = User.create({
      id: overrides?.id ?? "user-123",
      authUserId: "auth-123",
      firstName: overrides?.firstName ?? "John",
      lastName: overrides?.lastName ?? "Doe",
      role: UserRole.USER,
      hasAvatar: overrides?.hasAvatar ?? false,
    });
    try {
      return Effect.runSync(effect);
    } catch (e) {
      throw new Error(`Failed to create test user: ${e}`);
    }
  };

  // Helper to run use case with repository
  const runUseCase = async (input: UpdateUserInput) => {
    const program = updateUserUseCase(input).pipe(
      Effect.provideService(UserRepositoryTag, {
        create: (user: User) => Effect.promise(() => repo.create(user)),
        findById: (id: string) => Effect.promise(() => repo.findById(id)),
        findByAuthUserId: (authUserId: string) =>
          Effect.promise(() => repo.findByAuthUserId(authUserId)),
        findByRole: (role: UserRole) =>
          Effect.promise(() => repo.findByRole(role)),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => repo.findAll(options)),
        update: (user: User) => Effect.promise(() => repo.update(user)),
        delete: (id: string) => Effect.promise(() => repo.delete(id)),
        existsByAuthUserId: (authUserId: string) =>
          Effect.promise(() => repo.existsByAuthUserId(authUserId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should update user first and last name", async () => {
      // Arrange
      const existingUser = createValidUser({ id: "user-456" });
      await repo.create(existingUser);

      const input: UpdateUserInput = {
        userId: "user-456",
        firstName: "Jane",
        lastName: "Smith",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.firstName).toBe("Jane");
      expect(result.lastName).toBe("Smith");
      expect(result.fullName).toBe("Jane Smith");
    });

    it("should update only first name when lastName not provided", async () => {
      // Arrange
      const existingUser = createValidUser({
        id: "user-789",
        lastName: "Original",
      });
      await repo.create(existingUser);

      const input: UpdateUserInput = {
        userId: "user-789",
        firstName: "NewFirst",
        // lastName not provided
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.firstName).toBe("NewFirst");
      expect(result.lastName).toBe("Original");
    });

    it("should update only last name when firstName not provided", async () => {
      // Arrange
      const existingUser = createValidUser({
        id: "user-abc",
        firstName: "Original",
      });
      await repo.create(existingUser);

      const input: UpdateUserInput = {
        userId: "user-abc",
        lastName: "NewLast",
        // firstName not provided
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.firstName).toBe("Original");
      expect(result.lastName).toBe("NewLast");
    });

    it("should update hasAvatar status", async () => {
      // Arrange
      const existingUser = createValidUser({
        id: "user-avatar",
        hasAvatar: false,
      });
      await repo.create(existingUser);

      const input: UpdateUserInput = {
        userId: "user-avatar",
        hasAvatar: true,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.hasAvatar).toBe(true);
    });

    it("should fail when user not found", async () => {
      // Arrange
      const input: UpdateUserInput = {
        userId: "non-existent",
        firstName: "NewName",
      };

      // Act
      const program = updateUserUseCase(input).pipe(
        Effect.provideService(UserRepositoryTag, {
          create: (user: User) => Effect.promise(() => repo.create(user)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByAuthUserId: (authUserId: string) =>
            Effect.promise(() => repo.findByAuthUserId(authUserId)),
          findByRole: (role: UserRole) =>
            Effect.promise(() => repo.findByRole(role)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (user: User) => Effect.promise(() => repo.update(user)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          existsByAuthUserId: (authUserId: string) =>
            Effect.promise(() => repo.existsByAuthUserId(authUserId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserNotFoundError);
      }
    });

    it("should fail when name validation fails", async () => {
      // Arrange
      const existingUser = createValidUser({ id: "user-invalid" });
      await repo.create(existingUser);

      const input: UpdateUserInput = {
        userId: "user-invalid",
        firstName: "A", // Too short
        lastName: "Doe",
      };

      // Act
      const program = updateUserUseCase(input).pipe(
        Effect.provideService(UserRepositoryTag, {
          create: (user: User) => Effect.promise(() => repo.create(user)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByAuthUserId: (authUserId: string) =>
            Effect.promise(() => repo.findByAuthUserId(authUserId)),
          findByRole: (role: UserRole) =>
            Effect.promise(() => repo.findByRole(role)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (user: User) => Effect.promise(() => repo.update(user)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          existsByAuthUserId: (authUserId: string) =>
            Effect.promise(() => repo.existsByAuthUserId(authUserId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserUpdateError);
      }
    });

    it("should fail when name contains digits", async () => {
      // Arrange
      const existingUser = createValidUser({ id: "user-digits" });
      await repo.create(existingUser);

      const input: UpdateUserInput = {
        userId: "user-digits",
        firstName: "John123",
        lastName: "Doe",
      };

      // Act
      const program = updateUserUseCase(input).pipe(
        Effect.provideService(UserRepositoryTag, {
          create: (user: User) => Effect.promise(() => repo.create(user)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByAuthUserId: (authUserId: string) =>
            Effect.promise(() => repo.findByAuthUserId(authUserId)),
          findByRole: (role: UserRole) =>
            Effect.promise(() => repo.findByRole(role)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (user: User) => Effect.promise(() => repo.update(user)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          existsByAuthUserId: (authUserId: string) =>
            Effect.promise(() => repo.existsByAuthUserId(authUserId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UserUpdateError);
      }
    });

    it("should update multiple fields at once", async () => {
      // Arrange
      const existingUser = createValidUser({
        id: "user-multi",
        firstName: "Old",
        lastName: "Name",
        hasAvatar: false,
      });
      await repo.create(existingUser);

      const input: UpdateUserInput = {
        userId: "user-multi",
        firstName: "New",
        lastName: "Person",
        hasAvatar: true,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.firstName).toBe("New");
      expect(result.lastName).toBe("Person");
      expect(result.fullName).toBe("New Person");
      expect(result.hasAvatar).toBe(true);
    });
  });
});
