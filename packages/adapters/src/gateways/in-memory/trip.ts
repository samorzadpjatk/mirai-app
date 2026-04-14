import { Trip, type TripStatus } from "@mirai-app/domain";
import type { TripRepository } from "@mirai-app/use-cases";
import { Effect } from "effect";
import { InMemoryRepository, DatabaseError } from "./base";

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
  /**
   * Reconstruct a Trip entity from plain object storage.
   * Uses reconstitute() factory to bypass validation and ensure proper instance.
   */
  protected reconstruct(
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
    return this.createGeneric(trip);
  }

  findById(id: string): Effect.Effect<Trip | null, never, never> {
    return this.findByIdGeneric(id);
  }

  findByStatus(status: TripStatus): Effect.Effect<Trip[], never, never> {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const filtered = plains.filter(
        (t) => (t as Record<string, unknown>).status === status,
      );
      const reconstructed: Trip[] = [];
      for (const plain of filtered) {
        const entity = yield* this.reconstruct(plain);
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
