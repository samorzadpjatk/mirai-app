import { describe, it, expect, mock } from "bun:test";
import { GetLocationUseCase, type GetLocationInput } from "./GetLocation";
import { Location } from "@mirai-app/domain";
import type { LocationRepository } from "../ports/LocationRepository";

describe("[UNIT] GetLocationUseCase", () => {
  // Helper to create a valid location
  const createValidLocation = (
    overrides?: Partial<{
      id: string;
      userId: string;
      latitude: number | null;
      longitude: number | null;
      isSharingLocation: boolean;
    }>,
  ): Location => {
    const result = Location.create({
      id: overrides?.id ?? "loc-123",
      userId: overrides?.userId ?? "user-123",
      latitude: overrides?.latitude ?? 52.52,
      longitude: overrides?.longitude ?? 13.405,
      accuracy: 10,
      altitude: 100,
      altitudeAccuracy: 5,
      heading: 90,
      speed: 25,
      isSharingLocation: overrides?.isSharingLocation ?? false,
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
    it("should return location when found by userId", async () => {
      // Arrange
      const mockLocation = createValidLocation({
        id: "loc-456",
        userId: "user-456",
        latitude: 48.8566,
        longitude: 2.3522,
      });
      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(mockLocation)),
      });

      const useCase = new GetLocationUseCase(mockRepo);
      const input: GetLocationInput = {
        userId: "user-456",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.id).toBe("loc-456");
        expect(result.value.userId).toBe("user-456");
        expect(result.value.latitude).toBe(48.8566);
        expect(result.value.longitude).toBe(2.3522);
        expect(result.value.accuracy).toBe(10);
        expect(result.value.altitude).toBe(100);
        expect(result.value.altitudeAccuracy).toBe(5);
        expect(result.value.heading).toBe(90);
        expect(result.value.speed).toBe(25);
        expect(result.value.isSharingLocation).toBe(false);
        expect(result.value.timestamp).toBeInstanceOf(Date);
        expect(result.value.usersToShareWith).toEqual([]);
      }
      expect(mockRepo.findByUserId).toHaveBeenCalledWith("user-456");
    });

    it("should return error when location not found", async () => {
      // Arrange
      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(null)),
      });

      const useCase = new GetLocationUseCase(mockRepo);
      const input: GetLocationInput = {
        userId: "non-existent-user",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toBe("Location not found");
      }
      expect(mockRepo.findByUserId).toHaveBeenCalledWith("non-existent-user");
    });

    it("should return location with null coordinates", async () => {
      // Arrange - Create location with explicit null coordinates
      const locationResult = Location.create({
        id: "loc-789",
        userId: "user-789",
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
        findByUserId: mock(() => Promise.resolve(mockLocation)),
      });

      const useCase = new GetLocationUseCase(mockRepo);
      const input: GetLocationInput = {
        userId: "user-789",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      // Verify repository was called
      expect(mockRepo.findByUserId).toHaveBeenCalledWith("user-789");
    });

    it("should return sharing location status correctly", async () => {
      // Arrange
      const mockLocation = createValidLocation({
        userId: "user-sharing",
        isSharingLocation: true,
      });
      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(mockLocation)),
      });

      const useCase = new GetLocationUseCase(mockRepo);
      const input: GetLocationInput = {
        userId: "user-sharing",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isSharingLocation).toBe(true);
      }
    });

    it("should return location with sharing users list", async () => {
      // Arrange
      const locationResult = Location.create({
        id: "loc-sharing",
        userId: "user-owner",
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        isSharingLocation: true,
        usersToShareWith: [
          { id: "user-1", firstName: "John", lastName: "Doe" },
          { id: "user-2", firstName: "Jane", lastName: "Smith" },
        ],
      });
      if (locationResult.kind === "err") {
        throw new Error("Failed to create test location");
      }
      const mockLocation = locationResult.value;

      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(mockLocation)),
      });

      const useCase = new GetLocationUseCase(mockRepo);
      const input: GetLocationInput = {
        userId: "user-owner",
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.usersToShareWith).toHaveLength(2);
        expect(result.value.usersToShareWith[0].firstName).toBe("John");
        expect(result.value.usersToShareWith[1].firstName).toBe("Jane");
      }
    });

    it("should handle repository errors", async () => {
      // Arrange
      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new GetLocationUseCase(mockRepo);
      const input: GetLocationInput = {
        userId: "user-123",
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });
  });
});
