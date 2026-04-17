import { Context, Effect } from "effect";
import type {
  GroupJoinRequest,
  DatabaseError,
  IGroupJoinRequestPort,
} from "@mirai-app/domain";

/**
 * GroupJoinRequest Port - Repository interface with Context.Tag for Effect DI
 * Extends domain IGroupJoinRequestPort with use-case specific methods
 */
export interface GroupJoinRequestUseCasePort extends IGroupJoinRequestPort {
  findById(
    id: string,
  ): Effect.Effect<GroupJoinRequest | null, DatabaseError, never>;
  findByUserAndTrip(
    userId: string,
    tripId: string,
  ): Effect.Effect<GroupJoinRequest | null, DatabaseError, never>;
  findByUserTripAndGroup(
    userId: string,
    tripId: string,
    groupId: string,
  ): Effect.Effect<GroupJoinRequest | null, DatabaseError, never>;
  findPendingByGroupId(
    groupId: string,
  ): Effect.Effect<GroupJoinRequest[], DatabaseError, never>;
  findByGroupId(
    groupId: string,
  ): Effect.Effect<GroupJoinRequest[], DatabaseError, never>;
  create(
    request: GroupJoinRequest,
  ): Effect.Effect<GroupJoinRequest, DatabaseError, never>;
  update(
    request: GroupJoinRequest,
  ): Effect.Effect<GroupJoinRequest, DatabaseError, never>;
  delete(id: string): Effect.Effect<void, DatabaseError, never>;
  deleteByGroupId(groupId: string): Effect.Effect<void, DatabaseError, never>;
  deleteByUserAndTrip(
    userId: string,
    tripId: string,
  ): Effect.Effect<void, DatabaseError, never>;
  deleteByUsersAndTrip(
    userIds: string[],
    tripId: string,
  ): Effect.Effect<void, DatabaseError, never>;
  exists(id: string): Effect.Effect<boolean, DatabaseError, never>;
  hasPendingRequest(
    userId: string,
    tripId: string,
  ): Effect.Effect<boolean, DatabaseError, never>;
}

export class GroupJoinRequestPortTag extends Context.Tag(
  "GroupJoinRequestPort",
)<GroupJoinRequestPortTag, GroupJoinRequestUseCasePort>() {}
