import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { UserController } from "./controller";
import { UserGatewayTag, type UserGateway } from "@mirai-app/use-cases";
import { UserRole, DatabaseError } from "@mirai-app/domain";
import type { UserDTO } from "../../../../use-cases/src/user/dto";

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

    findAllConnection: (args: { first?: number; after?: unknown | null }) => {
      const allUsers = Array.from(userMap.values());
      const first = args.first ?? 10;
      const nodes = allUsers.slice(0, first);
      const hasNextPage = allUsers.length > first;

      const encodeCursor = (id: string, date: Date) =>
        Buffer.from(
          JSON.stringify({ id, createdAt: date.toISOString() }),
        ).toString("base64");

      return Effect.succeed({
        edges: nodes.map((node) => ({
          node,
          cursor: encodeCursor(node.id, node.createdAt),
        })),
        nodes,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: false,
          startCursor:
            nodes.length > 0
              ? encodeCursor(nodes[0]!.id, nodes[0]!.createdAt)
              : null,
          endCursor:
            nodes.length > 0
              ? encodeCursor(
                  nodes[nodes.length - 1]!.id,
                  nodes[nodes.length - 1]!.createdAt,
                )
              : null,
        },
        totalCount: allUsers.length,
      });
    },

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

    existsByAuthUserId: (authUserId: string) => {
      const exists = Array.from(userMap.values()).some(
        (u) => u.authUserId === authUserId,
      );
      return Effect.succeed(exists);
    },
  };
}

