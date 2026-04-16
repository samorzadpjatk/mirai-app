import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  deleteGroupUseCase,
  type DeleteGroupInput,
  DeleteGroupNotFoundError,
} from "./delete";
import { GroupGatewayTag, type GroupGateway } from "../ports/gateway";
import type { GroupDTO } from "../dto";
import { DatabaseError, GroupStatus } from "@mirai-app/domain";

/**
 * Mock GroupGateway for testing
 */
function createMockGroupGateway(groups: GroupDTO[] = []): GroupGateway {
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const deletedIds = new Set<string>();

  return {
    create: (group: GroupDTO) => {
      groupMap.set(group.id, group);
      return Effect.succeed(group);
    },

    findById: (id: string) => {
      if (deletedIds.has(id)) {
        return Effect.succeed(null);
      }
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
        items: Array.from(groupMap.values()).filter(
          (g) => !deletedIds.has(g.id),
        ),
        total: groupMap.size - deletedIds.size,
        limit: groupMap.size,
        offset: 0,
        hasMore: false,
      }),

    update: (group: GroupDTO) => Effect.succeed(group),

    delete: (id: string) => {
      deletedIds.add(id);
      groupMap.delete(id);
      return Effect.succeed(void 0);
    },

    exists: () => Effect.succeed(false),

    existsByCode: () => Effect.succeed(false),

    findByCode: () => Effect.succeed(null),

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

describe("[UNIT] deleteGroupUseCase", () => {
  it("should delete group successfully", async () => {
    const mockGroup = createMockGroupDTO({ id: "group-to-delete" });
    const mockGateway = createMockGroupGateway([mockGroup]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: DeleteGroupInput = {
      groupId: "group-to-delete",
    };

    const program = deleteGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedGroupId).toBe("group-to-delete");
  });

  it("should fail with DeleteGroupNotFoundError when group not found", async () => {
    const mockGateway = createMockGroupGateway([]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: DeleteGroupInput = {
      groupId: "non-existent-group",
    };

    const program = deleteGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DeleteGroupNotFoundError);
      if (either.left instanceof DeleteGroupNotFoundError) {
        expect(either.left.groupId).toBe("non-existent-group");
      }
    }
  });

  it("should handle database errors during find", async () => {
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

    const input: DeleteGroupInput = {
      groupId: "group-123",
    };

    const program = deleteGroupUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should handle database errors during delete", async () => {
    const mockGroup = createMockGroupDTO({ id: "group-456" });
    const failingGateway: GroupGateway = {
      ...createMockGroupGateway([mockGroup]),
      delete: () =>
        Effect.fail(
          new DatabaseError({
            operation: "delete",
            message: "Cannot delete group with existing references",
          }),
        ),
    };
    const failingLayer = Layer.succeed(GroupGatewayTag, failingGateway);

    const input: DeleteGroupInput = {
      groupId: "group-456",
    };

    const program = deleteGroupUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should delete group and verify it is gone", async () => {
    const mockGroup = createMockGroupDTO({ id: "group-verify" });
    const mockGateway = createMockGroupGateway([mockGroup]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: DeleteGroupInput = {
      groupId: "group-verify",
    };

    const program = deleteGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);

    const findProgram = mockGateway.findById("group-verify");
    const foundGroup = await Effect.runPromise(findProgram);
    expect(foundGroup).toBeNull();
  });

  it("should delete group with coins", async () => {
    const mockGroup = createMockGroupDTO({
      id: "group-with-coins",
      coins: 1000,
    });
    const mockGateway = createMockGroupGateway([mockGroup]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: DeleteGroupInput = {
      groupId: "group-with-coins",
    };

    const program = deleteGroupUseCase(input).pipe(Effect.provide(mockLayer));
    const result = await Effect.runPromise(program);

    expect(result.success).toBe(true);
    expect(result.deletedGroupId).toBe("group-with-coins");
  });
});
