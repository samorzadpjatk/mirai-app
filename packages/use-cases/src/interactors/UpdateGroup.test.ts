import { describe, it, expect, mock } from "bun:test";
import { UpdateGroupUseCase, type UpdateGroupInput } from "./UpdateGroup";
import { Group, GroupStatus } from "@mirai-app/domain";
import type { GroupRepository } from "../ports/GroupRepository";

describe("[UNIT] UpdateGroupUseCase", () => {
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

  describe("execute", () => {
    it("should update group name successfully", async () => {
      // Arrange
      const existingGroup = createValidGroup({
        id: "group-456",
        name: "Old Name",
      });
      const updatedGroup = createValidGroup({
        id: "group-456",
        name: "New Name",
      });

      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(existingGroup)),
        findById: mock(() => Promise.resolve(existingGroup)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateGroupUseCase(mockRepo);
      const input: UpdateGroupInput = {
        groupId: "group-456",
        name: "New Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("New Name");
        expect(result.value.id).toBe("group-456");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("group-456");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should update group description and image", async () => {
      // Arrange
      const existingGroup = createValidGroup({ id: "group-456" });
      const updatedGroup = createValidGroup({
        id: "group-456",
        name: "Test Group",
      });

      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(existingGroup)),
        findById: mock(() => Promise.resolve(existingGroup)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateGroupUseCase(mockRepo);
      const input: UpdateGroupInput = {
        groupId: "group-456",
        description: "Updated description",
        image: "https://example.com/new-image.png",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should update organizerId successfully", async () => {
      // Arrange
      const existingGroup = createValidGroup({
        id: "group-456",
        organizerId: "user-old",
      });
      const updatedGroup = createValidGroup({
        id: "group-456",
        organizerId: "user-new",
      });

      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(existingGroup)),
        findById: mock(() => Promise.resolve(existingGroup)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(updatedGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateGroupUseCase(mockRepo);
      const input: UpdateGroupInput = {
        groupId: "group-456",
        organizerId: "user-new",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.organizerId).toBe("user-new");
      }
    });

    it("should return error when group not found", async () => {
      // Arrange
      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(createValidGroup())),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(createValidGroup())),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new UpdateGroupUseCase(mockRepo);
      const input: UpdateGroupInput = {
        groupId: "non-existent-id",
        name: "New Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Group not found");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error when group is deleted", async () => {
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

      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(deletedGroup)),
        findById: mock(() => Promise.resolve(deletedGroup)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(deletedGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateGroupUseCase(mockRepo);
      const input: UpdateGroupInput = {
        groupId: "group-deleted",
        name: "New Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Cannot update a deleted group");
      }
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("should return error when repository fails to load", async () => {
      // Arrange
      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(createValidGroup())),
        findById: mock(() => Promise.reject(new Error("DB error"))),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(createValidGroup())),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new UpdateGroupUseCase(mockRepo);
      const input: UpdateGroupInput = {
        groupId: "group-123",
        name: "New Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Failed to load group");
      }
    });

    it("should return error when repository fails to update", async () => {
      // Arrange
      const existingGroup = createValidGroup({ id: "group-456" });

      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(existingGroup)),
        findById: mock(() => Promise.resolve(existingGroup)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.reject(new Error("DB error"))),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateGroupUseCase(mockRepo);
      const input: UpdateGroupInput = {
        groupId: "group-456",
        name: "New Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Failed to update group");
      }
    });

    it("should return error when name validation fails", async () => {
      // Arrange
      const existingGroup = createValidGroup({ id: "group-456" });

      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(existingGroup)),
        findById: mock(() => Promise.resolve(existingGroup)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(existingGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateGroupUseCase(mockRepo);
      const input: UpdateGroupInput = {
        groupId: "group-456",
        name: "", // Invalid empty name
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("name");
      }
    });

    it("should not update when no fields provided", async () => {
      // Arrange
      const existingGroup = createValidGroup({
        id: "group-456",
        name: "Original Name",
      });

      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(existingGroup)),
        findById: mock(() => Promise.resolve(existingGroup)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(existingGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateGroupUseCase(mockRepo);
      const input: UpdateGroupInput = {
        groupId: "group-456",
        // No fields to update
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.name).toBe("Original Name");
      }
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it("should include isActive and summary in output", async () => {
      // Arrange
      const existingGroup = createValidGroup({ id: "group-456" });

      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(existingGroup)),
        findById: mock(() => Promise.resolve(existingGroup)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(existingGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new UpdateGroupUseCase(mockRepo);
      const input: UpdateGroupInput = {
        groupId: "group-456",
        name: "Updated Name",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isActive).toBe(true);
        expect(result.value.summary).toBeDefined();
        expect(result.value.updatedAt).toBeInstanceOf(Date);
      }
    });
  });
});