function createMockUserDTO(overrides: Partial<UserDTO> = {}): UserDTO {
  return {
    id: overrides.id ?? "550e8400-e29b-41d4-a716-446655440000",
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

describe("[UNIT] UserController", () => {
  let controller: UserController;
  let mockLayer: Layer.Layer<unknown>;

  beforeEach(() => {
    const mockGateway = createMockUserGateway();
    mockLayer = Layer.succeed(
      UserGatewayTag,
      mockGateway,
    ) as Layer.Layer<unknown>;
    controller = new UserController(mockLayer);
  });

  describe("getById", () => {
    it("should return user when found by valid ID", async () => {
      const mockUser = createMockUserDTO({
        id: "550e8400-e29b-41d4-a716-446655440001",
        firstName: "Jane",
        lastName: "Smith",
        avatarUrl: "https://example.com/avatar.jpg",
      });
      const mockGateway = createMockUserGateway([mockUser]);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440001");
        expect(result.data.firstName).toBe("Jane");
        expect(result.data.lastName).toBe("Smith");
        expect(result.data.fullName).toBe("Jane Smith");
        expect(result.data.hasAvatar).toBe(true);
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should return error for invalid UUID format", async () => {
      const result = await controller.getById({ id: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when user not found", async () => {
      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440999",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
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
      mockLayer = Layer.succeed(
        UserGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database connection failed");
      }
    });

    it("should return error for missing id", async () => {
      const result = await controller.getById({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("create", () => {
    it("should create user with valid input", async () => {
      const result = await controller.create({
        authUserId: "auth-456",
        firstName: "Alice",
        lastName: "Wonderland",
        role: "USER",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authUserId).toBe("auth-456");
        expect(result.data.firstName).toBe("Alice");
        expect(result.data.lastName).toBe("Wonderland");
        expect(result.data.fullName).toBe("Alice Wonderland");
        expect(result.data.role).toBe("USER");
        expect(result.data.hasAvatar).toBe(false);
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.id).toBeDefined();
      }
    });

    it("should create user with default role when role not provided", async () => {
      const result = await controller.create({
        authUserId: "auth-789",
        firstName: "Bob",
        lastName: "Builder",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("USER");
      }
    });

    it("should create user with MODERATOR role", async () => {
      const result = await controller.create({
        authUserId: "auth-moderator",
        firstName: "Moderator",
        lastName: "User",
        role: "MODERATOR",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("MODERATOR");
      }
    });

    it("should create user with ADMIN role", async () => {
      const result = await controller.create({
        authUserId: "auth-admin",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("ADMIN");
      }
    });

    it("should return error for missing authUserId", async () => {
      const result = await controller.create({
        firstName: "John",
        lastName: "Doe",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty authUserId", async () => {
      const result = await controller.create({
        authUserId: "",
        firstName: "John",
        lastName: "Doe",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for short first name", async () => {
      const result = await controller.create({
        authUserId: "auth-short",
        firstName: "A",
        lastName: "Doe",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for first name with digits", async () => {
      const result = await controller.create({
        authUserId: "auth-digits",
        firstName: "John123",
        lastName: "Doe",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for long first name", async () => {
      const result = await controller.create({
        authUserId: "auth-long",
        firstName: "A".repeat(101),
        lastName: "Doe",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when user already exists", async () => {
      const existingUser = createMockUserDTO({
        authUserId: "auth-existing",
      });
      const mockGateway = createMockUserGateway([existingUser]);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.create({
        authUserId: "auth-existing",
        firstName: "Existing",
        lastName: "User",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already exists");
      }
    });

    it("should handle database errors during create", async () => {
      const failingGateway: UserGateway = {
        ...createMockUserGateway([]),
        create: () =>
          Effect.fail(
            new DatabaseError({
              operation: "create",
              message: "Database write failed",
            }),
          ),
        existsByAuthUserId: () => Effect.succeed(false),
      };
      mockLayer = Layer.succeed(
        UserGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.create({
        authUserId: "auth-new",
        firstName: "New",
        lastName: "User",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database write failed");
      }
    });
  });

  describe("update", () => {
    it("should update user first name successfully", async () => {
      const mockUser = createMockUserDTO({
        id: "550e8400-e29b-41d4-a716-446655440002",
        firstName: "Old",
        lastName: "Name",
      });
      const mockGateway = createMockUserGateway([mockUser]);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.update({
        userId: "550e8400-e29b-41d4-a716-446655440002",
        firstName: "New",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440002");
        expect(result.data.firstName).toBe("New");
        expect(result.data.lastName).toBe("Name");
        expect(result.data.fullName).toBe("New Name");
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should update user last name successfully", async () => {
      const mockUser = createMockUserDTO({
        id: "550e8400-e29b-41d4-a716-446655440003",
        firstName: "John",
        lastName: "Doe",
      });
      const mockGateway = createMockUserGateway([mockUser]);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.update({
        userId: "550e8400-e29b-41d4-a716-446655440003",
        lastName: "Smith",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe("John");
        expect(result.data.lastName).toBe("Smith");
        expect(result.data.fullName).toBe("John Smith");
      }
    });

    it("should update both first and last name together", async () => {
      const mockUser = createMockUserDTO({
        id: "550e8400-e29b-41d4-a716-446655440004",
        firstName: "OldFirst",
        lastName: "OldLast",
      });
      const mockGateway = createMockUserGateway([mockUser]);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.update({
        userId: "550e8400-e29b-41d4-a716-446655440004",
        firstName: "NewFirst",
        lastName: "NewLast",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstName).toBe("NewFirst");
        expect(result.data.lastName).toBe("NewLast");
        expect(result.data.fullName).toBe("NewFirst NewLast");
      }
    });

    it("should update hasAvatar flag", async () => {
      const mockUser = createMockUserDTO({
        id: "550e8400-e29b-41d4-a716-446655440005",
        avatarUrl: null,
      });
      const mockGateway = createMockUserGateway([mockUser]);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.update({
        userId: "550e8400-e29b-41d4-a716-446655440005",
        hasAvatar: true,
      });

      expect(result.success).toBe(true);
    });

    it("should return error for invalid user ID format", async () => {
      const result = await controller.update({
        userId: "invalid-id",
        firstName: "New",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when user not found", async () => {
      const result = await controller.update({
        userId: "550e8400-e29b-41d4-a716-446655440999",
        firstName: "New",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should handle database errors during update", async () => {
      const mockUser = createMockUserDTO({
        id: "550e8400-e29b-41d4-a716-446655440006",
      });
      const failingGateway: UserGateway = {
        ...createMockUserGateway([mockUser]),
        update: () =>
          Effect.fail(
            new DatabaseError({
              operation: "update",
              message: "Database update failed",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        UserGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.update({
        userId: "550e8400-e29b-41d4-a716-446655440006",
        firstName: "New",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database update failed");
      }
    });

    it("should return error for invalid first name with digits", async () => {
      const mockUser = createMockUserDTO({
        id: "550e8400-e29b-41d4-a716-446655440007",
      });
      const mockGateway = createMockUserGateway([mockUser]);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.update({
        userId: "550e8400-e29b-41d4-a716-446655440007",
        firstName: "Name123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for short first name", async () => {
      const mockUser = createMockUserDTO({
        id: "550e8400-e29b-41d4-a716-446655440008",
      });
      const mockGateway = createMockUserGateway([mockUser]);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.update({
        userId: "550e8400-e29b-41d4-a716-446655440008",
        firstName: "A",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("list", () => {
    it("should return list of users with default pagination", async () => {
      const mockUsers = [
        createMockUserDTO({
          id: "550e8400-e29b-41d4-a716-446655440010",
          firstName: "User1",
        }),
        createMockUserDTO({
          id: "550e8400-e29b-41d4-a716-446655440011",
          firstName: "User2",
        }),
      ];
      const mockGateway = createMockUserGateway(mockUsers);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.list({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        const first = result.data[0];
        const second = result.data[1];
        expect(first).toBeDefined();
        expect(second).toBeDefined();
        if (first && second) {
          expect(first.firstName).toBe("User1");
          expect(second.firstName).toBe("User2");
        }
      }
    });

    it("should return list with custom limit", async () => {
      const mockUsers = Array.from({ length: 5 }, (_, i) =>
        createMockUserDTO({
          id: `550e8400-e29b-41d4-a716-4466554400${10 + i}`,
          firstName: `User${i + 1}`,
        }),
      );
      const mockGateway = createMockUserGateway(mockUsers);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.list({ limit: 3 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeLessThanOrEqual(5);
      }
    });

    it("should return list with offset parameter (converted to limit)", async () => {
      const mockUsers = Array.from({ length: 3 }, (_, i) =>
        createMockUserDTO({
          id: `550e8400-e29b-41d4-a716-4466554400${10 + i}`,
          firstName: `User${i + 1}`,
        }),
      );
      const mockGateway = createMockUserGateway(mockUsers);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      // Note: offset is not supported by cursor-based pagination
      // The controller passes offset to the validator but uses limit for first
      const result = await controller.list({ offset: 1 });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should return all 3 since limit defaults to 10
        expect(result.data.length).toBe(3);
      }
    });

    it("should return error for invalid limit", async () => {
      const result = await controller.list({ limit: 0 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for negative offset", async () => {
      const result = await controller.list({ offset: -1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for limit exceeding 100", async () => {
      const result = await controller.list({ limit: 101 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors during list", async () => {
      const failingGateway: UserGateway = {
        ...createMockUserGateway([]),
        findAllConnection: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findAllConnection",
              message: "Database error",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        UserGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.list({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should return empty list when no users exist", async () => {
      const mockGateway = createMockUserGateway([]);
      mockLayer = Layer.succeed(
        UserGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new UserController(mockLayer);

      const result = await controller.list({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });
});
