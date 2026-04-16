import { describe, it, expect } from "bun:test";
import { Effect, Context } from "effect";
import type { UserGateway } from "./gateway";
import { UserGatewayTag } from "./gateway";
import type { UserDTO } from "../dto";
import { DatabaseError, UserRole } from "@mirai-app/domain";

describe("[UNIT] UserGatewayTag", () => {
  it("should be a valid Context.Tag", () => {
    expect(UserGatewayTag).toBeDefined();
    expect(UserGatewayTag.key).toBe("UserGateway");
  });

  it("should have correct key", () => {
    expect(UserGatewayTag.key).toBe("UserGateway");
  });
});

describe("[UNIT] UserGateway Interface Contract", () => {
  const mockUserDTO: UserDTO = {
    id: "user-123",
    authUserId: "auth-123",
    firstName: "John",
    lastName: "Doe",
    nickname: null,
    email: null,
    phone: null,
    avatarUrl: null,
    role: UserRole.USER,
    status: "ACTIVE",
    groupId: null,
    bio: null,
    birthDate: null,
    shirtSize: null,
    dietaryRequirements: null,
    medicalInfo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("create method should return Effect<UserDTO, DatabaseError>", async () => {
    const mockGateway: UserGateway = {
      create: () => Effect.succeed(mockUserDTO),
      findById: () => Effect.succeed(null),
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
      update: () => Effect.succeed(mockUserDTO),
      delete: () => Effect.succeed(void 0),
      existsByAuthUserId: () => Effect.succeed(false),
    };

    const result = await Effect.runPromise(mockGateway.create(mockUserDTO));
    expect(result.id).toBe("user-123");
  });

  it("findById should return null when user not found", async () => {
    const mockGateway: UserGateway = {
      create: () => Effect.succeed(mockUserDTO),
      findById: () => Effect.succeed(null),
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
      update: () => Effect.succeed(mockUserDTO),
      delete: () => Effect.succeed(void 0),
      existsByAuthUserId: () => Effect.succeed(false),
    };

    const result = await Effect.runPromise(
      mockGateway.findById("non-existent"),
    );
    expect(result).toBeNull();
  });

  it("should handle DatabaseError from create", async () => {
    const failingGateway: UserGateway = {
      ...({} as UserGateway),
      create: () =>
        Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Connection failed",
          }),
        ),
      findById: () => Effect.succeed(null),
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
      update: () => Effect.succeed(mockUserDTO),
      delete: () => Effect.succeed(void 0),
      existsByAuthUserId: () => Effect.succeed(false),
    };

    const effect = failingGateway.create(mockUserDTO);
    const either = await Effect.runPromise(Effect.either(effect));

    expect(either._tag).toBe("Left");
  });
});
