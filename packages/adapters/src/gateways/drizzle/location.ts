import { eq, inArray } from "drizzle-orm";
import {
  locations,
  type LocationSelect,
  type LocationInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import { Location, type LocationId } from "@mirai-app/domain";
import type { LocationRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../base/repository";
import { LocationDrizzleMapper } from "../../mappers/drizzle/location";
import { DatabaseError } from "@mirai-app/use-cases/ports/errors";

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

  findByUserId(
    userId: string,
  ): Effect.Effect<Location | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.userId, userId))
          .limit(1);
        return records[0] ? this.mapper.toDomain(records[0]) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByUserId",
          message: "Failed to find location by user ID",
          cause: error,
        }),
    });
  }

  findSharingWithUser(
    userId: string,
  ): Effect.Effect<Location[], DatabaseError, never> {
    return Effect.succeed([]);
  }

  findByUserIds(
    userIds: string[],
  ): Effect.Effect<Location[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (userIds.length === 0) return [];
        const records = await this.db
          .select()
          .from(this.table)
          .where(inArray(this.table.userId, userIds));
        return records.map((r) => this.mapper.toDomain(r));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByUserIds",
          message: "Failed to find locations by user IDs",
          cause: error,
        }),
    });
  }

  save(location: Location): Effect.Effect<Location, DatabaseError, never> {
    return Effect.gen(this, function* () {
      const existing = yield* this.findByUserId(location.userId);
      if (existing) {
        return yield* this.update({
          ...location,
          id: existing.id,
        } as Location & { id: string });
      }
      return yield* this.create(location);
    });
  }

  override delete(id: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db.delete(this.table).where(eq(this.table.id, id));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "delete",
          message: "Failed to delete location",
          cause: error,
        }),
    });
  }

  deleteByUserId(userId: string): Effect.Effect<void, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        await this.db.delete(this.table).where(eq(this.table.userId, userId));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "deleteByUserId",
          message: "Failed to delete location by user ID",
          cause: error,
        }),
    });
  }

  existsForUser(userId: string): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({ id: this.table.id })
          .from(this.table)
          .where(eq(this.table.userId, userId))
          .limit(1);
        return records.length > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "existsForUser",
          message: "Failed to check location existence for user",
          cause: error,
        }),
    });
  }
}
