import { sql, eq, and } from "drizzle-orm";
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
  Group,
  GroupStatus,
  TripParticipant,
  TripParticipantRole,
} from "@mirai-app/domain";
import type { GroupRepository } from "@mirai-app/use-cases";
import { BaseDrizzleRepository } from "../base/repository";
import { GroupDrizzleMapper } from "../../mappers/drizzle/group";
import { DatabaseError } from "@mirai-app/adapters/errors";

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
  findByTripId(tripId: string): Effect.Effect<Group[], DatabaseError, never> {
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
    });
  }

  /**
   * Find groups by status
   */
  findByStatus(
    status: GroupStatus,
  ): Effect.Effect<Group[], DatabaseError, never> {
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
    });
  }

  /**
   * Find groups by trip ID and status
   */
  findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Effect.Effect<Group[], DatabaseError, never> {
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
    });
  }

  /**
   * Find groups by organizer ID
   */
  findByOrganizerId(
    organizerId: string,
  ): Effect.Effect<Group[], DatabaseError, never> {
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
    });
  }

  /**
   * Find group by code
   */
  findByCode(code: string): Effect.Effect<Group | null, DatabaseError, never> {
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
    });
  }

  /**
   * Find groups with pagination
   */
  override findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Group[], DatabaseError, never> {
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
