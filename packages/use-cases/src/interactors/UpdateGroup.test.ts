import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateGroupUseCase,
  type UpdateGroupInput,
  UpdateGroupNotFoundError,
  UpdateGroupDeletedError,
  UpdateGroupValidationError,
} from "./UpdateGroup";
import { Group, GroupStatus } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { GroupRepositoryTag } from "../ports/GroupRepository";
import { InMemoryGroupRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] updateGroupUseCase (Effect)", () => {
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
  const runUseCase = async (input: UpdateGroupInput) => {
    const program = updateGroupUseCase(input).pipe(
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
    it("should update group name successfully", async () => {
      // Arrange
      const existingGroup = createValidGroup({
        id: "group-456",
        name: "Old Name",
      });
      await repo.create(existingGroup);

      const input: UpdateGroupInput = {
        groupId: "group-456",
        name: "New Name",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.name).toBe("New Name");
      expect(result.id).toBe("group-456");

      // Verify in repository
      const stored = await repo.findById("group-456");
      expect(stored?.name).toBe("New Name");
    });

    it("should update group description and image", async () => {
      // Arrange
      const existingGroup = createValidGroup({ id: "group-456" });
      await repo.create(existingGroup);

      const input: UpdateGroupInput = {
        groupId: "group-456",
        description: "Updated description",
        image: "https://example.com/new-image.png",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.description).toBe("Updated description");
      expect(result.image).toBe("https://example.com/new-image.png");
    });

    it("should update organizerId successfully", async () => {
      // Arrange
      const existingGroup = createValidGroup({
        id: "group-456",
        organizerId: "user-old",
      });
      await repo.create(existingGroup);

      const input: UpdateGroupInput = {
        groupId: "group-456",
        organizerId: "user-new",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.organizerId).toBe("user-new");

      // Verify in repository
      const stored = await repo.findById("group-456");
      expect(stored?.organizerId).toBe("user-new");
    });

    it("should fail when group not found", async () => {
      // Arrange
      const input: UpdateGroupInput = {
        groupId: "non-existent-id",
        name: "New Name",
      };

      // Act
      const program = updateGroupUseCase(input).pipe(
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

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateGroupNotFoundError);
      }
    });

    it("should fail when group is deleted", async () => {
      // Arrange
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

      const input: UpdateGroupInput = {
        groupId: "group-deleted",
        name: "New Name",
      };

      // Act
      const program = updateGroupUseCase(input).pipe(
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

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateGroupDeletedError);
      }
    });

    it("should fail when name validation fails", async () => {
      // Arrange
      const existingGroup = createValidGroup({ id: "group-456" });
      await repo.create(existingGroup);

      const input: UpdateGroupInput = {
        groupId: "group-456",
        name: "", // Invalid empty name
      };

      // Act
      const program = updateGroupUseCase(input).pipe(
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

      // Act & Assert
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(UpdateGroupValidationError);
        expect(either.left.message).toContain("name");
      }
    });

    it("should not update when no fields provided", async () => {
      // Arrange
      const existingGroup = createValidGroup({
        id: "group-456",
        name: "Original Name",
      });
      await repo.create(existingGroup);

      const input: UpdateGroupInput = {
        groupId: "group-456",
        // No fields to update
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.name).toBe("Original Name");
    });

    it("should include isActive and summary in output", async () => {
      // Arrange
      const existingGroup = createValidGroup({ id: "group-456" });
      await repo.create(existingGroup);

      const input: UpdateGroupInput = {
        groupId: "group-456",
        name: "Updated Name",
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isActive).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });
});
