import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import {
  assignUserToGroupUseCase,
  type AssignUserToGroupInput,
  GroupNotFoundError,
  ParticipantNotFoundError,
} from "./assign-user";
import { GroupGatewayTag, type GroupGateway } from "../ports/gateway";
import type { GroupDTO } from "../dto";
import {
  DatabaseError,
  GroupStatus,
  type GroupId,
  type UserId,
} from "@mirai-app/domain";
import type { TripParticipantDTO } from "../../trip/dto";

/**
 * Helper to create branded GroupId
 */
function createGroupId(id: string): GroupId {
  return id as unknown as GroupId;
}

/**
 * Helper to create branded UserId
 */
function createUserId(id: string): UserId {
  return id as unknown as UserId;
}

/**
 * Mock GroupGateway for testing
 */
function createMockGroupGateway(
  groups: GroupDTO[] = [],
  participants: TripParticipantDTO[] = [],
  options: {
    shouldFailFindById?: boolean;
    shouldFailFindParticipant?: boolean;
    shouldFailAssign?: boolean;
  } = {},
): GroupGateway {
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const participantMap = new Map(participants.map((p) => [p.id, p]));

  return {
    create: (group: GroupDTO) => {
      groupMap.set(group.id, group);
      return Effect.succeed(group);
    },

    findById: (id: GroupId) => {
      if (options.shouldFailFindById) {
        return Effect.fail(
          new DatabaseError({
            operation: "findById",
            message: "Database connection failed",
          }),
        );
      }
      const group = groupMap.get(id as unknown as string);
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

    findParticipantByUserIdAndTripId: (userId: string, tripId: string) => {
      if (options.shouldFailFindParticipant) {
        return Effect.fail(
          new DatabaseError({
            operation: "findParticipantByUserIdAndTripId",
            message: "Database error",
          }),
        );
      }
      const participant = Array.from(participantMap.values()).find(
        (p) => p.userId === userId && p.tripId === tripId,
      );
      return Effect.succeed(participant ?? null);
    },

    assignUserToGroup: () => {
      if (options.shouldFailAssign) {
        return Effect.fail(
          new DatabaseError({
            operation: "assignUserToGroup",
            message: "Failed to assign user",
          }),
        );
      }
      return Effect.succeed({} as TripParticipantDTO);
    },

    removeUserFromGroup: () => Effect.succeed({} as TripParticipantDTO),
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

function createMockParticipantDTO(
  overrides: Partial<TripParticipantDTO> = {},
): TripParticipantDTO {
  return {
    id: overrides.id ?? "participant-123",
    userId: overrides.userId ?? "user-456",
    tripId: overrides.tripId ?? "trip-123",
    groupId: overrides.groupId ?? null,
    role: overrides.role ?? "MEMBER",
    status: overrides.status ?? "ACTIVE",
    joinedAt: overrides.joinedAt ?? new Date("2024-01-01"),
    leftAt: overrides.leftAt ?? null,
    invitedById: overrides.invitedById ?? null,
  };
}

describe("[UNIT] assignUserToGroupUseCase", () => {
  it("should assign user to group successfully", async () => {
    const mockGroup = createMockGroupDTO({
      id: "group-456",
      tripId: "trip-456",
      name: "My Group",
    });
    const mockParticipant = createMockParticipantDTO({
      id: "participant-456",
      userId: "user-789",
      tripId: "trip-456",
      groupId: null,
    });
    const mockGateway = createMockGroupGateway([mockGroup], [mockParticipant]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: AssignUserToGroupInput = {
      groupId: createGroupId("group-456"),
      userId: createUserId("user-789"),
    };
    const program = assignUserToGroupUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("group-456");
    expect(result.name).toBe("My Group");
    expect(result.tripId).toBe("trip-456");
    expect(result.isActive).toBe(true);
  });

  it("should return group when user already assigned to the same group (idempotent)", async () => {
    const mockGroup = createMockGroupDTO({
      id: "group-789",
      tripId: "trip-789",
      name: "Existing Group",
    });
    const mockParticipant = createMockParticipantDTO({
      id: "participant-789",
      userId: "user-999",
      tripId: "trip-789",
      groupId: "group-789",
    });
    const mockGateway = createMockGroupGateway([mockGroup], [mockParticipant]);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: AssignUserToGroupInput = {
      groupId: createGroupId("group-789"),
      userId: createUserId("user-999"),
    };
    const program = assignUserToGroupUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const result = await Effect.runPromise(program);

    expect(result.id).toBe("group-789");
    expect(result.name).toBe("Existing Group");
  });

  it("should fail with GroupNotFoundError when group not found", async () => {
    const mockGateway = createMockGroupGateway([], []);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: AssignUserToGroupInput = {
      groupId: createGroupId("non-existent-group"),
      userId: createUserId("user-123"),
    };
    const program = assignUserToGroupUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left" && either.left instanceof GroupNotFoundError) {
      expect(either.left.groupId).toBe("non-existent-group");
    }
  });

  it("should fail with ParticipantNotFoundError when user is not a trip participant", async () => {
    const mockGroup = createMockGroupDTO({
      id: "group-321",
      tripId: "trip-321",
      name: "Test Group",
    });
    const mockGateway = createMockGroupGateway([mockGroup], []);
    const mockLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: AssignUserToGroupInput = {
      groupId: createGroupId("group-321"),
      userId: createUserId("user-not-participant"),
    };
    const program = assignUserToGroupUseCase(input).pipe(
      Effect.provide(mockLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (
      either._tag === "Left" &&
      either.left instanceof ParticipantNotFoundError
    ) {
      expect(either.left.userId).toBe("user-not-participant");
      expect(either.left.tripId).toBe("trip-321");
    }
  });

  it("should handle database errors when finding group", async () => {
    const mockGateway = createMockGroupGateway([], [], {
      shouldFailFindById: true,
    });
    const failingLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: AssignUserToGroupInput = {
      groupId: createGroupId("group-123"),
      userId: createUserId("user-123"),
    };
    const program = assignUserToGroupUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should handle database errors when finding participant", async () => {
    const mockGroup = createMockGroupDTO({
      id: "group-555",
      tripId: "trip-555",
    });
    const mockGateway = createMockGroupGateway([mockGroup], [], {
      shouldFailFindParticipant: true,
    });
    const failingLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: AssignUserToGroupInput = {
      groupId: createGroupId("group-555"),
      userId: createUserId("user-555"),
    };
    const program = assignUserToGroupUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });

  it("should handle database errors when assigning user", async () => {
    const mockGroup = createMockGroupDTO({
      id: "group-777",
      tripId: "trip-777",
    });
    const mockParticipant = createMockParticipantDTO({
      userId: "user-777",
      tripId: "trip-777",
      groupId: null,
    });
    const mockGateway = createMockGroupGateway([mockGroup], [mockParticipant], {
      shouldFailAssign: true,
    });
    const failingLayer = Layer.succeed(GroupGatewayTag, mockGateway);

    const input: AssignUserToGroupInput = {
      groupId: createGroupId("group-777"),
      userId: createUserId("user-777"),
    };
    const program = assignUserToGroupUseCase(input).pipe(
      Effect.provide(failingLayer),
    );
    const either = await Effect.runPromise(Effect.either(program));

    expect(either._tag).toBe("Left");
    if (either._tag === "Left") {
      expect(either.left).toBeInstanceOf(DatabaseError);
    }
  });
});
