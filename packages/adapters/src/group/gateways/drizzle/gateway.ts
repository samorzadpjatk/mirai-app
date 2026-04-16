import { sql, eq, and, desc } from "drizzle-orm";
import {
  groups,
  tripParticipants,
  type GroupSelect,
  type GroupInsert,
  type TripParticipantSelect,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import { Effect } from "effect";
import {
  GroupStatus,
  TripParticipant,
  TripParticipantRole,
  type GroupId,
} from "@mirai-app/domain";
import type {
  GroupGateway,
  GroupDTO,
  GroupPaginatedResult,
  CursorPaginationOptions,
  CursorPaginatedResult,
} from "@mirai-app/use-cases";
import { DatabaseError } from "@mirai-app/domain";
import { BaseDrizzleGateway } from "../../../system/shared/gateways/drizzle-base";
import { GroupDrizzleMapper } from "../../../group/mappers/drizzle/mapper";

/**
 * DrizzleGroupGateway
 *
 * Gateway implementation using Drizzle ORM for Group entity.
 * Returns GroupDTOs instead of domain entities to satisfy the GroupGateway interface.
 *
 * @example
 * ```typescript
 * const container = createContainer({
 *   groupGateway: asFunction(() => new DrizzleGroupGateway(db)).singleton(),
 * });
 * ```
 */
export class DrizzleGroupGateway
  extends BaseDrizzleGateway<GroupDTO, GroupSelect, GroupInsert, typeof groups>
  implements GroupGateway
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
  findByTripId(
    tripId: string,
  ): Effect.Effect<GroupDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.tripId, tripId));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripId",
          message: "Failed to find groups by trip ID",
          cause: error,
        }),
    });
  }

  /**
   * Find groups by status
   */
  findByStatus(
    status: string,
  ): Effect.Effect<GroupDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const isDeleted = status === GroupStatus.DELETED;
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.isDeleted, isDeleted));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatus",
          message: "Failed to find groups by status",
          cause: error,
        }),
    });
  }

  /**
   * Find groups by trip ID and status
   */
  findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Effect.Effect<GroupDTO[], DatabaseError, never> {
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

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdAndStatus",
          message: "Failed to find groups by trip ID and status",
          cause: error,
        }),
    });
  }

  /**
   * Find groups by organizer ID
   */
  findByOrganizerId(
    organizerId: string,
  ): Effect.Effect<GroupDTO[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.organizerId, organizerId));

        return records.map((record) => this.mapper.toDTO(record));
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByOrganizerId",
          message: "Failed to find groups by organizer ID",
          cause: error,
        }),
    });
  }

  /**
   * Find groups by trip ID with cursor-based pagination
   * Sorted by (createdAt DESC, id DESC)
   */
  findByTripIdConnection(
    tripId: string,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const limit = Math.min(options.limit ?? 20, 100);
        const cursor = options.cursor;

        const conditions = [eq(this.table.tripId, tripId)];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.tripId, tripId));
        const total = countResult?.count ?? 0;

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        const lastItem = items[items.length - 1];
        const nextCursor =
          hasMore && lastItem
            ? { id: lastItem.id, createdAt: lastItem.createdAt.toISOString() }
            : null;

        return { items, total, hasMore, nextCursor };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdConnection",
          message: "Failed to find groups by trip ID with cursor pagination",
          cause: error,
        }),
    });
  }

  /**
   * Find groups by status with cursor-based pagination
   * Sorted by (createdAt DESC, id DESC)
   */
  findByStatusConnection(
    status: string,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const limit = Math.min(options.limit ?? 20, 100);
        const cursor = options.cursor;
        const isDeleted = status === GroupStatus.DELETED;

        const conditions = [eq(this.table.isDeleted, isDeleted)];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.isDeleted, isDeleted));
        const total = countResult?.count ?? 0;

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        const lastItem = items[items.length - 1];
        const nextCursor =
          hasMore && lastItem
            ? { id: lastItem.id, createdAt: lastItem.createdAt.toISOString() }
            : null;

        return { items, total, hasMore, nextCursor };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByStatusConnection",
          message: "Failed to find groups by status with cursor pagination",
          cause: error,
        }),
    });
  }

  /**
   * Find groups by trip ID and status with cursor-based pagination
   * Sorted by (createdAt DESC, id DESC)
   */
  findByTripIdAndStatusConnection(
    tripId: string,
    status: GroupStatus,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const limit = Math.min(options.limit ?? 20, 100);
        const cursor = options.cursor;
        const isDeleted = status === GroupStatus.DELETED;

        const conditions = [
          eq(this.table.tripId, tripId),
          eq(this.table.isDeleted, isDeleted),
        ];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(
            and(
              eq(this.table.tripId, tripId),
              eq(this.table.isDeleted, isDeleted),
            ),
          );
        const total = countResult?.count ?? 0;

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        const lastItem = items[items.length - 1];
        const nextCursor =
          hasMore && lastItem
            ? { id: lastItem.id, createdAt: lastItem.createdAt.toISOString() }
            : null;

        return { items, total, hasMore, nextCursor };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByTripIdAndStatusConnection",
          message:
            "Failed to find groups by trip ID and status with cursor pagination",
          cause: error,
        }),
    });
  }

  /**
   * Find groups by organizer ID with cursor-based pagination
   * Sorted by (createdAt DESC, id DESC)
   */
  findByOrganizerIdConnection(
    organizerId: string,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const limit = Math.min(options.limit ?? 20, 100);
        const cursor = options.cursor;

        const conditions = [eq(this.table.organizerId, organizerId)];

        if (cursor) {
          conditions.push(
            sql`(${this.table.createdAt}, ${this.table.id}) < (${cursor.createdAt}, ${cursor.id})`,
          );
        }

        const [countResult] = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(eq(this.table.organizerId, organizerId));
        const total = countResult?.count ?? 0;

        const records = await this.db
          .select()
          .from(this.table)
          .where(and(...conditions))
          .orderBy(desc(this.table.createdAt), desc(this.table.id))
          .limit(limit + 1);

        const hasMore = records.length > limit;
        const items = records.slice(0, limit).map((r) => this.mapper.toDTO(r));

        const lastItem = items[items.length - 1];
        const nextCursor =
          hasMore && lastItem
            ? { id: lastItem.id, createdAt: lastItem.createdAt.toISOString() }
            : null;

        return { items, total, hasMore, nextCursor };
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByOrganizerIdConnection",
          message:
            "Failed to find groups by organizer ID with cursor pagination",
          cause: error,
        }),
    });
  }

  /**
   * Find group by code
   */
  findByCode(
    code: string,
  ): Effect.Effect<GroupDTO | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.code, code))
          .limit(1);

        const record = records[0];
        return record ? this.mapper.toDTO(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByCode",
          message: "Failed to find group by code",
          cause: error,
        }),
    });
  }

  /**
   * Find groups with pagination
   */
  override findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<GroupPaginatedResult, DatabaseError, never> {
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
        const items = records.map((record) => this.mapper.toDTO(record));

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
          message: "Failed to find groups with pagination",
          cause: error,
        }),
    });
  }

  /**
   * Check if group code already exists
   */
  existsByCode(
    code: string,
    excludeGroupId?: GroupId,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const conditions: Array<ReturnType<typeof eq>> = [
          eq(this.table.code, code),
        ];

        if (excludeGroupId) {
          conditions.push(
            sql`${this.table.id} != ${excludeGroupId}` as ReturnType<typeof eq>,
          );
        }

        const result = await this.db
          .select({ count: sql<number>`count(*)::int` })
          .from(this.table)
          .where(and(...conditions));

        return (result[0]?.count ?? 0) > 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "existsByCode",
          message: "Failed to check if group code exists",
          cause: error,
        }),
    });
  }

  /**
   * Get coin balance for a group
   */
  getCoins(id: GroupId): Effect.Effect<number, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select({ coins: this.table.coins })
          .from(this.table)
          .where(eq(this.table.id, id))
          .limit(1);

        return records[0]?.coins ?? 0;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "getCoins",
          message: "Failed to get group coins",
          cause: error,
        }),
    });
  }

  /**
   * Update coin balance
   */
  updateCoins(
    id: GroupId,
    amount: number,
  ): Effect.Effect<GroupDTO, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const [record] = await this.db
          .update(this.table)
          .set({
            coins: sql`${this.table.coins} + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(this.table.id, id))
          .returning();

        if (!record) {
          throw new Error(`Group not found: ${id}`);
        }

        return this.mapper.toDTO(record);
      },
      catch: (error) =>
        new DatabaseError({
          operation: "updateCoins",
          message: "Failed to update group coins",
          cause: error,
        }),
    });
  }

  /**
   * Count groups by trip ID
   */
  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
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
    });
  }

  /**
   * Find trip participant by user ID and trip ID
   */
  findParticipantByUserIdAndTripId(
    userId: string,
    tripId: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(tripParticipants)
          .where(
            and(
              eq(tripParticipants.userId, userId),
              eq(tripParticipants.tripId, tripId),
            ),
          )
          .limit(1);

        const record = records[0];
        return record ? this.mapTripParticipantFromDrizzle(record) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findParticipantByUserIdAndTripId",
          message: "Failed to find participant by user ID and trip ID",
          cause: error,
        }),
    });
  }

  /**
   * Find all participants assigned to a group
   */
  findParticipantsByGroupId(
    groupId: string,
  ): Effect.Effect<TripParticipant[], DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(tripParticipants)
          .where(eq(tripParticipants.groupId, groupId));

        return records.map((record) =>
          this.mapTripParticipantFromDrizzle(record),
        );
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findParticipantsByGroupId",
          message: "Failed to find participants by group ID",
          cause: error,
        }),
    });
  }

  /**
   * Assign a user to a group by updating their participant record
   */
  assignUserToGroup(
    userId: string,
    groupId: string,
  ): Effect.Effect<TripParticipant, DatabaseError, never> {
    return Effect.gen(this, function* () {
      // First find the group to get the trip ID
      const group = yield* this.findById(groupId);
      if (!group) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "assignUserToGroup",
            message: `Group not found: ${groupId}`,
          }),
        );
      }

      // Find the participant
      const participant = yield* this.findParticipantByUserIdAndTripId(
        userId,
        group.tripId,
      );
      if (!participant) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "assignUserToGroup",
            message: `Participant not found for user ${userId} in trip ${group.tripId}`,
          }),
        );
      }

      // Update the participant's groupId in the database
      const updatedParticipant = yield* Effect.tryPromise({
        try: async () => {
          const records = await this.db
            .update(tripParticipants)
            .set({ groupId, updatedAt: new Date() })
            .where(eq(tripParticipants.id, participant.id))
            .returning();

          const record = records[0];
          if (!record) {
            throw new Error("Failed to update participant");
          }
          return this.mapTripParticipantFromDrizzle(record);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "assignUserToGroup",
            message: "Failed to assign user to group",
            cause: error,
          }),
      });

      return updatedParticipant;
    });
  }

  /**
   * Remove a user from their assigned group
   */
  removeUserFromGroup(
    userId: string,
    groupId: string,
  ): Effect.Effect<TripParticipant, DatabaseError, never> {
    return Effect.gen(this, function* () {
      // First find the group to get the trip ID
      const group = yield* this.findById(groupId);
      if (!group) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "removeUserFromGroup",
            message: `Group not found: ${groupId}`,
          }),
        );
      }

      // Find the participant
      const participant = yield* this.findParticipantByUserIdAndTripId(
        userId,
        group.tripId,
      );
      if (!participant) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "removeUserFromGroup",
            message: `Participant not found for user ${userId} in trip ${group.tripId}`,
          }),
        );
      }

      // Remove the participant's groupId in the database
      const updatedParticipant = yield* Effect.tryPromise({
        try: async () => {
          const records = await this.db
            .update(tripParticipants)
            .set({ groupId: null, updatedAt: new Date() })
            .where(
              and(
                eq(tripParticipants.id, participant.id),
                eq(tripParticipants.groupId, groupId),
              ),
            )
            .returning();

          const record = records[0];
          if (!record) {
            throw new Error(
              "Failed to remove user from group - user not in group",
            );
          }
          return this.mapTripParticipantFromDrizzle(record);
        },
        catch: (error) =>
          new DatabaseError({
            operation: "removeUserFromGroup",
            message: "Failed to remove user from group",
            cause: error,
          }),
      });

      return updatedParticipant;
    });
  }

  /**
   * Map Drizzle TripParticipant record to domain TripParticipant entity
   */
  private mapTripParticipantFromDrizzle(
    record: TripParticipantSelect,
  ): TripParticipant {
    const role =
      record.role === "LEADER"
        ? TripParticipantRole.LEADER
        : TripParticipantRole.MEMBER;

    const effect = TripParticipant.create({
      id: record.id,
      userId: record.userId,
      tripId: record.tripId,
      groupId: record.groupId,
      wristNumber: record.wristNumber,
      houseNumber: record.houseNumber,
      role,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    // Run the Effect synchronously
    const exit = Effect.runSyncExit(effect);

    if (exit._tag === "Failure") {
      throw new Error(
        `Failed to map TripParticipant from Drizzle: ${exit.cause}`,
      );
    }

    return exit.value;
  }
}
