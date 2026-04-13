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
import { DatabaseError } from "../../errors/adapter-errors";

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

  override create(location: Location): Effect.Effect<Location, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const insertData = this.mapper.toDrizzleInsert(location);
        const [record] = await this.db
          .insert(this.table)
          .values(insertData)
          .returning();

        if (!record) {
          throw new Error("Failed to create location: no record returned");
        }

        return this.mapper.toDomain(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "create",
          message: "Failed to create location",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  findByUserId(userId: string): Effect.Effect<Location | null, never, never> {
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
    }).pipe(Effect.orDie);
  }

  findSharingWithUser(userId: string): Effect.Effect<Location[], never, never> {
    return Effect.succeed([]);
  }

  findByUserIds(userIds: string[]): Effect.Effect<Location[], never, never> {
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
    }).pipe(Effect.orDie);
  }

  save(location: Location): Effect.Effect<Location, never, never> {
    return Effect.tryPromise({
      try: async () => {
        const existing = await this.findByUserId(location.userId);
        if (existing) {
          return await this.update({
            ...location,
            id: existing.id,
          } as Location & { id: string });
        }
        return await this.create(location);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "save",
          message: "Failed to save location",
          cause: error,
        }),
    }).pipe(Effect.orDie);
  }

  override delete(id: LocationId): Effect.Effect<void, never, never> {
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
    }).pipe(Effect.orDie);
  }

  deleteByUserId(userId: string): Effect.Effect<void, never, never> {
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
    }).pipe(Effect.orDie);
  }

  existsForUser(userId: string): Effect.Effect<boolean, never, never> {
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
    }).pipe(Effect.orDie);
  }
}
