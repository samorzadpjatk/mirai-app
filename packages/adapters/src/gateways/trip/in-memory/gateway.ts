import { Trip, type TripStatus } from "@mirai-app/domain";
import type { TripRepository } from "@mirai-app/domain/ports";
import { Effect } from "effect";
import { InMemoryGateway, DatabaseError } from "../_shared/in-memory-base";

/**
 * In-Memory Trip Gateway for Testing
 *
 * Implements TripRepository port with in-memory storage.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryTripGateway();
 * gateway.seed([mockTrip]);
 *
 * const active = await Effect.runPromise(gateway.findActive());
 * expect(active).toHaveLength(1);
 *
 * gateway.reset();
 * ```
 */
export class InMemoryTripGateway
  extends InMemoryGateway<Trip>
  implements TripRepository
{
  /**
   * Reconstruct a Trip entity from plain object storage.
   * Uses reconstitute() factory to bypass validation and ensure proper instance.
   */
  protected override reconstruct(
    plain: unknown,
  ): Effect.Effect<Trip, DatabaseError, never> {
    const p = plain as Record<string, unknown>;
    try {
      const trip = Trip.reconstitute({
        id: p.id as string,
        name: p.name as string,
        description: p.description as string | null,
        startDate: p.startDate as Date,
        endDate: p.endDate as Date,
        backgroundImagePath: p.backgroundImagePath as string | null,
        status: p.status as TripStatus,
        createdAt: p.createdAt as Date,
        updatedAt: p.updatedAt as Date,
      });
      return Effect.succeed(trip);
    } catch (error) {
      return Effect.fail(
        new DatabaseError({
          operation: "reconstruct",
          message: `Failed to reconstruct Trip: ${error instanceof Error ? error.message : String(error)}`,
          cause: error,
        }),
      );
    }
  }

  create(trip: Trip): Effect.Effect<Trip, never, never> {
    return Effect.sync(() => {
      this.storage.set(trip.id, trip);
      return trip;
    });
  }

  findById(id: string): Effect.Effect<Trip | null, never, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findByStatus(status: TripStatus): Effect.Effect<Trip[], never, never> {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const filtered = plains.filter(
        (t) => (t as unknown as Record<string, unknown>).status === status,
      );
      const reconstructed: Trip[] = [];
      for (const plain of filtered) {
        const entity = yield* this.reconstruct(plain).pipe(Effect.orDie);
        reconstructed.push(entity);
      }
      return reconstructed;
    });
  }

  findActive(): Effect.Effect<Trip[], never, never> {
    return this.findByStatus("ACTIVE" as TripStatus);
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Trip[], never, never> {
    return Effect.gen(this, function* () {
      const trips = yield* this.findAllGeneric(options).pipe(Effect.orDie);
      return trips;
    });
  }

  update(trip: Trip): Effect.Effect<Trip, never, never> {
    return Effect.sync(() => {
      this.storage.set(trip.id, trip);
      return trip;
    });
  }

  updateStatus(
    id: string,
    status: TripStatus,
  ): Effect.Effect<Trip, never, never> {
    return Effect.sync(() => {
      const tripItem = this.storage.get(id);
      if (!tripItem) {
        throw new Error(`Trip with id ${id} not found`);
      }
      const updated = new (tripItem.constructor as new (
        ...args: unknown[]
      ) => Trip)(
        tripItem.id,
        tripItem.name,
        tripItem.description,
        tripItem.startDate,
        tripItem.endDate,
        tripItem.backgroundImagePath,
        status,
        tripItem.createdAt,
        new Date(),
      );
      this.storage.set(id, updated);
      return updated;
    });
  }

  delete(id: string): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.storage.delete(id);
    });
  }

  exists(id: string): Effect.Effect<boolean, never, never> {
    return Effect.sync(() => this.storage.has(id));
  }

  countByStatus(status: TripStatus): Effect.Effect<number, never, never> {
    return Effect.succeed(
      this.getAllItems().filter((t) => t.status === status).length,
    );
  }
}
