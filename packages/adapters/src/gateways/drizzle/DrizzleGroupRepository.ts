import { sql, eq, and } from "drizzle-orm";
import {
  groups,
  type GroupSelect,
  type GroupInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Group, type GroupStatus } from "@mirai-app/domain";
import type { GroupRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../base/repository";
import { GroupDrizzleMapper } from "../../mappers/drizzle/group";

/**
 * DrizzleGroupRepository
 *
 * Repository implementation using Drizzle ORM for Group entity.
 */
export class DrizzleGroupRepository
  extends BaseDrizzleRepository<Group, GroupSelect, GroupInsert, typeof groups>
  implements GroupRepository
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: groups,
      mapper: GroupDrizzleMapper.instance,
    });
  }

  /**
   * Find groups by trip ID
   */
  async findByTripId(tripId: string): Promise<Group[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.tripId, tripId));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find groups by status
   */
  async findByStatus(status: GroupStatus): Promise<Group[]> {
    const isDeleted = status === GroupStatus.DELETED;
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.isDeleted, isDeleted));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find groups by trip ID and status
   */
  async findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Promise<Group[]> {
    const isDeleted = status === GroupStatus.DELETED;
    const records = await this.db
      .select()
      .from(this.table)
      .where(
        and(eq(this.table.tripId, tripId), eq(this.table.isDeleted, isDeleted)),
      );

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find groups by organizer ID
   */
  async findByOrganizerId(organizerId: string): Promise<Group[]> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.organizerId, organizerId));

    return records.map((record) => this.mapper.toDomain(record));
  }

  /**
   * Find group by code
   */
  async findByCode(code: string): Promise<Group | null> {
    const records = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.code, code))
      .limit(1);

    const record = records[0];
    return record ? this.mapper.toDomain(record) : null;
  }

  /**
   * Find groups with pagination
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Group[]> {
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
   * Count groups by trip ID
   */
  async countByTripId(tripId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(eq(this.table.tripId, tripId));

    return result[0]?.count ?? 0;
  }
}
