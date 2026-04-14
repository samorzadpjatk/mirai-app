import { describe, it, expect, beforeEach } from "bun:test";
import {
  getGroupUseCase,
  type GetGroupInput,
  GetGroupNotFoundError,
} from "./GetGroup";
import { Group, GroupStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { GroupRepositoryTag } from "../ports/GroupRepository";
import { InMemoryGroupRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] getGroupUseCase (Effect)", () => {
  let repo: InMemoryGroupRepository;

  beforeEach(() => {
    repo = new InMemoryGroupRepository();
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

  const runUseCase = async (input: GetGroupInput) => {
    const program = getGroupUseCase(input).pipe(
      Effect.provideService(GroupRepositoryTag, {
        create: (group: Group) => repo.create(group),
        findById: (id: string) => repo.findById(id),
        findByTripId: (tripId: string) => repo.findByTripId(tripId),
        findByStatus: (status: GroupStatus) => repo.findByStatus(status),
        findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
          repo.findByTripIdAndStatus(tripId, status),
        findByOrganizerId: (organizerId: string) =>
          repo.findByOrganizerId(organizerId),
        findByCode: (code: string) => repo.findByCode(code),
        findAll: (options?: { limit?: number; offset?: number }) =>
          repo.findAll(options),
        update: (group: Group) => repo.update(group),
        delete: (id: string) => repo.delete(id),
        exists: (id: string) => repo.exists(id),
        countByTripId: (tripId: string) => repo.countByTripId(tripId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should return group when found by ID", async () => {
      const mockGroup = createValidGroup({
        id: "group-456",
        name: "My Group",
        tripId: "trip-456",
      });
      await Effect.runPromise(repo.create(mockGroup));

      const input: GetGroupInput = {
        groupId: "group-456",
      };

      const result = await runUseCase(input);

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

    it("should fail when group not found", async () => {
      const input: GetGroupInput = {
        groupId: "non-existent-id",
      };

      const program = getGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, {
          create: (group: Group) => repo.create(group),
          findById: (id: string) => repo.findById(id),
          findByTripId: (tripId: string) => repo.findByTripId(tripId),
          findByStatus: (status: GroupStatus) => repo.findByStatus(status),
          findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
            repo.findByTripIdAndStatus(tripId, status),
          findByOrganizerId: (organizerId: string) =>
            repo.findByOrganizerId(organizerId),
          findByCode: (code: string) => repo.findByCode(code),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          update: (group: Group) => repo.update(group),
          delete: (id: string) => repo.delete(id),
          exists: (id: string) => repo.exists(id),
          countByTripId: (tripId: string) => repo.countByTripId(tripId),
        }),
      );

      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(GetGroupNotFoundError);
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
      await Effect.runPromise(repo.create(deletedGroup));

      const input: GetGroupInput = {
        groupId: "group-deleted",
      };

      const result = await runUseCase(input);

      expect(result.id).toBe("group-deleted");
      expect(result.isActive).toBe(false);
      expect(result.status).toBe("DELETED");
    });

    it("should return correct summary for group", async () => {
      const mockGroup = createValidGroup({
        name: "Adventure Group",
        coins: 500,
      });
      await Effect.runPromise(repo.create(mockGroup));

      const input: GetGroupInput = {
        groupId: "group-123",
      };

      const result = await runUseCase(input);

      expect(result.summary).toContain("Adventure Group");
    });
  });
});
