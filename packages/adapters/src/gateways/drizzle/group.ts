import { sql, eq, and } from "drizzle-orm";
import {
  groups,
  type GroupSelect,
  type GroupInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import { Group, GroupStatus } from "@mirai-app/domain";
import type { GroupRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../base/repository";
import { GroupDrizzleMapper } from "../../mappers/drizzle/group";
import { DatabaseError } from "../../errors/adapter-errors";

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
  findByTripId(tripId: string): Effect.Effect<Group[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.tripId, tripId));

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          message: "Failed to find groups by trip ID",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Find groups by status
   */
  findByStatus(status: GroupStatus): Effect.Effect<Group[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const isDeleted = status === GroupStatus.DELETED;
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.isDeleted, isDeleted));

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatus",
          message: "Failed to find groups by status",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Find groups by trip ID and status
   */
  findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Effect.Effect<Group[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const isDeleted = status === GroupStatus.DELETED;
        const records = await this.db
          .select()
          .from(this.table)
          .where(
            and(
              eq(this.table.tripId, tripId),
              eq(this.table.isDeleted, isDeleted),
            ),
          );

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdAndStatus",
          message: "Failed to find groups by trip ID and status",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Find groups by organizer ID
   */
  findByOrganizerId(organizerId: string): Effect.Effect<Group[], never, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.organizerId, organizerId));

        return records.map((record) => this.mapper.toDomain(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByOrganizerId",
          message: "Failed to find groups by organizer ID",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Find group by code
   */
  findByCode(code: string): Effect.Effect<Group | null, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.code, code))
          .limit(1);

        const record = records[0];
        return record ? this.mapper.toDomain(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByCode",
          message: "Failed to find group by code",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Find groups with pagination
   */
  override findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Group[], never, never> {
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
          message: "Failed to find groups with pagination",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  /**
   * Count groups by trip ID
   */
  countByTripId(tripId: string): Effect.Effect<number, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.tripId, tripId));

        return result[0]?.count ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "countByTripId",
          message: "Failed to count groups by trip ID",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }
}
