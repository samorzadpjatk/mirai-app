import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * LocationSharingRequestStatus - represents the status of a location sharing request
 */
export enum LocationSharingRequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

/**
 * LocationSharingRequest entity - represents friend-to-friend location sharing requests
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class LocationSharingRequest {
  private constructor(
    public readonly id: string,
    public readonly senderId: string,
    public readonly receiverId: string,
    public readonly status: LocationSharingRequestStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new LocationSharingRequest
   * Validates all input data
   */
  static create(props: {
    id?: string;
    senderId: string;
    receiverId: string;
    status?: LocationSharingRequestStatus;
    createdAt?: Date;
    updatedAt?: Date;
  }): Result<LocationSharingRequest, string> {
    // Validate senderId
    if (!props.senderId || props.senderId.trim() === "") {
      return err("senderId is required");
    }

    // Validate receiverId
    if (!props.receiverId || props.receiverId.trim() === "") {
      return err("receiverId is required");
    }

    // Check that sender and receiver are different
    if (props.senderId.trim() === props.receiverId.trim()) {
      return err("senderId and receiverId must be different");
    }

    const now = new Date();
    const status = props.status ?? LocationSharingRequestStatus.PENDING;

    return ok(
      new LocationSharingRequest(
        props.id ?? crypto.randomUUID(),
        props.senderId.trim(),
        props.receiverId.trim(),
        status,
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
  }

  /**
   * Accept the request
   * Returns a new LocationSharingRequest instance (immutable)
   */
  accept(): LocationSharingRequest {
    return new LocationSharingRequest(
      this.id,
      this.senderId,
      this.receiverId,
      LocationSharingRequestStatus.ACCEPTED,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Reject the request
   * Returns a new LocationSharingRequest instance (immutable)
   */
  reject(): LocationSharingRequest {
    return new LocationSharingRequest(
      this.id,
      this.senderId,
      this.receiverId,
      LocationSharingRequestStatus.REJECTED,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Check if request is pending
   */
  isPending(): boolean {
    return this.status === LocationSharingRequestStatus.PENDING;
  }

  /**
   * Check if request is accepted
   */
  isAccepted(): boolean {
    return this.status === LocationSharingRequestStatus.ACCEPTED;
  }

  /**
   * Check if request is rejected
   */
  isRejected(): boolean {
    return this.status === LocationSharingRequestStatus.REJECTED;
  }

  /**
   * Check if request is in a terminal state (accepted or rejected)
   */
  isResolved(): boolean {
    return this.isAccepted() || this.isRejected();
  }

  /**
   * Get unique composite identifier (senderId + receiverId)
   */
  getUniqueKey(): string {
    return `${this.senderId}:${this.receiverId}`;
  }

  /**
   * Check if this user is involved in the request (as sender or receiver)
   */
  involvesUser(userId: string): boolean {
    return this.senderId === userId || this.receiverId === userId;
  }

  /**
   * Check if user is the sender
   */
  isFromUser(userId: string): boolean {
    return this.senderId === userId;
  }

  /**
   * Check if user is the receiver
   */
  isToUser(userId: string): boolean {
    return this.receiverId === userId;
  }

  /**
   * Get the other party's ID given one user's ID
   */
  getOtherParty(userId: string): string | null {
    if (this.senderId === userId) return this.receiverId;
    if (this.receiverId === userId) return this.senderId;
    return null;
  }
}
