import { describe, it, expect, beforeEach } from "bun:test";
import {
  getLocationUseCase,
  type GetLocationInput,
  LocationNotFoundError,
} from "./GetLocation";
import { Location, LocationId } from "@mirai-app/domain";
import { Effect, Either, Layer } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";

/**
 * Simple in-memory mock repository for testing (Effect-based)
 */
class MockLocationRepository {
  private locations = new Map<string, Location>();

  create(location: Location): Effect.Effect<Location, never, never> {
    this.locations.set(location.id, location);
    return Effect.succeed(location);
  }

  findById(id: string): Effect.Effect<Location | null, never, never> {
    return Effect.succeed(this.locations.get(id) ?? null);
  }

  findByUserId(userId: string): Effect.Effect<Location | null, never, never> {
    return Effect.succeed(
      Array.from(this.locations.values()).find((l) => l.userId === userId) ??
        null,
    );
  }

  save(location: Location): Effect.Effect<Location, never, never> {
    this.locations.set(location.id, location);
    return Effect.succeed(location);
  }

  delete(id: string): Effect.Effect<void, never, never> {
    this.locations.delete(id);
    return Effect.succeed(undefined);
  }
}

describe("[UNIT] getLocationUseCase - Pure Effect Pattern", () => {
  let repo: MockLocationRepository;
  let mockLayer: Layer.Layer<LocationRepositoryTag>;

  beforeEach(() => {
    repo = new MockLocationRepository();
    mockLayer = Layer.succeed(LocationRepositoryTag, repo);
  });

  const createValidLocation = (
    overrides?: Partial<{
      id: LocationId;
      userId: string;
      latitude: number | null;
      longitude: number | null;
      isSharingLocation: boolean;
    }>,
  ): Location => {
    const effect = Location.create({
      id: overrides?.id ?? LocationId.create("loc-123"),
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
        id: LocationId.create("loc-456"),
        userId: "user-456",
        latitude: 48.8566,
        longitude: 2.3522,
      });
      Effect.runSync(repo.create(mockLocation));

      // Act
      const program = getLocationUseCase({ userId: "user-456" }).pipe(
        Effect.provide(mockLayer),
      );
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.id).toBe("loc-456");
      expect(result.userId).toBe("user-456");
      expect(result.latitude).toBe(48.8566);
      expect(result.longitude).toBe(2.3522);
      expect(result.accuracy).toBe(10);
      expect(result.isSharingLocation).toBe(false);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it("should fail with LocationNotFoundError when location not found", async () => {
      // Act
      const program = getLocationUseCase({ userId: "non-existent-user" }).pipe(
        Effect.provide(mockLayer),
      );
      const either = await Effect.runPromise(Effect.either(program));

      // Assert
      expect(either._tag).toBe("Left");
      if (either._tag === "Left") {
        expect(either.left).toBeInstanceOf(LocationNotFoundError);
        expect(either.left.userId).toBe("non-existent-user");
      }
    });

    it("should return location with null coordinates", async () => {
      // Arrange
      const mockLocation = Effect.runSync(
        Location.create({
          id: LocationId.create("loc-789"),
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
      Effect.runSync(repo.create(mockLocation));

      // Act
      const program = getLocationUseCase({ userId: "user-789" }).pipe(
        Effect.provide(mockLayer),
      );
      const result = await Effect.runPromise(program);

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
      Effect.runSync(repo.create(mockLocation));

      // Act
      const program = getLocationUseCase({ userId: "user-sharing" }).pipe(
        Effect.provide(mockLayer),
      );
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.isSharingLocation).toBe(true);
    });

    it("should return location with sharing users list", async () => {
      // Arrange
      const mockLocation = Effect.runSync(
        Location.create({
          id: LocationId.create("loc-sharing"),
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
      Effect.runSync(repo.create(mockLocation));

      // Act
      const program = getLocationUseCase({ userId: "user-owner" }).pipe(
        Effect.provide(mockLayer),
      );
      const result = await Effect.runPromise(program);

      // Assert
      expect(result.usersToShareWith).toHaveLength(2);
      expect(result.usersToShareWith[0].firstName).toBe("John");
      expect(result.usersToShareWith[1].firstName).toBe("Jane");
    });
  });
});
