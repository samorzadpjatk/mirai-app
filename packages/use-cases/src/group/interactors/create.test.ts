import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  createGroupUseCase,
  type CreateGroupInput,
  GroupCodeAlreadyExistsError,
  GroupCreationError,
} from "./create";
import { GroupGatewayTag, type GroupGateway } from "../ports/gateway";
import type { GroupDTO } from "../dto";
import { DatabaseError, GroupStatus } from "@mirai-app/domain";
import type { CursorPaginationOptions } from "../../system/shared/dto";

/**
 * Mock GroupGateway for testing
 */
function createMockGroupGateway(
  groups: GroupDTO[] = [],
  options: {
    shouldFailCreate?: boolean;
  } = {},
): GroupGateway {
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const existingCodes = new Set(groups.map((g) => g.code));

  return {
    create: (group: GroupDTO) => {
      if (options.shouldFailCreate) {
        return Effect.fail(
          new DatabaseError({
            operation: "create",
            message: "Database error",
          }),
        );
      }
      groupMap.set(group.id, group);
      return Effect.succeed(group);
    },

    findById: (id: string) => {
      const group = groupMap.get(id);
      return Effect.succeed(group ?? null);
    },

    findByTripIdConnection: () =>
      Effect.succeed({
        items: [],
        hasMore: false,
        nextCursor: null,
        total: 0,
      }),

    findByStatusConnection: () =>
      Effect.succeed({
        items: [],
        hasMore: false,
        nextCursor: null,
        total: 0,
      }),

    findByTripIdAndStatusConnection: () =>
      Effect.succeed({
        items: [],
        hasMore: false,
        nextCursor: null,
        total: 0,
      }),

    findByOrganizerIdConnection: () =>
      Effect.succeed({
        items: [],
        hasMore: false,
        nextCursor: null,
        total: 0,
      }),

    findAll: () =>
      Effect.succeed({
        items: Array.from(groupMap.values()),
        total: groupMap.size,
        limit: groupMap.size,
        offset: 0,
        hasMore: false,
      }),

    update: (group: GroupDTO) => Effect.succeed(group),

    delete: () => Effect.succeed(void 0),

    exists: () => Effect.succeed(false),

    existsByCode: (code: string) => Effect.succeed(existingCodes.has(code)),

    findByCode: (code: string) => {
      const group = Array.from(groupMap.values()).find((g) => g.code === code);
      return Effect.succeed(group ?? null);
    },

    getCoins: () => Effect.succeed(0),

    updateCoins: () => Effect.succeed(null as unknown as GroupDTO),

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
        totalCount: 0,
      }),
  };
}

describe("[UNIT] createGroupUseCase", () => {
  it("should create a group successfully", async () => {
    const mockGateway = createMockGroupGateway([]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: CreateGroupInput = {
      tripId: "trip-123",
      name: "Test Group",
      code: "TEST123",
      organizerId: "user-123",
    };

    const program = createGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.name).toBe("Test Group");
    expect(result.code).toBe("TEST123");
    expect(result.tripId).toBe("trip-123");
    expect(result.organizerId).toBe("user-123");
    expect(result.coins).toBe(0);
    expect(result.status).toBe("ACTIVE");
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("should fail with GroupCodeAlreadyExistsError when code exists", async () => {
    const existingGroup: GroupDTO = {
      id: "existing-group",
      tripId: "trip-123",
      name: "Existing Group",
      code: "DUPLICATE",
      description: null,
      imageUrl: null,
      status: GroupStatus.ACTIVE,
      coins: 100,
      maxMembers: null,
      createdById: "user-123",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      deletedById: null,
    };
    const mockGateway = createMockGroupGateway([existingGroup]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: CreateGroupInput = {
      tripId: "trip-456",
      name: "New Group",
      code: "DUPLICATE",
      organizerId: "user-456",
    };

    const program = createGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GroupCodeAlreadyExistsError);
      expect(either.left.message).toBe("Group code already exists");
    }
  });

  it("should use default values when optional fields not provided", async () => {
    const mockGateway = createMockGroupGateway([]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: CreateGroupInput = {
      tripId: "trip-789",
      name: "Minimal Group",
      code: "MINIMAL",
      organizerId: "user-789",
    };

    const program = createGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.coins).toBe(0);
    expect(result.status).toBe("ACTIVE");
    expect(result.description).toBeNull();
    expect(result.image).toBeNull();
  });

  it("should handle database errors during creation", async () => {
    const mockGateway = createMockGroupGateway([], { shouldFailCreate: true });
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: CreateGroupInput = {
      tripId: "trip-999",
      name: "Failing Group",
      code: "FAIL999",
      organizerId: "user-999",
    };

    const program = createGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should create group with custom status and coins", async () => {
    const mockGateway = createMockGroupGateway([]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: CreateGroupInput = {
      tripId: "trip-custom",
      name: "Custom Group",
      code: "CUSTOM",
      organizerId: "user-custom",
      coins: 500,
      status: GroupStatus.DELETED,
    };

    const program = createGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.coins).toBe(500);
    expect(result.status).toBe("DELETED");
  });

  it("should fail with GroupCreationError when validation fails", async () => {
    const mockGateway = createMockGroupGateway([]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: CreateGroupInput = {
      tripId: "trip-invalid",
      name: "", // Empty name should fail validation
      code: "INVALID",
      organizerId: "user-invalid",
    };

    const program = createGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(GroupCreationError);
    }
  });
});
