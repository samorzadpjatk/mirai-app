import { sql, eq, and, gte, lte } from "drizzle-orm";
import {
  trips,
  type TripSelect,
  type TripInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Trip, type TripStatus } from "@mirai-app/domain";
import type { TripRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../base/repository";
import { TripDrizzleMapper } from "../../mappers/drizzle/trip";

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
  async findByStatus(status: TripStatus): Promise<Trip[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.status, status));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find active trips (trips where current time is between start and end dates)
   */
  async findActive(): Promise<Trip[]> {
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
  }

  /**
   * Find trips with pagination
   */
  override async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Trip[]> {
    let query = this.db.select().from(this.table);

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    const records = await query;
    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Update trip status
   */
  async updateStatus(id: string, status: TripStatus): Promise<Trip> {
    const [record] = await this.db
      .update(this.table)
      .set({ status, updatedAt: new Date() })
      .where(eq(this.table.id, id))
      .returning();

    if (!record) {
      throw new Error(`Trip with id ${id} not found`);
    }

    return this.mapper.toDomain(record);
  }

  /**
   * Count trips by status
   */
  async countByStatus(status: TripStatus): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.status, status));

    return result[0]?.count ?? 0;
  }
}
