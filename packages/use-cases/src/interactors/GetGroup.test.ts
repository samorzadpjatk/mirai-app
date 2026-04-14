import { describe, it, expect, beforeEach } from "bun:test";
import { Effect, Layer } from "effect";
import {
  getGroupUseCase,
  type GetGroupInput,
  GetGroupNotFoundError,
} from "./GetGroup";
import { Group, GroupStatus } from "@mirai-app/domain";
import {
  GroupRepositoryTag,
  type GroupRepository,
} from "../ports/GroupRepository";

/**
 * Simple in-memory mock repository for testing (Effect-based)
 */
class MockGroupRepository implements GroupRepository {
  private groups = new Map<string, Group>();

  create(group: Group): Effect.Effect<Group, never, never> {
    this.groups.set(group.id, group);
    return Effect.succeed(group);
  }

  findById(id: string): Effect.Effect<Group | null, never, never> {
    return Effect.succeed(this.groups.get(id) ?? null);
  }

  findByTripId(tripId: string): Effect.Effect<Group[], never, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).filter((g) => g.tripId === tripId),
    );
  }

  findByStatus(status: GroupStatus): Effect.Effect<Group[], never, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).filter((g) => g.status === status),
    );
  }

  findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Effect.Effect<Group[], never, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).filter(
        (g) => g.tripId === tripId && g.status === status,
      ),
    );
  }

  findByOrganizerId(organizerId: string): Effect.Effect<Group[], never, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).filter(
        (g) => g.organizerId === organizerId,
      ),
    );
  }

  findByCode(code: string): Effect.Effect<Group | null, never, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).find((g) => g.code === code) ?? null,
    );
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Group[], never, never> {
    const groups = Array.from(this.groups.values());
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? groups.length;
    return Effect.succeed(groups.slice(offset, offset + limit));
  }

  update(group: Group): Effect.Effect<Group, never, never> {
    this.groups.set(group.id, group);
    return Effect.succeed(group);
  }

  delete(id: string): Effect.Effect<void, never, never> {
    this.groups.delete(id);
    return Effect.succeed(undefined);
  }

  exists(id: string): Effect.Effect<boolean, never, never> {
    return Effect.succeed(this.groups.has(id));
  }

  countByTripId(tripId: string): Effect.Effect<number, never, never> {
    return Effect.succeed(
      Array.from(this.groups.values()).filter((g) => g.tripId === tripId)
        .length,
    );
  }
}

describe("[UNIT] getGroupUseCase - Pure Effect Pattern", () => {
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

  describe("[UNIT] execute", () => {
    it("should return group when found by ID", async () => {
      const mockGroup = createValidGroup({
        id: "group-456",
        name: "My Group",
        tripId: "trip-456",
      });
      Effect.runSync(repo.create(mockGroup));

      const input: GetGroupInput = {
        groupId: "group-456",
      };

      const program = getGroupUseCase(input).pipe(Effect.provide(mockLayer));
      const result = await Effect.runPromise(program);

      expect(result.id).toBe("group-456");
      expect(result.name).toBe("My Group");
      expect(result.tripId).toBe("trip-456");
      expect(result.code).toBe("TEST123");
      expect(result.organizerId).toBe("user-123");
      expect(result.coins).toBe(100);
      expect(result.status).toBe("ACTIVE");
      expect(result.isActive).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should fail with GetGroupNotFoundError when group not found", async () => {
      const input: GetGroupInput = {
        groupId: "non-existent-id",
      };

      const program = getGroupUseCase(input).pipe(Effect.provide(mockLayer));
      const either = await Effect.runPromise(Effect.either(program));

      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(GetGroupNotFoundError);
        expect(either.left.groupId).toBe("non-existent-id");
      }
    });

    it("should return deleted group if it exists", async () => {
      const deletedGroup = Effect.runSync(
        Group.create({
          id: "group-deleted",
          tripId: "trip-123",
          name: "Deleted Group",
          code: "DELETED",
          organizerId: "user-123",
          description: null,
          image: null,
          coins: 0,
          status: GroupStatus.DELETED,
        }),
      );
      Effect.runSync(repo.create(deletedGroup));

      const input: GetGroupInput = {
        groupId: "group-deleted",
      };

      const program = getGroupUseCase(input).pipe(Effect.provide(mockLayer));
      const result = await Effect.runPromise(program);

      expect(result.id).toBe("group-deleted");
      expect(result.isActive).toBe(false);
      expect(result.status).toBe("DELETED");
    });

    it("should return correct summary for group", async () => {
      const mockGroup = createValidGroup({
        name: "Adventure Group",
        coins: 500,
      });
      Effect.runSync(repo.create(mockGroup));

      const input: GetGroupInput = {
        groupId: "group-123",
      };

      const program = getGroupUseCase(input).pipe(Effect.provide(mockLayer));
      const result = await Effect.runPromise(program);

      expect(result.summary).toContain("Adventure Group");
    });
  });
});
