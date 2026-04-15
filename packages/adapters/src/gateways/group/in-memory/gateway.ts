import { Group, TripParticipant, type GroupStatus } from "@mirai-app/domain";
import type { GroupRepository } from "@mirai-app/domain/ports";
import { Effect } from "effect";
import { InMemoryGateway, DatabaseError } from "../_shared/in-memory-base";

/**
 * In-Memory Group Gateway for Testing
 *
 * Implements GroupRepository port with in-memory storage.
 *
 * @example
 * ```typescript
 * const gateway = new InMemoryGroupGateway();
 * gateway.seed([mockGroup]);
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
  joinedAt: Date;
}

export class InMemoryGroupGateway
  extends InMemoryGateway<Group>
  implements GroupRepository
{
  private participants: Map<string, ParticipantRecord> = new Map();
  /**
   * Reconstruct a Group entity from plain object storage.
   * Uses reconstitute() factory to bypass validation and ensure proper instance.
   */
  protected override reconstruct(
    plain: unknown,
  ): Effect.Effect<Group, DatabaseError, never> {
    const p = plain as Record<string, unknown>;
    try {
      const group = Group.reconstitute({
        id: p.id as string,
        tripId: p.tripId as string,
        name: p.name as string,
        description: p.description as string | null,
        image: p.image as string | null,
        organizerId: p.organizerId as string,
        code: p.code as string,
        coins: p.coins as number,
        status: p.status as GroupStatus,
        createdAt: p.createdAt as Date,
        updatedAt: p.updatedAt as Date,
      });
      return Effect.succeed(group);
    } catch (error) {
      return Effect.fail(
        new DatabaseError({
          operation: "reconstruct",
          message: `Failed to reconstruct Group: ${error instanceof Error ? error.message : String(error)}`,
          cause: error,
        }),
      );
    }
  }

  create(group: Group): Effect.Effect<Group, never, never> {
    return Effect.sync(() => {
      this.storage.set(group.id, group);
      return group;
    });
  }

  findById(id: string): Effect.Effect<Group | null, never, never> {
    return Effect.sync(() => this.storage.get(id) ?? null);
  }

  findByTripId(tripId: string): Effect.Effect<Group[], never, never> {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const filtered = plains.filter(
        (g) => (g as unknown as Record<string, unknown>).tripId === tripId,
      );
      const reconstructed: Group[] = [];
      for (const plain of filtered) {
        const entity = yield* this.reconstruct(plain).pipe(Effect.orDie);
        reconstructed.push(entity);
      }
      return reconstructed;
    });
  }

  findByStatus(status: GroupStatus): Effect.Effect<Group[], never, never> {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const filtered = plains.filter(
        (g) => (g as unknown as Record<string, unknown>).status === status,
      );
      const reconstructed: Group[] = [];
      for (const plain of filtered) {
        const entity = yield* this.reconstruct(plain).pipe(Effect.orDie);
        reconstructed.push(entity);
      }
      return reconstructed;
    });
  }

  findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Effect.Effect<Group[], never, never> {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const filtered = plains.filter(
        (g) =>
          (g as unknown as Record<string, unknown>).tripId === tripId &&
          (g as unknown as Record<string, unknown>).status === status,
      );
      const reconstructed: Group[] = [];
      for (const plain of filtered) {
        const entity = yield* this.reconstruct(plain).pipe(Effect.orDie);
        reconstructed.push(entity);
      }
      return reconstructed;
    });
  }

  findByOrganizerId(organizerId: string): Effect.Effect<Group[], never, never> {
    return Effect.gen(this, function* () {
      const plains = this.getAllItems();
      const filtered = plains.filter(
        (g) =>
          (g as unknown as Record<string, unknown>).organizerId === organizerId,
      );
      const reconstructed: Group[] = [];
      for (const plain of filtered) {
        const entity = yield* this.reconstruct(plain).pipe(Effect.orDie);
        reconstructed.push(entity);
      }
      return reconstructed;
    });
  }

  findByCode(code: string): Effect.Effect<Group | null, never, never> {
    return Effect.succeed(
      this.getAllItems().find(
        (g) => (g as unknown as Record<string, unknown>).code === code,
      ) ?? null,
    );
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Group[], never, never> {
    return Effect.gen(this, function* () {
      const groups = yield* this.findAllGeneric(options).pipe(Effect.orDie);
      return groups;
    });
  }

  update(group: Group): Effect.Effect<Group, never, never> {
    return Effect.sync(() => {
      this.storage.set(group.id, group);
      return group;
    });
  }

  delete(id: string): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      this.storage.delete(id);
    });
  }

  exists(id: string): Effect.Effect<boolean, never, never> {
    return Effect.sync(() => this.storage.has(id));
  }

  countByTripId(tripId: string): Effect.Effect<number, never, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (g) => (g as unknown as Record<string, unknown>).tripId === tripId,
      ).length,
    );
  }

  /**
   * Reset gateway - clears groups and participants
   */
  override reset(): Effect.Effect<void, never, never> {
    return Effect.sync(() => {
      super.reset();
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
      const group = yield* this.findById(groupId);
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
      const participantEffect = TripParticipant.create({
        id: record.id,
        userId: record.userId,
        tripId: record.tripId,
        groupId: record.groupId,
        createdAt: record.joinedAt,
        updatedAt: new Date(),
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
