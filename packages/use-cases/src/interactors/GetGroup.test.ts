import { describe, it, expect, mock } from "bun:test";
import { GetGroupUseCase, type GetGroupInput } from "./GetGroup";
import { Group, GroupStatus } from "@mirai-app/domain";
import type { GroupRepository } from "../ports/GroupRepository";

describe("[UNIT] GetGroupUseCase", () => {
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
    it("should return group when found by ID", async () => {
      // Arrange
      const mockGroup = createValidGroup({
        id: "group-456",
        name: "My Group",
        tripId: "trip-456",
      });
      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(mockGroup)),
        findById: mock(() => Promise.resolve(mockGroup)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new GetGroupUseCase(mockRepo);
      const input: GetGroupInput = {
        groupId: "group-456",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
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
      expect(mockRepo.findById).toHaveBeenCalledWith("group-456");
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

      const useCase = new GetGroupUseCase(mockRepo);
      const input: GetGroupInput = {
        groupId: "non-existent-id",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Group not found");
      }
      expect(mockRepo.findById).toHaveBeenCalledWith("non-existent-id");
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

      const useCase = new GetGroupUseCase(mockRepo);
      const input: GetGroupInput = {
        groupId: "group-123",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Failed to load group");
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

      const useCase = new GetGroupUseCase(mockRepo);
      const input: GetGroupInput = {
        groupId: "group-deleted",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("group-deleted");
        expect(result.value.isActive).toBe(false);
        expect(result.value.status).toBe("DELETED");
      }
    });

    it("should return correct summary for group", async () => {
      // Arrange
      const mockGroup = createValidGroup({
        name: "Adventure Group",
        coins: 500,
      });
      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(mockGroup)),
        findById: mock(() => Promise.resolve(mockGroup)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new GetGroupUseCase(mockRepo);
      const input: GetGroupInput = {
        groupId: "group-123",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.summary).toContain("Adventure Group");
      }
    });
  });
});
