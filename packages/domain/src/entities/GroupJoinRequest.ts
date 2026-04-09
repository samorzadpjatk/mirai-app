import type { Result } from "../utils/result";
import { ok, err } from "../utils/result";

/**
 * GroupJoinRequest entity - represents a pending request to join a group
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class GroupJoinRequest {
  private constructor(
    public readonly id: string,
    public readonly tripId: string,
    public readonly groupId: string,
    public readonly userId: string,
    public readonly createdAt: Date,
  ) {}

  /**
   * Factory method to create a new GroupJoinRequest
   * Validates all input data
   */
  static create(props: {
    id?: string;
    tripId: string;
    groupId: string;
    userId: string;
    createdAt?: Date;
  }): Result<GroupJoinRequest, string> {
    // Validate tripId
    if (!props.tripId || props.tripId.trim() === "") {
      return err("tripId is required");
    }

    // Validate groupId
    if (!props.groupId || props.groupId.trim() === "") {
      return err("groupId is required");
    }

    // Validate userId
    if (!props.userId || props.userId.trim() === "") {
      return err("userId is required");
    }

    // Check that userId is different from groupId
    if (props.userId.trim() === props.groupId.trim()) {
      return err("userId and groupId must be different");
    }

    const now = new Date();

    return ok(
      new GroupJoinRequest(
        props.id ?? crypto.randomUUID(),
        props.tripId.trim(),
        props.groupId.trim(),
        props.userId.trim(),
        props.createdAt ?? now,
      ),
    );
  }

  /**
   * Get unique composite identifier (tripId + userId)
   * One user can only have one pending request per trip
   */
  getUniqueKey(): string {
    return `${this.tripId}:${this.userId}`;
  }

  /**
   * Get full composite identifier
   */
  getCompositeId(): string {
    return `${this.tripId}:${this.groupId}:${this.userId}`;
  }

  /**
   * Check if this request matches given identifiers
   */
  matches(tripId: string, userId: string): boolean {
    return this.tripId === tripId && this.userId === userId;
  }

  /**
   * Check if this request is for a specific trip
   */
  isForTrip(tripId: string): boolean {
    return this.tripId === tripId;
  }

  /**
   * Check if this request is for a specific group
   */
  isForGroup(groupId: string): boolean {
    return this.groupId === groupId;
  }

  /**
   * Check if this request is from a specific user
   */
  isFromUser(userId: string): boolean {
    return this.userId === userId;
  }

  /**
   * Get age of request in milliseconds
   */
  getAgeMs(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Check if request is older than given milliseconds
   */
  isOlderThan(ms: number): boolean {
    return this.getAgeMs() > ms;
  }
}
