import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createUserUseCase,
  type CreateUserInput,
  UserAlreadyExistsError,
  UserCreationError,
} from "./create";
import { UserGatewayTag, type UserGateway } from "../ports/gateway";
import type { UserDTO } from "../dto";
import { UserRole, DatabaseError } from "@mirai-app/domain";

/**
 * Mock UserGateway for testing
 */
function createMockUserGateway(
  options: {
    existingAuthIds?: string[];
    shouldFailCreate?: boolean;
  } = {},
): UserGateway {
  const users = new Map<string, UserDTO>();

  return {
    create: (user: UserDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
      users.set(user.id, user);
      return Effect.succeed(user);
    },

    findById: () => Effect.succeed(null),

    findByAuthUserId: (authUserId: string) => {
      const user = Array.from(users.values()).find(
        (u) => u.authUserId === authUserId,
      );
      return Effect.succeed(user ?? null);
    },

    findAllConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    findByRoleConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      }),

    update: (user: UserDTO) => Effect.succeed(user),

    delete: () => Effect.succeed(void 0),

    existsByAuthUserId: (authUserId: string) => {
      const exists =
        options.existingAuthIds?.includes(authUserId) ??
        Array.from(users.values()).some((u) => u.authUserId === authUserId);
      return Effect.succeed(exists);
    },
  };
}

describe("[UNIT] createUserUseCase", () => {
  let mockLayer: Layer.Layer<UserGatewayTag>;

  beforeEach(() => {
    const mockGateway = createMockUserGateway();
    mockLayer = Layer.succeed(UserGatewayTag, mockGateway);
  });

  it("should create a user successfully", async () => {
    const input: CreateUserInput = {
      authUserId: "auth-123",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.USER,
    };

    const program = createUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.authUserId).toBe("auth-123");
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
    expect(result.fullName).toBe("John Doe");
    expect(result.role).toBe("USER");
    expect(result.hasAvatar).toBe(false);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.id).toBeDefined();
  });

  it("should fail with UserAlreadyExistsError when user exists", async () => {
    const mockGateway = createMockUserGateway({
      existingAuthIds: ["existing-auth"],
    });
    mockLayer = Layer.succeed(UserGatewayTag, mockGateway);

    const input: CreateUserInput = {
      authUserId: "existing-auth",
      firstName: "Jane",
      lastName: "Doe",
    };

    const program = createUserUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UserAlreadyExistsError);
      expect(either.left.message).toBe("User with this auth ID already exists");
    }
  });

  it("should use default role when not provided", async () => {
    const input: CreateUserInput = {
      authUserId: "auth-456",
      firstName: "Jane",
      lastName: "Smith",
    };

    const program = createUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.role).toBe("USER");
  });

  it("should fail with UserCreationError when validation fails", async () => {
    const input: CreateUserInput = {
      authUserId: "auth-789",
      firstName: "",
      lastName: "Invalid",
    };

    const program = createUserUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UserCreationError);
    }
  });

  it("should handle database errors during save", async () => {
    const failingGateway = createMockUserGateway({ shouldFailCreate: true });
    const failingLayer = Layer.succeed(UserGatewayTag, failingGateway);

    const input: CreateUserInput = {
      authUserId: "auth-999",
      firstName: "Test",
      lastName: "User",
    };

    const program = createUserUseCase(input).pipe(Effect.provide(failingLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });
});
