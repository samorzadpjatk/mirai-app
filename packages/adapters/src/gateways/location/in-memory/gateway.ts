import {
  Location,
  type SharingUserInfo,
  type LocationId,
} from "@mirai-app/domain";
import type { LocationRepository } from "@mirai-app/domain/ports";
import { Effect } from "effect";
import { InMemoryGateway, DatabaseError } from "../_shared/in-memory-base";

/**
 * In-Memory Location Gateway for Testing
 *
 * Implements LocationRepository port with in-memory storage.
 * Useful for unit testing use cases without database dependencies.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryLocationGateway();
 *
 * // Seed with test data
 * const location = Location.create({
 *   userId: "user-123",
 *   latitude: 52.2297,
 *   longitude: 21.0122,
 *   isSharingLocation: true,
 * })._unsafeUnwrap();
 *
 * await Effect.runPromise(gateway.create(location));
 *
 * const found = await Effect.runPromise(gateway.findById(location.id));
 * expect(found).not.toBeNull();
 *
 * // Find by user ID
 * const userLocation = await Effect.runPromise(gateway.findByUserId("user-123"));
 * expect(userLocation?.latitude).toBe(52.2297);
 *
 * // Find locations sharing with a user
 * const sharing = await Effect.runPromise(gateway.findSharingWithUser("viewer-456"));
 * expect(sharing).toHaveLength(1);
 *
 * gateway.reset(); // Clean up for next test
 * ```
 */
export class InMemoryLocationGateway
  extends InMemoryGateway<Location>
  implements LocationRepository
{
  /**
   * Reconstruct a Location entity from plain object storage.
   * Uses reconstitute() factory to bypass validation and ensure proper instance.
   * Extracts data properties, not methods (arrow functions get stored as properties).
   */
  protected override reconstruct(
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

  create(
    request: import("@mirai-app/domain").LocationSharingRequest,
  ): Effect.Effect<
    import("@mirai-app/domain").LocationSharingRequest,
    never,
    never
  > {
    return Effect.sync(() => {
      this.storage.set(request.id, request as unknown as Location);
      return request;
    });
  }

  findById(
    id: LocationId,
  ): Effect.Effect<
    import("@mirai-app/domain").LocationSharingRequest | null,
    never,
    never
  > {
    return Effect.sync(() => {
      const item = this.storage.get(id as string);
      return item as unknown as
        | import("@mirai-app/domain").LocationSharingRequest
        | null;
    });
  }

  findByUserId(
    userId: string,
  ): Effect.Effect<
    import("@mirai-app/domain").LocationSharingRequest[],
    never,
    never
  > {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const filtered = plains.filter(
        (loc) =>
          (loc as unknown as Record<string, unknown>).senderId === userId,
      );
      return filtered as unknown as import("@mirai-app/domain").LocationSharingRequest[];
    });
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Location[], never, never> {
    return Effect.gen(this, function* () {
      const locations = yield* this.findAllGeneric(options).pipe(Effect.orDie);
      return locations;
    });
  }

  findSharingWithUser(userId: string): Effect.Effect<Location[], never, never> {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const filtered = plains.filter((loc) =>
        (
          (loc as unknown as Record<string, unknown>).usersToShareWith as
            | SharingUserInfo[]
            | undefined
        )?.some((user: SharingUserInfo) => user.id === userId),
      );
      const reconstructed: Location[] = [];
      for (const plain of filtered) {
        const entity = yield* this.reconstruct(plain).pipe(Effect.orDie);
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
        userIdSet.has(
          (loc as unknown as Record<string, unknown>).userId as string,
        ),
      );
      const reconstructed: Location[] = [];
      for (const plain of filtered) {
        const entity = yield* this.reconstruct(plain).pipe(Effect.orDie);
        reconstructed.push(entity);
      }
      return reconstructed;
    });
  }

  save(location: Location): Effect.Effect<Location, never, never> {
    return Effect.sync(() => {
      this.storage.set(location.id as string, location);
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
      const plains = this.getAllItems();
      const plain = plains.find(
        (loc) => (loc as unknown as Record<string, unknown>).userId === userId,
      );
      if (plain) {
        this.storage.delete(
          (plain as unknown as Record<string, unknown>).id as string,
        );
      }
    });
  }

  existsForUser(userId: string): Effect.Effect<boolean, never, never> {
    return Effect.succeed(
      this.getAllItems().some(
        (loc) => (loc as unknown as Record<string, unknown>).userId === userId,
      ),
    );
  }
}
