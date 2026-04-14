import { Group, type GroupStatus } from "@mirai-app/domain";
import type { GroupRepository } from "@mirai-app/use-cases";
import { Effect } from "effect";
import { InMemoryRepository, DatabaseError } from "./base";

/**
 * In-Memory Group Repository for Testing
 *
 * Implements GroupRepository port with in-memory storage.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryGroupRepository();
 * repo.seed([mockGroup]);
 *
 * const byTrip = await Effect.runPromise(repo.findByTripId("trip-123"));
 * expect(byTrip).toHaveLength(1);
 *
 * repo.reset();
 * ```
 */
export class InMemoryGroupRepository
  extends InMemoryRepository<Group>
  implements GroupRepository
{
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
}
