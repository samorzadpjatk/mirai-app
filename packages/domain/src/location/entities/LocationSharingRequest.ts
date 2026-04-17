import type { UserId } from "../../user/value-objects/UserId";
import type { LocationSharingRequestId } from "../value-objects/LocationId";
import { ValidationError } from "../../shared/errors/domain-errors";
import { Effect, Data } from "effect";

/**
 * Location sharing request status
 */
export type LocationSharingRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

/**
 * LocationSharingRequest Domain Entity
 *
 * Represents a request for location sharing between two users.
 */
export class LocationSharingRequest {
  private constructor(
    readonly id: LocationSharingRequestId,
    readonly senderId: UserId,
    readonly receiverId: UserId,
    readonly status: LocationSharingRequestStatus,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a LocationSharingRequest entity
   */
  static create(props: {
    id: LocationSharingRequestId;
    senderId: UserId;
    receiverId: UserId;
    status?: LocationSharingRequestStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<LocationSharingRequest, ValidationError, never> {
    // Validate that sender and receiver are not the same
    if (props.senderId === props.receiverId) {
      return Effect.fail(
        new ValidationError({
          field: "receiverId",
          message: "Cannot send location sharing request to yourself",
          value: props.receiverId,
        }),
      );
    }

    // Validate status
    const validStatuses: LocationSharingRequestStatus[] = [
      "PENDING",
      "ACCEPTED",
      "REJECTED",
    ];
    const status = props.status ?? "PENDING";
    if (!validStatuses.includes(status)) {
      return Effect.fail(
        new ValidationError({
          field: "status",
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          value: status,
        }),
      );
    }

    const now = props.createdAt ?? new Date();

    return Effect.succeed(
      new LocationSharingRequest(
        props.id,
        props.senderId,
        props.receiverId,
        status,
        now,
        props.updatedAt ?? now,
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
   * Check if the request is accepted
   */
  isAccepted(): boolean {
    return this.status === "ACCEPTED";
  }

  /**
   * Check if the request is rejected
   */
  isRejected(): boolean {
    return this.status === "REJECTED";
  }

  /**
   * Accept the request
   */
  accept(): Effect.Effect<LocationSharingRequest, ValidationError, never> {
    if (!this.isPending()) {
      return Effect.fail(
        new ValidationError({
          field: "status",
          message: "Only pending requests can be accepted",
          value: this.status,
        }),
      );
    }

    return Effect.succeed(
      new LocationSharingRequest(
        this.id,
        this.senderId,
        this.receiverId,
        "ACCEPTED",
        this.createdAt,
        new Date(),
      ),
    );
  }

  /**
   * Reject the request
   */
  reject(): Effect.Effect<LocationSharingRequest, ValidationError, never> {
    if (!this.isPending()) {
      return Effect.fail(
        new ValidationError({
          field: "status",
          message: "Only pending requests can be rejected",
          value: this.status,
        }),
      );
    }

    return Effect.succeed(
      new LocationSharingRequest(
        this.id,
        this.senderId,
        this.receiverId,
        "REJECTED",
        this.createdAt,
        new Date(),
      ),
    );
  }

  /**
   * Reset to pending (e.g., for re-sending a rejected request)
   */
  resetToPending(): Effect.Effect<
    LocationSharingRequest,
    ValidationError,
    never
  > {
    return Effect.succeed(
      new LocationSharingRequest(
        this.id,
        this.senderId,
        this.receiverId,
        "PENDING",
        this.createdAt,
        new Date(),
      ),
    );
  }
}
