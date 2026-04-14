import { describe, it, expect, mock } from "bun:test";
import {
  getLocationUseCase,
  type GetLocationInput,
  LocationNotFoundError,
} from "./GetLocation";
import { Location } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import type { Location as DomainLocation } from "@mirai-app/domain";

describe("[UNIT] getLocationUseCase (Effect)", () => {
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

  const createMockRepoService = (overrides?: {
    findByUserId?: (userId: string) => Promise<DomainLocation | null>;
  }) => ({
    create: (location: DomainLocation) =>
      Effect.promise(() => Promise.resolve(location)),
    findById: (id: string) => Effect.promise(() => Promise.resolve(null)),
    findByUserId: (userId: string) =>
      Effect.promise(() =>
        overrides?.findByUserId
          ? overrides.findByUserId(userId)
          : Promise.resolve(null),
      ),
    findAll: (options?: { limit?: number; offset?: number }) =>
      Effect.promise(() => Promise.resolve([])),
    findSharingWithUser: (userId: string) =>
      Effect.promise(() => Promise.resolve([])),
    findByUserIds: (userIds: string[]) =>
      Effect.promise(() => Promise.resolve([])),
    save: (location: DomainLocation) =>
      Effect.promise(() => Promise.resolve(location)),
    delete: (id: string) => Effect.promise(() => Promise.resolve()),
    deleteByUserId: (userId: string) => Effect.promise(() => Promise.resolve()),
    existsForUser: (userId: string) =>
      Effect.promise(() => Promise.resolve(false)),
  });

  const runUseCase = async (
    input: GetLocationInput,
    repoOverrides?: {
      findByUserId?: (userId: string) => Promise<DomainLocation | null>;
    },
  ) => {
    const program = getLocationUseCase(input).pipe(
      Effect.provideService(
        LocationRepositoryTag,
        createMockRepoService(repoOverrides),
      ),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should return location when found by userId", async () => {
      // Arrange
      const mockLocation = createValidLocation({
        id: "loc-456",
        userId: "user-456",
        latitude: 48.8566,
        longitude: 2.3522,
      });

      // Act
      const result = await runUseCase(
        { userId: "user-456" },
        { findByUserId: () => Promise.resolve(mockLocation) },
      );

      // Assert
      expect(result.id).toBe("loc-456");
      expect(result.userId).toBe("user-456");
      expect(result.latitude).toBe(48.8566);
      expect(result.longitude).toBe(2.3522);
      expect(result.accuracy).toBe(10);
      expect(result.altitude).toBe(100);
      expect(result.altitudeAccuracy).toBe(5);
      expect(result.heading).toBe(90);
      expect(result.speed).toBe(25);
      expect(result.isSharingLocation).toBe(false);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.usersToShareWith).toEqual([]);
    });

    it("should fail when location not found", async () => {
      // Arrange
      const program = getLocationUseCase({ userId: "non-existent-user" }).pipe(
        Effect.provideService(
          LocationRepositoryTag,
          createMockRepoService({ findByUserId: () => Promise.resolve(null) }),
        ),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(LocationNotFoundError);
      }
    });

    it("should return location with null coordinates", async () => {
      // Arrange - Create location with explicit null coordinates
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

      // Act
      const result = await runUseCase(
        { userId: "user-789" },
        { findByUserId: () => Promise.resolve(mockLocation) },
      );

      // Assert
      expect(result.id).toBe("loc-789");
      expect(result.userId).toBe("user-789");
      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
    });

    it("should return sharing location status correctly", async () => {
      // Arrange
      const mockLocation = createValidLocation({
        userId: "user-sharing",
        isSharingLocation: true,
      });

      // Act
      const result = await runUseCase(
        { userId: "user-sharing" },
        { findByUserId: () => Promise.resolve(mockLocation) },
      );

      // Assert
      expect(result.isSharingLocation).toBe(true);
    });

    it("should return location with sharing users list", async () => {
      // Arrange
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

      // Act
      const result = await runUseCase(
        { userId: "user-owner" },
        { findByUserId: () => Promise.resolve(mockLocation) },
      );

      // Assert
      expect(result.usersToShareWith).toHaveLength(2);
      expect(result.usersToShareWith[0].firstName).toBe("John");
      expect(result.usersToShareWith[1].firstName).toBe("Jane");
    });

    it("should propagate repository errors as defects", async () => {
      // Arrange
      const program = getLocationUseCase({ userId: "user-123" }).pipe(
        Effect.provideService(
          LocationRepositoryTag,
          createMockRepoService({
            findByUserId: () => Promise.reject(new Error("DB error")),
          }),
        ),
      );

      // Act & Assert
      await expect(Effect.runPromise(program)).rejects.toThrow("DB error");
    });
  });
});
