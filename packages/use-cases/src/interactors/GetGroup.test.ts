import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  GetGroupUseCase,
  getGroupUseCase,
  type GetGroupInput,
  GetGroupNotFoundError,
} from "./GetGroup";
import {
  Group,
  GroupStatus,
  type Result,
  ok,
  err,
  isOk,
  isErr,
} from "@mirai-app/domain";
import type { GroupRepository } from "../ports/GroupRepository";

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

describe("[UNIT] GetGroupUseCase - Effect.gen", () => {
  let repo: MockGroupRepository;
  let useCase: GetGroupUseCase;

  beforeEach(() => {
    repo = new MockGroupRepository();
    useCase = new GetGroupUseCase(repo);
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
    // Domain entities still use Effect internally - unwrap with runSync
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

      const result = await Effect.runPromise(useCase.execute(input));

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.id).toBe("group-456");
        expect(result.value.name).toBe("My Group");
        expect(result.value.tripId).toBe("trip-456");
        expect(result.value.code).toBe("TEST123");
        expect(result.value.organizerId).toBe("user-123");
        expect(result.value.coins).toBe(100);
        expect(result.value.status).toBe("ACTIVE");
        expect(result.value.isActive).toBe(true);
        expect(result.value.summary).toBeDefined();
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });

    it("should fail when group not found", async () => {
      const input: GetGroupInput = {
        groupId: "non-existent-id",
      };

      const result = await Effect.runPromise(useCase.execute(input));

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(GetGroupNotFoundError);
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

      const result = await Effect.runPromise(useCase.execute(input));

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.id).toBe("group-deleted");
        expect(result.value.isActive).toBe(false);
        expect(result.value.status).toBe("DELETED");
      }
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

      const result = await Effect.runPromise(useCase.execute(input));

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.summary).toContain("Adventure Group");
      }
    });
  });

  describe("[UNIT] legacy function-based API", () => {
    it("should work with legacy function API", async () => {
      const mockGroup = createValidGroup({
        id: "group-legacy",
        name: "Legacy Test Group",
      });
      Effect.runSync(repo.create(mockGroup));

      const input: GetGroupInput = {
        groupId: "group-legacy",
      };

      const result = await Effect.runPromise(getGroupUseCase(input, repo));

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.id).toBe("group-legacy");
        expect(result.value.name).toBe("Legacy Test Group");
      }
    });
  });
});
