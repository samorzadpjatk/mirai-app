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
import { Effect } from "effect";
import {
  InMemoryGateway,
  DatabaseError,
} from "../../../system/shared/gateways/in-memory-base";

/**
 * In-Memory Group Gateway for Testing
 *
 * Implements GroupGateway port with in-memory storage.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryGroupGateway();
 * gateway.seed([mockGroupDTO]);
 *
 * const byTrip = await Effect.runPromise(gateway.findByTripId("trip-123"));
 * expect(byTrip).toHaveLength(1);
 *
 * gateway.reset();
 * ```
 */

/**
 * In-memory storage for trip participants
 */
interface ParticipantRecord {
  id: string;
  userId: string;
  tripId: string;
  groupId: string | null;
  role: string;
  joinedAt: Date;
}

export class InMemoryGroupGateway
  extends InMemoryGateway<GroupDTO>
  implements GroupGateway
{
  private participants: Map<string, ParticipantRecord> = new Map();

  create(dto: GroupDTO): Effect.Effect<GroupDTO, never, never> {
    return Effect.sync(() => {
      this.storage.set(dto.id, dto);
      return dto;
    });
  }

  findById(id: GroupId): Effect.Effect<GroupDTO | null, DatabaseError, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findByTripId(
    tripId: string,
  ): Effect.Effect<GroupDTO[], DatabaseError, never> {
    return Effect.sync(() =>
      this.getAllItems().filter((g) => g.tripId === tripId),
    );
  }

  findByStatus(
    status: string,
  ): Effect.Effect<GroupDTO[], DatabaseError, never> {
    return Effect.sync(() =>
      this.getAllItems().filter((g) => g.status === status),
    );
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<GroupPaginatedResult, DatabaseError, never> {
    return Effect.sync(() => {
      const limit = options?.limit ?? 50;
      const offset = options?.offset ?? 0;
      const allItems = this.getAllItems();
      const total = allItems.length;
      const items = allItems.slice(offset, offset + limit);
      const hasMore = offset + items.length < total;

      return {
        items,
        total,
        limit,
        offset,
        hasMore,
      };
    });
  }

  update(dto: GroupDTO): Effect.Effect<GroupDTO, DatabaseError, never> {
    return Effect.sync(() => {
      this.storage.set(dto.id, dto);
      return dto;
    });
  }

  delete(id: GroupId): Effect.Effect<void, DatabaseError, never> {
    return Effect.sync(() => {
      this.storage.delete(id);
    });
  }

  exists(id: GroupId): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.sync(() => this.storage.has(id));
  }

  existsByCode(
    code: string,
    excludeGroupId?: GroupId,
  ): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.sync(() => {
      const groups = this.getAllItems();
      const found = groups.find(
        (g) => g.code === code && (!excludeGroupId || g.id !== excludeGroupId),
      );
      return !!found;
    });
  }

  findByCode(
    code: string,
  ): Effect.Effect<GroupDTO | null, DatabaseError, never> {
    return Effect.sync(() => {
      const found = this.getAllItems().find((g) => g.code === code);
      return found ?? null;
    });
  }

  getCoins(id: GroupId): Effect.Effect<number, DatabaseError, never> {
    return Effect.sync(() => {
      const group = this.storage.get(id);
      return group?.coins ?? 0;
    });
  }

  updateCoins(
    id: GroupId,
    amount: number,
  ): Effect.Effect<GroupDTO, DatabaseError, never> {
    return Effect.gen(this, function* () {
      const group = this.storage.get(id);
      if (!group) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "updateCoins",
            message: `Group not found: ${id}`,
          }),
        );
      }

      const updated: GroupDTO = {
        ...group,
        coins: group.coins + amount,
        updatedAt: new Date(),
      };

      this.storage.set(id, updated);
      return updated;
    });
  }

  /**
   * Reset gateway - clears groups and participants
   */
  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.storage.clear();
      this.participants.clear();
    });
  }

  /**
   * Seed participants for testing
   */
  seedParticipants(
    participants: ParticipantRecord[],
  ): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      participants.forEach((p) => this.participants.set(p.id, p));
    });
  }

  // ============================================================================
  // Additional methods for Group domain (not in GroupGateway interface)
  // ============================================================================

  findByTripIdAndStatus(
    tripId: string,
    status: string,
  ): Effect.Effect<GroupDTO[], never, never> {
    return Effect.sync(() =>
      this.getAllItems().filter(
        (g) => g.tripId === tripId && g.status === status,
      ),
    );
  }

  findByOrganizerId(
    organizerId: string,
  ): Effect.Effect<GroupDTO[], never, never> {
    return Effect.sync(() =>
      this.getAllItems().filter((g) => g.createdById === organizerId),
    );
  }

  // ============================================================================
  // Cursor-based pagination methods (Connection methods)
  // ============================================================================

  findByTripIdConnection(
    tripId: string,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  > {
    return Effect.sync(() => {
      const limit = Math.min(options.limit ?? 20, 100);
      const cursor = options.cursor;

      let items = this.getAllItems().filter((g) => g.tripId === tripId);
      const total = items.length;

      // Sort by createdAt DESC, id DESC
      items.sort((a, b) => {
        const dateCompare = b.createdAt.getTime() - a.createdAt.getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.id.localeCompare(a.id);
      });

      // Apply cursor filter
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        items = items.filter((g) => {
          const gDate = g.createdAt.getTime();
          const cDate = cursorDate.getTime();
          if (gDate !== cDate) return gDate < cDate;
          return g.id.localeCompare(cursor.id) < 0;
        });
      }

      const hasMore = items.length > limit;
      const paginatedItems = items.slice(0, limit);

      const lastItem = paginatedItems[paginatedItems.length - 1];
      const nextCursor =
        hasMore && lastItem
          ? { id: lastItem.id, createdAt: lastItem.createdAt.toISOString() }
          : null;

      return { items: paginatedItems, total, hasMore, nextCursor };
    });
  }

  findByStatusConnection(
    status: string,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  > {
    return Effect.sync(() => {
      const limit = Math.min(options.limit ?? 20, 100);
      const cursor = options.cursor;

      let items = this.getAllItems().filter((g) => g.status === status);
      const total = items.length;

      // Sort by createdAt DESC, id DESC
      items.sort((a, b) => {
        const dateCompare = b.createdAt.getTime() - a.createdAt.getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.id.localeCompare(a.id);
      });

      // Apply cursor filter
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        items = items.filter((g) => {
          const gDate = g.createdAt.getTime();
          const cDate = cursorDate.getTime();
          if (gDate !== cDate) return gDate < cDate;
          return g.id.localeCompare(cursor.id) < 0;
        });
      }

      const hasMore = items.length > limit;
      const paginatedItems = items.slice(0, limit);

      const lastItem = paginatedItems[paginatedItems.length - 1];
      const nextCursor =
        hasMore && lastItem
          ? { id: lastItem.id, createdAt: lastItem.createdAt.toISOString() }
          : null;

      return { items: paginatedItems, total, hasMore, nextCursor };
    });
  }

  findByTripIdAndStatusConnection(
    tripId: string,
    status: string,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  > {
    return Effect.sync(() => {
      const limit = Math.min(options.limit ?? 20, 100);
      const cursor = options.cursor;

      let items = this.getAllItems().filter(
        (g) => g.tripId === tripId && g.status === status,
      );
      const total = items.length;

      // Sort by createdAt DESC, id DESC
      items.sort((a, b) => {
        const dateCompare = b.createdAt.getTime() - a.createdAt.getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.id.localeCompare(a.id);
      });

      // Apply cursor filter
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        items = items.filter((g) => {
          const gDate = g.createdAt.getTime();
          const cDate = cursorDate.getTime();
          if (gDate !== cDate) return gDate < cDate;
          return g.id.localeCompare(cursor.id) < 0;
        });
      }

      const hasMore = items.length > limit;
      const paginatedItems = items.slice(0, limit);

      const lastItem = paginatedItems[paginatedItems.length - 1];
      const nextCursor =
        hasMore && lastItem
          ? { id: lastItem.id, createdAt: lastItem.createdAt.toISOString() }
          : null;

      return { items: paginatedItems, total, hasMore, nextCursor };
    });
  }

  findByOrganizerIdConnection(
    organizerId: string,
    options: CursorPaginationOptions<{ id: string; createdAt: string }>,
  ): Effect.Effect<
    CursorPaginatedResult<GroupDTO, { id: string; createdAt: string }>,
    DatabaseError,
    never
  > {
    return Effect.sync(() => {
      const limit = Math.min(options.limit ?? 20, 100);
      const cursor = options.cursor;

      let items = this.getAllItems().filter(
        (g) => g.createdById === organizerId,
      );
      const total = items.length;

      // Sort by createdAt DESC, id DESC
      items.sort((a, b) => {
        const dateCompare = b.createdAt.getTime() - a.createdAt.getTime();
        if (dateCompare !== 0) return dateCompare;
        return b.id.localeCompare(a.id);
      });

      // Apply cursor filter
      if (cursor) {
        const cursorDate = new Date(cursor.createdAt);
        items = items.filter((g) => {
          const gDate = g.createdAt.getTime();
          const cDate = cursorDate.getTime();
          if (gDate !== cDate) return gDate < cDate;
          return g.id.localeCompare(cursor.id) < 0;
        });
      }

      const hasMore = items.length > limit;
      const paginatedItems = items.slice(0, limit);

      const lastItem = paginatedItems[paginatedItems.length - 1];
      const nextCursor =
        hasMore && lastItem
          ? { id: lastItem.id, createdAt: lastItem.createdAt.toISOString() }
          : null;

      return { items: paginatedItems, total, hasMore, nextCursor };
    });
  }

  countByTripId(tripId: string): Effect.Effect<number, never, never> {
    return Effect.sync(
      () => this.getAllItems().filter((g) => g.tripId === tripId).length,
    );
  }

  // ============================================================================
  // Participant management methods
  // ============================================================================

  findParticipantByUserIdAndTripId(
    userId: string,
    tripId: string,
  ): Effect.Effect<TripParticipant | null, DatabaseError, never> {
    return Effect.gen(this, function* () {
      const record = Array.from(this.participants.values()).find(
        (p) => p.userId === userId && p.tripId === tripId,
      );

      if (!record) {
        return null;
      }

      const participant = yield* this.createParticipantFromRecord(record);
      return participant;
    });
  }

  findParticipantsByGroupId(
    groupId: string,
  ): Effect.Effect<TripParticipant[], DatabaseError, never> {
    return Effect.gen(this, function* () {
      const records = Array.from(this.participants.values()).filter(
        (p) => p.groupId === groupId,
      );

      const participants: TripParticipant[] = [];
      for (const record of records) {
        const participant = yield* this.createParticipantFromRecord(record);
        participants.push(participant);
      }

      return participants;
    });
  }

  assignUserToGroup(
    userId: string,
    groupId: string,
  ): Effect.Effect<TripParticipant, DatabaseError, never> {
    return Effect.gen(this, function* () {
      // Find the participant by userId and their current trip
      const existingRecord = Array.from(this.participants.values()).find(
        (p) => p.userId === userId,
      );

      if (!existingRecord) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "assignUserToGroup",
            message: `Participant not found for user ${userId}`,
          }),
        );
      }

      // Get the group to verify it exists
      const group = yield* this.findById(groupId as GroupId);
      if (!group) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "assignUserToGroup",
            message: `Group ${groupId} not found`,
          }),
        );
      }

      // Update the participant record with new groupId
      const updatedRecord: ParticipantRecord = {
        ...existingRecord,
        groupId,
      };

      this.participants.set(existingRecord.id, updatedRecord);

      const participant =
        yield* this.createParticipantFromRecord(updatedRecord);
      return participant;
    });
  }

  removeUserFromGroup(
    userId: string,
    groupId: string,
  ): Effect.Effect<TripParticipant, DatabaseError, never> {
    return Effect.gen(this, function* () {
      // Find the participant by userId and groupId
      const existingRecord = Array.from(this.participants.values()).find(
        (p) => p.userId === userId && p.groupId === groupId,
      );

      if (!existingRecord) {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "removeUserFromGroup",
            message: `Participant not found for user ${userId} in group ${groupId}`,
          }),
        );
      }

      // Update the participant record to remove groupId
      const updatedRecord: ParticipantRecord = {
        ...existingRecord,
        groupId: null,
      };

      this.participants.set(existingRecord.id, updatedRecord);

      const participant =
        yield* this.createParticipantFromRecord(updatedRecord);
      return participant;
    });
  }

  /**
   * Create a TripParticipant entity from a participant record
   */
  private createParticipantFromRecord(
    record: ParticipantRecord,
  ): Effect.Effect<TripParticipant, DatabaseError, never> {
    return Effect.gen(this, function* () {
      const role =
        record.role === "LEADER"
          ? TripParticipantRole.LEADER
          : TripParticipantRole.MEMBER;

      const participantEffect = TripParticipant.create({
        id: record.id,
        userId: record.userId,
        tripId: record.tripId,
        groupId: record.groupId,
        createdAt: record.joinedAt,
        updatedAt: new Date(),
        role,
      });

      const result = yield* Effect.either(participantEffect);

      if (result._tag === "Left") {
        return yield* Effect.fail(
          new DatabaseError({
            operation: "createParticipantFromRecord",
            message: `Failed to create TripParticipant: ${result.left.message}`,
            cause: result.left,
          }),
        );
      }

      return result.right;
    });
  }
}
