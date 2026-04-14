import { describe, it, expect, beforeEach } from "bun:test";
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
 * Simple in-memory mock repository for testing (Promise-based)
 */
class MockGroupRepository implements GroupRepository {
  private groups = new Map<string, Group>();

  async create(group: Group): Promise<Group> {
    this.groups.set(group.id, group);
    return group;
  }

  async findById(id: string): Promise<Group | null> {
    return this.groups.get(id) ?? null;
  }

  async findByTripId(tripId: string): Promise<Group[]> {
    return Array.from(this.groups.values()).filter((g) => g.tripId === tripId);
  }

  async findByStatus(status: GroupStatus): Promise<Group[]> {
    return Array.from(this.groups.values()).filter((g) => g.status === status);
  }

  async findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(
      (g) => g.tripId === tripId && g.status === status,
    );
  }

  async findByOrganizerId(organizerId: string): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(
      (g) => g.organizerId === organizerId,
    );
  }

  async findByCode(code: string): Promise<Group | null> {
    return (
      Array.from(this.groups.values()).find((g) => g.code === code) ?? null
    );
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Group[]> {
    const groups = Array.from(this.groups.values());
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? groups.length;
    return groups.slice(offset, offset + limit);
  }

  async update(group: Group): Promise<Group> {
    this.groups.set(group.id, group);
    return group;
  }

  async delete(id: string): Promise<void> {
    this.groups.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.groups.has(id);
  }

  async countByTripId(tripId: string): Promise<number> {
    return Array.from(this.groups.values()).filter((g) => g.tripId === tripId)
      .length;
  }
}

describe("[UNIT] GetGroupUseCase - Async/Await", () => {
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
    const { Effect } = require("effect");
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
      await repo.create(mockGroup);

      const input: GetGroupInput = {
        groupId: "group-456",
      };

      const result = await useCase.execute(input);

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

      const result = await useCase.execute(input);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(GetGroupNotFoundError);
      }
    });

    it("should return deleted group if it exists", async () => {
      const { Effect } = require("effect");
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
      await repo.create(deletedGroup);

      const input: GetGroupInput = {
        groupId: "group-deleted",
      };

      const result = await useCase.execute(input);

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
      await repo.create(mockGroup);

      const input: GetGroupInput = {
        groupId: "group-123",
      };

      const result = await useCase.execute(input);

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
      await repo.create(mockGroup);

      const input: GetGroupInput = {
        groupId: "group-legacy",
      };

      const result = await getGroupUseCase(input, repo);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.id).toBe("group-legacy");
        expect(result.value.name).toBe("Legacy Test Group");
      }
    });
  });
});
