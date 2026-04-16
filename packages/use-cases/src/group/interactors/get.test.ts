import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getGroupUseCase,
  type GetGroupInput,
  GetGroupNotFoundError,
} from "./get";
import { GroupGatewayTag, type GroupGateway } from "../ports/gateway";
import type { GroupDTO } from "../dto";
import { DatabaseError, GroupStatus } from "@mirai-app/domain";

/**
 * Mock GroupGateway for testing
 */
function createMockGroupGateway(groups: GroupDTO[] = []): GroupGateway {
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  return {
    create: (group: GroupDTO) => {
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

    existsByCode: () => Effect.succeed(false),

    findByCode: () => Effect.succeed(null),

    getCoins: () => Effect.succeed(0),

    updateCoins: (id: string) => {
      const group = groupMap.get(id);
      return group
        ? Effect.succeed(group)
        : Effect.succeed(null as unknown as GroupDTO);
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
        totalCount: 0,
      }),
  };
}

function createMockGroupDTO(overrides: Partial<GroupDTO> = {}): GroupDTO {
  return {
    id: overrides.id ?? "group-123",
    tripId: overrides.tripId ?? "trip-123",
    name: overrides.name ?? "Test Group",
    code: overrides.code ?? "TEST123",
    description: overrides.description ?? null,
    imageUrl: overrides.imageUrl ?? null,
    status: overrides.status ?? GroupStatus.ACTIVE,
    coins: overrides.coins ?? 100,
    maxMembers: overrides.maxMembers ?? null,
    createdById: overrides.createdById ?? "user-123",
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
    deletedAt: overrides.deletedAt ?? null,
    deletedById: overrides.deletedById ?? null,
  };
}

describe("[UNIT] getGroupUseCase", () => {
  it("should return group when found by ID", async () => {
    const mockGroup = createMockGroupDTO({
      id: "group-456",
      name: "My Group",
      tripId: "trip-456",
      coins: 500,
    });
    const mockGateway = createMockGroupGateway([mockGroup]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: GetGroupInput = { groupId: "group-456" };
    const program = getGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("group-456");
    expect(result.name).toBe("My Group");
    expect(result.tripId).toBe("trip-456");
    expect(result.coins).toBe(500);
    expect(result.isActive).toBe(true);
    expect(result.summary).toContain("My Group");
  });

  it("should fail with GetGroupNotFoundError when group not found", async () => {
    const mockGateway = createMockGroupGateway([]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: GetGroupInput = { groupId: "non-existent" };
    const program = getGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (
      either._tag === "Left" &&
      either.left instanceof GetGroupNotFoundError
    ) {
      expect(either.left.groupId).toBe("non-existent");
    }
  });

  it("should handle deleted groups correctly", async () => {
    const mockGroup = createMockGroupDTO({
      id: "group-deleted",
      status: GroupStatus.DELETED,
    });
    const mockGateway = createMockGroupGateway([mockGroup]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: GetGroupInput = { groupId: "group-deleted" };
    const program = getGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("group-deleted");
    expect(result.isActive).toBe(false);
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
    const failingLayer = Layer.succeed(GroupGatewayTag, failingGateway);

    const input: GetGroupInput = { groupId: "group-123" };
    const program = getGroupUseCase(input).pipe(Effect.provide(failingLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });
});
