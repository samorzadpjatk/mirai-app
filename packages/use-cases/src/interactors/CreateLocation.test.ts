import { describe, it, expect, beforeEach } from "bun:test";
import {
  createLocationUseCase,
  type CreateLocationInput,
  LocationCreationError,
  LocationUpdateError,
} from "./CreateLocation";
import { Location, LocationId, UserId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import { InMemoryLocationRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] createLocationUseCase (Effect)", () => {
  let repo: InMemoryLocationRepository;

  beforeEach(() => {
    repo = new InMemoryLocationRepository();
  });

  // Helper to create a valid location
  const createValidLocation = (
    overrides?: Partial<{
      id: string;
      userId: string;
      latitude: number | null;
      longitude: number | null;
    }>,
  ): Location => {
    const effect = Location.create({
      id: LocationId.unsafeCreate(overrides?.id ?? "loc-123"),
      userId: UserId.unsafeCreate(overrides?.userId ?? "user-123"),
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
    try {
      return Effect.runSync(effect);
    } catch (e) {
      throw new Error(`Failed to create test location: ${e}`);
    }
  };

  // Helper to run use case with repository
  const runUseCase = async (input: CreateLocationInput) => {
    const program = createLocationUseCase(input).pipe(
      Effect.provideService(LocationRepositoryTag, {
        create: (location: Location) => repo.create(location),
        findById: (id: LocationId) => repo.findById(id),
        findByUserId: (userId: string) => repo.findByUserId(userId),
        findAll: (options?: { limit?: number; offset?: number }) =>
          repo.findAll(options),
        findSharingWithUser: (userId: string) =>
          repo.findSharingWithUser(userId),
        findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
        save: (location: Location) => repo.save(location),
        delete: (id: LocationId) => repo.delete(id),
        deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
        existsForUser: (userId: string) => repo.existsForUser(userId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should create new location when user has no existing location", async () => {
      // Arrange
      const input: CreateLocationInput = {
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 10,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.userId).toBe("user-123");
      expect(result.latitude).toBe(52.52);
      expect(result.longitude).toBe(13.405);
      expect(result.accuracy).toBe(10);
      expect(result.isSharingLocation).toBe(false);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.usersToShareWith).toEqual([]);

      // Verify location was actually stored
      const stored = Effect.runSync(repo.findByUserId("user-123"));
      expect(stored).not.toBeNull();
      expect(stored?.userId).toBe("user-123");
    });

    it("should update existing location when user already has one", async () => {
      // Arrange - seed existing location
      const existingLocation = createValidLocation({
        id: "loc-existing",
        userId: "user-123",
        latitude: 50.0,
        longitude: 10.0,
      });
      Effect.runSync(repo.create(existingLocation));

      const input: CreateLocationInput = {
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
        accuracy: 15,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.userId).toBe("user-123");
      expect(result.latitude).toBe(52.52);
      expect(result.longitude).toBe(13.405);

      // Verify location was updated, not created
      const allLocations = Effect.runSync(repo.findAll());
      expect(allLocations).toHaveLength(1);
    });

    it("should fail when domain validation fails (empty userId)", async () => {
      const input: CreateLocationInput = {
        userId: "", // Empty userId
        latitude: 52.52,
        longitude: 13.405,
      };

      // Act
      const program = createLocationUseCase(input).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location: Location) => repo.create(location),
          findById: (id: LocationId) => repo.findById(id),
          findByUserId: (userId: string) => repo.findByUserId(userId),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          findSharingWithUser: (userId: string) =>
            repo.findSharingWithUser(userId),
          findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
          save: (location: Location) => repo.save(location),
          delete: (id: LocationId) => repo.delete(id),
          deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
          existsForUser: (userId: string) => repo.existsForUser(userId),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(LocationCreationError);
      }

      // Verify no location was stored
      const stored = Effect.runSync(repo.findByUserId(""));
      expect(stored).toBeNull();
    });

    it("should create location with all optional fields", async () => {
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
      const result = await runUseCase(input);

      // Assert
      expect(result.userId).toBe("user-123");

      // Verify location was stored
      const stored = Effect.runSync(repo.findByUserId("user-123"));
      expect(stored).not.toBeNull();
    });

    it("should create location without coordinates (null values)", async () => {
      const input: CreateLocationInput = {
        userId: "user-123",
        latitude: null,
        longitude: null,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.userId).toBe("user-123");
      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();

      // Verify location was stored
      const stored = Effect.runSync(repo.findByUserId("user-123"));
      expect(stored).not.toBeNull();
    });

    it("should fail when domain validation fails during update", async () => {
      // Arrange - seed existing location
      const existingLocation = createValidLocation({ userId: "user-123" });
      Effect.runSync(repo.create(existingLocation));

      const input: CreateLocationInput = {
        userId: "user-123",
        latitude: -999, // Invalid latitude
      };

      // Act
      const program = createLocationUseCase(input).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location: Location) => repo.create(location),
          findById: (id: LocationId) => repo.findById(id),
          findByUserId: (userId: string) => repo.findByUserId(userId),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          findSharingWithUser: (userId: string) =>
            repo.findSharingWithUser(userId),
          findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
          save: (location: Location) => repo.save(location),
          delete: (id: LocationId) => repo.delete(id),
          deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
          existsForUser: (userId: string) => repo.existsForUser(userId),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(LocationUpdateError);
      }
    });
  });
});
