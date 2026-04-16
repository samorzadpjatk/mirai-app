import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  updateUserUseCase,
  type UpdateUserInput,
  UserNotFoundError,
  UserUpdateError,
} from "./update";
import { UserGatewayTag, type UserGateway } from "../ports/gateway";
import type { UserDTO } from "../dto";
import { DatabaseError, UserRole } from "@mirai-app/domain";

/**
 * Mock UserGateway for testing
 */
function createMockUserGateway(users: UserDTO[] = []): UserGateway {
  const userMap = new Map(users.map((u) => [u.id, u]));

  return {
    create: (user: UserDTO) => {
      userMap.set(user.id, user);
      return Effect.succeed(user);
    },

    findById: (id: string) => {
      const user = userMap.get(id);
      return Effect.succeed(user ?? null);
    },

    findByAuthUserId: () => Effect.succeed(null),

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

    update: (user: UserDTO) => {
      userMap.set(user.id, user);
      return Effect.succeed(user);
    },

    delete: () => Effect.succeed(void 0),

    existsByAuthUserId: () => Effect.succeed(false),
  };
}

function createMockUserDTO(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: overrides.id ?? "user-123",
    authUserId: overrides.authUserId ?? "auth-123",
    firstName: overrides.firstName ?? "John",
    lastName: overrides.lastName ?? "Doe",
    nickname: overrides.nickname ?? null,
    email: overrides.email ?? null,
    phone: overrides.phone ?? null,
    avatarUrl: overrides.avatarUrl ?? null,
    role: overrides.role ?? UserRole.USER,
    status: overrides.status ?? "ACTIVE",
    groupId: overrides.groupId ?? null,
    bio: overrides.bio ?? null,
    birthDate: overrides.birthDate ?? null,
    shirtSize: overrides.shirtSize ?? null,
    dietaryRequirements: overrides.dietaryRequirements ?? null,
    medicalInfo: overrides.medicalInfo ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
  };
}

describe("[UNIT] updateUserUseCase", () => {
  it("should update user first name successfully", async () => {
    const mockUser = createMockUserDTO({
      id: "user-456",
      firstName: "Old",
      lastName: "Name",
    });
    const mockGateway = createMockUserGateway([mockUser]);
    const mockLayer = Layer.succeed(UserGatewayTag, mockGateway);

    const input: UpdateUserInput = {
      userId: "user-456",
      firstName: "New",
    };

    const program = updateUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("user-456");
    expect(result.firstName).toBe("New");
    expect(result.lastName).toBe("Name");
    expect(result.fullName).toBe("New Name");
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should update user last name successfully", async () => {
    const mockUser = createMockUserDTO({
      id: "user-789",
      firstName: "John",
      lastName: "Doe",
    });
    const mockGateway = createMockUserGateway([mockUser]);
    const mockLayer = Layer.succeed(UserGatewayTag, mockGateway);

    const input: UpdateUserInput = {
      userId: "user-789",
      lastName: "Smith",
    };

    const program = updateUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("user-789");
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Smith");
    expect(result.fullName).toBe("John Smith");
  });

  it("should update both first and last name together", async () => {
    const mockUser = createMockUserDTO({
      id: "user-abc",
      firstName: "OldFirst",
      lastName: "OldLast",
    });
    const mockGateway = createMockUserGateway([mockUser]);
    const mockLayer = Layer.succeed(UserGatewayTag, mockGateway);

    const input: UpdateUserInput = {
      userId: "user-abc",
      firstName: "NewFirst",
      lastName: "NewLast",
    };

    const program = updateUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.firstName).toBe("NewFirst");
    expect(result.lastName).toBe("NewLast");
    expect(result.fullName).toBe("NewFirst NewLast");
  });

  it("should fail with UserNotFoundError when user not found", async () => {
    const mockGateway = createMockUserGateway([]);
    const mockLayer = Layer.succeed(UserGatewayTag, mockGateway);

    const input: UpdateUserInput = {
      userId: "non-existent",
      firstName: "New",
    };

    const program = updateUserUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(UserNotFoundError);
      expect(either.left.message).toBe("User not found");
    }
  });

  it("should handle database errors", async () => {
    const mockUser = createMockUserDTO({ id: "user-123" });
    const failingGateway: UserGateway = {
      ...createMockUserGateway([mockUser]),
      findById: () =>
        Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database connection failed",
          }),
        ),
    };
    const failingLayer = Layer.succeed(UserGatewayTag, failingGateway);

    const input: UpdateUserInput = {
      userId: "user-123",
      firstName: "New",
    };

    const program = updateUserUseCase(input).pipe(Effect.provide(failingLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should allow empty firstName when updating", async () => {
    const mockUser = createMockUserDTO({
      id: "user-xyz",
      firstName: "Valid",
      lastName: "Name",
    });
    const mockGateway = createMockUserGateway([mockUser]);
    const mockLayer = Layer.succeed(UserGatewayTag, mockGateway);

    const input: UpdateUserInput = {
      userId: "user-xyz",
      firstName: "",
    };

    const program = updateUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    // Empty firstName should be allowed and result in empty fullName
    expect(result.firstName).toBe("");
    expect(result.fullName).toBe("Name");
  });
});
