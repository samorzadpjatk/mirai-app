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

  const runUseCase = async (input: DeleteUserInput) => {
    const program = deleteUserUseCase(input).pipe(
      Effect.provideService(UserRepositoryTag, {
        create: (user: User) => repo.create(user),
        findById: (id: string) => repo.findById(id),
        findByAuthUserId: (authUserId: string) =>
          repo.findByAuthUserId(authUserId),
        findByRole: (role: UserRole) => repo.findByRole(role),
        findAll: (options?: { limit?: number; offset?: number }) =>
          repo.findAll(options),
        update: (user: User) => repo.update(user),
        delete: (id: string) => repo.delete(id),
        existsByAuthUserId: (authUserId: string) =>
          repo.existsByAuthUserId(authUserId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should delete user when found", async () => {
      const existingUser = createValidUser({ id: "user-to-delete" });
      await Effect.runPromise(repo.create(existingUser));

      const input: DeleteUserInput = {
        userId: "user-to-delete",
      };

      const beforeDelete = await Effect.runPromise(
        repo.findById("user-to-delete"),
      );
      expect(beforeDelete).not.toBeNull();

      const result = await runUseCase(input);

      expect(result.success).toBe(true);
      expect(result.deletedUserId).toBe("user-to-delete");

      const afterDelete = await Effect.runPromise(
        repo.findById("user-to-delete"),
      );
      expect(afterDelete).toBeNull();
    });

    it("should fail when user not found", async () => {
      const input: DeleteUserInput = {
        userId: "non-existent-id",
      };

      const program = deleteUserUseCase(input).pipe(
        Effect.provideService(UserRepositoryTag, {
          create: (user: User) => repo.create(user),
          findById: (id: string) => repo.findById(id),
          findByAuthUserId: (authUserId: string) =>
            repo.findByAuthUserId(authUserId),
          findByRole: (role: UserRole) => repo.findByRole(role),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          update: (user: User) => repo.update(user),
          delete: (id: string) => repo.delete(id),
          existsByAuthUserId: (authUserId: string) =>
            repo.existsByAuthUserId(authUserId),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DeleteUserNotFoundError);
      }
    });

    it("should not affect other users when deleting one", async () => {
      const user1 = createValidUser({ id: "user-1", authUserId: "auth-1" });
      const user2 = createValidUser({ id: "user-2", authUserId: "auth-2" });
      const user3 = createValidUser({ id: "user-3", authUserId: "auth-3" });

      await Effect.runPromise(repo.create(user1));
      await Effect.runPromise(repo.create(user2));
      await Effect.runPromise(repo.create(user3));

      const input: DeleteUserInput = {
        userId: "user-2",
      };

      await runUseCase(input);

      const allUsers = await Effect.runPromise(repo.findAll());
      expect(allUsers).toHaveLength(2);
      expect(allUsers.find((u) => u.id === "user-1")).not.toBeNull();
      expect(allUsers.find((u) => u.id === "user-2")).toBeUndefined();
      expect(allUsers.find((u) => u.id === "user-3")).not.toBeNull();
    });
  });
});
