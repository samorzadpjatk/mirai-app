import type { LocationId } from "@mirai-app/domain";
import type {
  LocationGateway,
  LocationDTO,
  LocationPaginatedResult,
} from "@mirai-app/use-cases";
import { Effect } from "effect";
import {
  InMemoryGateway,
  DatabaseError,
} from "../../../system/shared/gateways/in-memory-base";

/**
 * In-Memory Location Gateway for Testing
 *
 * Implements LocationGateway port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * All methods return Effect.Effect<T, DatabaseError, never> for composable error handling.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryLocationGateway();
 *
 * // Seed with test data
 * const locationDto: LocationDTO = {
 *   id: "loc-123",
 *   userId: "user-123",
 *   latitude: 52.2297,
 *   longitude: 21.0122,
 *   accuracy: null,
 *   altitude: null,
 *   speed: null,
 *   heading: null,
 *   recordedAt: new Date(),
 *   createdAt: new Date(),
 * };
 *
 * await Effect.runPromise(gateway.create(locationDto));
 *
 * const found = await Effect.runPromise(gateway.findById("loc-123"));
 * expect(found).not.toBeNull();
 *
 * // Find by user ID
 * const userLocation = await Effect.runPromise(gateway.findByUserId("user-123"));
 * expect(userLocation?.latitude).toBe(52.2297);
 *
 * // Find locations sharing with a user
 * const sharing = await Effect.runPromise(gateway.findSharingWithUser("viewer-456"));
 * expect(sharing).toHaveLength(0);
 *
 * gateway.reset(); // Clean up for next test
 * ```
 */
export class InMemoryLocationGateway
  extends InMemoryGateway<LocationDTO>
  implements LocationGateway
{
  /**
   * Reconstruct a LocationDTO from plain object storage.
   * For DTOs, this is a simple cast since they are plain objects.
   */
  protected override reconstruct(
    plain: unknown,
  ): Effect.Effect<LocationDTO, DatabaseError, never> {
    return Effect.succeed(plain as LocationDTO);
  }

  create(location: LocationDTO): Effect.Effect<LocationDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(location.id, location);
      return location;
    });
  }

  findById(id: LocationId): Effect.Effect<LocationDTO | null, never, never> {
    return Effect.sync(() => {
      return this.storage.get(id as string) ?? null;
    });
  }

  findByUserId(
    userId: string,
  ): Effect.Effect<LocationDTO | null, never, never> {
    return Effect.gen(this, function* () {
      const items = this.getAllItems();
      const found = items.find((loc) => loc.userId === userId);
      return found ?? null;
    });
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<LocationPaginatedResult, never, never> {
    return Effect.gen(this, function* () {
      const allItems = this.getAllItems();
      const total = allItems.length;

      let items = allItems;
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? total;

      if (offset > 0) {
        items = items.slice(offset);
      }
      if (options?.limit !== undefined) {
        items = items.slice(0, options.limit);
      }

      const hasMore = offset + items.length < total;

      return {
        items,
        total,
        limit,
        offset,
        hasMore,
      };
    });
  }

  findSharingWithUser(
    userId: string,
  ): Effect.Effect<LocationDTO[], never, never> {
    return Effect.gen(this, function* () {
      // For simplicity in testing, return empty array
      // In real implementation, this would check sharing permissions
      return [];
    });
  }

  findByUserIds(userIds: string[]): Effect.Effect<LocationDTO[], never, never> {
    return Effect.gen(this, function* () {
      const userIdSet = new Set(userIds);
      const items = this.getAllItems();
      return items.filter((loc) => userIdSet.has(loc.userId));
    });
  }

  save(location: LocationDTO): Effect.Effect<LocationDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(location.id, location);
      return location;
    });
  }

  delete(id: LocationId): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.storage.delete(id as string);
    });
  }

  deleteByUserId(userId: string): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      const items = this.getAllItems();
      const found = items.find((loc) => loc.userId === userId);
      if (found) {
        this.storage.delete(found.id);
      }
    });
  }

  existsForUser(userId: string): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      this.getAllItems().some((loc) => loc.userId === userId),
    );
  }
}
