import type { TripStatus } from "@mirai-app/domain";
import type {
  TripGateway,
  TripDTO,
  TripPaginatedResult,
} from "@mirai-app/use-cases";
import { Effect } from "effect";
import {
  InMemoryGateway,
  DatabaseError,
} from "../../../system/shared/gateways/in-memory-base";

/**
 * In-Memory Trip Gateway for Testing
 *
 * Implements TripGateway port with in-memory storage.
 * Stores and returns TripDTOs instead of domain entities.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryTripGateway();
 * await Effect.runPromise(gateway.seed([mockTripDTO]));
 *
 * const active = await Effect.runPromise(gateway.findActive());
 * expect(active).toHaveLength(1);
 *
 * await Effect.runPromise(gateway.reset());
 * ```
 */
export class InMemoryTripGateway
  extends InMemoryGateway<TripDTO>
  implements TripGateway
{
  create(trip: TripDTO): Effect.Effect<TripDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(trip.id, trip);
      return trip;
    });
  }

  findById(id: string): Effect.Effect<TripDTO | null, never, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findByStatus(status: TripStatus): Effect.Effect<TripDTO[], never, never> {
    return Effect.sync(() => {
      return this.getAllItems().filter((t) => t.status === status);
    });
  }

  findActive(): Effect.Effect<TripDTO[], never, never> {
    return this.findByStatus("ACTIVE" as TripStatus);
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<TripPaginatedResult, never, never> {
    return Effect.sync(() => {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const allItems = this.getAllItems();
      const total = allItems.length;
      const items = allItems.slice(offset, offset + limit);
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

  update(trip: TripDTO): Effect.Effect<TripDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(trip.id, trip);
      return trip;
    });
  }

  updateStatus(
    id: string,
    status: TripStatus,
  ): Effect.Effect<TripDTO, DatabaseError, never> {
    return Effect.gen(this, function* () {
      const trip = this.storage.get(id);
      if (!trip) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "updateStatus",
            message: `Trip with id ${id} not found`,
          }),
        );
      }
      const updated: TripDTO = {
        ...trip,
        status,
        updatedAt: new Date(),
      };
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
