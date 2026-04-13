import { describe, it, expect, beforeEach } from "bun:test";
import {
  deleteLocationUseCase,
  type DeleteLocationInput,
  DeleteLocationNotFoundError,
} from "./DeleteLocation";
import { Location, type LocationId } from "@mirai-app/domain";
import { Effect, Either } from "effect";
import { LocationRepositoryTag } from "../ports/LocationRepository";
import { InMemoryLocationRepository } from "@mirai-app/adapters/gateways/in-memory";

describe("[UNIT] deleteLocationUseCase (Effect)", () => {
  let repo: InMemoryLocationRepository;

  beforeEach(() => {
    repo = new InMemoryLocationRepository();
  });

  // Helper to create a valid location
  const createValidLocation = (
    overrides?: Partial<{
      id: LocationId;
      userId: string;
    }>,
  ): Location => {
    const effect = Location.create({
      id: overrides?.id ?? ("loc-123" as LocationId),
      userId: overrides?.userId ?? "user-123",
      latitude: 52.52,
      longitude: 13.405,
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
  const runUseCase = async (input: DeleteLocationInput) => {
    const program = deleteLocationUseCase(input).pipe(
      Effect.provideService(LocationRepositoryTag, {
        create: (location: Location) => repo.create(location),
        findById: (id: string) => repo.findById(id as LocationId),
        findByUserId: (userId: string) => repo.findByUserId(userId),
        findAll: (options?: { limit?: number; offset?: number }) =>
          repo.findAll(options),
        findSharingWithUser: (userId: string) =>
          repo.findSharingWithUser(userId),
        findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
        save: (location: Location) => repo.save(location),
        delete: (id: string) => repo.delete(id as LocationId),
        deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
        existsForUser: (userId: string) => repo.existsForUser(userId),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should delete location when found", async () => {
      // Arrange
      const existingLocation = createValidLocation({
        id: "loc-to-delete" as LocationId,
      });
      Effect.runSync(repo.create(existingLocation));

      const input: DeleteLocationInput = {
        locationId: "loc-to-delete" as LocationId,
      };

      // Verify location exists before deletion
      const beforeDelete = Effect.runSync(
        repo.findById("loc-to-delete" as LocationId),
      );
      expect(beforeDelete).not.toBeNull();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedLocationId).toBe("loc-to-delete");

      // Verify location was actually deleted
      const afterDelete = Effect.runSync(
        repo.findById("loc-to-delete" as LocationId),
      );
      expect(afterDelete).toBeNull();
    });

    it("should fail when location not found", async () => {
      // Arrange
      const input: DeleteLocationInput = {
        locationId: "non-existent-id" as LocationId,
      };

      // Act
      const program = deleteLocationUseCase(input).pipe(
        Effect.provideService(LocationRepositoryTag, {
          create: (location: Location) => repo.create(location),
          findById: (id: string) => repo.findById(id as LocationId),
          findByUserId: (userId: string) => repo.findByUserId(userId),
          findAll: (options?: { limit?: number; offset?: number }) =>
            repo.findAll(options),
          findSharingWithUser: (userId: string) =>
            repo.findSharingWithUser(userId),
          findByUserIds: (userIds: string[]) => repo.findByUserIds(userIds),
          save: (location: Location) => repo.save(location),
          delete: (id: string) => repo.delete(id as LocationId),
          deleteByUserId: (userId: string) => repo.deleteByUserId(userId),
          existsForUser: (userId: string) => repo.existsForUser(userId),
        }),
      );

      // Act & Assert - use Either to properly check error type
      const either = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(either)).toBe(true);
      if (Either.isLeft(either)) {
        expect(either.left).toBeInstanceOf(DeleteLocationNotFoundError);
      }
    });

    it("should not affect other locations when deleting one", async () => {
      // Arrange
      const location1 = createValidLocation({
        id: "loc-1" as LocationId,
        userId: "user-1",
      });
      const location2 = createValidLocation({
        id: "loc-2" as LocationId,
        userId: "user-2",
      });
      const location3 = createValidLocation({
        id: "loc-3" as LocationId,
        userId: "user-3",
      });

      Effect.runSync(repo.create(location1));
      Effect.runSync(repo.create(location2));
      Effect.runSync(repo.create(location3));

      const input: DeleteLocationInput = {
        locationId: "loc-2" as LocationId,
      };

      // Act
      await runUseCase(input);

      // Assert
      const allLocations = Effect.runSync(repo.findAll());
      expect(allLocations).toHaveLength(2);
      expect(allLocations.find((l) => l.id === "loc-1")).not.toBeNull();
      expect(allLocations.find((l) => l.id === "loc-2")).toBeUndefined();
      expect(allLocations.find((l) => l.id === "loc-3")).not.toBeNull();
    });
  });
});
