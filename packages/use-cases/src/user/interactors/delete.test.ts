import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  deleteUserUseCase,
  type DeleteUserInput,
  DeleteUserNotFoundError,
} from "./delete";
import { UserGatewayTag, type UserGateway } from "../ports/gateway";
import type { UserDTO } from "../dto";
import { DatabaseError, UserRole } from "@mirai-app/domain";

/**
 * Mock UserGateway for testing
 */
function createMockUserGateway(users: UserDTO[] = []): UserGateway {
  const userMap = new Map(users.map((u) => [u.id, u]));
  const deletedIds = new Set<string>();

  return {
    create: (user: UserDTO) => {
      userMap.set(user.id, user);
      return Effect.succeed(user);
    },

    findById: (id: string) => {
      if (deletedIds.has(id)) {
        return Effect.succeed(null);
      }
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

    update: (user: UserDTO) => Effect.succeed(user),

    delete: (id: string) => {
      deletedIds.add(id);
      userMap.delete(id);
      return Effect.succeed(void 0);
    },

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

describe("[UNIT] deleteUserUseCase", () => {
  it("should delete user successfully", async () => {
    const mockUser = createMockUserDTO({ id: "user-to-delete" });
    const mockGateway = createMockUserGateway([mockUser]);
    const mockLayer = Layer.succeed(UserGatewayTag, mockGateway);

    const input: DeleteUserInput = {
      userId: "user-to-delete",
    };

    const program = deleteUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedUserId).toBe("user-to-delete");
  });

  it("should fail with DeleteUserNotFoundError when user not found", async () => {
    const mockGateway = createMockUserGateway([]);
    const mockLayer = Layer.succeed(UserGatewayTag, mockGateway);

    const input: DeleteUserInput = {
      userId: "non-existent-user",
    };

    const program = deleteUserUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeleteUserNotFoundError);
      expect(either.left.userId).toBe("non-existent-user");
    }
  });

  it("should handle database errors during find", async () => {
    const failingGateway: UserGateway = {
      ...createMockUserGateway([]),
      findById: () =>
        Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database connection failed",
          }),
        ),
    };
    const failingLayer = Layer.succeed(UserGatewayTag, failingGateway);

    const input: DeleteUserInput = {
      userId: "user-123",
    };

    const program = deleteUserUseCase(input).pipe(Effect.provide(failingLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should handle database errors during delete", async () => {
    const mockUser = createMockUserDTO({ id: "user-456" });
    const failingGateway: UserGateway = {
      ...createMockUserGateway([mockUser]),
      delete: () =>
        Effect.fail(
          new DatabaseError({
            operation: "delete",
            message: "Cannot delete user with existing references",
          }),
        ),
    };
    const failingLayer = Layer.succeed(UserGatewayTag, failingGateway);

    const input: DeleteUserInput = {
      userId: "user-456",
    };

    const program = deleteUserUseCase(input).pipe(Effect.provide(failingLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should delete user and verify user is gone", async () => {
    const mockUser = createMockUserDTO({ id: "user-verify" });
    const mockGateway = createMockUserGateway([mockUser]);
    const mockLayer = Layer.succeed(UserGatewayTag, mockGateway);

    const input: DeleteUserInput = {
      userId: "user-verify",
    };

    const program = deleteUserUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);

    const findProgram = mockGateway.findById("user-verify");
    const foundUser = await Effect.runPromise(findProgram);
    expect(foundUser).toBeNull();
  });
});
