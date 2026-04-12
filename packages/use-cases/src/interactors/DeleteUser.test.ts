import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteUserUseCase,
  type DeleteUserInput,
  DeleteUserNotFoundError,
} from "./DeleteUser";
import { User, UserRole } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { UserRepositoryTag } from "../ports/UserRepository";
import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] deleteUserUseCase (Effect)", () => {
  let repo: InMemoryUserRepository;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
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
    const effect = User.create({
      id: overrides?.id ?? "user-123",
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
  const runUseCase = async (input: DeleteUserInput) => {
    const program = deleteUserUseCase(input).pipe(
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
    it("should delete user when found", async () => {
      // Arrange
      const existingUser = createValidUser({ id: "user-to-delete" });
      await repo.create(existingUser);

      const input: DeleteUserInput = {
        userId: "user-to-delete",
      };

      // Verify user exists before deletion
      const beforeDelete = await repo.findById("user-to-delete");
      expect(beforeDelete).not.toBeNull();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedUserId).toBe("user-to-delete");

      // Verify user was actually deleted
      const afterDelete = await repo.findById("user-to-delete");
      expect(afterDelete).toBeNull();
    });

    it("should fail when user not found", async () => {
      // Arrange
      const input: DeleteUserInput = {
        userId: "non-existent-id",
      };

      // Act
      const program = deleteUserUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(DeleteUserNotFoundError);
      }
    });

    it("should not affect other users when deleting one", async () => {
      // Arrange
      const user1 = createValidUser({ id: "user-1", authUserId: "auth-1" });
      const user2 = createValidUser({ id: "user-2", authUserId: "auth-2" });
      const user3 = createValidUser({ id: "user-3", authUserId: "auth-3" });

      await repo.create(user1);
      await repo.create(user2);
      await repo.create(user3);

      const input: DeleteUserInput = {
        userId: "user-2",
      };

      // Act
      await runUseCase(input);

      // Assert
      const allUsers = await repo.findAll();
      expect(allUsers).toHaveLength(2);
      expect(allUsers.find((u) => u.id === "user-1")).not.toBeNull();
      expect(allUsers.find((u) => u.id === "user-2")).toBeUndefined();
      expect(allUsers.find((u) => u.id === "user-3")).not.toBeNull();
    });
  });
});
