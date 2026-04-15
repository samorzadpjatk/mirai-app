import { Effect } from "effect";
import { ValidationError } from "../../errors";

/**
 * UserEvent entity - represents a user's participation/interest in an event
 *
 * This is a pure domain entity with no external dependencies.
 * All operations return new instances (immutable).
 */
export class UserEvent {
  private constructor(
    public readonly userId: string,
    public readonly eventId: string,
    public readonly interestedIn: boolean,
    public readonly enlistedIn: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method to create a new UserEvent
   * Validates all input data
   */
  static create(props: {
    userId: string;
    eventId: string;
    interestedIn?: boolean;
    enlistedIn?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): Effect.Effect<UserEvent, ValidationError, never> {
    // Validate userId
    if (!props.userId || props.userId.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "userId is required",
          field: "general",
        }),
      );
    }

    // Validate eventId
    if (!props.eventId || props.eventId.trim() === "") {
      return Effect.fail(
        new ValidationError({
          message: "eventId is required",
          field: "general",
        }),
      );
    }

    const interestedIn = props.interestedIn ?? false;
    const enlistedIn = props.enlistedIn ?? false;

    const now = new Date();

    return Effect.succeed(
      new UserEvent(
        props.userId.trim(),
        props.eventId.trim(),
        interestedIn,
        enlistedIn,
        props.createdAt ?? now,
        props.updatedAt ?? now,
      ),
    );
  }

  /**
   * Mark as interested
   * Returns a new UserEvent instance (immutable)
   */
  markInterested(): UserEvent {
    return new UserEvent(
      this.userId,
      this.eventId,
      true,
      this.enlistedIn,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Remove interest
   * Returns a new UserEvent instance (immutable)
   */
  removeInterest(): UserEvent {
    return new UserEvent(
      this.userId,
      this.eventId,
      false,
      this.enlistedIn,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Enlist in event
   * Returns a new UserEvent instance (immutable)
   */
  enlist(): UserEvent {
    return new UserEvent(
      this.userId,
      this.eventId,
      this.interestedIn,
      true,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Unenlist from event
   * Returns a new UserEvent instance (immutable)
   */
  unenlist(): UserEvent {
    return new UserEvent(
      this.userId,
      this.eventId,
      this.interestedIn,
      false,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Set both interest and enlistment
   * Returns a new UserEvent instance (immutable)
   */
  updateParticipation(props: {
    interestedIn?: boolean;
    enlistedIn?: boolean;
  }): UserEvent {
    return new UserEvent(
      this.userId,
      this.eventId,
      props.interestedIn ?? this.interestedIn,
      props.enlistedIn ?? this.enlistedIn,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Check if user is interested
   */
  isInterested(): boolean {
    return this.interestedIn;
  }

  /**
   * Check if user is enlisted
   */
  isEnlisted(): boolean {
    return this.enlistedIn;
  }

  /**
   * Check if user has any participation
   */
  hasParticipation(): boolean {
    return this.interestedIn || this.enlistedIn;
  }

  /**
   * Get participation status
   */
  getStatus(): "none" | "interested" | "enlisted" | "both" {
    if (this.enlistedIn && this.interestedIn) return "both";
    if (this.enlistedIn) return "enlisted";
    if (this.interestedIn) return "interested";
    return "none";
  }

  /**
   * Get composite ID for this user-event pair
   */
  getCompositeId(): string {
    return `${this.userId}:${this.eventId}`;
  }
}
