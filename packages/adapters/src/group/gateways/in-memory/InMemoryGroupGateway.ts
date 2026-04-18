import { Effect } from "effect";
import {
  Group,
  GroupId,
  TripId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";
import type { IGroupPort } from "@mirai-app/domain";

/**
 * In-Memory Group Gateway
 *
 * Implements GroupPort using in-memory Map storage for testing.
 */
export class InMemoryGroupGateway implements IGroupPort {
  private groups: Map<string, Group> = new Map();

  findById(id: GroupId) {
    const idStr = GroupId.toString(id);
    return Effect.succeed(this.groups.get(idStr) ?? null);
  }

  findByCode(code: string) {
    const result = Array.from(this.groups.values()).find(
      (g) => g.code === code && !g.isDeleted,
    );
    return Effect.succeed(result ?? null);
  }

  findByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);
    const result = Array.from(this.groups.values()).filter(
      (g) => TripId.toString(g.tripId) === tripIdStr && !g.isDeleted,
    );
    return Effect.succeed(result);
  }

  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
  ) {
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

  findByOrganizerId(organizerId: string) {
    const result = Array.from(this.groups.values()).filter(
      (g) => UserId.toString(g.organizerId) === organizerId && !g.isDeleted,
    );
    return Effect.succeed(result);
  }

  create(group: Group) {
    this.groups.set(GroupId.toString(group.id), group);
    return Effect.succeed(group);
  }

  update(group: Group) {
    this.groups.set(GroupId.toString(group.id), group);
    return Effect.succeed(group);
  }

  delete(id: GroupId) {
    const idStr = GroupId.toString(id);
    this.groups.delete(idStr);
    return Effect.succeed(undefined);
  }

  softDelete(id: GroupId) {
    const idStr = GroupId.toString(id);
    const group = this.groups.get(idStr);
    if (group) {
      this.groups.set(idStr, group.softDelete());
    }
    return Effect.succeed(undefined);
  }

  exists(id: GroupId) {
    const idStr = GroupId.toString(id);
    const group = this.groups.get(idStr);
    return Effect.succeed(group != null && !group.isDeleted);
  }

  countByTripId(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);
    const count = Array.from(this.groups.values()).filter(
      (g) => TripId.toString(g.tripId) === tripIdStr && !g.isDeleted,
    ).length;
    return Effect.succeed(count);
  }

  addCoins(groupId: GroupId, amount: number) {
    const groupIdStr = GroupId.toString(groupId);
    const group = this.groups.get(groupIdStr);
    if (!group) {
      return Effect.fail(
        new DatabaseError({
          operation: "addCoins",
          id: groupIdStr,
          cause: new Error("Group not found"),
        }),
      );
    }

    return Effect.gen(this, function* () {
      const updated = yield* group.addCoins(amount);
      this.groups.set(groupIdStr, updated);
      return updated;
    });
  }

  subtractCoins(groupId: GroupId, amount: number) {
    const groupIdStr = GroupId.toString(groupId);
    const group = this.groups.get(groupIdStr);
    if (!group) {
      return Effect.fail(
        new DatabaseError({
          operation: "subtractCoins",
          id: groupIdStr,
          cause: new Error("Group not found"),
        }),
      );
    }

    return Effect.gen(this, function* () {
      const updated = yield* group.subtractCoins(amount);
      this.groups.set(groupIdStr, updated);
      return updated;
    });
  }

  getRanking(tripId: TripId) {
    const tripIdStr = TripId.toString(tripId);
    const result = Array.from(this.groups.values())
      .filter((g) => TripId.toString(g.tripId) === tripIdStr && !g.isDeleted)
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
