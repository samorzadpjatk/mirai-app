import type { Group, GroupStatus } from "@mirai-app/domain";
import type { GroupRepository } from "@mirai-app/use-cases";
import { Effect } from "effect";
import { InMemoryRepository } from "./base";

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
  create(group: Group): Effect.Effect<Group, never, never> {
    return this.createGeneric(group);
  }

  findById(id: string): Effect.Effect<Group | null, never, never> {
    return this.findByIdGeneric(id);
  }

  findByTripId(tripId: string): Effect.Effect<Group[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((g) => g.tripId === tripId),
    );
  }

  findByStatus(status: GroupStatus): Effect.Effect<Group[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((g) => g.status === status),
    );
  }

  findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Effect.Effect<Group[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter(
        (g) => g.tripId === tripId && g.status === status,
      ),
    );
  }

  findByOrganizerId(organizerId: string): Effect.Effect<Group[], never, never> {
    return Effect.succeed(
      this.getAllItems().filter((g) => g.organizerId === organizerId),
    );
  }

  findByCode(code: string): Effect.Effect<Group | null, never, never> {
    return Effect.succeed(
      this.getAllItems().find((g) => g.code === code) ?? null,
    );
  }

  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Effect.Effect<Group[], never, never> {
    return this.findAllGeneric(options);
  }

  update(group: Group): Effect.Effect<Group, never, never> {
    return this.updateGeneric(group);
  }

  delete(id: string): Effect.Effect<void, never, never> {
    return this.deleteGeneric(id);
  }

  exists(id: string): Effect.Effect<boolean, never, never> {
    return this.existsGeneric(id);
  }

  countByTripId(tripId: string): Effect.Effect<number, never, never> {
    return Effect.succeed(
      this.getAllItems().filter((g) => g.tripId === tripId).length,
    );
  }
}
