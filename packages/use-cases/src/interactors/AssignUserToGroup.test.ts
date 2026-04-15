import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  assignUserToGroupUseCase,
  type AssignUserToGroupInput,
  GroupNotFoundError,
  ParticipantNotFoundError,
} from "./AssignUserToGroup";
import {
  Group,
  GroupStatus,
  TripParticipant,
  TripParticipantRole,
  UserId,
  GroupId,
} from "@mirai-app/domain";
import {
  GroupRepositoryTag,
  type GroupRepository,
} from "../ports/GroupRepository";
import { DatabaseError } from "../ports/errors";

/**
 * Simple in-memory mock repository for testing (Effect-based)
 */
class MockGroupRepository implements GroupRepository {
  private groups = new Map<string, Group>();
  private participants = new Map<string, TripParticipant>();

  create(group: Group): Effect.Effect<Group, DatabaseError, never> {
    this.groups.set(group.id, group);
    return Effect.succeed(group);
  }

  findById(id: string): Effect.Effect<Group | null, DatabaseError, never> {
    return Effect.succeed(this.groups.get(id) ?? null);
  }

  findByTripId(tripId: string): Effect.Effect<Group[], DatabaseError, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).filter((g) => g.tripId === tripId),
    );
  }

  findByStatus(
    status: GroupStatus,
  ): Effect.Effect<Group[], DatabaseError, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).filter((g) => g.status === status),
    );
  }

  findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Effect.Effect<Group[], DatabaseError, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).filter(
        (g) => g.tripId === tripId && g.status === status,
      ),
    );
  }

  findByOrganizerId(
    organizerId: string,
  ): Effect.Effect<Group[], DatabaseError, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).filter(
        (g) => g.organizerId === organizerId,
      ),
    );
  }

  findByCode(code: string): Effect.Effect<Group | null, DatabaseError, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).find((g) => g.code === code) ?? null,
    );
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Group[], DatabaseError, never> {
    const groups = Array.from(this.groups.values());
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? groups.length;
    return Effect.succeed(groups.slice(offset, offset + limit));
  }

  update(group: Group): Effect.Effect<Group, DatabaseError, never> {
    this.groups.set(group.id, group);
    return Effect.succeed(group);
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    this.groups.delete(id);
    return Effect.succeed(undefined);
  }

  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.succeed(this.groups.has(id));
  }

  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).filter((g) => g.tripId === tripId)
        .length,
    );
  }

  // Member management methods
  findParticipantByUserIdAndTripId(
    userId: string,
    tripId: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never> {
    const participant = Array.from(this.participants.values()).find(
      (p) => p.userId === userId && p.tripId === tripId,
    );
    return Effect.succeed(participant ?? null);
  }

  findParticipantsByGroupId(
    groupId: string,
  ): Effect.Effect<TripParticipant[], DatabaseError, never> {
    return Effect.succeed(
      Array.from(this.participants.values()).filter(
        (p) => p.groupId === groupId,
      ),
    );
  }

  assignUserToGroup(
    userId: string,
    groupId: string,
  ): Effect.Effect<TripParticipant, DatabaseError, never> {
    const participant = Array.from(this.participants.values()).find(
      (p) => p.userId === userId,
    );
    if (!participant) {
      return Effect.fail(
        new DatabaseError({
          operation: "assignUserToGroup",
          message: "Participant not found",
        }),
      );
    }
    const updated = participant.assignToGroup(groupId);
    if (updated._tag === "Left") {
      return Effect.fail(
        new DatabaseError({
          operation: "assignUserToGroup",
          message: updated.left.message,
        }),
      );
    }
    this.participants.set(participant.id, Effect.runSync(updated)!);
    return Effect.succeed(Effect.runSync(updated)!);
  }

  removeUserFromGroup(
    userId: string,
    _groupId: string,
  ): Effect.Effect<TripParticipant, DatabaseError, never> {
    const participant = Array.from(this.participants.values()).find(
      (p) => p.userId === userId,
    );
    if (!participant) {
      return Effect.fail(
        new DatabaseError({
          operation: "removeUserFromGroup",
          message: "Participant not found",
        }),
      );
    }
    const updated = participant.removeFromGroup();
    this.participants.set(participant.id, updated);
    return Effect.succeed(updated);
  }

  // Helper method for tests to add participants
  addParticipant(participant: TripParticipant): void {
    this.participants.set(participant.id, participant);
  }
}

