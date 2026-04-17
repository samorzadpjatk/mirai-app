import { Effect } from "effect";
import {
  Group,
  GroupId,
  TripId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";
import type { IGroupPort } from "@mirai-app/use-cases";

/**
 * In-Memory Group Gateway
 *
 * Implements GroupPort using in-memory Map storage for testing.
 */
export class InMemoryGroupGateway implements IGroupPort {
  private groups: Map<string, Group> = new Map();

  findById(id: string): Effect.Effect<Group | null, DatabaseError, never> {
    return Effect.succeed(this.groups.get(id) ?? null);
  }

  findByCode(code: string): Effect.Effect<Group | null, DatabaseError, never> {
    const result = Array.from(this.groups.values()).find(
      (g) => g.code === code && !g.isDeleted,
    );
    return Effect.succeed(result ?? null);
  }

  findByTripId(tripId: string): Effect.Effect<Group[], DatabaseError, never> {
    const result = Array.from(this.groups.values()).filter(
      (g) => TripId.toString(g.tripId) === tripId && !g.isDeleted,
    );
    return Effect.succeed(result);
  }

  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { groups: Group[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  > {
    const allGroups = Array.from(this.groups.values()).filter(
      (g) => TripId.toString(g.tripId) === tripId && !g.isDeleted,
    );
    const total = allGroups.length;
    const paginated = allGroups
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(params.offset, params.offset + params.limit);
    const hasMore = params.offset + paginated.length < total;

    return Effect.succeed({ groups: paginated, total, hasMore });
  }

  findByOrganizerId(
    organizerId: string,
  ): Effect.Effect<Group[], DatabaseError, never> {
    const result = Array.from(this.groups.values()).filter(
      (g) => UserId.toString(g.organizerId) === organizerId && !g.isDeleted,
    );
    return Effect.succeed(result);
  }

  create(group: Group): Effect.Effect<Group, DatabaseError, never> {
    this.groups.set(GroupId.toString(group.id), group);
    return Effect.succeed(group);
  }

  update(group: Group): Effect.Effect<Group, DatabaseError, never> {
    this.groups.set(GroupId.toString(group.id), group);
    return Effect.succeed(group);
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    this.groups.delete(id);
    return Effect.succeed(undefined);
  }

  softDelete(id: string): Effect.Effect<void, DatabaseError, never> {
    const group = this.groups.get(id);
    if (group) {
      this.groups.set(id, group.softDelete());
    }
    return Effect.succeed(undefined);
  }

  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    const group = this.groups.get(id);
    return Effect.succeed(group != null && !group.isDeleted);
  }

  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never> {
    const count = Array.from(this.groups.values()).filter(
      (g) => TripId.toString(g.tripId) === tripId && !g.isDeleted,
    ).length;
    return Effect.succeed(count);
  }

  addCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<Group, DatabaseError, never> {
    const group = this.groups.get(groupId);
    if (!group) {
      return Effect.fail(
        new DatabaseError({
          operation: "addCoins",
          id: groupId,
          cause: new Error("Group not found"),
        }),
      );
    }

    return Effect.gen(this, function* () {
      const updated = yield* group.addCoins(amount);
      this.groups.set(groupId, updated);
      return updated;
    });
  }

  subtractCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<Group, DatabaseError, never> {
    const group = this.groups.get(groupId);
    if (!group) {
      return Effect.fail(
        new DatabaseError({
          operation: "subtractCoins",
          id: groupId,
          cause: new Error("Group not found"),
        }),
      );
    }

    return Effect.gen(this, function* () {
      const updated = yield* group.subtractCoins(amount);
      this.groups.set(groupId, updated);
      return updated;
    });
  }

  getRanking(tripId: string): Effect.Effect<Group[], DatabaseError, never> {
    const result = Array.from(this.groups.values())
      .filter((g) => TripId.toString(g.tripId) === tripId && !g.isDeleted)
      .sort((a, b) => b.coins - a.coins);
    return Effect.succeed(result);
  }

  // Test helper methods
  clear(): void {
    this.groups.clear();
  }

  seed(groups: Group[]): void {
    for (const group of groups) {
      this.groups.set(GroupId.toString(group.id), group);
    }
  }

  getAll(): Group[] {
    return Array.from(this.groups.values());
  }
}
