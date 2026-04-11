import { describe, it, expect, mock, beforeEach } from "bun:test";
import { CreateGroupUseCase, type CreateGroupInput } from "./CreateGroup";
import { Group, GroupStatus } from "@mirai-app/domain";
import type { GroupRepository } from "../ports/GroupRepository";

describe("[UNIT] CreateGroupUseCase", () => {
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

  describe("execute", () => {
    it("should create group with valid input", async () => {
      // Arrange
      const mockGroup = createValidGroup();
      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(mockGroup)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new CreateGroupUseCase(mockRepo);
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST123",
        organizerId: "user-123",
        coins: 100,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.tripId).toBe("trip-123");
        expect(result.value.name).toBe("Test Group");
        expect(result.value.code).toBe("TEST123");
        expect(result.value.organizerId).toBe("user-123");
        expect(result.value.coins).toBe(100);
        expect(result.value.status).toBe("ACTIVE");
      }
      expect(mockRepo.findByCode).toHaveBeenCalledWith("TEST123");
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should return error when group code already exists", async () => {
      // Arrange
      const existingGroup = createValidGroup({ code: "EXISTING" });
      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(existingGroup)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(existingGroup)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(existingGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(true)),
        countByTripId: mock(() => Promise.resolve(1)),
      };

      const useCase = new CreateGroupUseCase(mockRepo);
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "EXISTING",
        organizerId: "user-123",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Group code already exists");
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should return error when group name is empty", async () => {
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

      const useCase = new CreateGroupUseCase(mockRepo);
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "", // Empty name
        code: "TEST123",
        organizerId: "user-123",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("name");
      }
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should return error when tripId is empty", async () => {
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

      const useCase = new CreateGroupUseCase(mockRepo);
      const input: CreateGroupInput = {
        tripId: "", // Empty tripId
        name: "Test Group",
        code: "TEST123",
        organizerId: "user-123",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("tripId");
      }
    });

    it("should return error when organizerId is empty", async () => {
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

      const useCase = new CreateGroupUseCase(mockRepo);
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST123",
        organizerId: "", // Empty organizerId
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("organizerId");
      }
    });

    it("should use default values when optional fields not provided", async () => {
      // Arrange - the repository should be called with a group created using defaults
      const mockGroupWithDefaults = createValidGroup({
        coins: 0,
        status: GroupStatus.ACTIVE,
      });
      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(mockGroupWithDefaults)),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockGroupWithDefaults)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new CreateGroupUseCase(mockRepo);
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST123",
        organizerId: "user-123",
        // coins, description, image, status not provided
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      // Verify repository was called (success path executed)
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should return error when repository fails to check code", async () => {
      // Arrange
      const mockRepo: GroupRepository = {
        create: mock(() => Promise.resolve(createValidGroup())),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.reject(new Error("DB error"))),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(createValidGroup())),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new CreateGroupUseCase(mockRepo);
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST123",
        organizerId: "user-123",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Failed to check group code");
      }
    });

    it("should return error when repository fails to create", async () => {
      // Arrange
      const mockGroup = createValidGroup();
      const mockRepo: GroupRepository = {
        create: mock(() => Promise.reject(new Error("DB error"))),
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new CreateGroupUseCase(mockRepo);
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST123",
        organizerId: "user-123",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Failed to create group");
      }
    });

    it("should pass optional description and image to repository", async () => {
      // Arrange - verify that the use case accepts optional fields
      const mockGroup = createValidGroup();
      const createMock = mock(() => Promise.resolve(mockGroup));
      const mockRepo: GroupRepository = {
        create: createMock,
        findById: mock(() => Promise.resolve(null)),
        findByTripId: mock(() => Promise.resolve([])),
        findByStatus: mock(() => Promise.resolve([])),
        findByTripIdAndStatus: mock(() => Promise.resolve([])),
        findByOrganizerId: mock(() => Promise.resolve([])),
        findByCode: mock(() => Promise.resolve(null)),
        findAll: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve(mockGroup)),
        delete: mock(() => Promise.resolve()),
        exists: mock(() => Promise.resolve(false)),
        countByTripId: mock(() => Promise.resolve(0)),
      };

      const useCase = new CreateGroupUseCase(mockRepo);
      const input: CreateGroupInput = {
        tripId: "trip-123",
        name: "Test Group",
        code: "TEST123",
        organizerId: "user-123",
        description: "A test group description",
        image: "https://example.com/image.png",
        coins: 500,
        status: GroupStatus.ACTIVE,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      // Verify repository was called
      expect(createMock).toHaveBeenCalled();
    });
  });
});
