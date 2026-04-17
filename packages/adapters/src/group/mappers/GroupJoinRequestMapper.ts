import type { GroupJoinRequestSelect } from "@mirai-app/frameworks/drizzle";
import {
  GroupJoinRequest,
  GroupJoinRequestId,
  GroupId,
  TripId,
  UserId,
  type JoinRequestStatus,
} from "@mirai-app/domain";
import type { IPortError } from "@mirai-app/domain";
import { Effect } from "effect";

/**
 * GroupJoinRequest Mapper
 *
 * Maps between database GroupJoinRequest records and domain GroupJoinRequest entities.
 */
export class GroupJoinRequestMapper {
  /**
   * Convert database record to domain entity
   */
  toDomain(
    dbRequest: GroupJoinRequestSelect,
  ): Effect.Effect<GroupJoinRequest, IPortError, never> {
    return GroupJoinRequest.create({
      id: GroupJoinRequestId.unsafeCreate(dbRequest.id),
      groupId: GroupId.unsafeCreate(dbRequest.groupId),
      tripId: TripId.unsafeCreate(dbRequest.tripId),
      userId: UserId.unsafeCreate(dbRequest.userId),
      status: "PENDING", // Default status for new requests
      requestedAt: dbRequest.createdAt,
      decidedAt: null,
      decidedBy: null,
    });
  }

  /**
   * Convert domain entity to database insert format
   */
  toInsert(request: GroupJoinRequest): {
    id: string;
    groupId: string;
    tripId: string;
    userId: string;
    createdAt: Date;
  } {
    return {
      id: GroupJoinRequestId.toString(request.id),
      groupId: GroupId.toString(request.groupId),
      tripId: TripId.toString(request.tripId),
      userId: UserId.toString(request.userId),
      createdAt: request.requestedAt,
    };
  }

  /**
   * Convert domain entity status to database-compatible format
   */
  toStatusUpdate(request: GroupJoinRequest): {
    status: string;
    decidedAt: Date | null;
    decidedBy: string | null;
  } {
    return {
      status: request.status,
      decidedAt: request.decidedAt,
      decidedBy: request.decidedBy ? UserId.toString(request.decidedBy) : null,
    };
  }
}

export const groupJoinRequestMapper = new GroupJoinRequestMapper();
