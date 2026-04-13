import type { Location, SharingUserInfo } from "@mirai-app/domain";
import type { LocationId } from "@mirai-app/domain";
import type { LocationRepository } from "@mirai-app/use-cases";
import { Effect } from "effect";
import { InMemoryRepository } from "./base";

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
  create(location: Location): Effect.Effect<Location, never, never> {
    return this.createGeneric(location);
  }

  findById(id: LocationId): Effect.Effect<Location | null, never, never> {
    return this.findByIdGeneric(id as string);
  }

  findByUserId(userId: string): Effect.Effect<Location | null, never, never> {
    return Effect.succeed(
      this.getAllItems().find((location) => location.userId === userId) ?? null,
    );
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Location[], never, never> {
    return this.findAllGeneric(options);
  }

  findSharingWithUser(userId: string): Effect.Effect<Location[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((location) =>
        location.usersToShareWith.some(
          (user: SharingUserInfo) => user.id === userId,
        ),
      ),
    );
  }

  findByUserIds(userIds: string[]): Effect.Effect<Location[], never, never> {
    const userIdSet = new Set(userIds);
    return Effect.succeed(
      this.getAllItems().filter((location) => userIdSet.has(location.userId)),
    );
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
    const location = this.getAllItems().find(
      (location) => location.userId === userId,
    );
    if (location) {
      this.storage.delete(location.id as string);
    }
    return Effect.succeed(undefined);
  }

  existsForUser(userId: string): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      this.getAllItems().some((location) => location.userId === userId),
    );
  }
}
