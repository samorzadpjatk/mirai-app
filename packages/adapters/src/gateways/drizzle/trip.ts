import { sql, eq, and, gte, lte } from "drizzle-orm";
import {
  trips,
  type TripSelect,
  type TripInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import { Trip, type TripStatus } from "@mirai-app/domain";
import type { TripRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../base/repository";
import { TripDrizzleMapper } from "../../mappers/drizzle/trip";
import { DatabaseError } from "@mirai-app/adapters/errors";

/**
 * DrizzleTripRepository
 *
 * Repository implementation using Drizzle ORM for Trip entity.
 */
export class DrizzleTripRepository
  extends BaseDrizzleRepository<Trip, TripSelect, TripInsert, typeof trips>
  implements TripRepository
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
  findByStatus(status: TripStatus): Effect.Effect<Trip[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.status, status));

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatus",
          message: "Failed to find trips by status",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Find active trips (trips where current time is between start and end dates)
   */
  findActive(): Effect.Effect<Trip[], never, never> {
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

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findActive",
          message: "Failed to find active trips",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Find trips with pagination
   */
  override findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Trip[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        let query = this.db.select().from(this.table);

        if (options?.limit) {
          query = query.limit(options.limit) as typeof query;
        }
        if (options?.offset) {
          query = query.offset(options.offset) as typeof query;
        }

        const records = await query;
        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findAll",
          message: "Failed to find trips with pagination",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Update trip status
   */
  updateStatus(
    id: string,
    status: TripStatus,
  ): Effect.Effect<Trip, never, never> {
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

        return this.mapper.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "updateStatus",
          message: `Failed to update trip status for id ${id}`,
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Count trips by status
   */
  countByStatus(status: TripStatus): Effect.Effect<number, never, never> {
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
    }).pipe(Effect.orDie);
  }
}