describe("[UNIT] assignUserToGroupUseCase - Pure Effect Pattern", () => {
  let repo: MockGroupRepository;
  let mockLayer: Layer.Layer<GroupRepositoryTag>;

  beforeEach(() => {
    repo = new MockGroupRepository();
    mockLayer = Layer.succeed(GroupRepositoryTag, repo);
  });

  const createValidGroup = (
    overrides?: Partial<{
      id: string;
      tripId: string;
      name: string;
      code: string;
      organizerId: string;
      coins: number;
      status: GroupStatus;
    }>,
  ): Group => {
    const effect = Group.create({
      id: overrides?.id ?? "group-123",
      tripId: overrides?.tripId ?? "trip-123",
      name: overrides?.name ?? "Test Group",
      code: overrides?.code ?? "TEST123",
      organizerId: overrides?.organizerId ?? "user-123",
      description: "A test description",
      image: "https://example.com/image.png",
      coins: overrides?.coins ?? 100,
      status: overrides?.status ?? GroupStatus.ACTIVE,
    });
    return Effect.runSync(effect);
  };

  const createValidParticipant = (
    overrides?: Partial<{
      id: string;
      userId: string;
      tripId: string;
      groupId: string | null;
      role: TripParticipantRole;
    }>,
  ): TripParticipant => {
    const effect = TripParticipant.create({
      id: overrides?.id ?? "participant-123",
      userId: overrides?.userId ?? "user-456",
      tripId: overrides?.tripId ?? "trip-123",
      groupId: overrides?.groupId ?? null,
      role: overrides?.role ?? TripParticipantRole.MEMBER,
    });
    return Effect.runSync(effect);
  };

  describe("[UNIT] execute", () => {
    it("should assign user to group successfully", async () => {
      const mockGroup = createValidGroup({
        id: "group-456",
        tripId: "trip-456",
        name: "My Group",
      });
      const mockParticipant = createValidParticipant({
        id: "participant-789",
        userId: "user-789",
        tripId: "trip-456",
        groupId: null,
      });

      Effect.runSync(repo.create(mockGroup));
      repo.addParticipant(mockParticipant);

      const input: AssignUserToGroupInput = {
        groupId: GroupId.create("group-456"),
        userId: UserId.create("user-789"),
      };

      const program = assignUserToGroupUseCase(input).pipe(
        Effect.provide(mockLayer),
      );
      const result = await Effect.runPromise(program);

      expect(result.id).toBe("group-456");
      expect(result.name).toBe("My Group");
      expect(result.tripId).toBe("trip-456");
    });

    it("should be idempotent - return success if user already assigned to group", async () => {
      const mockGroup = createValidGroup({
        id: "group-456",
        tripId: "trip-456",
        name: "My Group",
      });
      const mockParticipant = createValidParticipant({
        id: "participant-789",
        userId: "user-789",
        tripId: "trip-456",
        groupId: "group-456", // Already assigned
      });

      Effect.runSync(repo.create(mockGroup));
      repo.addParticipant(mockParticipant);

      const input: AssignUserToGroupInput = {
        groupId: GroupId.create("group-456"),
        userId: UserId.create("user-789"),
      };

      const program = assignUserToGroupUseCase(input).pipe(
        Effect.provide(mockLayer),
      );
      const result = await Effect.runPromise(program);

      expect(result.id).toBe("group-456");
      expect(result.name).toBe("My Group");
    });

    it("should fail with GroupNotFoundError when group does not exist", async () => {
      const mockParticipant = createValidParticipant({
        id: "participant-789",
        userId: "user-789",
        tripId: "trip-456",
        groupId: null,
      });
      repo.addParticipant(mockParticipant);

      const input: AssignUserToGroupInput = {
        groupId: GroupId.create("non-existent-group"),
        userId: UserId.create("user-789"),
      };

      const program = assignUserToGroupUseCase(input).pipe(
        Effect.provide(mockLayer),
      );
      const either = await Effect.runPromise(Effect.either(program));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(GroupNotFoundError);
        expect(either.left.groupId).toBe("non-existent-group");
      }
    });

    it("should fail with ParticipantNotFoundError when user is not a trip participant", async () => {
      const mockGroup = createValidGroup({
        id: "group-456",
        tripId: "trip-456",
        name: "My Group",
      });
      // No participant added for user-789

      Effect.runSync(repo.create(mockGroup));

      const input: AssignUserToGroupInput = {
        groupId: GroupId.create("group-456"),
        userId: UserId.create("user-789"),
      };

      const program = assignUserToGroupUseCase(input).pipe(
        Effect.provide(mockLayer),
      );
      const either = await Effect.runPromise(Effect.either(program));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(ParticipantNotFoundError);
        expect(either.left.userId).toBe("user-789");
        expect(either.left.tripId).toBe("trip-456");
      }
    });

    it("should succeed when reassigning user from one group to another in same trip", async () => {
      const group1 = createValidGroup({
        id: "group-1",
        tripId: "trip-shared",
        name: "First Group",
        code: "FIRST",
      });
      const group2 = createValidGroup({
        id: "group-2",
        tripId: "trip-shared",
        name: "Second Group",
        code: "SECOND",
      });
      const participant = createValidParticipant({
        id: "participant-reassign",
        userId: "user-reassign",
        tripId: "trip-shared",
        groupId: "group-1", // Initially in group 1
      });

      Effect.runSync(repo.create(group1));
      Effect.runSync(repo.create(group2));
      repo.addParticipant(participant);

      const input: AssignUserToGroupInput = {
        groupId: GroupId.create("group-2"),
        userId: UserId.create("user-reassign"),
      };

      const program = assignUserToGroupUseCase(input).pipe(
        Effect.provide(mockLayer),
      );
      const result = await Effect.runPromise(program);

      expect(result.id).toBe("group-2");
      expect(result.name).toBe("Second Group");
    });
  });
});
