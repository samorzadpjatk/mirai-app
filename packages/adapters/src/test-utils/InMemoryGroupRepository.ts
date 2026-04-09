import type { Group, GroupStatus } from "@mirai-app/domain";
import type { GroupRepository } from "@mirai-app/use-cases";
import { InMemoryRepository } from "./InMemoryRepository";

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
 * const byTrip = await repo.findByTripId("trip-123");
 * expect(byTrip).toHaveLength(1);
 *
 * repo.reset();
 * ```
 */
export class InMemoryGroupRepository
  extends InMemoryRepository<Group>
  implements GroupRepository
{
  async create(group: Group): Promise<Group> {
    return this.createGeneric(group);
  }

  async findById(id: string): Promise<Group | null> {
    return this.findByIdGeneric(id);
  }

  async findByTripId(tripId: string): Promise<Group[]> {
    return this.getAllItems().filter((g) => g.tripId === tripId);
  }

  async findByStatus(status: GroupStatus): Promise<Group[]> {
    return this.getAllItems().filter((g) => g.status === status);
  }

  async findByTripIdAndStatus(
    tripId: string,
    status: GroupStatus,
  ): Promise<Group[]> {
    return this.getAllItems().filter(
      (g) => g.tripId === tripId && g.status === status,
    );
  }

  async findByOrganizerId(organizerId: string): Promise<Group[]> {
    return this.getAllItems().filter((g) => g.organizerId === organizerId);
  }

  async findByCode(code: string): Promise<Group | null> {
    return this.getAllItems().find((g) => g.code === code) ?? null;
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Group[]> {
    return this.findAllGeneric(options);
  }

  async update(group: Group): Promise<Group> {
    return this.updateGeneric(group);
  }

  async delete(id: string): Promise<void> {
    return this.deleteGeneric(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.existsGeneric(id);
  }

  async countByTripId(tripId: string): Promise<number> {
    return this.findByTripId(tripId).then((items) => items.length);
  }
}
