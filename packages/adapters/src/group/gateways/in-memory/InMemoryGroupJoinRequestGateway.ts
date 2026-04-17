import { Effect } from "effect";
import {
  GroupJoinRequest,
  GroupJoinRequestId,
  GroupId,
  TripId,
  UserId,
  DatabaseError,
} from "@mirai-app/domain";
import type { IGroupJoinRequestPort } from "@mirai-app/use-cases";

/**
 * In-Memory GroupJoinRequest Gateway
 *
 * Implements GroupJoinRequestPort using in-memory Map storage for testing.
 */
export class InMemoryGroupJoinRequestGateway implements IGroupJoinRequestPort {
  private requests: Map<string, GroupJoinRequest> = new Map();

  findById(
    id: string,
  ): Effect.Effect<GroupJoinRequest | null, DatabaseError, never> {
    return Effect.succeed(this.requests.get(id) ?? null);
  }

  findByUserAndTrip(
    userId: string,
    tripId: string,
  ): Effect.Effect<GroupJoinRequest | null, DatabaseError, never> {
    const result = Array.from(this.requests.values()).find(
      (r) =>
        UserId.toString(r.userId) === userId &&
        TripId.toString(r.tripId) === tripId,
    );
    return Effect.succeed(result ?? null);
  }

  findByUserTripAndGroup(
    userId: string,
    tripId: string,
    groupId: string,
  ): Effect.Effect<GroupJoinRequest | null, DatabaseError, never> {
    const result = Array.from(this.requests.values()).find(
      (r) =>
        UserId.toString(r.userId) === userId &&
        TripId.toString(r.tripId) === tripId &&
        GroupId.toString(r.groupId) === groupId,
    );
    return Effect.succeed(result ?? null);
  }

  findPendingByGroupId(
    groupId: string,
  ): Effect.Effect<GroupJoinRequest[], DatabaseError, never> {
    const result = Array.from(this.requests.values()).filter(
      (r) => GroupId.toString(r.groupId) === groupId && r.isPending(),
    );
    return Effect.succeed(result);
  }

  findByGroupId(
    groupId: string,
  ): Effect.Effect<GroupJoinRequest[], DatabaseError, never> {
    const result = Array.from(this.requests.values()).filter(
      (r) => GroupId.toString(r.groupId) === groupId,
    );
    return Effect.succeed(result);
  }

  create(
    request: GroupJoinRequest,
  ): Effect.Effect<GroupJoinRequest, DatabaseError, never> {
    this.requests.set(GroupJoinRequestId.toString(request.id), request);
    return Effect.succeed(request);
  }

  update(
    request: GroupJoinRequest,
  ): Effect.Effect<GroupJoinRequest, DatabaseError, never> {
    this.requests.set(GroupJoinRequestId.toString(request.id), request);
    return Effect.succeed(request);
  }

  delete(id: string): Effect.Effect<void, DatabaseError, never> {
    this.requests.delete(id);
    return Effect.succeed(undefined);
  }

  deleteByGroupId(groupId: string): Effect.Effect<void, DatabaseError, never> {
    for (const [id, request] of this.requests.entries()) {
      if (GroupId.toString(request.groupId) === groupId) {
        this.requests.delete(id);
      }
    }
    return Effect.succeed(undefined);
  }

  deleteByUserAndTrip(
    userId: string,
    tripId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    for (const [id, request] of this.requests.entries()) {
      if (
        UserId.toString(request.userId) === userId &&
        TripId.toString(request.tripId) === tripId
      ) {
        this.requests.delete(id);
      }
    }
    return Effect.succeed(undefined);
  }

  deleteByUsersAndTrip(
    userIds: string[],
    tripId: string,
  ): Effect.Effect<void, DatabaseError, never> {
    for (const [id, request] of this.requests.entries()) {
      if (
        userIds.includes(UserId.toString(request.userId)) &&
        TripId.toString(request.tripId) === tripId
      ) {
        this.requests.delete(id);
      }
    }
    return Effect.succeed(undefined);
  }

  exists(id: string): Effect.Effect<boolean, DatabaseError, never> {
    return Effect.succeed(this.requests.has(id));
  }

  hasPendingRequest(
    userId: string,
    tripId: string,
  ): Effect.Effect<boolean, DatabaseError, never> {
    const hasPending = Array.from(this.requests.values()).some(
      (r) =>
        UserId.toString(r.userId) === userId &&
        TripId.toString(r.tripId) === tripId &&
        r.isPending(),
    );
    return Effect.succeed(hasPending);
  }

  // Test helper methods
  clear(): void {
    this.requests.clear();
  }

  seed(requests: GroupJoinRequest[]): void {
    for (const request of requests) {
      this.requests.set(GroupJoinRequestId.toString(request.id), request);
    }
  }

  getAll(): GroupJoinRequest[] {
    return Array.from(this.requests.values());
  }
}
