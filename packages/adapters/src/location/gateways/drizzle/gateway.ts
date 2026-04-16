import { eq, inArray, count, and, asc, sql } from "drizzle-orm";
import {
  locations,
  locationSharingRequests,
  type LocationSelect,
  type LocationInsert,
  type LocationSharingRequestSelect,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import type {
  LocationId,
  Connection,
  LocationSharingRequestConnectionArgs,
} from "@mirai-app/domain";
import type {
  LocationGateway,
  LocationDTO,
  LocationPaginatedResult,
  LocationConnectionArgs,
  LocationSharingDTO,
} from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { LocationDrizzleMapper } from "../../../location/mappers/drizzle/mapper";
import { encodeCursor } from "@mirai-app/use-cases/system/utils/cursor";

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
  override create(
    location: LocationDTO,
  ): Effect.Effect<LocationDTO, DatabaseError, never> {
    return super.create(location);
  }

  /**
   * Find location by ID
   */
  override findById(
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
  override findAll(options?: {
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
   * Update location (upsert pattern for user locations)
   */
  override save(
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
  override delete(id: LocationId): Effect.Effect<void, DatabaseError, never> {
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

  // ============================================================================
  // Cursor-based Pagination Methods (Relay Connection Spec)
  // ============================================================================

  /**
   * Find locations for users that are sharing with a specific user
   * Uses cursor-based pagination per Relay Cursor Connections Specification
   * Uses (timestamp, id) composite sort key for stable pagination
   */
  findSharingWithUserConnection(
    userId: string,
    args: LocationConnectionArgs,
  ): Effect.Effect<Connection<LocationDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build conditions - find locations where isSharingLocation is true
        const conditions = [eq(this.table.isSharingLocation, true)];

        // Add cursor condition: (timestamp, id) > (cursor.createdAt, cursor.id)
        // Using timestamp as the sort field per the schema
        if (cursor) {
          const cursorDate = new Date(cursor.createdAt);
          conditions.push(
            sql`(${this.table.timestamp}, ${this.table.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(asc(this.table.timestamp), asc(this.table.id))
          .limit(first + 1);

        const hasMore = records.length > first;
        const items = records
          .slice(0, first)
          .map((record) => this.mapper.toDTO(record));

        // Build edges with cursors using recordedAt (timestamp) as the sort field
        const edges = items.map((item) => ({
          node: item,
          cursor: encodeCursor({
            id: item.id,
            createdAt: item.recordedAt.toISOString(),
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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findSharingWithUserConnection",
          message: "Failed to find locations sharing with user",
          cause: error,
        }),
    });
  }

  /**
   * Find locations by user IDs with cursor-based pagination
   * Uses (timestamp, id) composite sort key for stable pagination
   */
  findByUserIdsConnection(
    userIds: string[],
    args: LocationConnectionArgs,
  ): Effect.Effect<Connection<LocationDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Handle empty userIds - return empty result
        if (userIds.length === 0) {
          return {
            edges: [],
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: !!cursor,
              startCursor: null,
              endCursor: null,
            },
          };
        }

        // Build conditions
        const conditions: Array<
          ReturnType<typeof inArray> | ReturnType<typeof sql>
        > = [inArray(this.table.userId, userIds)];

        // Add cursor condition: (timestamp, id) > (cursor.createdAt, cursor.id)
        // Using timestamp as the sort field per the schema
        if (cursor) {
          const cursorDate = new Date(cursor.createdAt);
          conditions.push(
            sql`(${this.table.timestamp}, ${this.table.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(asc(this.table.timestamp), asc(this.table.id))
          .limit(first + 1);

        const hasMore = records.length > first;
        const items = records
          .slice(0, first)
          .map((record) => this.mapper.toDTO(record));

        // Build edges with cursors using recordedAt (timestamp) as the sort field
        const edges = items.map((item) => ({
          node: item,
          cursor: encodeCursor({
            id: item.id,
            createdAt: item.recordedAt.toISOString(),
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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByUserIdsConnection",
          message: "Failed to find locations by user IDs",
          cause: error,
        }),
    });
  }

  /**
   * Find location sharing requests sent by a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findSharingRequestsConnection(
    userId: string,
    args: LocationSharingRequestConnectionArgs,
  ): Effect.Effect<Connection<LocationSharingDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build conditions - find requests where requesterId matches
        const conditions = [eq(locationSharingRequests.requesterId, userId)];

        // Add cursor condition: (createdAt, id) > (cursor.createdAt, cursor.id)
        if (cursor) {
          const cursorDate = new Date(cursor.createdAt);
          conditions.push(
            sql`(${locationSharingRequests.createdAt}, ${locationSharingRequests.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(locationSharingRequests)
          .where(and(...conditions))
          .orderBy(
            asc(locationSharingRequests.createdAt),
            asc(locationSharingRequests.id),
          )
          .limit(first + 1);

        const hasMore = records.length > first;
        const items = records
          .slice(0, first)
          .map((record) => this.toLocationSharingDTO(record));

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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findSharingRequestsConnection",
          message: "Failed to find sharing requests",
          cause: error,
        }),
    });
  }

  /**
   * Find location sharing requests received by a user with cursor-based pagination
   * Uses (createdAt, id) sort order for stable pagination
   */
  findReceivedSharingRequestsConnection(
    userId: string,
    args: LocationSharingRequestConnectionArgs,
  ): Effect.Effect<Connection<LocationSharingDTO>, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const first = Math.min(args.first ?? 20, 100);
        const cursor = args.after;

        // Build conditions - find requests where targetId matches
        const conditions = [eq(locationSharingRequests.targetId, userId)];

        // Add cursor condition: (createdAt, id) > (cursor.createdAt, cursor.id)
        if (cursor) {
          const cursorDate = new Date(cursor.createdAt);
          conditions.push(
            sql`(${locationSharingRequests.createdAt}, ${locationSharingRequests.id}) > (${cursorDate}, ${cursor.id})`,
          );
        }

        // Fetch first + 1 to determine hasNextPage
        const records = await this.db
          .select()
          .from(locationSharingRequests)
          .where(and(...conditions))
          .orderBy(
            asc(locationSharingRequests.createdAt),
            asc(locationSharingRequests.id),
          )
          .limit(first + 1);

        const hasMore = records.length > first;
        const items = records
          .slice(0, first)
          .map((record) => this.toLocationSharingDTO(record));

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
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findReceivedSharingRequestsConnection",
          message: "Failed to find received sharing requests",
          cause: error,
        }),
    });
  }

  private toLocationSharingDTO(
    record: LocationSharingRequestSelect,
  ): LocationSharingDTO {
    return {
      id: record.id,
      userId: record.requesterId,
      sharedWithUserId: record.targetId,
      canViewLocation: record.status === "ACCEPTED",
      createdAt: record.createdAt,
    };
  }
}
