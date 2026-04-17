import type { GroupJoinRequestId } from "../value-objects/GroupJoinRequestId";
import type { GroupId } from "../value-objects/GroupId";
import type { TripId } from "../../trip/value-objects/TripId";
import type { UserId } from "../../user/value-objects/UserId";
import { ValidationError } from "../../shared/errors/domain-errors";
import { Effect } from "effect";

/**
 * Join Request Status Enum
 */
export type JoinRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

/**
 * Group Join Request Domain Entity
 *
 * Represents a user's request to join a group.
 */
export class GroupJoinRequest {
  private constructor(
    readonly id: GroupJoinRequestId,
    readonly groupId: GroupId,
    readonly tripId: TripId,
    readonly userId: UserId,
    readonly status: JoinRequestStatus,
    readonly requestedAt: Date,
    readonly decidedAt: Date | null,
    readonly decidedBy: UserId | null,
  ) {}

  /**
   * Factory method to create a GroupJoinRequest entity
   */
  static create(props: {
    id: GroupJoinRequestId;
    groupId: GroupId;
    tripId: TripId;
    userId: UserId;
    status?: JoinRequestStatus;
    requestedAt: Date;
    decidedAt?: Date | null;
    decidedBy?: UserId | null;
  }): Effect.Effect<GroupJoinRequest, ValidationError, never> {
    const status = props.status ?? "PENDING";

    if (!["PENDING", "ACCEPTED", "REJECTED"].includes(status)) {
      return Effect.fail(
        new ValidationError({
          field: "status",
          message: "Invalid join request status",
          value: status,
        }),
      );
    }

    // If status is not PENDING, decidedAt and decidedBy should be set
    if (status !== "PENDING" && !props.decidedAt) {
      return Effect.fail(
        new ValidationError({
          field: "decidedAt",
          message: "Decided at date is required when status is not pending",
          value: props.decidedAt,
        }),
      );
    }

    return Effect.succeed(
      new GroupJoinRequest(
        props.id,
        props.groupId,
        props.tripId,
        props.userId,
        status,
        props.requestedAt,
        props.decidedAt ?? null,
        props.decidedBy ?? null,
      ),
    );
  }

  /**
   * Check if the request is pending
   */
  isPending(): boolean {
    return this.status === "PENDING";
  }

  /**
   * Accept the join request
   */
  accept(decidedBy: UserId): GroupJoinRequest {
    return new GroupJoinRequest(
      this.id,
      this.groupId,
      this.tripId,
      this.userId,
      "ACCEPTED",
      this.requestedAt,
      new Date(),
      decidedBy,
    );
  }

  /**
   * Reject the join request
   */
  reject(decidedBy: UserId): GroupJoinRequest {
    return new GroupJoinRequest(
      this.id,
      this.groupId,
      this.tripId,
      this.userId,
      "REJECTED",
      this.requestedAt,
      new Date(),
      decidedBy,
    );
  }

  /**
   * Cancel the join request (only if pending)
   */
  cancel(): Effect.Effect<GroupJoinRequest, ValidationError, never> {
    if (this.status !== "PENDING") {
      return Effect.fail(
        new ValidationError({
          field: "status",
          message: "Only pending requests can be cancelled",
          value: this.status,
        }),
      );
    }

    return Effect.succeed(
      new GroupJoinRequest(
        this.id,
        this.groupId,
        this.tripId,
        this.userId,
        "REJECTED",
        this.requestedAt,
        new Date(),
        this.userId, // Cancelled by the requester
      ),
    );
  }
}
