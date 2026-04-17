import { Context, Effect } from "effect";
import type { Group, DatabaseError, IGroupPort } from "@mirai-app/domain";

/**
 * Group Port - Repository interface with Context.Tag for Effect DI
 * Extends domain IGroupPort with use-case specific methods
 */
export interface GroupUseCasePort extends IGroupPort {
  findById(id: string): Effect.Effect<Group | null, DatabaseError, never>;
  findByTripId(tripId: string): Effect.Effect<Group[], DatabaseError, never>;
  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { groups: Group[]; total: number; hasMore: boolean },
    DatabaseError,
    never
  >;
  findByOrganizerId(
    organizerId: string,
  ): Effect.Effect<Group[], DatabaseError, never>;
  create(group: Group): Effect.Effect<Group, DatabaseError, never>;
  update(group: Group): Effect.Effect<Group, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
  softDelete(id: string): Effect.Effect<void, DatabaseError, never>;
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;
  countByTripId(tripId: string): Effect.Effect<number, DatabaseError, never>;
  addCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<Group, DatabaseError, never>;
  subtractCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<Group, DatabaseError, never>;
  getRanking(tripId: string): Effect.Effect<Group[], DatabaseError, never>;
}

export class GroupPortTag extends Context.Tag("GroupPort")<
  GroupPortTag,
  GroupUseCasePort
>() {}
