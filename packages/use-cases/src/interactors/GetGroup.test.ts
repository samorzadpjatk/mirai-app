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

  // Helper to create a valid group
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
    const result = Group.create({
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
    if (result.kind === "err") {
      throw new Error(`Failed to create test group: ${result.error.message}`);
    }
    return result.value;
  };

  // Helper to run use case with repository
  const runUseCase = async (input: GetGroupInput) => {
    const program = getGroupUseCase(input).pipe(
      Effect.provideService(GroupRepositoryTag, {
        create: (group: Group) => Effect.promise(() => repo.create(group)),
        findById: (id: string) => Effect.promise(() => repo.findById(id)),
        findByTripId: (tripId: string) =>
          Effect.promise(() => repo.findByTripId(tripId)),
        findByStatus: (status: GroupStatus) =>
          Effect.promise(() => repo.findByStatus(status)),
        findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
          Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
        findByOrganizerId: (organizerId: string) =>
          Effect.promise(() => repo.findByOrganizerId(organizerId)),
        findByCode: (code: string) =>
          Effect.promise(() => repo.findByCode(code)),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => repo.findAll(options)),
        update: (group: Group) => Effect.promise(() => repo.update(group)),
        delete: (id: string) => Effect.promise(() => repo.delete(id)),
        exists: (id: string) => Effect.promise(() => repo.exists(id)),
        countByTripId: (tripId: string) =>
          Effect.promise(() => repo.countByTripId(tripId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should return group when found by ID", async () => {
      // Arrange
      const mockGroup = createValidGroup({
        id: "group-456",
        name: "My Group",
        tripId: "trip-456",
      });
      await repo.create(mockGroup);

      const input: GetGroupInput = {
        groupId: "group-456",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
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
      // Arrange
      const input: GetGroupInput = {
        groupId: "non-existent-id",
      };

      // Act
      const program = getGroupUseCase(input).pipe(
        Effect.provideService(GroupRepositoryTag, {
          create: (group: Group) => Effect.promise(() => repo.create(group)),
          findById: (id: string) => Effect.promise(() => repo.findById(id)),
          findByTripId: (tripId: string) =>
            Effect.promise(() => repo.findByTripId(tripId)),
          findByStatus: (status: GroupStatus) =>
            Effect.promise(() => repo.findByStatus(status)),
          findByTripIdAndStatus: (tripId: string, status: GroupStatus) =>
            Effect.promise(() => repo.findByTripIdAndStatus(tripId, status)),
          findByOrganizerId: (organizerId: string) =>
            Effect.promise(() => repo.findByOrganizerId(organizerId)),
          findByCode: (code: string) =>
            Effect.promise(() => repo.findByCode(code)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          update: (group: Group) => Effect.promise(() => repo.update(group)),
          delete: (id: string) => Effect.promise(() => repo.delete(id)),
          exists: (id: string) => Effect.promise(() => repo.exists(id)),
          countByTripId: (tripId: string) =>
            Effect.promise(() => repo.countByTripId(tripId)),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(GetGroupNotFoundError);
      }
    });

    it("should return deleted group if it exists", async () => {
      // Arrange - create a deleted group
      const groupResult = Group.create({
        id: "group-deleted",
        tripId: "trip-123",
        name: "Deleted Group",
        code: "DELETED",
        organizerId: "user-123",
        description: null,
        image: null,
        coins: 0,
        status: GroupStatus.DELETED,
      });
      if (groupResult.kind === "err") {
        throw new Error("Failed to create test group");
      }
      const deletedGroup = groupResult.value;
      await repo.create(deletedGroup);

      const input: GetGroupInput = {
        groupId: "group-deleted",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.id).toBe("group-deleted");
      expect(result.isActive).toBe(false);
      expect(result.status).toBe("DELETED");
    });

    it("should return correct summary for group", async () => {
      // Arrange
      const mockGroup = createValidGroup({
        name: "Adventure Group",
        coins: 500,
      });
      await repo.create(mockGroup);

      const input: GetGroupInput = {
        groupId: "group-123",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.summary).toContain("Adventure Group");
    });
  });
});
