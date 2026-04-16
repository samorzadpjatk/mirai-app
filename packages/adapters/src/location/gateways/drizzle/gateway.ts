import { eq, inArray, count } from "drizzle-orm";
import {
  locations,
  type LocationSelect,
  type LocationInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import type { LocationId } from "@mirai-app/domain";
import type {
  LocationGateway,
  LocationDTO,
  LocationPaginatedResult,
} from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { LocationDrizzleMapper } from "../../../location/mappers/drizzle/mapper";

/**
 * DrizzleLocationGateway
 *
 * Gateway implementation using Drizzle ORM for Location entity.
 * Returns LocationDTOs instead of domain entities to satisfy the LocationGateway interface.
 *
 * @example
 * ```typescript
 * const container = createContainer({
 *   locationGateway: asFunction(() => new DrizzleLocationGateway(db)).singleton(),
 * });
 * ```
 */
export class DrizzleLocationGateway
  extends BaseDrizzleGateway<
    LocationDTO,
    LocationSelect,
    LocationInsert,
    typeof locations
  >
  implements LocationGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: locations,
      mapper: LocationDrizzleMapper.instance,
    });
  }

  /**
   * Create a new location
   */
  create(
    location: LocationDTO,
  ): Effect.Effect<LocationDTO, DatabaseError, never> {
    return super.create(location);
  }

  /**
   * Find location by ID
   */
  findById(
    id: LocationId,
  ): Effect.Effect<LocationDTO | null, DatabaseError, never> {
    return super.findById(id as string);
  }

  /**
   * Find location by user ID
   */
  findByUserId(
    userId: string,
  ): Effect.Effect<LocationDTO | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.userId, userId))
          .limit(1);

        const record = records[0];
        return record ? this.mapper.toDTO(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByUserId",
          message: "Failed to find location by user ID",
          cause: error,
        }),
    });
  }

  /**
   * Find all locations with pagination
   */
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<LocationPaginatedResult, DatabaseError, never> {
    return Effect.gen(this, function* () {
      const allRecords = yield* Effect.tryPromise({
        try: async () => {
          let query = this.db.select().from(this.table);

          if (options?.limit) {
            query = query.limit(options.limit);
          }
          if (options?.offset) {
            query = query.offset(options.offset);
          }

          return await query;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findAll",
            message: "Failed to find locations",
            cause: error,
          }),
      });

      const countResult = yield* Effect.tryPromise({
        try: async () => {
          const result = await this.db
            .select({ count: count() })
            .from(this.table);
          return result[0]?.count ?? 0;
        },
        catch: (error) =>
          new DatabaseError({
            operation: "findAll",
            message: "Failed to count locations",
            cause: error,
          }),
      });

      const dtos = allRecords.map((record) => this.mapper.toDTO(record));
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? dtos.length;
      const hasMore = offset + dtos.length < countResult;

      return {
        items: dtos,
        total: countResult,
        limit,
        offset,
        hasMore,
      };
    });
  }

  /**
   * Find locations for users that are sharing with a specific user
   * Note: This queries all locations and filters by sharing settings
   */
  findSharingWithUser(
    userId: string,
  ): Effect.Effect<LocationDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.isSharingLocation, true));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findSharingWithUser",
          message: "Failed to find locations sharing with user",
          cause: error,
        }),
    });
  }

  /**
   * Find locations by user IDs
   */
  findByUserIds(
    userIds: string[],
  ): Effect.Effect<LocationDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        if (userIds.length === 0) return [];

        const records = await this.db
          .select()
          .from(this.table)
          .where(inArray(this.table.userId, userIds));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByUserIds",
          message: "Failed to find locations by user IDs",
          cause: error,
        }),
    });
  }

  /**
   * Update location (upsert pattern for user locations)
   */
  save(
    location: LocationDTO,
  ): Effect.Effect<LocationDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const updateData = this.mapper.toDrizzleUpdate(location);

        const [record] = await this.db
          .update(this.table)
          .set(updateData)
          .where(eq(this.table.userId, location.userId))
          .returning();

        if (record) {
          return this.mapper.toDTO(record);
        }

        // If no record was updated, create one
        const insertData = this.mapper.toDrizzleInsert(location);
        const [newRecord] = await this.db
          .insert(this.table)
          .values(insertData)
          .returning();

        if (!newRecord) {
          throw new Error("Failed to save location: no record returned");
        }

        return this.mapper.toDTO(newRecord);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "save",
          message: "Failed to save location",
          cause: error,
        }),
    });
  }

  /**
   * Delete location
   */
  delete(id: LocationId): Effect.Effect<void, DatabaseError, never> {
    return super.delete(id as string);
  }

  /**
   * Delete location by user ID
   */
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

  /**
   * Check if location exists for user
   */
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
          message: "Failed to check if location exists for user",
          cause: error,
        }),
    });
  }
}
