import { describe, it, expect, mock } from "bun:test";
import {
  UpdateLocationUseCase,
  type UpdateLocationInput,
} from "./UpdateLocation";
import { Location } from "@mirai-app/domain";
import type { LocationRepository } from "../ports/LocationRepository";

describe("[UNIT] UpdateLocationUseCase", () => {
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
    it("should create new location when user has no existing location", async () => {
      // Arrange
      const newLocation = createValidLocation({
        id: "loc-new",
        userId: "user-123",
        latitude: 48.8566,
        longitude: 2.3522,
      });
      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(null)),
        create: mock(() => Promise.resolve(newLocation)),
      });

      const useCase = new UpdateLocationUseCase(mockRepo);
      const input: UpdateLocationInput = {
        userId: "user-123",
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 15,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.latitude).toBe(48.8566);
        expect(result.value.longitude).toBe(2.3522);
      }
      expect(mockRepo.findByUserId).toHaveBeenCalledWith("user-123");
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it("should update existing location coordinates", async () => {
      // Arrange
      const existingLocation = createValidLocation({
        userId: "user-123",
        latitude: 50.0,
        longitude: 10.0,
      });
      const updatedLocation = createValidLocation({
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
      });

      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(existingLocation)),
        save: mock(() => Promise.resolve(updatedLocation)),
      });

      const useCase = new UpdateLocationUseCase(mockRepo);
      const input: UpdateLocationInput = {
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.latitude).toBe(52.52);
        expect(result.value.longitude).toBe(13.405);
      }
      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should start sharing location when isSharingLocation is true", async () => {
      // Arrange
      const existingLocation = createValidLocation({
        userId: "user-123",
        isSharingLocation: false,
      });
      const sharingLocation = createValidLocation({
        userId: "user-123",
        isSharingLocation: true,
      });

      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(existingLocation)),
        save: mock(() => Promise.resolve(sharingLocation)),
      });

      const useCase = new UpdateLocationUseCase(mockRepo);
      const input: UpdateLocationInput = {
        userId: "user-123",
        isSharingLocation: true,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isSharingLocation).toBe(true);
      }
    });

    it("should stop sharing location when isSharingLocation is false", async () => {
      // Arrange
      const existingLocation = createValidLocation({
        userId: "user-123",
        isSharingLocation: true,
      });
      const notSharingLocation = createValidLocation({
        userId: "user-123",
        isSharingLocation: false,
      });

      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(existingLocation)),
        save: mock(() => Promise.resolve(notSharingLocation)),
      });

      const useCase = new UpdateLocationUseCase(mockRepo);
      const input: UpdateLocationInput = {
        userId: "user-123",
        isSharingLocation: false,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.value.isSharingLocation).toBe(false);
      }
    });

    it("should return error when userId is empty", async () => {
      // Arrange
      const mockRepo = createMockRepo();

      const useCase = new UpdateLocationUseCase(mockRepo);
      const input: UpdateLocationInput = {
        userId: "", // Empty userId
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
      if (result.kind === "err") {
        expect(result.error).toContain("userId");
      }
    });

    it("should update altitude, heading, and speed", async () => {
      // Arrange
      const existingLocation = createValidLocation({ userId: "user-123" });
      const updatedLocation = createValidLocation({
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
      });

      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(existingLocation)),
        save: mock(() => Promise.resolve(updatedLocation)),
      });

      const useCase = new UpdateLocationUseCase(mockRepo);
      const input: UpdateLocationInput = {
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
        altitude: 200,
        altitudeAccuracy: 10,
        heading: 180,
        speed: 50,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it("should handle repository errors during find", async () => {
      // Arrange
      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.reject(new Error("DB error"))),
      });

      const useCase = new UpdateLocationUseCase(mockRepo);
      const input: UpdateLocationInput = {
        userId: "user-123",
        latitude: 52.52,
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow("DB error");
    });

    it("should return error when coordinate validation fails", async () => {
      // Arrange
      const existingLocation = createValidLocation({ userId: "user-123" });

      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(existingLocation)),
      });

      const useCase = new UpdateLocationUseCase(mockRepo);
      const input: UpdateLocationInput = {
        userId: "user-123",
        latitude: -999, // Invalid latitude
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("err");
    });

    it("should update with partial coordinate data", async () => {
      // Arrange
      const existingLocation = createValidLocation({
        userId: "user-123",
        latitude: 50.0,
        longitude: 10.0,
      });
      const updatedLocation = createValidLocation({
        userId: "user-123",
        latitude: 55.0,
        longitude: 10.0, // longitude unchanged
      });

      const mockRepo = createMockRepo({
        findByUserId: mock(() => Promise.resolve(existingLocation)),
        save: mock(() => Promise.resolve(updatedLocation)),
      });

      const useCase = new UpdateLocationUseCase(mockRepo);
      const input: UpdateLocationInput = {
        userId: "user-123",
        latitude: 55.0, // Only update latitude
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.kind).toBe("ok");
    });
  });
});
