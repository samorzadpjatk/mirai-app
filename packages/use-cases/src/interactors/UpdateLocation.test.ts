import { describe, it, expect, beforeEach } from "bun:test";
import {
  updateLocationUseCase,
  type UpdateLocationInput,
  LocationCreateError,
  LocationUpdateValidationError,
} from "./UpdateLocation";
import { Location } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import { InMemoryLocationGateway } from "@mirai-app/adapters/gateways/_shared/in-memory-exports";

describe("[UNIT] updateLocationUseCase (Effect)", () => {
  let repo: InMemoryLocationGateway;

  beforeEach(() => {
    repo = new InMemoryLocationGateway();
  });

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
    try {
      return Effect.runSync(effect);
    } catch (e) {
      throw new Error(`Failed to create test location: ${e}`);
    }
  };

  // Helper to run use case with repository
  const runUseCase = async (input: UpdateLocationInput) => {
    const program = updateLocationUseCase(input).pipe(
      Effect.provideService(LocationRepositoryTag, {
        create: (location: Location) => repo.create(location),
        findById: (id: string) => repo.findById(id),
        findByUserId: (userId: string) => repo.findByUserId(userId),
        findAll: (options?: { limit?: number; offset?: number }) =>
          repo.findAll(options),
        findSharingWithUser: (userId: string) =>
          repo.findSharingWithUser(userId),
        findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
        save: (location: Location) => repo.save(location),
        delete: (id: string) => repo.delete(id),
        deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
        existsForUser: (userId: string) => repo.existsForUser(userId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("[UNIT] execute", () => {
    it("should create new location when user has no existing location", async () => {
      // Arrange
      const input: UpdateLocationInput = {
        userId: "user-123",
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 15,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.latitude).toBe(48.8566);
      expect(result.longitude).toBe(2.3522);

      // Verify location was created
      const stored = Effect.runSync(repo.findByUserId("user-123"));
      expect(stored).not.toBeNull();
    });

    it("should update existing location coordinates", async () => {
      // Arrange - seed existing location
      const existingLocation = createValidLocation({
        userId: "user-123",
        latitude: 50.0,
        longitude: 10.0,
      });
      Effect.runSync(repo.create(existingLocation));

      const input: UpdateLocationInput = {
        userId: "user-123",
        latitude: 52.52,
        longitude: 13.405,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.latitude).toBe(52.52);
      expect(result.longitude).toBe(13.405);

      // Verify location was updated
      const stored = Effect.runSync(repo.findByUserId("user-123"));
      expect(stored?.latitude).toBe(52.52);
      expect(stored?.longitude).toBe(13.405);
    });

    it("should start sharing location when isSharingLocation is true", async () => {
      // Arrange - seed existing location with sharing disabled
      const existingLocation = createValidLocation({
        userId: "user-123",
        isSharingLocation: false,
      });
      Effect.runSync(repo.create(existingLocation));

      const input: UpdateLocationInput = {
        userId: "user-123",
        isSharingLocation: true,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isSharingLocation).toBe(true);

      // Verify location was updated
      const stored = Effect.runSync(repo.findByUserId("user-123"));
      expect(stored?.isSharingLocation()).toBe(true);
    });

    it("should stop sharing location when isSharingLocation is false", async () => {
      // Arrange - seed existing location with sharing enabled
      const existingLocation = createValidLocation({
        userId: "user-123",
        isSharingLocation: true,
      });
      Effect.runSync(repo.create(existingLocation));

      const input: UpdateLocationInput = {
        userId: "user-123",
        isSharingLocation: false,
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.isSharingLocation).toBe(false);

      // Verify location was updated
      const stored = Effect.runSync(repo.findByUserId("user-123"));
      expect(stored?.isSharingLocation()).toBe(false);
    });

    it("should fail when domain validation fails for empty userId", async () => {
      const input: UpdateLocationInput = {
        userId: "", // Empty userId
        latitude: 52.52,
      };

      // Act
      const program = updateLocationUseCase(input).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location: Location) => repo.create(location),
          findById: (id: string) => repo.findById(id),
          findByUserId: (userId: string) => repo.findByUserId(userId),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          findSharingWithUser: (userId: string) =>
            repo.findSharingWithUser(userId),
          findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
          save: (location: Location) => repo.save(location),
          delete: (id: string) => repo.delete(id),
          deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
          existsForUser: (userId: string) => repo.existsForUser(userId),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(LocationCreateError);
      }
    });

    it("should update altitude, heading, and speed", async () => {
      // Arrange - seed existing location
      const existingLocation = createValidLocation({ userId: "user-123" });
      Effect.runSync(repo.create(existingLocation));

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
      const result = await runUseCase(input);

      // Assert
      expect(result.latitude).toBe(52.52);

      // Verify location was updated
      const stored = Effect.runSync(repo.findByUserId("user-123"));
      expect(stored).not.toBeNull();
    });

    it("should fail when coordinate validation fails", async () => {
      // Arrange - seed existing location
      const existingLocation = createValidLocation({ userId: "user-123" });
      Effect.runSync(repo.create(existingLocation));

      const input: UpdateLocationInput = {
        userId: "user-123",
        latitude: -999, // Invalid latitude
      };

      // Act
      const program = updateLocationUseCase(input).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location: Location) => repo.create(location),
          findById: (id: string) => repo.findById(id),
          findByUserId: (userId: string) => repo.findByUserId(userId),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          findSharingWithUser: (userId: string) =>
            repo.findSharingWithUser(userId),
          findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
          save: (location: Location) => repo.save(location),
          delete: (id: string) => repo.delete(id),
          deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
          existsForUser: (userId: string) => repo.existsForUser(userId),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(LocationUpdateValidationError);
      }
    });

    it("should update with partial coordinate data", async () => {
      // Arrange - seed existing location
      const existingLocation = createValidLocation({
        userId: "user-123",
        latitude: 50.0,
        longitude: 10.0,
      });
      Effect.runSync(repo.create(existingLocation));

      const input: UpdateLocationInput = {
        userId: "user-123",
        latitude: 55.0, // Only update latitude
      };

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.latitude).toBe(55.0);

      // Verify location was updated
      const stored = Effect.runSync(repo.findByUserId("user-123"));
      expect(stored?.latitude).toBe(55.0);
    });
  });
});
