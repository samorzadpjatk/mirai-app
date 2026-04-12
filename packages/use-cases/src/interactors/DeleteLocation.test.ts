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
      id: string;
      userId: string;
    }>,
  ): Location => {
    const effect = Location.create({
      id: overrides?.id ?? "loc-123",
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
        create: (location: Location) =>
          Effect.promise(() => repo.create(location)),
        findById: (id: string) =>
          Effect.promise(() => repo.findById(id as LocationId)),
        findByUserId: (userId: string) =>
          Effect.promise(() => repo.findByUserId(userId)),
        findAll: (options?: { limit?: number; offset?: number }) =>
          Effect.promise(() => repo.findAll(options)),
        findSharingWithUser: (userId: string) =>
          Effect.promise(() => repo.findSharingWithUser(userId)),
        findByUserIds: (userIds: string[]) =>
          Effect.promise(() => repo.findByUserIds(userIds)),
        save: (location: Location) => Effect.promise(() => repo.save(location)),
        delete: (id: string) =>
          Effect.promise(() => repo.delete(id as LocationId)),
        deleteByUserId: (userId: string) =>
          Effect.promise(() => repo.deleteByUserId(userId)),
        existsForUser: (userId: string) =>
          Effect.promise(() => repo.existsForUser(userId)),
      }),
    );
    return await Effect.runPromise(program);
  };

  describe("execute", () => {
    it("should delete location when found", async () => {
      // Arrange
      const existingLocation = createValidLocation({ id: "loc-to-delete" });
      await repo.create(existingLocation);

      const input: DeleteLocationInput = {
        locationId: "loc-to-delete" as LocationId,
      };

      // Verify location exists before deletion
      const beforeDelete = await repo.findById("loc-to-delete" as LocationId);
      expect(beforeDelete).not.toBeNull();

      // Act
      const result = await runUseCase(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedLocationId).toBe("loc-to-delete");

      // Verify location was actually deleted
      const afterDelete = await repo.findById("loc-to-delete" as LocationId);
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
          create: (location: Location) =>
            Effect.promise(() => repo.create(location)),
          findById: (id: string) =>
            Effect.promise(() => repo.findById(id as LocationId)),
          findByUserId: (userId: string) =>
            Effect.promise(() => repo.findByUserId(userId)),
          findAll: (options?: { limit?: number; offset?: number }) =>
            Effect.promise(() => repo.findAll(options)),
          findSharingWithUser: (userId: string) =>
            Effect.promise(() => repo.findSharingWithUser(userId)),
          findByUserIds: (userIds: string[]) =>
            Effect.promise(() => repo.findByUserIds(userIds)),
          save: (location: Location) =>
            Effect.promise(() => repo.save(location)),
          delete: (id: string) =>
            Effect.promise(() => repo.delete(id as LocationId)),
          deleteByUserId: (userId: string) =>
            Effect.promise(() => repo.deleteByUserId(userId)),
          existsForUser: (userId: string) =>
            Effect.promise(() => repo.existsForUser(userId)),
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
      const location1 = createValidLocation({ id: "loc-1", userId: "user-1" });
      const location2 = createValidLocation({ id: "loc-2", userId: "user-2" });
      const location3 = createValidLocation({ id: "loc-3", userId: "user-3" });

      await repo.create(location1);
      await repo.create(location2);
      await repo.create(location3);

      const input: DeleteLocationInput = {
        locationId: "loc-2" as LocationId,
      };

      // Act
      await runUseCase(input);

      // Assert
      const allLocations = await repo.findAll();
      expect(allLocations).toHaveLength(2);
      expect(allLocations.find((l) => l.id === "loc-1")).not.toBeNull();
      expect(allLocations.find((l) => l.id === "loc-2")).toBeUndefined();
      expect(allLocations.find((l) => l.id === "loc-3")).not.toBeNull();
    });
  });
});
