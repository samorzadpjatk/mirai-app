import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteGroupUseCase,
  type DeleteGroupInput,
  DeleteGroupNotFoundError,
} from "./DeleteGroup";
import { Group, GroupStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { GroupRepositoryTag } from "../ports/GroupRepository";
import { InMemoryGroupRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] deleteGroupUseCase (Effect)", () => {
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
    }>,
  ): Group => {
    const result = Group.create({
      id: overrides?.id ?? "group-123",
      tripId: overrides?.tripId ?? "trip-123",
      name: overrides?.name ?? "Test Group",
      code: overrides?.code ?? "TEST123",
      organizerId: overrides?.organizerId ?? "user-123",
      description: null,
      image: null,
      coins: 100,
      status: GroupStatus.ACTIVE,
    });
    if (result.kind === "err") {
      throw new Error(`Failed to create test group: ${result.error.message}`);
    }
    return result.value;
  };

  // Helper to run use case with repository
  const runUseCase = async (input: DeleteGroupInput) => {
    const program = deleteGroupUseCase(input).pipe(
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
    it("should delete group when found", async () => {
      // Arrange
      const existingGroup = createValidGroup({ id: "group-to-delete" });
      await repo.create(existingGroup);

      const input: DeleteGroupInput = {
        groupId: "group-to-delete",
      };

      // Verify group exists before deletion
      const beforeDelete = await repo.findById("group-to-delete");
      expect(beforeDelete).not.toBeNull();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedGroupId).toBe("group-to-delete");

      // Verify group was actually deleted
      const afterDelete = await repo.findById("group-to-delete");
      expect(afterDelete).toBeNull();
    });

    it("should fail when group not found", async () => {
      // Arrange
      const input: DeleteGroupInput = {
        groupId: "non-existent-id",
      };

      // Act
      const program = deleteGroupUseCase(input).pipe(
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
        expect(either.left).toBeInstanceOf(DeleteGroupNotFoundError);
      }
    });

    it("should not affect other groups when deleting one", async () => {
      // Arrange
      const group1 = createValidGroup({ id: "user-1", code: "CODE1" });
      const group2 = createValidGroup({ id: "user-2", code: "CODE2" });
      const group3 = createValidGroup({ id: "user-3", code: "CODE3" });

      await repo.create(group1);
      await repo.create(group2);
      await repo.create(group3);

      const input: DeleteGroupInput = {
        groupId: "user-2",
      };

      // Act
      await runUseCase(input);

      // Assert
      const allGroups = await repo.findAll();
      expect(allGroups).toHaveLength(2);
      expect(allGroups.find((g) => g.id === "user-1")).not.toBeNull();
      expect(allGroups.find((g) => g.id === "user-2")).toBeUndefined();
      expect(allGroups.find((g) => g.id === "user-3")).not.toBeNull();
    });
  });
});
