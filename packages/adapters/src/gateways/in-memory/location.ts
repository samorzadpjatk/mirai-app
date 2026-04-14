import {
  Location,
  type SharingUserInfo,
  type LocationId,
} from "@mirai-app/domain";
import type { LocationRepository } from "@mirai-app/use-cases";
import { Effect } from "effect";
import { InMemoryRepository, DatabaseError } from "./base";

/**
 * In-Memory Location Repository for Testing
 *
 * Implements LocationRepository port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryLocationRepository();
 *
 * // Seed with test data
 * const location = Location.create({
 *   userId: "user-123",
 *   latitude: 52.2297,
 *   longitude: 21.0122,
 *   isSharingLocation: true,
 * })._unsafeUnwrap();
 *
 * await Effect.runPromise(repo.create(location));
 *
 * const found = await Effect.runPromise(repo.findById(location.id));
 * expect(found).not.toBeNull();
 *
 * // Find by user ID
 * const userLocation = await Effect.runPromise(repo.findByUserId("user-123"));
 * expect(userLocation?.latitude).toBe(52.2297);
 *
 * // Find locations sharing with a user
 * const sharing = await Effect.runPromise(repo.findSharingWithUser("viewer-456"));
 * expect(sharing).toHaveLength(1);
 *
 * repo.reset(); // Clean up for next test
 * ```
 */
export class InMemoryLocationRepository
  extends InMemoryRepository<Location>
  implements LocationRepository
{
  /**
   * Reconstruct a Location entity from plain object storage.
   * Uses reconstitute() factory to bypass validation and ensure proper instance.
   * Extracts data properties, not methods (arrow functions get stored as properties).
   */
  protected reconstruct(
    plain: unknown,
  ): Effect.Effect<Location, DatabaseError, never> {
    const p = plain as Record<string, unknown>;
    try {
      // Extract data properties - note: isSharingLocation is a method (arrow function)
      // the actual data is in sharingLocation property
      const location = Location.reconstitute({
        id: p.id as LocationId,
        userId: p.userId as string,
        latitude: p.latitude as number | null,
        longitude: p.longitude as number | null,
        accuracy: p.accuracy as number | null,
        altitude: p.altitude as number | null,
        altitudeAccuracy: p.altitudeAccuracy as number | null,
        heading: p.heading as number | null,
        speed: p.speed as number | null,
        // sharingLocation is the data property (not isSharingLocation which is the method)
        isSharingLocation: (p.sharingLocation as boolean) ?? false,
        timestamp: p.timestamp as Date,
        lastInactivityNotification: p.lastInactivityNotification as Date | null,
        usersToShareWith: (p.usersToShareWith as SharingUserInfo[]) ?? [],
      });
      return Effect.succeed(location);
    } catch (error) {
      return Effect.fail(
        new DatabaseError({
          operation: "reconstruct",
          message: `Failed to reconstruct Location: ${error instanceof Error ? error.message : String(error)}`,
          cause: error,
        }),
      );
    }
  }

  create(location: Location): Effect.Effect<Location, never, never> {
    return this.createGeneric(location);
  }

  findById(id: LocationId): Effect.Effect<Location | null, never, never> {
    return this.findByIdGeneric(id as string);
  }

  findByUserId(userId: string): Effect.Effect<Location | null, never, never> {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const plain = plains.find(
        (loc) => (loc as Record<string, unknown>).userId === userId,
      );
      if (!plain) return null;
      return yield* this.reconstruct(plain);
    });
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Location[], never, never> {
    return this.findAllGeneric(options);
  }

  findSharingWithUser(userId: string): Effect.Effect<Location[], never, never> {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const filtered = plains.filter((loc) =>
        (loc as Record<string, unknown>).usersToShareWith?.some(
          (user: SharingUserInfo) => user.id === userId,
        ),
      );
      const reconstructed: Location[] = [];
      for (const plain of filtered) {
        const entity = yield* this.reconstruct(plain);
        reconstructed.push(entity);
      }
      return reconstructed;
    });
  }

  findByUserIds(userIds: string[]): Effect.Effect<Location[], never, never> {
    return Effect.gen(this, function* () {
      const userIdSet = new Set(userIds);
      const plains = this.getAllItems();
      const filtered = plains.filter((loc) =>
        userIdSet.has((loc as Record<string, unknown>).userId as string),
      );
      const reconstructed: Location[] = [];
      for (const plain of filtered) {
        const entity = yield* this.reconstruct(plain);
        reconstructed.push(entity);
      }
      return reconstructed;
    });
  }

  save(location: Location): Effect.Effect<Location, never, never> {
    if (this.storage.has(location.id as string)) {
      return this.updateGeneric(location);
    }
    return this.createGeneric(location);
  }

  delete(id: LocationId): Effect.Effect<void, never, never> {
    return this.deleteGeneric(id as string);
  }

  deleteByUserId(userId: string): Effect.Effect<void, never, never> {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const plain = plains.find(
        (loc) => (loc as Record<string, unknown>).userId === userId,
      );
      if (plain) {
        this.storage.delete((plain as Record<string, unknown>).id as string);
      }
      return undefined;
    });
  }

  existsForUser(userId: string): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      this.getAllItems().some(
        (loc) => (loc as Record<string, unknown>).userId === userId,
      ),
    );
  }
}
