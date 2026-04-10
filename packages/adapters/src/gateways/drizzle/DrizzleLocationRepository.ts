import { eq, inArray } from "drizzle-orm";
import {
  locations,
  type LocationSelect,
  type LocationInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Location, type LocationId } from "@mirai-app/domain";
import type { LocationRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../BaseDrizzleRepository";
import { LocationDrizzleMapper } from "../../mappers/drizzle/LocationDrizzleMapper";

/**
 * DrizzleLocationRepository
 *
 * Repository implementation using Drizzle ORM for Location entity.
 */
export class DrizzleLocationRepository
  extends BaseDrizzleRepository<
    Location,
    LocationSelect,
    LocationInsert,
    typeof locations
  >
  implements LocationRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: locations,
      mapper: LocationDrizzleMapper.instance,
    });
  }

  async findByUserId(userId: string): Promise<Location | null> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.userId, userId))
      .limit(1);
    return records[0] ? this.mapper.toDomain(records[0]) : null;
  }

  async findSharingWithUser(userId: string): Promise<Location[]> {
    // This requires a join with locationSharingRequests table
    // For simplicity, returning empty array
    // In production, implement the join query
    return [];
  }

  async findByUserIds(userIds: string[]): Promise<Location[]> {
    if (userIds.length === 0) return [];
    const records = await this.db
      .select()
      .from(this.table)
      .where(inArray(this.table.userId, userIds));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async save(location: Location): Promise<Location> {
    // Upsert pattern: try update, if not exists then create
    const existing = await this.findByUserId(location.userId);
    if (existing) {
      return this.update({ ...location, id: existing.id } as Location & {
        id: string;
      });
    }
    return this.create(location);
  }

  async delete(id: LocationId): Promise<void> {
    await this.db.delete(this.table).where(eq(this.table.id, id));
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(this.table).where(eq(this.table.userId, userId));
  }

  async existsForUser(userId: string): Promise<boolean> {
    const records = await this.db
      .select({ id: this.table.id })
      .from(this.table)
      .where(eq(this.table.userId, userId))
      .limit(1);
    return records.length > 0;
  }
}
