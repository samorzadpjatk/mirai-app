import { describe, it, expect, beforeEach } from "bun:test";
import {
  createUserUseCase,
  type CreateUserInput,
  UserCreationError,
  UserAlreadyExistsError,
} from "./CreateUser";
import { User, UserRole } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { UserRepositoryTag } from "../ports/UserRepository";
import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] createUserUseCase (Effect)", () => {
  let repo: InMemoryUserRepository;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
  });

  // Helper to create a valid user
  const createValidUser = (overrides?: Partial<CreateUserInput>): User => {
    const effect = User.create({
      authUserId: overrides?.authUserId ?? "auth-123",
      firstName: overrides?.firstName ?? "John",
      lastName: overrides?.lastName ?? "Doe",
      role: UserRole.USER,
    });
    try {
      return Effect.runSync(effect);
    } catch (e) {
      throw new Error(`Failed to create test user: ${e}`);
    }
  };

  // Helper to run use case with repository
  const runUseCase = async (input: CreateUserInput) => {
    const program = createUserUseCase(input).pipe(
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
    it("should create user with valid input", async () => {
      // Arrange
      const input: CreateUserInput = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.authUserId).toBe("auth-123");
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
      expect(result.role).toBe("USER");
      expect(result.fullName).toBe("John Doe");

      // Verify user was actually stored
      const stored = await repo.findByAuthUserId("auth-123");
      expect(stored).not.toBeNull();
      expect(stored?.authUserId).toBe("auth-123");
    });

    it("should use default USER role when role not provided", async () => {
      const input: CreateUserInput = {
        authUserId: "auth-789",
        firstName: "Bob",
        lastName: "Wilson",
        // role not provided
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.role).toBe("USER");

      // Verify stored user has USER role
      const stored = await repo.findByAuthUserId("auth-789");
      expect(stored?.role).toBe(UserRole.USER);
    });

    it("should fail when user already exists with authUserId", async () => {
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
      const program = createUserUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
        expect(either.left.message).toContain("already exists");
      }

      // Verify create was not called again
      const users = await repo.findAll();
      expect(users).toHaveLength(1);
    });

    it("should fail when domain validation fails for invalid name", async () => {
      const input: CreateUserInput = {
        authUserId: "auth-456",
        firstName: "A", // Too short (less than 2 chars when trimmed)
        lastName: "Doe",
        role: UserRole.USER,
      };

      // Act
      const program = createUserUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(UserCreationError);
      }

      // Verify no user was stored
      const stored = await repo.findByAuthUserId("auth-456");
      expect(stored).toBeNull();
    });

    it("should fail when domain validation fails for empty authUserId", async () => {
      const input: CreateUserInput = {
        authUserId: "", // Empty
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      };

      // Act
      const program = createUserUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(UserCreationError);
      }

      // Verify no user was stored
      const users = await repo.findAll();
      expect(users).toHaveLength(0);
    });
  });
});
