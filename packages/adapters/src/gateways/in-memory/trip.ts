import type { Trip, TripStatus } from "@mirai-app/domain";
import type { TripRepository } from "@mirai-app/use-cases";
import { Effect } from "effect";
import { InMemoryRepository } from "./base";

/**
 * In-Memory Trip Repository for Testing
 *
 * Implements TripRepository port with in-memory storage.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryTripRepository();
 * repo.seed([mockTrip]);
 *
 * const active = await Effect.runPromise(repo.findActive());
 * expect(active).toHaveLength(1);
 *
 * repo.reset();
 * ```
 */
export class InMemoryTripRepository
  extends InMemoryRepository<Trip>
  implements TripRepository
{
  create(trip: Trip): Effect.Effect<Trip, never, never> {
    return this.createGeneric(trip);
  }

  findById(id: string): Effect.Effect<Trip | null, never, never> {
    return this.findByIdGeneric(id);
  }

  findByStatus(status: TripStatus): Effect.Effect<Trip[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((t) => t.status === status),
    );
  }

  findActive(): Effect.Effect<Trip[], never, never> {
    return this.findByStatus("ACTIVE" as TripStatus);
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Trip[], never, never> {
    return this.findAllGeneric(options);
  }

  update(trip: Trip): Effect.Effect<Trip, never, never> {
    return this.updateGeneric(trip);
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
    return this.deleteGeneric(id);
  }

  exists(id: string): Effect.Effect<boolean, never, never> {
    return this.existsGeneric(id);
  }

  countByStatus(status: TripStatus): Effect.Effect<number, never, never> {
    return Effect.succeed(
      this.getAllItems().filter((t) => t.status === status).length,
    );
  }
}
