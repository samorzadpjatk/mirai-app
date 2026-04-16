import type { TripStatus, Connection } from "@mirai-app/domain";
import type {
  TripGateway,
  TripDTO,
  TripPaginatedResult,
  TripConnectionArgs,
} from "@mirai-app/use-cases";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";
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

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find all trips with cursor-based pagination
   * Sorts by createdAt DESC, then id DESC, then slices
   */
  findAllConnection(
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, never, never> {
    return this.executeConnectionQuery(args, () => true);
  }

  /**
   * Find trips by status with cursor-based pagination
   */
  findByStatusConnection(
    status: TripStatus,
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, never, never> {
    return this.executeConnectionQuery(args, (trip) => trip.status === status);
  }

  /**
   * Find active trips with cursor-based pagination
   * Active trips: current time is between start and end dates
   */
  findActiveConnection(
    args: TripConnectionArgs,
  ): Effect.Effect<Connection<TripDTO>, never, never> {
    const now = new Date();
    return this.executeConnectionQuery(
      args,
      (trip) =>
        trip.startDate <= now &&
        trip.endDate >= now &&
        trip.status === "ACTIVE",
    );
  }

  /**
   * Internal helper to execute cursor-based pagination queries
   * Sorts by createdAt DESC, then id DESC, then slices
   */
  private executeConnectionQuery(
    args: TripConnectionArgs,
    filterFn: (trip: TripDTO) => boolean,
  ): Effect.Effect<Connection<TripDTO>, never, never> {
    return Effect.sync(() => {
      const first = Math.min(args.first ?? 20, 100);
      const cursor = args.after;

      // Get all trips matching the filter
      let trips = this.getAllItems().filter(filterFn);

      // Sort by createdAt DESC, then by id DESC as tiebreaker
      trips.sort((a, b) => {
        const timeCompare = b.createdAt.getTime() - a.createdAt.getTime();
        if (timeCompare !== 0) return timeCompare;
        return b.id.localeCompare(a.id);
      });

      // Find starting position if cursor provided
      let startIndex = 0;
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        startIndex = trips.findIndex(
          (t) =>
            t.createdAt < cursorDate ||
            (t.createdAt.getTime() === cursorDate.getTime() &&
              t.id < cursor.id),
        );
        if (startIndex === -1) {
          startIndex = trips.length;
        }
      }

      // Slice to get the page
      const items = trips.slice(startIndex, startIndex + first);
      const hasMore = startIndex + first < trips.length;

      // Build edges with cursors
      const edges = items.map((item) => ({
        node: item,
        cursor: encodeCursor({
          id: item.id,
          createdAt: item.createdAt.toISOString(),
        }),
      }));

      return {
        edges,
        nodes: items,
        pageInfo: {
          hasNextPage: hasMore,
          hasPreviousPage: !!cursor,
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges[edges.length - 1]?.cursor ?? null,
        },
      };
    });
  }
}
