import { describe, it, expect, beforeEach } from "bun:test";
import {
  createUserUseCase,
  type CreateUserInput,
  UserCreationError,
  UserAlreadyExistsError,
} from "./create";
import { User, UserRole } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { UserGatewayTag } from "../ports/gateway";
import { InMemoryUserGateway } from "@mirai-app/adapters";

describe("[UNIT] createUserUseCase (Effect)", () => {
  let repo: InMemoryUserGateway;

  beforeEach(() => {
    repo = new InMemoryUserGateway();
  });

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

  const runUseCase = async (input: CreateUserInput) => {
    const program = createUserUseCase(input).pipe(
      Effect.provideService(UserGatewayTag, {
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
    it("should create user with valid input", async () => {
      const input: CreateUserInput = {
        authUserId: "auth-123",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      };

      const result = await runUseCase(input);

      expect(result.authUserId).toBe("auth-123");
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
      expect(result.role).toBe("USER");
      expect(result.fullName).toBe("John Doe");

      const stored = await Effect.runPromise(repo.findByAuthUserId("auth-123"));
      expect(stored).not.toBeNull();
      expect(stored?.authUserId).toBe("auth-123");
    });

    it("should use default USER role when role not provided", async () => {
      const input: CreateUserInput = {
        authUserId: "auth-789",
        firstName: "Bob",
        lastName: "Wilson",
      };

      const result = await runUseCase(input);

      expect(result.role).toBe("USER");

      const stored = await Effect.runPromise(repo.findByAuthUserId("auth-789"));
      expect(stored?.role).toBe(UserRole.USER);
    });

    it("should fail when user already exists with authUserId", async () => {
      const existingUser = createValidUser({ authUserId: "auth-existing" });
      await Effect.runPromise(repo.create(existingUser));

      const input: CreateUserInput = {
        authUserId: "auth-existing",
        firstName: "Jane",
        lastName: "Smith",
        role: UserRole.USER,
      };

      const program = createUserUseCase(input).pipe(
        Effect.provideService(UserGatewayTag, {
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
        expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
        expect(either.left.message).toContain("already exists");
      }

      const users = await Effect.runPromise(repo.findAll());
      expect(users).toHaveLength(1);
    });

    it("should fail when domain validation fails for invalid name", async () => {
      const input: CreateUserInput = {
        authUserId: "auth-456",
        firstName: "A",
        lastName: "Doe",
        role: UserRole.USER,
      };

      const program = createUserUseCase(input).pipe(
        Effect.provideService(UserGatewayTag, {
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
        expect(either.left).toBeInstanceOf(UserCreationError);
      }

      const stored = await Effect.runPromise(repo.findByAuthUserId("auth-456"));
      expect(stored).toBeNull();
    });

    it("should fail when domain validation fails for empty authUserId", async () => {
      const input: CreateUserInput = {
        authUserId: "",
        firstName: "John",
        lastName: "Doe",
        role: UserRole.USER,
      };

      const program = createUserUseCase(input).pipe(
        Effect.provideService(UserGatewayTag, {
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
        expect(either.left).toBeInstanceOf(UserCreationError);
      }

      const users = await Effect.runPromise(repo.findAll());
      expect(users).toHaveLength(0);
    });
  });
});
