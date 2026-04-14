import { describe, it, expect, beforeEach } from "bun:test";
import {
  GetLocationUseCase,
  getLocationUseCase,
  type GetLocationInput,
  LocationNotFoundError,
} from "./GetLocation";
import { Location, type Result, isOk, isErr } from "@mirai-app/domain";
import type { LocationRepository } from "../ports/LocationRepository";
import type { Location as DomainLocation, LocationId } from "@mirai-app/domain";

/**
 * Simple mock repository for testing (Promise-based)
 */
function createMockRepository(overrides?: {
  findByUserId?: (userId: string) => Promise<DomainLocation | null>;
}): LocationRepository {
  return {
    create: async (location: DomainLocation) => location,
    findById: async () => null,
    findByUserId: async (userId: string) => {
      return overrides?.findByUserId
        ? await overrides.findByUserId(userId)
        : null;
    },
    findAll: async () => [],
    findSharingWithUser: async () => [],
    findByUserIds: async () => [],
    save: async (location: DomainLocation) => location,
    delete: async () => {},
    deleteByUserId: async () => {},
    existsForUser: async () => false,
  };
}

describe("[UNIT] GetLocationUseCase - Async/Await", () => {
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
    const { Effect } = require("effect");
    const effect = Location.create({
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
    return Effect.runSync(effect);
  };

  describe("[UNIT] execute", () => {
    it("should return location when found by userId", async () => {
      // Arrange
      const mockLocation = createValidLocation({
        id: "loc-456",
        userId: "user-456",
        latitude: 48.8566,
        longitude: 2.3522,
      });
      const repo = createMockRepository({
        findByUserId: () => Promise.resolve(mockLocation),
      });
      const useCase = new GetLocationUseCase(repo);

      // Act
      const result = await useCase.execute({ userId: "user-456" });

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
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
    });

    it("should fail when location not found", async () => {
      // Arrange
      const repo = createMockRepository({
        findByUserId: () => Promise.resolve(null),
      });
      const useCase = new GetLocationUseCase(repo);

      // Act
      const result = await useCase.execute({ userId: "non-existent-user" });

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(LocationNotFoundError);
      }
    });

    it("should return location with null coordinates", async () => {
      // Arrange - Create location with explicit null coordinates
      const { Effect } = require("effect");
      const mockLocation = Effect.runSync(
        Location.create({
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
        }),
      );
      const repo = createMockRepository({
        findByUserId: () => Promise.resolve(mockLocation),
      });
      const useCase = new GetLocationUseCase(repo);

      // Act
      const result = await useCase.execute({ userId: "user-789" });

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.id).toBe("loc-789");
        expect(result.value.userId).toBe("user-789");
        expect(result.value.latitude).toBeNull();
        expect(result.value.longitude).toBeNull();
      }
    });

    it("should return sharing location status correctly", async () => {
      // Arrange
      const mockLocation = createValidLocation({
        userId: "user-sharing",
        isSharingLocation: true,
      });
      const repo = createMockRepository({
        findByUserId: () => Promise.resolve(mockLocation),
      });
      const useCase = new GetLocationUseCase(repo);

      // Act
      const result = await useCase.execute({ userId: "user-sharing" });

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.isSharingLocation).toBe(true);
      }
    });

    it("should return location with sharing users list", async () => {
      // Arrange
      const { Effect } = require("effect");
      const mockLocation = Effect.runSync(
        Location.create({
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
        }),
      );
      const repo = createMockRepository({
        findByUserId: () => Promise.resolve(mockLocation),
      });
      const useCase = new GetLocationUseCase(repo);

      // Act
      const result = await useCase.execute({ userId: "user-owner" });

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.usersToShareWith).toHaveLength(2);
        expect(result.value.usersToShareWith[0].firstName).toBe("John");
        expect(result.value.usersToShareWith[1].firstName).toBe("Jane");
      }
    });

    it("should propagate repository errors as exceptions", async () => {
      // Arrange
      const repo = createMockRepository({
        findByUserId: () => Promise.reject(new Error("DB error")),
      });
      const useCase = new GetLocationUseCase(repo);

      // Act & Assert
      await expect(useCase.execute({ userId: "user-123" })).rejects.toThrow(
        "DB error",
      );
    });
  });

  describe("[UNIT] legacy function-based API", () => {
    it("should work with legacy function API", async () => {
      // Arrange
      const mockLocation = createValidLocation({
        id: "loc-legacy",
        userId: "user-legacy",
      });
      const repo = createMockRepository({
        findByUserId: () => Promise.resolve(mockLocation),
      });

      // Act
      const result = await getLocationUseCase({ userId: "user-legacy" }, repo);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.id).toBe("loc-legacy");
      }
    });
  });
});
