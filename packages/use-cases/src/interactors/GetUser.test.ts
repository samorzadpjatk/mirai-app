import { describe, it, expect, beforeEach } from "bun:test";
import {
  getUserUseCase,
  type GetUserInput,
  GetUserNotFoundError,
} from "./GetUser";
import { User, UserRole } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { UserRepositoryTag } from "../ports/UserRepository";
import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] getUserUseCase (Effect)", () => {
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

  const runUseCase = async (input: GetUserInput) => {
    const program = getUserUseCase(input).pipe(
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

  describe("execute", () => {
    it("should return user when found by ID", async () => {
      const mockUser = createValidUser({
        id: "user-456",
        authUserId: "auth-456",
        firstName: "Jane",
        lastName: "Smith",
      });
      await Effect.runPromise(repo.create(mockUser));

      const input: GetUserInput = {
        userId: "user-456",
      };

      const result = await runUseCase(input);

      expect(result.id).toBe("user-456");
      expect(result.authUserId).toBe("auth-456");
      expect(result.firstName).toBe("Jane");
      expect(result.lastName).toBe("Smith");
      expect(result.fullName).toBe("Jane Smith");
      expect(result.role).toBe("USER");
      expect(result.hasAvatar).toBe(false);
    });

    it("should fail when user not found", async () => {
      const input: GetUserInput = {
        userId: "non-existent-id",
      };

      const program = getUserUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(GetUserNotFoundError);
      }
    });

    it("should return user with correct output format including null lastSeenOn", async () => {
      const mockUser = createValidUser({ id: "user-789" });
      await Effect.runPromise(repo.create(mockUser));

      const input: GetUserInput = {
        userId: "user-789",
      };

      const result = await runUseCase(input);

      expect(result.id).toBe("user-789");
      expect(result.lastSeenOn).toBeNull();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("should return user with empty full name when both names are empty", async () => {
      const userEffect = User.create({
        id: "user-empty",
        authUserId: "auth-empty",
        firstName: "",
        lastName: "",
        role: UserRole.USER,
      });
      const mockUser = Effect.runSync(userEffect);
      await Effect.runPromise(repo.create(mockUser));

      const input: GetUserInput = {
        userId: "user-empty",
      };

      const result = await runUseCase(input);

      expect(result.fullName).toBe("Unknown");
    });
  });
});
