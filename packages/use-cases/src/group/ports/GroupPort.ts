import { Context, Effect } from "effect";
import type { Group, IPortError, IGroupPort } from "@mirai-app/domain";

/**
 * Group Port - Repository interface with Context.Tag for Effect DI
 * Extends domain IGroupPort with use-case specific methods
 */
export interface GroupUseCasePort extends IGroupPort {
  findById(id: string): Effect.Effect<Group | null, IPortError, never>;
  findByTripId(tripId: string): Effect.Effect<Group[], IPortError, never>;
  findByTripIdPaginated(
    tripId: string,
    params: { limit: number; offset: number },
  ): Effect.Effect<
    { groups: Group[]; total: number; hasMore: boolean },
    IPortError,
    never
  >;
  findByOrganizerId(
    organizerId: string,
  ): Effect.Effect<Group[], IPortError, never>;
  create(group: Group): Effect.Effect<Group, IPortError, never>;
  update(group: Group): Effect.Effect<Group, IPortError, never>;
  delete(id: string): Effect.Effect<void, IPortError, never>;
  softDelete(id: string): Effect.Effect<void, IPortError, never>;
  exists(id: string): Effect.Effect<boolean, IPortError, never>;
  countByTripId(tripId: string): Effect.Effect<number, IPortError, never>;
  addCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<Group, IPortError, never>;
  subtractCoins(
    groupId: string,
    amount: number,
  ): Effect.Effect<Group, IPortError, never>;
  getRanking(tripId: string): Effect.Effect<Group[], IPortError, never>;
}

export class GroupPortTag extends Context.Tag("GroupPort")<
  GroupPortTag,
  GroupUseCasePort
>() {}
