import { describe, it, expect, beforeEach } from "bun:test";
import {
  getUserUseCase,
  GetUserUseCase,
  type GetUserInput,
  GetUserNotFoundError,
} from "./GetUser";
import { User, UserRole } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { InMemoryUserRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] GetUserUseCase (Effect.gen)", () => {
  let repo: InMemoryUserRepository;
  let useCase: GetUserUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new GetUserUseCase(repo);
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
    const program = useCase.execute(input);
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
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
    });

    it("should fail when user not found", async () => {
      const input: GetUserInput = {
        userId: "non-existent-id",
      };

      const result = await runUseCase(input);

      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBeInstanceOf(GetUserNotFoundError);
      }
    });

    it("should return user with correct output format including null lastSeenOn", async () => {
      const mockUser = createValidUser({ id: "user-789" });
      await Effect.runPromise(repo.create(mockUser));

      const input: GetUserInput = {
        userId: "user-789",
      };

      const result = await runUseCase(input);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("user-789");
        expect(result.value.lastSeenOn).toBeNull();
        expect(result.value.createdAt).toBeInstanceOf(Date);
      }
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

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.fullName).toBe("Unknown");
      }
    });
  });

  describe("[UNIT] legacy getUserUseCase function", () => {
    it("should work with legacy function API", async () => {
      const mockUser = createValidUser({
        id: "user-legacy",
        authUserId: "auth-legacy",
        firstName: "Legacy",
        lastName: "User",
      });
      await Effect.runPromise(repo.create(mockUser));

      const input: GetUserInput = {
        userId: "user-legacy",
      };

      const program = getUserUseCase(input, repo);
      const result = await Effect.runPromise(program);

      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("user-legacy");
        expect(result.value.firstName).toBe("Legacy");
      }
    });
  });
});
