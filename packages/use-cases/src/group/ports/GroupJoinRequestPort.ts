import { Context, Effect } from "effect";
import type {
  GroupJoinRequest,
  IPortError,
  IGroupJoinRequestPort,
} from "@mirai-app/domain";

/**
 * GroupJoinRequest Port - Repository interface with Context.Tag for Effect DI
 * Extends domain IGroupJoinRequestPort with use-case specific methods
 */
export interface GroupJoinRequestUseCasePort extends IGroupJoinRequestPort {
  findById(
    id: string,
  ): Effect.Effect<GroupJoinRequest | null, IPortError, never>;
  findByUserAndTrip(
    userId: string,
    tripId: string,
  ): Effect.Effect<GroupJoinRequest | null, IPortError, never>;
  findByUserTripAndGroup(
    userId: string,
    tripId: string,
    groupId: string,
  ): Effect.Effect<GroupJoinRequest | null, IPortError, never>;
  findPendingByGroupId(
    groupId: string,
  ): Effect.Effect<GroupJoinRequest[], IPortError, never>;
  findByGroupId(
    groupId: string,
  ): Effect.Effect<GroupJoinRequest[], IPortError, never>;
  create(
    request: GroupJoinRequest,
  ): Effect.Effect<GroupJoinRequest, IPortError, never>;
  update(
    request: GroupJoinRequest,
  ): Effect.Effect<GroupJoinRequest, IPortError, never>;
  delete(id: string): Effect.Effect<void, IPortError, never>;
  deleteByGroupId(groupId: string): Effect.Effect<void, IPortError, never>;
  deleteByUserAndTrip(
    userId: string,
    tripId: string,
  ): Effect.Effect<void, IPortError, never>;
  deleteByUsersAndTrip(
    userIds: string[],
    tripId: string,
  ): Effect.Effect<void, IPortError, never>;
  exists(id: string): Effect.Effect<boolean, IPortError, never>;
  hasPendingRequest(
    userId: string,
    tripId: string,
  ): Effect.Effect<boolean, IPortError, never>;
}

export class GroupJoinRequestPortTag extends Context.Tag(
  "GroupJoinRequestPort",
)<GroupJoinRequestPortTag, GroupJoinRequestUseCasePort>() {}
