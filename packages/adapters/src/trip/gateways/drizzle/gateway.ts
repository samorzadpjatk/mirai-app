import { sql, eq, and, gte, lte } from "drizzle-orm";
import {
  trips,
  type TripSelect,
  type TripInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import { type TripStatus } from "@mirai-app/domain";
import type {
  TripGateway,
  TripDTO,
  TripPaginatedResult,
} from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";
import { TripDrizzleMapper } from "../../../trip/mappers/drizzle/mapper";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";

/**
 * DrizzleTripGateway
 *
 * Gateway implementation using Drizzle ORM for Trip entity.
 * Returns TripDTOs instead of domain entities to satisfy the TripGateway interface.
 */
export class DrizzleTripGateway
  extends BaseDrizzleGateway<TripDTO, TripSelect, TripInsert, typeof trips>
  implements TripGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: trips,
      mapper: TripDrizzleMapper.instance,
    });
  }

  /**
   * Find trips by status
   */
  findByStatus(
    status: TripStatus,
  ): Effect.Effect<TripDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, status));

        return records.map((record) =>
          TripDrizzleMapper.instance.toDTO(record),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatus",
          message: "Failed to find trips by status",
          cause: error,
        }),
    });
  }

  /**
   * Find active trips (trips where current time is between start and end dates)
   */
  findActive(): Effect.Effect<TripDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(
              lte(this.table.startDate, now),
              gte(this.table.endDate, now),
              eq(this.table.status, "ACTIVE"),
            ),
          );

        return records.map((record) =>
          TripDrizzleMapper.instance.toDTO(record),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findActive",
          message: "Failed to find active trips",
          cause: error,
        }),
    });
  }

  /**
   * Find trips with pagination
   */
  override findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<TripPaginatedResult, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const limit = options?.limit ?? 50;
        const offset = options?.offset ?? 0;

        // Get total count
        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table);
        const total = countResult?.count ?? 0;

        // Get paginated records
        let query = this.db.select().from(this.table);

        if (limit) {
          query = query.limit(limit) as typeof query;
        }
        if (offset) {
          query = query.offset(offset) as typeof query;
        }

        const records = await query;
        const items = records.map((record) =>
          TripDrizzleMapper.instance.toDTO(record),
        );

        const hasMore = items.length === limit && offset + items.length < total;

        return {
          items,
          total,
          limit,
          offset,
          hasMore,
        };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: "Failed to find trips with pagination",
          cause: error,
        }),
    });
  }

  /**
   * Update trip status
   */
  updateStatus(
    id: string,
    status: TripStatus,
  ): Effect.Effect<TripDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({ status, updatedAt: new Date() })
          .where(eq(this.table.id, id))
          .returning();

        if (!record) {
          throw new Error(`Trip with id ${id} not found`);
        }

        return TripDrizzleMapper.instance.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "updateStatus",
          message: `Failed to update trip status for id ${id}`,
          cause: error,
        }),
    });
  }

  /**
   * Count trips by status
   */
  countByStatus(
    status: TripStatus,
  ): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.status, status));

        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByStatus",
          message: "Failed to count trips by status",
          cause: error,
        }),
    });
  }
}
