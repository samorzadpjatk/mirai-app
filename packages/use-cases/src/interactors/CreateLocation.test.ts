import { describe, it, expect, mock } from "bun:test";
import {
  CreateLocationUseCase,
  type CreateLocationInput,
} from "./CreateLocation";
import { Location } from "@mirai-app/domain";
import type { LocationRepository } from "../ports/LocationRepository";
import type { SharingUserInfo } from "@mirai-app/domain";

describe("[UNIT] CreateLocationUseCase", () => {
  // Helper to create a valid location
  const createValidLocation = (
    overrides?: Partial<{
      id: string;
      userId: string;
      latitude: number | null;
      longitude: number | null;
    }>,
  ): Location => {
    const result = Location.create({
      id: overrides?.id ?? "loc-123",
      userId: overrides?.userId ?? "user-123",
      latitude: overrides?.latitude ?? 52.52,
      longitude: overrides?.longitude ?? 13.405,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      isSharingLocation: false,
      usersToShareWith: [],
    });
    if (result.kind === "err") {
      throw new Error(
        `Failed to create test location: ${result.error.message}`,
      );
    }
    return result.value;
  };

  const createMockRepo = (
    overrides?: Partial<LocationRepository>,
  ): LocationRepository => ({
    create: mock(() => Promise.resolve(createValidLocation())),
    findById: mock(() => Promise.resolve(null)),
    findByUserId: mock(() => Promise.resolve(null)),
    findAll: mock(() => Promise.resolve([])),
    findSharingWithUser: mock(() => Promise.resolve([])),
    findByUserIds: mock(() => Promise.resolve([])),
    save: mock(() => Promise.resolve(createValidLocation())),
    delete: mock(() => Promise.resolve()),
    deleteByUserId: mock(() => Promise.resolve()),
    existsForUser: mock(() => Promise.resolve(false)),
    ...overrides,
  });

  describe("execute", () => {
    it("should create new location when user has no existing location", async () => {
      // Arrange
      const mockLocation = createValidLocation();
      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(null)),
        create: mock(() => Promise.resolve(mockLocation)),
      });

      const useCase = new CreateLocationUseCase(mockRepo);
      const input: CreateLocationInput = {
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.userId).toBe("user-123");
        expect(result.value.latitude).toBe(52.52);
        expect(result.value.longitude).toBe(13.405);
        expect(result.value.accuracy).toBe(10);
        expect(result.value.isSharingLocation).toBe(false);
        expect(result.value.timestamp).toBeInstanceOf(Date);
        expect(result.value.usersToShareWith).toEqual([]);
      }
      expect(mockRepo.findByUserId).toHaveBeenCalledWith("user-123");
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should update existing location when user already has one", async () => {
      // Arrange
      const existingLocation = createValidLocation({
        id: "loc-existing",
        userId: "user-123",
        latitude: 50.0,
        longitude: 10.0,
      });
      const updatedLocation = createValidLocation({
        id: "loc-existing",
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
      });

      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(existingLocation)),
        save: mock(() => Promise.resolve(updatedLocation)),
      });

      const useCase = new CreateLocationUseCase(mockRepo);
      const input: CreateLocationInput = {
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 15,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      expect(mockRepo.findByUserId).toHaveBeenCalledWith("user-123");
      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should return error when userId is empty", async () => {
      // Arrange
      const mockRepo = createMockRepo();

      const useCase = new CreateLocationUseCase(mockRepo);
      const input: CreateLocationInput = {
        userId: "", // Empty userId
        latitude: 52.52,
        longitude: 13.405,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("userId");
      }
    });

    it("should create location with all optional fields", async () => {
      // Arrange
      const mockLocation = createValidLocation();
      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(null)),
        create: mock(() => Promise.resolve(mockLocation)),
      });

      const useCase = new CreateLocationUseCase(mockRepo);
      const input: CreateLocationInput = {
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 10,
        altitude: 100,
        altitudeAccuracy: 5,
        heading: 90,
        speed: 25,
        isSharingLocation: true,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should create location without coordinates (null values)", async () => {
      // Arrange - mock repository to return location with null coordinates
      const locationResult = Location.create({
        id: "loc-null-coords",
        userId: "user-123",
        latitude: null,
        longitude: null,
        accuracy: null,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        isSharingLocation: false,
        usersToShareWith: [],
      });
      if (locationResult.kind === "err") {
        throw new Error("Failed to create test location");
      }
      const mockLocation = locationResult.value;

      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(null)),
        create: mock(() => Promise.resolve(mockLocation)),
      });

      const useCase = new CreateLocationUseCase(mockRepo);
      const input: CreateLocationInput = {
        userId: "user-123",
        latitude: null,
        longitude: null,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      // Verify success path (repository was called)
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("should return error when domain validation fails during update", async () => {
      // Arrange - Create location that will fail update validation
      const existingLocation = createValidLocation({ userId: "user-123" });

      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(existingLocation)),
      });

      const useCase = new CreateLocationUseCase(mockRepo);
      const input: CreateLocationInput = {
        userId: "user-123",
        latitude: -999, // Invalid latitude
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
    });

    it("should handle repository errors during find", async () => {
      // Arrange
      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new CreateLocationUseCase(mockRepo);
      const input: CreateLocationInput = {
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
      };

      // Act & Assert - should not throw, but return error
      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it("should work with usersToShareWith data", async () => {
      // Arrange
      const sharingUsers: SharingUserInfo[] = [
        { id: "user-2", firstName: "Jane", lastName: "Doe" },
      ];
      const mockLocationResult = Location.create({
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        isSharingLocation: true,
        usersToShareWith: sharingUsers,
      });
      if (mockLocationResult.kind === "err") {
        throw new Error("Failed to create test location");
      }
      const mockLocation = mockLocationResult.value;

      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(null)),
        create: mock(() => Promise.resolve(mockLocation)),
      });

      const useCase = new CreateLocationUseCase(mockRepo);
      const input: CreateLocationInput = {
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
        isSharingLocation: true,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.usersToShareWith).toHaveLength(1);
        expect(result.value.usersToShareWith[0].firstName).toBe("Jane");
      }
    });
  });
});
