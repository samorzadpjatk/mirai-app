import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { GetUserUseCase, type GetUserInput, GetUserNotFoundError } from "./get";
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

    update: (user: UserDTO) => Effect.succeed(user),

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

describe("[UNIT] GetUserUseCase", () => {
  let useCase: GetUserUseCase;

  beforeEach(() => {
    useCase = new GetUserUseCase();
  });

  it("should return user when found by ID", async () => {
    const mockUser = createMockUserDTO({
      id: "user-456",
      firstName: "Jane",
      lastName: "Smith",
    });
    const mockGateway = createMockUserGateway([mockUser]);
    const mockLayer = Layer.succeed(UserGatewayTag, mockGateway);

    const input: GetUserInput = { userId: "user-456" };
    const program = useCase.execute(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("user-456");
    expect(result.firstName).toBe("Jane");
    expect(result.lastName).toBe("Smith");
    expect(result.fullName).toBe("Jane Smith");
  });

  it("should fail with GetUserNotFoundError when user not found", async () => {
    const mockGateway = createMockUserGateway([]);
    const mockLayer = Layer.succeed(UserGatewayTag, mockGateway);

    const input: GetUserInput = { userId: "non-existent" };
    const program = useCase.execute(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GetUserNotFoundError);
      expect(either.left.userId).toBe("non-existent");
    }
  });

  it("should handle database errors", async () => {
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

    const input: GetUserInput = { userId: "user-123" };
    const program = useCase.execute(input).pipe(Effect.provide(failingLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });
});
